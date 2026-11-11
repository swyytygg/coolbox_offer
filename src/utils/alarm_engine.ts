/**
 * CookAlarm Smart Engine
 * 시간대별 알림 스케줄링 및 카테고리별 키워드 생성 로직을 담당합니다.
 */
import { safeLocalStorage } from "./safe_storage";
import i18n from "./i18n";

export type AlarmCategory = 'produce' | 'instant' | 'alcohol' | 'beverage' | 'meat' | 'etc';

interface KeywordSet {
  label: string;
  keywords: string[];
}

const KEYWORD_MAP: Record<AlarmCategory, { rec1: KeywordSet; rec2: KeywordSet }> = {
  produce: {
    rec1: { label: "🍎 영양과 효능", keywords: ["영양성분", "효능", "음식궁합", "보관법", "세척법"] },
    rec2: { label: "🥗 다이어트 요리", keywords: ["다이어트 레시피", "저칼로리 요리", "해독주스", "샐러드 드레싱"] }
  },
  instant: {
    rec1: { label: "🍱 쉐프의 한 끗", keywords: ["맛있게 먹는법", "조리 꿀팁", "업그레이드 레시피", "토핑 추천"] },
    rec2: { label: "🥢 찰떡 반찬 조합", keywords: ["어울리는 반찬", "함께 먹으면 좋은 음식", "간단 사이드메뉴"] }
  },
  alcohol: {
    rec1: { label: "🍺 환상의 안주", keywords: ["안주 추천", "편의점 꿀조합 안주", "간단 안주", "베스트 페어링"] },
    rec2: { label: "💊 숙취 제로 꿀팁", keywords: ["숙취해소법", "해장 요리", "술 빨리 깨는 법", "간 보호 음식"] }
  },
  beverage: {
    rec1: { label: "☕ 홈카페 가이드", keywords: ["홈카페 레시피", "어울리는 디저트", "맛있게 타는 법", "카페 음료 만들기"] },
    rec2: { label: "🌿 건강 한 잔", keywords: ["건강 효능", "다이어트 음료", "카페인 정보", "해독 주스"] }
  },
  meat: {
    rec1: { label: "🥩 고기 굽기 장인", keywords: ["황금 레시피", "잡내 제거법", "마리네이드 꿀팁", "부위별 요리"] },
    rec2: { label: "🍲 든든한 한끼", keywords: ["국물 요리 레시피", "단백질 식단", "영양 반찬"] }
  },
  etc: {
    rec1: { label: "🔍 지능형 검색", keywords: ["맛있게 먹는법", "활용 레시피", "보관 꿀팁"] },
    rec2: { label: "💡 이런 요리 어때요?", keywords: ["추천 요리", "함께 먹는 음식", "인기 식단"] }
  }
};

/**
 * 아이템 이름을 기반으로 카테고리를 추측합니다. (단순 구현)
 */
export const getCategory = (itemName: string): AlarmCategory => {
  if (itemName.match(/과일|사과|포도|배|채소|양파|당근|샐러드|가루|곡류|견과류/)) return 'produce';
  if (itemName.match(/과자|스낵|빵|베이커리|라면|햄버거|피자|햇반|레토르트/)) return 'instant';
  if (itemName.match(/소주|맥주|와인|위스키|술/)) return 'alcohol';
  if (itemName.match(/우유|커피|콜라|주스|음료|차/)) return 'beverage';
  if (itemName.match(/고기|삼겹살|닭고기|소고기/)) return 'meat';
  return 'etc';
};

/**
 * 현재 시간에 따른 알림 상태를 확인합니다.
 */
