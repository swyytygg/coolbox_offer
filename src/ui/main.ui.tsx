import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { COLORS, APP_DIALOGS, SAFE_AREA } from "./style/constants.ui";
import { LeftUI } from "./left.ui";
import { LeftFridgeList } from "./left_fridge_list.ui";
import { useTranslation } from "react-i18next";
import { ChatUI } from "./chat.ui";
import { CookAlarm } from "./cook_alarm.ui";
import { MainBody } from "./main_body.ui";
import { ItemAdd } from "./item_add.ui";
import { TalkRoom } from "./talkroom"; // 🛠️ 소통 플로팅 메뉴 장착
import { GuideRenderer } from "./guide"; // 🚀 가이드 레이아웃 임포트
import { SFX } from "../utils/shooting_sfx";
import { getAlarmStatus, fetchLatestDeleteNotification, insertDeleteNotification } from "../utils/alarm_engine";
import { MASTER_CATALOG } from "../utils/master_data";
import {
  FridgeItem,
  calculateRemainingDays,
  sortInventory,
  getEmergencyPlayers
} from "../utils/coolbox_engine";
import { supabase } from "../utils/supabase";
import { fetchInventory, upsertInventoryItem, deleteInventoryItem } from "../api/inventory";
import { getOrCreateFridgeGroup } from "../api/fridge";
import { useDialog } from "./DialogProvider";
import { safeLocalStorage } from "../utils/safe_storage";
import { useOcrSubscription } from "../hooks/useInAppPurchase";

// TossAds 모킹 객체 (글로벌 독립 실행용)
const TossAds = {
  initialize: undefined as any,
  attachBanner: undefined as any
};

const MOCK_ADS = [
  {
    icon: "🥦",
    title: "MOCK_AD1_TITLE",
    desc: "MOCK_AD1_DESC",
    cta: "MOCK_AD1_CTA",
    link: "https://smartstore.naver.com/coolbox"
  },
  {
    icon: "☕",
    title: "MOCK_AD2_TITLE",
    desc: "MOCK_AD2_DESC",
    cta: "MOCK_AD2_CTA",
    link: "https://smartstore.naver.com/coolbox"
  },
  {
    icon: "📦",
    title: "MOCK_AD3_TITLE",
    desc: "MOCK_AD3_DESC",
    cta: "MOCK_AD3_CTA",
    link: "https://smartstore.naver.com/coolbox"
  }
];



const BANNER_AD_GROUP_ID = import.meta.env.VITE_ADMOB_BANNER_ID as string;

interface MainUIProps {
  onStartScan: () => void;
}

