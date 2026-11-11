import { useState, useEffect, useRef } from "react";
import { COLORS, BUTTON_STYLE, SAFE_AREA, APP_DIALOGS } from "./style/constants.ui";
import { supabase } from "../utils/supabase";
import { fetchMessages, sendMessage, ChatMessage } from "../api/chat";
import { fetchGroupMembers, evictGroupMember, fetchMemberPrivateAliases, upsertMemberPrivateAlias } from "../api/fridge";
import { useDialog } from "./DialogProvider";
import { SFX } from "../utils/shooting_sfx";
import { useTranslation } from "react-i18next";
import { GuideRenderer } from "./guide"; // 🚀 가이드 레이아웃 임포트

interface ChatUIProps {
  isOpen: boolean;
  onClose: () => void;
  fridgeName: string;
  onOpenAlarm: (mode: 'emergency' | 'recommend' | 'more', itemName: string) => void;
  groupId: string | null;
  hasEmergency: boolean;
  emergencyItemName?: string;
}

/**
 * 쿨박스 전광판 스타일 채팅 UI
 */
export function ChatUI({ isOpen, onClose, fridgeName, onOpenAlarm, groupId, hasEmergency, emergencyItemName }: ChatUIProps) {
  const { t } = useTranslation();
  const dialog = useDialog();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 📋 그룹 멤버 목록 및 내 역할 권한 상태 추가
  const [members, setMembers] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'member' | null>(null);
  const [privateAliases, setPrivateAliases] = useState<{ [targetUserId: string]: string }>({});
  const [aliasModal, setAliasModal] = useState<{ isOpen: boolean; targetUserId: string; defaultNickname: string; value: string } | null>(null);

  // 🤖 실전 모바일 친화형 가족/친구 초대 로직 (OG 이미지 적용 버전)
  const handleInvite = async () => {
    try {
      // 그룹 아이디 기반으로 COOL-XXXX-1234 형태의 고품격 초대코드 생성
      const cleanGroupId = groupId || "BOX";
      const inviteCode = `COOL-${cleanGroupId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const inviteUrl = `${window.location.origin}/?inviteGroupId=${groupId}`;
      const shareText = t("SHARE_TEXT_TEMPLATE", {
        fridgeName,
        inviteCode,
        inviteUrl,
        defaultValue: `[쿨박스] '${fridgeName}' 우리 함께 관리해요!\n초대코드를 앱에 등록하고 함께 절약해요!\n\n🔑 초대코드: ${inviteCode}\n👉 바로 참가하기: ${inviteUrl}`
      });

      // 2. 클립보드에 무조건 자동 복사 (안전장치)
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          setToastMessage(t("INVITE_COPIED_TOAST", "초대 메시지가 복사됐어요! 원하는 곳에 붙여넣어 주세요."));
          setTimeout(() => setToastMessage(null), 2500);
        }
      } catch (clipErr) {
        console.warn("클립보드 자동 복사 실패 (공유 기능은 계속 진행):", clipErr);
      }

      // 3. 일반 모바일 브라우저/네이티브 폰 공유창 띄우기
      if (navigator.share) {
        await navigator.share({ title: t("APP_NAME", "Coolbox"), text: shareText, url: inviteUrl });
      }
    } catch (err) {
      console.warn("초대 취소 혹은 공유 미지원:", err);
    }
  };

  // 1. 전광판 상태 관리
  const [tickerIndex, setTickerIndex] = useState(0);

  const getTickerMessages = () => {
    const msgs = [
      { type: 'recommend', text: t("TICKER_RECOMMEND", "🍲 요정이 추천하는 오늘 뭐 먹지?"), query: '소비기한+짧은+재료+레시피+효능+건강+홈바' },
      { type: 'more', text: t("TICKER_MORE", "🔍 추천 맞춤 검색 더보기"), query: '냉장고+식재료+추천+요리+효능+건강+홈바+가성비+간단' },
    ];
    if (hasEmergency && emergencyItemName) {
      msgs.push({ type: 'emergency', text: t("EMERGENCY_COUNTDOWN", { itemName: emergencyItemName, defaultValue: `⚠️ [긴급] ${emergencyItemName}! 당장 먹어야 해요!` }), query: '유통기한+임박+재료+처리+레시피+홈바' });
    }
    return msgs;
  };

  const tickerMessages = getTickerMessages();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 1. 메시지 초기 로딩 및 구독
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id);
        
        // 초기 로딩 시 나만 보는 비밀 별칭도 캐싱
        if (groupId) {
          const aliases = await fetchMemberPrivateAliases(data.user.id, groupId);
          const aliasMap: { [key: string]: string } = {};
          aliases.forEach((a: any) => {
            aliasMap[a.target_user_id] = a.custom_alias;
          });
          setPrivateAliases(aliasMap);
        }
      }
    });
    if (!isOpen || !groupId) return;

    // 초기 로딩
    const loadMessages = async () => {
      const msgs = await fetchMessages(groupId);
      setMessages(msgs);
      setTimeout(() => scrollToBottom(), 100);
    };

    loadMessages();

    // 실시간 구독
    const channel = supabase
      .channel(`chat:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'coolbox_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
        setTimeout(() => scrollToBottom(), 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, groupId]);

  // 📋 그룹 멤버 목록 및 내 권한 실시간 연동
  const loadMembers = async () => {
    if (!groupId) return;
    const list = await fetchGroupMembers(groupId);
    setMembers(list);

    // 내 권한 파악
    if (currentUserId) {
      const me = list.find((m: any) => m.user_id === currentUserId);
      if (me) {
        setCurrentUserRole(me.role as 'owner' | 'member');
      }

      // 내가 지정한 비밀 별칭 동기화
      const aliases = await fetchMemberPrivateAliases(currentUserId, groupId);
      const aliasMap: { [key: string]: string } = {};
      aliases.forEach((a: any) => {
        aliasMap[a.target_user_id] = a.custom_alias;
      });
      setPrivateAliases(aliasMap);
    }
  };

  useEffect(() => {
    if ((isOpen || isMenuOpen) && groupId) {
      loadMembers();
    }
  }, [isOpen, isMenuOpen, groupId, currentUserId]);


  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
      return;
    }
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, tickerMessages.length]);

  // [수정] 누락되었던 handleClose 함수 정의
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 280);
  };

  // ❌ [방장 전용] 특정 멤버를 냉장고 그룹에서 강제 퇴출시킵니다.
  const handleEvict = async (memberId: string, nickname: string) => {
    if (!groupId || !currentUserId) return;
    
    const isConfirmed = await dialog.openConfirm(APP_DIALOGS.MEMBER_EVICT_CONFIRM(nickname));

    if (!isConfirmed) return;

    try {
      await evictGroupMember(groupId, memberId, currentUserId);
      setToastMessage(t("MEMBER_EVICTED_TOAST", "{{nickname}} 님이 퇴장됐어요", { nickname }));
      setTimeout(() => setToastMessage(null), 2500);
      loadMembers(); // 멤버 리스트 즉시 새로고침
    } catch (err: any) {
      await dialog.openAlert(APP_DIALOGS.MEMBER_EVICT_FAILURE(err.message));
    }
  };

  // 비밀 별칭을 적용한 멤버 별명 해석기
  const getMemberDisplayName = (userId: string | null, originalName: string) => {
    if (!userId) return originalName;
    const alias = privateAliases[userId];
    if (alias) return alias;
    const m = members.find((x: any) => x.user_id === userId);
    if (m?.nickname) return m.nickname;
    if (originalName === "회원" && m) {
      return m.role === 'owner' ? t("OWNER", "방장") : t("FAMILY", "가족");
    }
    return originalName;
  };

  const handleEditAlias = (targetUserId: string, defaultNickname: string) => {
    if (!groupId || !currentUserId) return;
    const currentAlias = privateAliases[targetUserId] || defaultNickname;
    setAliasModal({
      isOpen: true,
      targetUserId,
      defaultNickname,
      value: currentAlias === defaultNickname ? "" : currentAlias
    });
  };

  // 🚪 (수정됨) 방장 권한 강화를 위해 일반 멤버의 자진 탈퇴(대화방 나가기) 기능이 삭제되었습니다.

  const handleTickerClick = () => {
    const current = tickerMessages[tickerIndex];
    // [연결] 서랍 오픈 함수로 교체
    onOpenAlarm(current.type as any, t("FRIDGE_ITEMS", "냉장고 식재료"));
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !groupId || isSending) return;

    try {
      setIsSending(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const myInfo = members.find((m: any) => m.user_id === session.user.id);
      const myDefaultName = myInfo?.nickname || (currentUserRole === 'owner' ? t("OWNER", "방장") : t("FAMILY", "가족"));

      await sendMessage(
        groupId,
        session.user.id,
        myDefaultName, // "회원" 대신 동적 이름 사용
        inputText.trim()
      );
      setInputText("");
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  const currentMsg = tickerMessages[tickerIndex];
  const isEmergency = currentMsg.type === 'emergency';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#EEF4FE', zIndex: 3000,
      display: 'flex', flexDirection: 'column',
      animation: `${isClosing ? 'slideOutRight' : 'slideInRight'} 0.3s ease-out forwards`
    }}>

      {/* 헤더 */}
      <header style={{
        paddingTop: SAFE_AREA.HEADER_PADDING_TOP,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: '16px', paddingRight: '16px', borderBottom: `0px solid ${COLORS.BORDER}`
      }}>
        <div onClick={handleClose} style={{ cursor: 'pointer', padding: '8px' }}>
          <span style={{ color: '#191F28', fontSize: '24px', fontWeight: 'bold' }}>&gt;</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#191F28' }}>{t(fridgeName, fridgeName)}</div>
        <div 
          onClick={() => setMenuOpen(true)} 
          id="guide-chat-menu-btn" /* [미세조정: 온보딩 가이드 햄버거 메뉴 ID] */
          style={{ cursor: 'pointer', padding: '8px' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="#191F28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </header>

      {/* 전광판 */}
      <div onClick={handleTickerClick} style={{ padding: '15px 20px', borderBottom: `0px solid ${isEmergency ? COLORS.YELLOW : COLORS.BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: isEmergency ? '#E53E3E' : COLORS.BLUE }}>{currentMsg.text}</div>
      </div>

      {/* 대화 영역 */}
      <main ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', gap: '16px', display: 'flex', flexDirection: 'column' }}>
        {messages.filter(msg => {
          if (msg.is_bot) {
            // 요정 알림(is_bot)은 작성된 지 12시간 이내의 것만 대화방에 노출!
            const msgTime = new Date(msg.created_at).getTime();
            return msgTime > Date.now() - 12 * 60 * 60 * 1000;
          }
          return true; // 일반 가족 대화는 상시 보존 및 노출
        }).map((msg) => {
          const isMe = msg.user_id === currentUserId;
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.is_bot ? 'center' : (isMe ? 'flex-end' : 'flex-start'), gap: '4px' }}>
              {!msg.is_bot && <span style={{ fontSize: '12px', color: COLORS.GREY_50 }}>{getMemberDisplayName(msg.user_id, msg.sender_name || t("FAMILY", "가족"))}</span>}
              <div style={{
                maxWidth: msg.is_bot ? '90%' : '75%', padding: '8px 16px', borderRadius: '16px',
                backgroundColor: msg.is_bot ? 'transparent' : (isMe ? COLORS.BLUE : '#ffffff'),
                border: msg.is_bot ? `0px solid ${COLORS.BACKGROUND}` : (isMe ? 'none' : `1.5px solid ${COLORS.BLUE}`), 
                color: msg.is_bot ? '#4E5968' : (isMe ? 'white' : '#191F28'), 
                fontSize: '15px'
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
      </main>

      {/* 입력창 */}
      <div style={{ padding: '10px 16px', paddingBottom: `calc(${SAFE_AREA.BOTTOM} + 3px)`, backgroundColor: '#ffffff', borderTop: `1px solid ${COLORS.GREY_80}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#ffffff', border: `1.5px solid ${COLORS.BLUE}`, borderRadius: '20px', padding: '4px 8px 4px 16px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t("CHAT_INPUT_PLACEHOLDER", "메시지 주세요...")}
            style={{ flex: 1, height: '40px', backgroundColor: 'transparent', border: 'none', color:  '#191F28', outline: 'none', fontSize: '15px' }}
          />
          <div onClick={handleSendMessage} style={{ cursor: 'pointer', opacity: isSending ? 0.5 : 1 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill={COLORS.BLUE} />
              <path d="M16 8L7 11.5L10.5 13M16 8L12.5 17L10.5 13M16 8L10.5 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* 우측 관리 서랍 */}
      {isMenuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 3999 }} />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '85%', backgroundColor: COLORS.BACKGROUND, zIndex: 4000,
            boxShadow: '-5px 0 15px rgba(0,0,0,0.5)', padding: '24px', paddingTop: `calc(${SAFE_AREA.TOP} + 20px)`,
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>{t("ROOM_MANAGEMENT", "방 관리")}</h2>
              <div onClick={() => setMenuOpen(false)} style={{ cursor: 'pointer', fontSize: '24px', color: COLORS.TEXT_PRIMARY }}>&times;</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {currentUserRole === 'owner' && (
                <button
                  onClick={handleInvite}
                  id="guide-chat-invite-btn" /* [미세조정: 온보딩 가이드 초대 버튼 ID] */
                  style={{ ...BUTTON_STYLE.PRIMARY, width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '32px' }}
                >
                  {t("INVITE_FRIENDS", "가족/친구 함께해요")}
                </button>
              )}

              <div style={{ color: COLORS.GREY_80, fontSize: '14px', marginBottom: '16px' }}>{t("MEMBER_COUNT", "참여 멤버 ({{count}})", { count: members.length })}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {members.map((member) => {
                  const isMe = member.user_id === currentUserId;
                  const isOwner = member.role === 'owner';
                  const baseNickname = member.nickname || (isOwner ? t("OWNER", "방장") : t("FAMILY", "가족"));
                  const displayName = privateAliases[member.user_id] || baseNickname;
                  const hasAlias = !!privateAliases[member.user_id];
                  
                  return (
                    <div 
                      key={member.id} 
                      id={isMe ? "guide-chat-my-member-row" : undefined} /* [미세조정: 온보딩 가이드 내 별칭 수정/저장 버튼 행 ID] */
                      style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: isOwner ? COLORS.BLUE : '#444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        border: isOwner ? `2px solid ${COLORS.WHITE}` : `1px solid ${COLORS.GREY_80}`
                      }}>
                        {isOwner ? '👑' : '👤'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: isMe ? 'bold' : 'normal', color: COLORS.TEXT_PRIMARY, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                          <span>{displayName}</span>
                          {isMe && <span>{t("ME", "(나)")}</span>}
                          {hasAlias && <span style={{ fontSize: '11px', color: COLORS.GREY_80 }}>({baseNickname})</span>}
                          <button
                            onClick={() => handleEditAlias(member.user_id, baseNickname)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: COLORS.WHITE,
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: COLORS.BLUE,
                              marginLeft: '6px'
                            }}
                          >
                            {t("EDIT_SAVE", "수정/저장")}
                          </button>
                        </div>
                        <div style={{ fontSize: '12px', color: isOwner ? COLORS.BLUE : COLORS.GREY_80 }}>
                          {isOwner ? t("OWNER_DESC", "냉장고 주인") : t("MEMBER_DESC", "참여 회원")}
                        </div>
                      </div>
                      {/* ⭐⭐⭐ 핵심 방장 퇴출 권한 ⭐⭐⭐ */}
                      {currentUserRole === 'owner' && !isMe && (
                        <div
                          onClick={() => handleEvict(member.id, baseNickname)}
                          style={{ 
                            color: COLORS.YELLOW, 
                            fontSize: '13px', 
                            cursor: 'pointer',
                            backgroundColor: 'rgba(255, 184, 0, 0.1)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontWeight: 'bold'
                          }}
                        >
                          {t("EVICT", "추방")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 대화방 나가기 기능 기획 의도(방장 권한 전권)에 따라 삭제됨 */}

            {/* 토스 블루 플로팅 안내 토스트 */}
            {toastMessage && (
              <>
                <style>{`
                  @keyframes coolbox-toast-in {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                  }
                `}</style>
                <div style={{
                  position: 'absolute',
                  bottom: '75px', // 대화방 나가기 버튼 영역 위에 자연스럽게 뜸
                  left: '16px',
                  right: '16px',
                  backgroundColor: COLORS.BLUE, // 토스 공식 다크모드 전용 블루
                  color: '#FFFFFF',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  fontSize: '15px', // 사용자 요청: 글씨 크기 15px
                  fontWeight: '600',
                  zIndex: 5000,
                  boxShadow: '0 8px 24px rgba(72, 128, 238, 0.35)', // 다크모드 블루 광채 그림자
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  animation: 'coolbox-toast-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                  <span>📋</span>
                  <span>{toastMessage}</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ✏️ 멤버 비밀 별칭 변경용 프리미엄 토스 스타일 모달 */}
      {aliasModal && aliasModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5000,
          padding: '24px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '320px',
            backgroundColor: COLORS.CARD,
            border: `1.5px solid ${COLORS.BORDER}`,
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'scaleUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.WHITE }}>
                {t("ALIAS_MODAL_TITLE", "비밀 별칭 설정")}
              </span>
              <span style={{ fontSize: '13px', color: COLORS.GREY_50 }}>
                {t("ALIAS_MODAL_DESC", "'{{nickname}}' 님! 나만의 애칭을 주세요.", { nickname: aliasModal.defaultNickname })}
              </span>
            </div>

            <input
              type="text"
              value={aliasModal.value}
              onChange={(e) => setAliasModal({ ...aliasModal, value: e.target.value })}
              placeholder={t("ALIAS_INPUT_PLACEHOLDER", "예: 나쁜놈, 사랑하는 남편 등")}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: COLORS.BACKGROUND,
                border: `1.5px solid ${COLORS.BORDER}`,
                borderRadius: '14px',
                color: COLORS.WHITE,
                fontSize: '15px',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setAliasModal(null)}
                style={{
                  flex: 1,
                  height: '48px',
                  backgroundColor: 'transparent',
                  color: COLORS.GREY_80,
                  border: `1.5px solid ${COLORS.BORDER}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t("CANCEL")}
              </button>
              <button
                onClick={async () => {
                  try {
                    await upsertMemberPrivateAlias(currentUserId!, aliasModal.targetUserId, groupId!, aliasModal.value.trim());
                    await loadMembers();
                    SFX.playModify();
                    setToastMessage(t("ALIAS_SAVED_TOAST", "비밀 별칭이 적용됐어요!"));
                    setTimeout(() => setToastMessage(null), 2500);
                    setAliasModal(null);
                  } catch (err: any) {
                    await dialog.openAlert(APP_DIALOGS.ALIAS_SAVE_FAILURE(err.message));
                  }
                }}
                style={{
                  flex: 1,
                  height: '48px',
                  backgroundColor: COLORS.BLUE,
                  color: COLORS.WHITE,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t("SAVE")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
      `}</style>

      {/* 🚀 가이드 레이아웃 설치 (첫 1회 자동 실행)  "지속 테스트 가능 코드 forceShow={true}"*/}
      {isOpen && <GuideRenderer context="chat" forceShow={true} />}
    </div>
  );
}