export const getAlarmStatus = () => {
  const now = new Date();
  const hour = now.getHours();
  const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const lastAlarmKey = 'coolbox_last_alarm';
  
  // 이미 해당 시간대(슬롯)에 알람을 보냈는지 중복 확인
  const currentSlot = `${todayStr}-${hour}`;
  const lastAlarm = safeLocalStorage.getItem(lastAlarmKey);
  
  if (lastAlarm === currentSlot) {
    return { type: 'none' };
  }

  // 1. 침묵 모드 (22시 ~ 08시) - 절대 금지
  if (hour >= 22 || hour < 8) return { type: 'silent' };

  let type = 'none';

  // 2. 긴급 알림 (아침 9시, 점심 12시, 저녁 17시 - 하루 3번)
  if (hour === 9 || hour === 12 || hour === 17) type = 'emergency';

  // 3. 추천 알림 (오전 11시, 오후 18시 - 하루 2번)
  else if (hour === 11 || hour === 18) type = 'recommend';

  // 알림을 띄우기로 결정되었다면, 이 시간대에는 다시 뜨지 않도록 기록
  if (type !== 'none') {
    safeLocalStorage.setItem(lastAlarmKey, currentSlot);
    return { type };
  }

  return { type: 'none' };
};

/**
 * 카테고리에 따른 버튼별 검색 쿼리를 생성합니다.
 */
export const generateQueries = (itemName: string) => {
  const cat = getCategory(itemName);
  const set = KEYWORD_MAP[cat];

  const buildQuery = (labelKey: string, defaultLabel: string, keywords: string[]) => ({
    label: i18n.t(labelKey, { defaultValue: defaultLabel }),
    query: `${itemName} ${keywords.join(' ')}`
  });

  return [
    buildQuery(`REC_LABEL_${cat.toUpperCase()}_1`, set.rec1.label, set.rec1.keywords),
    buildQuery(`REC_LABEL_${cat.toUpperCase()}_2`, set.rec2.label, set.rec2.keywords)
  ];
};

/**
 * ==========================================
 * 🛡️ [신규] 유령 비서 및 동적 알림 제어 로직 (중앙화)
 * ==========================================
 */

import { supabase } from "./supabase";

/**
 * 📲 Expo 푸시 알림 서버로 푸시 알림을 발송합니다.
 * 
 * @param userId - 수신할 유저 ID
 * @param title - 푸시 제목
 * @param body - 푸시 내용
 */
export const sendPushNotificationToUser = async (userId: string, title: string, body: string) => {
  try {
    // 1. 유저의 등록된 모든 기기 토큰 가져오기
    const { data: tokenData, error: tokenErr } = await supabase
      .from('coolbox_user_push_tokens')
      .select('expo_push_token')
      .eq('user_id', userId);

    if (tokenErr) {
      console.error("[Push Engine] 토큰 조회 실패:", tokenErr);
      return;
    }

    if (!tokenData || tokenData.length === 0) {
      return;
    }

    // Expo Push 알림 포맷에 맞춰 전송 메시지 구성
    const messages = tokenData.map(item => ({
      to: item.expo_push_token,
      sound: 'default',
      title: title,
      body: body,
      data: { userId }
    }));

    // Expo Push 알림 발송 API 호출
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error("[Push Engine] 알림 전송 예외 발생:", err);
  }
};

/**
 * 📢 식재료가 삭제되었을 때 채팅방(coolbox_messages)에 자동 시스템 알림(봇)을 기록합니다.
 * (UI 코드를 깨끗하게 유지하기 위해 비즈니스 로직을 이 엔진으로 이관함)
 * 
 * @param groupId - 냉장고 그룹 ID
 * @param itemName - 삭제(소비)된 식재료 이름
 * @param userId - 행위를 수행한 사용자 ID (또는 'unknown')
 */