export function MainUI({ onStartScan }: MainUIProps) {
  const { t } = useTranslation();
  const dialog = useDialog();
  const isAdFree = useOcrSubscription();
  const [currentAdIdx, setCurrentAdIdx] = useState(0);

  useEffect(() => {
    if (isAdFree) return;
    const interval = setInterval(() => {
      setCurrentAdIdx(prev => (prev + 1) % MOCK_ADS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAdFree]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLeftDrawerOpen, _setLeftDrawerOpen] = useState(false);
  const [isFridgeListOpen, setFridgeListOpen] = useState(false);
  const [isChatOpen, _setChatOpen] = useState(false);
  const [isAlarmOpen, setAlarmOpen] = useState(false);
  const [isItemDetailOpen, setItemDetailOpen] = useState(false);
  const [itemAddMode, setItemAddMode] = useState<'add' | 'detail'>('detail');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentAlarmMode, setCurrentAlarmMode] = useState<'emergency' | 'recommend' | 'more' | 'none'>('none');
  const [alarmItems, setAlarmItems] = useState<Array<{ id: number; name: string; daysLeft?: number }>>([]);
  const [fridgeName, setFridgeName] = useState(t("MY_FRIDGE_DEFAULT_NAME", "회원의 냉장고"));
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const alarmCheckedRef = useRef(false);
  const bannerContainerRef = useRef<HTMLDivElement>(null);
  const [isAdInitialized, setIsAdInitialized] = useState(false);
  const [isAdSupported, setIsAdSupported] = useState(false);

  // [기존회원용 이스터에그] 메인 COOLBOX 로고 5회 연타 시 극초기화
  const [logoTaps, setLogoTaps] = useState({ count: 0, lastTime: 0 });
  const handleLogoClick = async () => {
    const now = Date.now();
    if (now - logoTaps.lastTime < 1500) {
      const newCount = logoTaps.count + 1;
      if (newCount >= 5) {
        const isConfirmed = await dialog.openConfirm(APP_DIALOGS.EASTER_EGG_RESET);
        if (isConfirmed) {
          try {
            await supabase.auth.signOut();
          } catch (err) { }
          // 로컬 저장소를 완전히 비워 세션 토큰 및 가이드 이력 등을 싹 날립니다.
          safeLocalStorage.clear();
          try {
            localStorage.clear();
          } catch (e) {}
          window.location.reload();
        }
        setLogoTaps({ count: 0, lastTime: 0 });
      } else {
        setLogoTaps({ count: newCount, lastTime: now });
      }
    } else {
      setLogoTaps({ count: 1, lastTime: now });
    }
  };

  // [중앙 관리] 전체 식재료 인벤토리 상태
  const [inventory, setInventory] = useState<FridgeItem[]>([]);
  const [latestDeleteMsg, setLatestDeleteMsg] = useState<string | null>(null);

  // 배너 광고 SDK 초기화 (토스 앱 5.241.0+)
  useEffect(() => {
    try {
      if (!TossAds.initialize) {
        setIsAdSupported(false);
        return;
      }
      setIsAdSupported(true);
      TossAds.initialize({
        callbacks: {
          onInitialized: () => setIsAdInitialized(true),
          onInitializationFailed: (error: any) => console.error("[배너광고] SDK 초기화 실패:", error),
        },
      });
    } catch {
      setIsAdSupported(false);
    }
  }, []);

  // 배너 광고 부착 (초기화 완료 후)
  useEffect(() => {
    if (!isAdInitialized || !bannerContainerRef.current) return;
    let attached: { destroy: () => void } | undefined;
    try {
      attached = TossAds.attachBanner(BANNER_AD_GROUP_ID, bannerContainerRef.current, {
        theme: "auto",
        tone: "blackAndWhite",
        variant: "expanded",
        callbacks: {
          onAdFailedToRender: (p: any) => console.error("[배너광고] 렌더 실패:", p.error.message),
          onNoFill: () => console.warn("[배너광고] 표시할 광고 없음"),
        },
      });
    } catch (e) {
      console.error("[배너광고] attachBanner 실패:", e);
    }
    return () => { try { attached?.destroy(); } catch {} };
  }, [isAdInitialized, isAdSupported]);

  /**
   * [복구: 데이터 로딩 및 초기화]
   */
  // 1. 유저 정보 취득 및 기본 냉장고 그룹 ID 로드
  useEffect(() => {
    const initUser = async () => {
      try {
        setLoading(true);
        // 1. 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        setCurrentUserId(session.user.id);

        // 2. 가장 마지막에 열어본(또는 방금 초대받은) 활성 냉장고 그룹 ID 확인
        let gid = safeLocalStorage.getItem('coolbox_active_group_id');

        // 2-1. 활성 방이 없으면(최초 가입 등) 기존 로직대로 1순위 방을 가져오고 활성 방으로 세팅
        if (!gid) {
          gid = await getOrCreateFridgeGroup(session.user.id);
          if (gid) safeLocalStorage.setItem('coolbox_active_group_id', gid);
        }

        setGroupId(gid);
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, []);

  // 2. 활성화된 냉장고 그룹 ID(groupId)가 변경되거나 강제 새로고침 시 세부 데이터 및 인벤토리 로딩
  useEffect(() => {
    if (!groupId) return;

    const loadFridgeDetails = async () => {
      try {
        setLoading(true);
        // 3. 냉장고 실제 커스텀 이름 데이터베이스 조회 및 동기화 (개인 맞춤명 custom_group_name 우선)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: memberData } = await supabase
            .from('coolbox_members')
            .select('custom_group_name, coolbox_groups ( name )')
            .eq('group_id', groupId)
            .eq('user_id', session.user.id)
            .maybeSingle() as any;

          if (memberData) {
            const finalName = memberData.custom_group_name || memberData.coolbox_groups?.name || t("이름 없는 냉장고");
            setFridgeName(finalName);
          } else {
            // 🚨 self-healing: 사용자가 해당 그룹 멤버가 아닌 경우 (유효하지 않거나 삭제된 group_id, 강퇴 등)
            // 실제 참여 중인 그룹이 있는지 재조회하여 복구하거나 신규 생성
            console.warn(`User is not a member of active group ${groupId}. Healing active group...`);
            const fallbackGid = await getOrCreateFridgeGroup(session.user.id);
            if (fallbackGid) {
              safeLocalStorage.setItem('coolbox_active_group_id', fallbackGid);
              setGroupId(fallbackGid);
              return;
            }
          }
        }

        // 4. 인벤토리 로딩
        const dbItems = await fetchInventory(groupId);

        // 5. 남은 날짜 계산 및 정렬
        const processedItems = dbItems.map(item => ({
          ...item,
          daysLeft: calculateRemainingDays(item.purchaseDate, item.expiryDays)
        }));

        setInventory(sortInventory(processedItems));

        // 6. 최신 꺼내 먹은 알림(유령 요정 시스템 메시지) 로드
        const latest = await fetchLatestDeleteNotification(groupId);
        setLatestDeleteMsg(latest);
      } catch (err) {
        console.error("Error loading fridge details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFridgeDetails();
  }, [groupId, refreshTrigger]);

  // 🤖 [3단계 고도화] 실시간 유령 요정 말풍선(coolbox_messages) 변경 감지 구독
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`main_secretary_messages:${groupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'coolbox_messages', filter: `group_id=eq.${groupId}` },
        async (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.is_bot) {
            setLatestDeleteMsg(newMsg.content);
          }

          // 내가 보낸 메시지는 알림 팝업 대상 제외
          if (currentUserId && newMsg.user_id === currentUserId) return;

          // 알림 구분 및 공통모달(Alert/Confirm) 띄우기
          if (newMsg.is_bot) {
            // 소비 임박 vs 소비 완료 판단
            const isUrgent = newMsg.content.includes("임박") || newMsg.content.includes("당장") || newMsg.content.includes("소비기한");
            if (isUrgent) {
              await dialog.openAlert({
                title: t("URGENT_ALERT_TITLE", "🚨 소비 임박 경보"),
                description: newMsg.content,
                sound: "urgent"
              });
            } else {
              await dialog.openAlert({
                title: t("CONSUME_ALERT_TITLE", "🥦 식재료 소비 알림"),
                description: newMsg.content,
                sound: "consume"
              });
            }
          } else {
            // 일반 대화방 메시지 수신 (채팅방이 닫혀있는 경우에만 공통 모달로 바로가기 팝업 노출)
            if (!isChatOpen) {
              const isGoToChat = await dialog.openConfirm({
                title: t("NEW_MSG_ALERT_TITLE", "💬 새로운 메시지"),
                description: `${newMsg.sender_name || t("MEMBER", "구성원")}: ${newMsg.content}`,
                confirmButton: t("GO_TO_CHAT", "대화방 가기"),
                cancelButton: t("CLOSE", "닫기"),
                sound: "chat"
              });
              if (isGoToChat) {
                _setChatOpen(true);
              }
            } else {
              // 채팅방이 열려있는 상태라면 알림음만 재생 (딩동)
              SFX.playChatAlert();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, currentUserId, isChatOpen, dialog]);

  // 🥦 [4단계 고도화] 실시간 식재료(coolbox_inventory) 변경 감지 구독 및 상태 연동
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`main_inventory_changes:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coolbox_inventory', filter: `group_id=eq.${groupId}` },
        async (payload) => {
          console.log("[Realtime Inventory Change]:", payload);
          try {
            const dbItems = await fetchInventory(groupId);
            const processedItems = dbItems.map(item => ({
              ...item,
              daysLeft: calculateRemainingDays(item.purchaseDate, item.expiryDays)
            }));
            setInventory(sortInventory(processedItems));
          } catch (err) {
            console.error("Failed to sync realtime inventory:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // 메인 화면용 긴급 선수 선발 (3일 이내, 최대 3명)
  const emergencyPlayers = useMemo(() => getEmergencyPlayers(inventory), [inventory]);

  /**
   * [수정 가능: 상세페이지 오픈 핸들러]
   * 캐릭터 클릭 시 해당 아이템 정보를 가지고 상세페이지를 엽니다.
   * 15번(미분류) 캐릭터의 경우 안내 메시지를 먼저 띄웁니다.
   */
  const handleOpenDetail = useCallback(async (item: any) => { // 🌟 앞에 async 추가
    SFX.playDetails(); // ◀ 상세 보기 효과음 재생 (찰나의 격 연동)
    if (item.name === "미분류" || (item.imageUrl && item.imageUrl.includes("15.webp"))) {
      await dialog.openAlert(APP_DIALOGS.ITEM_UNKNOWN);
    }
    setSelectedItem(item);
    setItemAddMode('detail');
    setItemDetailOpen(true);
  }, [dialog]);

  /**
   * [수정 - 2026-05-10] 칸별 직접 추가 핸들러
   * - 이유: 단순히 { location: targetLoc }만 넘길 경우, 추가 서랍에서 이미지 주소(imageUrl)나 
   *   기본 정보가 undefined가 되어 DB 저장 시 빈값이나 에러가 유발될 수 있습니다.
   * - 조치: 기본 15번(미분류) 캐릭터 이미지 주소와 기본 이름(""), 기본수량(1), 기본기한(7)을 
   *   명시적인 구조로 꽉 채워서 추가 서랍(ItemAdd)에 넘겨주도록 고쳤습니다.
   */
  const handleOpenDirectAdd = useCallback((category: string) => {
    SFX.playAdd(); // ◀ 수동 칸별 추가 효과음 재생 (찰나의 격 연동)
    const targetLoc = (category || '냉장') as '신선' | '냉장' | '냉동' | '실외';
    setSelectedItem({ location: targetLoc });
    setItemAddMode('add');
    setItemDetailOpen(true);
  }, []);

  /**
   * [수정 완료 - 2026-05-13] 스마트 시차적 순환형 알림 핸들러
   * - 1번 소비 임박: 3일 이하 재료가 있을 때만 가동, 아침(0번)/점심(1번)/저녁(2번) 순환 교대 노출
   * - 2번 추천 레시피: 소비긴박 제외한 모든 보관 식품을 날짜/오전오후 턴(하루 2번)에 맞춰 무중복 순환 추천
   */
  const handleOpenAlarm = useCallback((mode: 'emergency' | 'recommend' | 'more') => {
    if (inventory.length === 0) return;

    const now = new Date();
    const hour = now.getHours();

    // 1. 소비 임박 모드 (하루 3번: 9시, 12시, 17시)
    if (mode === 'emergency') {
      // 소비기한 3일 이하의 진짜 임박 품목만 정밀 필터링
      const urgentItems = inventory.filter(item => item.daysLeft <= 3);
      if (urgentItems.length === 0) {
        console.log("[Alarm Engine] 3일 이하 임박 재료가 없어 소비임박 알림을 띄우지 않습니다.");
        return; // ◀ 임박 재료가 없으면 알람 자체를 원천 침묵(차단)!
      }

      // 잔여 수명이 가장 적게 남은 급박한 순으로 정렬
      const sortedUrgent = [...urgentItems].sort((a, b) => a.daysLeft - b.daysLeft);

      // 시간대별 인덱스 분배 (아침 9시 -> 0번째, 점심 12시 -> 1번째, 저녁 17시 -> 2번째)
      let targetIndex = 0;
      if (hour === 9) targetIndex = 0;
      else if (hour === 12) targetIndex = 1;
      else if (hour === 17) targetIndex = 2;

      // 보관 중인 임박 품목 리스트 개수에 맞춰 순환 인덱싱 (% 연산)
      const finalIndex = targetIndex % sortedUrgent.length;
      const selectedItem = sortedUrgent[finalIndex];

      setAlarmItems([{
        id: 1,
        name: selectedItem.name,
        daysLeft: selectedItem.daysLeft
      }]);
      setCurrentAlarmMode('emergency');
      setAlarmOpen(true);
      SFX.playUrgentRecommend();
    }
    // 2. 오늘의 추천 레시피 모드 (하루 2번: 11시, 18시) 및 추천 더보기 모드
    else if (mode === 'recommend' || mode === 'more') {
      // 임박 품목(3일 이하)을 완전히 제외하여 겹치지 않게 분류
      const safeItems = inventory.filter(item => item.daysLeft > 3);
      const candidates = safeItems.length > 0 ? safeItems : inventory; // 만약 전부 임박 상태뿐이면 전체를 보완 대비책으로 수임

      // 일정한 회전 순서를 고정하기 위해 이름 가나다/알파벳 순으로 기단 정렬
      const sortedCandidates = [...candidates].sort((a, b) => a.name.localeCompare(b.name));

      // 1970년부터 흘러온 누적 날짜 수 환산
      const dayOffset = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));

      // 하루 2회 주기의 타임 오프셋 (오전 11시 -> 0, 오후 18시 -> 1, 기타 디폴트 0)
      const timeOffset = hour === 18 ? 1 : 0;

      // 날짜 수와 오전/오후 턴을 누적 합산하여 한 번도 안 겹치고 모든 재료가 정주행하는 순환 뺑뺑이 알고리즘
      // 'more' 모드일 때는 다음 식재료를 추천하도록 오프셋 1을 추가합니다.
      const modeOffset = mode === 'more' ? 1 : 0;
      const finalIndex = (dayOffset * 2 + timeOffset + modeOffset) % sortedCandidates.length;
      const selectedItem = sortedCandidates[finalIndex];

      setAlarmItems([{
        id: 1,
        name: selectedItem.name,
        daysLeft: selectedItem.daysLeft
      }]);
      setCurrentAlarmMode(mode);
      setAlarmOpen(true);
      SFX.playTodayRecommend();
    }
  }, [inventory]);

  const handleOpenAlarmEmergency = useCallback(() => {
    handleOpenAlarm('emergency');
  }, [handleOpenAlarm]);

  useEffect(() => {
    if (inventory.length === 0) return;
    if (alarmCheckedRef.current) return;

    // 🚨 최초 진입 시 단 한 번만 자동 알림 스케줄 체크가 구동되도록 제어!
    alarmCheckedRef.current = true;

    const status = getAlarmStatus();
    if (status.type === 'emergency' || status.type === 'recommend') {
      handleOpenAlarm(status.type as 'emergency' | 'recommend');
    }
  }, [inventory.length, handleOpenAlarm]);

  /**
   * [신규: 아이템 정보 업데이트 핸들러]
   * 상세 서랍에서 수정된 내용을 인벤토리에 반영하고 정렬을 재수행합니다.
   */
  const handleUpdateItem = async (updatedItem: FridgeItem) => {
    if (!groupId) return;

    try {
      // 1. 수량 변동 탐지 (이전 수량과 새로운 수량 비교)
      const oldItem = inventory.find(i => i.id === updatedItem.id);
      const oldQuantity = oldItem?.quantity ?? 1;
      const newQuantity = updatedItem.quantity ?? 1;

      // [이미지 복구 및 필드 보전]
      const master = MASTER_CATALOG.find(m => m.name === updatedItem.name);
      const recoveredImageUrl = updatedItem.imageUrl || master?.imageUrl || "";

      const processedItem: FridgeItem = {
        ...updatedItem,
        imageUrl: recoveredImageUrl,
        daysLeft: calculateRemainingDays(updatedItem.purchaseDate, updatedItem.expiryDays)
      };

      // DB 저장
      const saved = await upsertInventoryItem({ ...processedItem, group_id: groupId });

      // 상태 업데이트 (id가 DB에서 생성된 UUID일 수 있으므로 갱신)
      const newInventory = inventory.map(item =>
        item.id === updatedItem.id ? { ...processedItem, id: saved.id } : item
      );

      // 만약 신규 추가라면 리스트에 추가
      const exists = inventory.some(item => item.id === updatedItem.id);
      const finalInventory = exists ? newInventory : [...inventory, { ...processedItem, id: saved.id }];

      setInventory(sortInventory(finalInventory));
      setSelectedItem(null);
      setItemDetailOpen(false);

      // 2. 수량이 줄어들었을 때만 유령 요정 알림 데이터베이스 기록 (즉시 반영)
      if (oldItem && newQuantity < oldQuantity) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || 'unknown';
        await insertDeleteNotification(groupId, updatedItem.name, userId, newQuantity);

        // 즉시 삭제 알림 메시지 상태 동기화 및 메인 화면 말풍선 갱신
        const latest = await fetchLatestDeleteNotification(groupId);
        setLatestDeleteMsg(latest);

        SFX.playConsume(); // ◀ 수량 감소 소비음 재생 (찰나의 격 연동)
      } else {
        SFX.playModify(); // ◀ 단순 정보 수정/저장은 수정 완료음 재생 (찰나의 격 연동)
      }
    } catch (err) {
      await dialog.openAlert(APP_DIALOGS.ITEM_SAVE_FAILURE);
      console.error(err);
    }
  };

  /**
   * [신규: 아이템 삭제 핸들러]
   */
  const handleDeleteItem = async (id: string | number) => {
    const isConfirmed = await dialog.openConfirm(APP_DIALOGS.ITEM_DELETE_CONFIRM);
    if (!isConfirmed) return;
    try {
      // 삭제하기 전 식재료 이름 확보
      const targetItem = inventory.find(item => item.id === id);

      await deleteInventoryItem(id);
      setInventory(inventory.filter(item => item.id !== id));
      setItemDetailOpen(false);

      SFX.playConsume(); // ◀ 식재료 완전 삭제 역시 일종의 전량 소비이므로 소비 하강음 재생 (찰나의 격 연동)

      // 삭제 성공 즉시 유령 요정 알림 데이터베이스 기록 (0개 남음 -> 완전 비움)
      if (groupId && targetItem) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || 'unknown';
        await insertDeleteNotification(groupId, targetItem.name, userId, 0);

        const latest = await fetchLatestDeleteNotification(groupId);
        setLatestDeleteMsg(latest);
      }
    } catch (err) {
      await dialog.openAlert(APP_DIALOGS.ITEM_DELETE_FAILURE);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.BACKGROUND, color: COLORS.BLUE
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '2px' }}>COOLBOX</div>
        <div style={{ fontSize: '14px', color: COLORS.GREY_80 }}>{t("CHECKING_FRIDGE", "냉장고를 확인하고 있어요...")}</div>
      </div>
    );
  }

  return (
    <div className="theme-light" style={{ backgroundColor: COLORS.BACKGROUND, height: '100%', display: 'flex', flexDirection: 'column', color: COLORS.TEXT_PRIMARY, overflow: 'hidden' }}>
      {/* 1. 상단 헤더 - 고정 영역 (메인 0번 인덱스일 때만 노출) */}
      {currentSectionIdx === 0 && (
        <header style={{
          paddingTop: SAFE_AREA.HEADER_PADDING_TOP,
          paddingLeft: '24px', paddingRight: '24px',
          height: 'var(--header-height)', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          borderBottom: `0px solid ${COLORS.BORDER}`, flexShrink: 0
        }}>
          {/* 2. 상단 헤더 - 햄버거 메뉴 & 로고 & 채팅방 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div onClick={() => _setLeftDrawerOpen(true)} id="guide-menu-btn" style={{ cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center' }}>

                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20M4 12H20M4 18H20" stroke={COLORS.TEXT_PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1
                onClick={handleLogoClick}
                style={{
                  fontSize: '20px', fontWeight: 'bold', color: COLORS.BLUE, marginTop: "5px",
                  cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center'
                }}
              >
                COOLBOX
              </h1>
            </div>
          </div>
        </header>
      )}

      {/* 2. 메인 바디 - 스크롤 가변 영역 (내부 인디케이터 노출을 위해 overflow 수정) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MainBody
          fridgeName={fridgeName}
          inventory={inventory}
          emergencyPlayers={emergencyPlayers}
          onOpenAlarm={handleOpenAlarmEmergency}
          onOpenDetail={handleOpenDetail}
          currentSectionIdx={currentSectionIdx}
          onSectionChange={setCurrentSectionIdx}
          latestDeleteMsg={latestDeleteMsg}
          onOpenDirectAdd={handleOpenDirectAdd}
        />
      </div>

      {/* 3. 하단 그룹 (광고 + 푸터) - 고정 영역 */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', margin: 0, gap: 0 }}>
        {/* 2.5 광고 배너 - 전체 화면 노출 (정식 배너 자동 노출로 연동) */}
        {isAdFree ? (
          <div 
            onClick={() => window.open('https://smartstore.naver.com/coolbox', '_blank')}
            style={{ 
              width: '100%', 
              height: '96px', 
              background: 'linear-gradient(90deg, #3182F6 0%, #00C896 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 24px',
              cursor: 'pointer',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            className="store-banner-hover"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>🥦</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '2px' }}>
                    {t("OFFICIAL_STORE_BANNER_TITLE", "쿨박스 공식 굿즈/인기상품 특별전")}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                    {t("OFFICIAL_STORE_BANNER_DESC", "귀여운 요정 키링과 굿즈를 스토어에서 만나보세요!")}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 'bold' }}>
                {t("GO_TO_STORE", "구경하기")} ➔
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: '96px',
              backgroundColor: '#F9FAFB',
              borderTop: `1px solid ${COLORS.BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (MOCK_ADS[currentAdIdx]?.link) {
                window.open(MOCK_ADS[currentAdIdx].link, '_blank');
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
              <span style={{ fontSize: '28px', flexShrink: 0 }}>
                {MOCK_ADS[currentAdIdx]?.icon || '🥦'}
              </span>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333D4B', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t(MOCK_ADS[currentAdIdx]?.title)}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7684', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t(MOCK_ADS[currentAdIdx]?.desc)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '10px', color: '#B0B8C1', border: '1px solid #E5E8EB', borderRadius: '4px', padding: '2px 4px', lineHeight: 1 }}>
                AD
              </span>
              <span style={{ fontSize: '12px', color: '#3182F6', fontWeight: 'bold' }}>
                {t(MOCK_ADS[currentAdIdx]?.cta)} ➔
              </span>
            </div>
          </div>
        )}

        <div ref={bannerContainerRef} style={{ width: 0, height: 0, display: 'none' }} />

        {/* 하단 푸터 - 모든 화면에서 노출 */}
        <footer style={{
          height: 'calc(var(--footer-height) + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          backgroundColor: COLORS.BACKGROUND,
          borderTop: `0px solid ${COLORS.BORDER}`
        }}>
          {/* 홈 버튼 */}
          <div
            onClick={() => {
              SFX.playHome();
              setCurrentSectionIdx(0);
            }}
            id="guide-home-btn"
            style={{
              cursor: 'pointer', flex: 1,
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke={currentSectionIdx === 0 ? COLORS.BLUE : COLORS.GREY_50} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* 중앙 스캔 버튼 [+] */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <button
              onClick={() => {
                SFX.playAdd();
                onStartScan();
              }}
              id="guide-scan-btn"
              style={{
                width: '50px', /* [미세조정: 스캔 버튼 지름] */
                height: '50px',
                borderRadius: '50%',
                backgroundColor: COLORS.BLUE,
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(49, 130, 246, 0.4)',
                cursor: 'pointer'
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* 우측 추천 버튼 [요리사 모자] */}
          <div
            onClick={() => {
              SFX.playChef();
              handleOpenAlarm('recommend');
            }}
            id="guide-chef-btn"
            style={{
              cursor: 'pointer', flex: 1,
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 13.8738C4.1804 13.4116 3 11.9056 3 10.1473C3 7.85686 5.16397 6 7.83333 6C8.01957 6 8.20164 6.00903 8.37956 6.02649C9.17646 4.24606 11.1444 3 13.5 3C16.3644 3 18.7303 4.84758 19.3334 7.29289C20.2974 7.64936 21 8.52731 21 9.54737C21 10.8407 19.8061 11.8895 18.3333 11.8895" stroke={currentAlarmMode === 'recommend' ? COLORS.BLUE : COLORS.GREY_50} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 12V18C18 19.1046 17.1046 20 16 20H8C6.89543 20 6 19.1046 6 18V12" stroke={currentAlarmMode === 'recommend' ? COLORS.BLUE : COLORS.GREY_50} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </footer>
      </div>

      {/* [드로워 및 모달 영역 - 레이어 우선순위 높음] */}
      <LeftUI
        isOpen={isLeftDrawerOpen}
        onClose={() => _setLeftDrawerOpen(false)}
        onOpenFridgeList={() => {
          _setLeftDrawerOpen(false); // 메인 메뉴 서랍은 닫고
          setFridgeListOpen(true);   // 냉장고 목록 서랍을 엽니다
        }}
      />
      <LeftFridgeList
        isOpen={isFridgeListOpen}
        onClose={() => setFridgeListOpen(false)}
        currentGroupId={groupId}
        onSwitchGroup={(newGroupId) => {
          safeLocalStorage.setItem('coolbox_active_group_id', newGroupId);
          setGroupId(newGroupId);
        }}
        onRefreshFridgeName={() => setRefreshTrigger(prev => prev + 1)}
      />
      <ChatUI
        isOpen={isChatOpen}
        onClose={() => _setChatOpen(false)}
        fridgeName={fridgeName}
        onOpenAlarm={handleOpenAlarm}
        groupId={groupId}
        hasEmergency={emergencyPlayers.length > 0}
        emergencyItemName={emergencyPlayers.length > 0 ? emergencyPlayers[0].name : undefined}
      />
      <CookAlarm isOpen={isAlarmOpen} onClose={() => setAlarmOpen(false)} mode={currentAlarmMode} items={alarmItems} />

      {/* 식재료 상세 보기 서랍 (ItemAdd 컴포넌트의 detail 모드 활용) */}
      <ItemAdd
        isOpen={isItemDetailOpen}
        onClose={() => setItemDetailOpen(false)}
        onSave={handleUpdateItem}
        onDelete={handleDeleteItem}
        mode={itemAddMode}
        initialData={selectedItem}
      />

      {/* 💬 신규: 하단 플로팅 챗방 말풍선 버튼 */}
      <div
        onClick={() => _setChatOpen(true)}
        id="guide-chat-btn" /* [미세조정: 온보딩 가이드 타겟 ID] */
        style={{
          position: 'absolute',
          right: '20px', /* [미세조정: 챗방 버튼 우측 마진] */
          bottom: 'calc(var(--ad-height) + var(--footer-height) + 80px)', // 👈 여기서 위아래 위치(10px)를 조절하세요!
          width: '50px',   // 👈 여기서 너비를 조절하세요!
          height: '50px',  // 👈 여기서 높이를 조절하세요!
          backgroundColor: COLORS.BLUE,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(49, 130, 246, 0.3)',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* 🛠️ 개발자 소통 플로팅 메뉴 (오픈챗방/손편지/후원 연동) */}
      <TalkRoom />

      {/* 🚀 가이드 레이아웃 설치 (첫 1회 자동 실행) "지속 테스트 가능 코드 forceShow={true}" */}
      {(!isLeftDrawerOpen && !isFridgeListOpen && !isChatOpen && currentSectionIdx === 0) && (
        <GuideRenderer context="main"  />
      )}
    </div>
  );
}