export const insertDeleteNotification = async (groupId: string, itemName: string, userId: string, remainingQuantity?: number) => {
  try {
    const isDecreased = remainingQuantity !== undefined && remainingQuantity > 0;
    const content = isDecreased
      ? i18n.t("BOT_MSG_QTY_LEFT", { itemName: i18n.t(itemName, itemName), remainingQuantity, defaultValue: `📢 [${itemName}] 수량이 ${remainingQuantity}개 남았어요!` })
      : i18n.t("BOT_MSG_EMPTY", { itemName: i18n.t(itemName, itemName), defaultValue: `📢 [${itemName}]! 다 먹고 비웠어요!` });

    const { error } = await supabase
      .from('coolbox_messages')
      .insert({
        group_id: groupId,
        user_id: userId,
        sender_name: i18n.t("FAIRY_NAME", { defaultValue: '유령 요정' }),
        content: content,
        is_bot: true
      });

    if (error) {
      console.error("[Alarm Engine] 삭제/수량 변경 알림 등록 실패:", error);
    } else {
      // 🥦 [푸시 연동] 해당 냉장고 그룹에 참여 중인 다른 가족 멤버들에게 실시간 모바일 푸시 발송
      const { data: members, error: memberErr } = await supabase
        .from('coolbox_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (!memberErr && members) {
        const title = i18n.t("APP_NAME", { defaultValue: "Coolbox" });
        const pushBody = content.replace('📢 ', '');
        
        for (const member of members) {
          // 본인(수정을 주도한 멤버)은 제외하고 발송
          if (member.user_id && member.user_id !== userId) {
            await sendPushNotificationToUser(member.user_id, title, pushBody);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Alarm Engine] 삭제/수량 변경 알림 예외 발생:", err);
  }
};

/**
 * 🔍 최근 등록된 '유령 비서'의 삭제 알림 메시지를 가져옵니다.
 * 
 * @param groupId - 냉장고 그룹 ID
 * @returns {Promise<string | null>} 가장 최신의 꺼내 먹은 알림 문구
 */
export const fetchLatestDeleteNotification = async (groupId: string): Promise<string | null> => {
  try {
    // ⏰ 12시간 전 시간 계산
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('coolbox_messages')
      .select('content')
      .eq('group_id', groupId)
      .eq('is_bot', true)
      .gte('created_at', twelveHoursAgo) // 12시간 이내에 생성된 알림만 유효!
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error("[Alarm Engine] 최신 삭제 알림 로드 실패:", error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0].content;
    }
    return null;
  } catch (err) {
    console.error("[Alarm Engine] 최신 삭제 알림 로드 예외:", err);
    return null;
  }
};

/**
 * 🎨 [유령 비서 디자인 규격] 로그인 여부 및 최근 알림 상태에 따라
 * 실전용 배경과 테두리를 완벽하게 적용한 스타일과 문구를 반환합니다.
 * 
 * @param hasTossToken - 토스 간편로그인 연동 여부
 * @param latestDeleteMsg - 최신 삭제 알림 문구 (있을 경우 전달)
 * @returns { text: string, style: React.CSSProperties }
 */
export const getSecretaryMessage = (
  hasTossToken: boolean,
  latestDeleteMsg: string | null
): { text: string; style: any } => {
  let text = i18n.t("BOT_WELCOME", { defaultValue: "📦 새 냉장고가 멋지게 생겼어요!" });

  if (hasTossToken) {
    if (latestDeleteMsg) {
      // 3번의 옵션A(삭제 기록)을 4번의 흐름으로 매칭
      text = `${i18n.t("SPEECH_FAIRY", { defaultValue: "요정" })}: ${latestDeleteMsg.replace('📢 ', '')}`;
    } else {
      // 로그인 후 기본 개인화 문구
      text = i18n.t("BOT_SPEECH_DEFAULT", { defaultValue: "요정: 오늘 먹어야 할 유통기한 임박 재료가 있어요!" });
    }
  } 

  // 사용자의 디자인 요구 사항: "배경과 테두리 적용해"
  // 어둡고 고급스러운 검은 배경과 세련된 가시성을 주는 블루 테두리 테마 적용
  const style = {
    backgroundColor: '#1E1E1E',                      // 짙은 그레이 배경색 (가시성 확보)
    border: '1px solid #4880EE',                     // 쿨박스 공식 블루 테두리 선명하게 노출
    borderRadius: '12px',                            // 부드러운 라운딩 처리
    padding: '8px 14px',                             // 내부 정렬 패딩
    color: '#FFFFFF',                                // 완전 흰색 텍스트로 시각적 가독성 극대화
    fontSize: '13px',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',      // 입체적인 쉐도우 효과
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  return { text, style };
};
