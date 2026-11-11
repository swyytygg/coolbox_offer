import { useState, useEffect } from "react";
import { COLORS, BUTTON_STYLE, BUTTON_SIZE } from "./style/constants.ui";
import { useInAppAds } from "../hooks/useInAppAds";
import { useInAppPurchase } from "../hooks/useInAppPurchase";
import { useTranslation } from "react-i18next";
import { supabase } from "../utils/supabase";

interface TalkRoomProps {
  onOpenStory?: () => void;
}

/**
 * 🛠️ TalkRoom 컴포넌트 - 메인 화면의 스마트 소통 시스템
 * - 오픈 카카오톡 채팅방 연결 (파스텔 노란색 말풍선 테마 적용)
 * - 개발자 아저씨의 손편지 모달 내장으로 플러그앤플레이 지원
 * - 커피 후원하기 연동
 */
export function TalkRoom({ onOpenStory }: TalkRoomProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // 문의 및 공지 관련 상태
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryTab, setInquiryTab] = useState<"notices" | "inquiry">("notices");
  const [notices, setNotices] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [newInquiryName, setNewInquiryName] = useState(localStorage.getItem('coolbox_user_nickname') || "");
  const [newInquiryContent, setNewInquiryContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 문의 및 공지사항 데이터 패치
  const loadInquiryData = async () => {
    setIsLoading(true);
    try {
      // 1. 공지사항 로드 (is_private = false)
      const { data: noticeData, error: noticeErr } = await supabase
        .from("coolbox_inquiries")
        .select("*")
        .eq("is_private", false)
        .order("created_at", { ascending: false });

      if (!noticeErr && noticeData) {
        setNotices(noticeData);
      }

      // 2. 익명 로그인 확보 및 내 문의 내역 로드
      const { data: { session } } = await supabase.auth.getSession();
      let curUserId = session?.user?.id;
      if (!curUserId) {
        const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();
        if (!signInError && authData.user) {
          curUserId = authData.user.id;
        }
      }

      if (curUserId) {
        const { data: inquiryData, error: inquiryErr } = await supabase
          .from("coolbox_inquiries")
          .select("*")
          .eq("user_id", curUserId)
          .order("created_at", { ascending: false });

        if (!inquiryErr && inquiryData) {
          setInquiries(inquiryData);
        }
      }
    } catch (error) {
      console.error("Failed to load inquiries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInquiryOpen) {
      loadInquiryData();
      // 닉네임 로컬스토리지 최신값 동기화
      setNewInquiryName(localStorage.getItem('coolbox_user_nickname') || "");
    }
  }, [isInquiryOpen]);

  // 문의글 등록
  const handleSubmitInquiry = async () => {
    if (!newInquiryContent.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let curUserId = session?.user?.id;
      if (!curUserId) {
        const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw signInError;
        curUserId = authData?.user?.id;
      }

      if (!curUserId) throw new Error("사용자 세션을 생성하지 못했습니다.");

      const senderName = newInquiryName.trim() || "익명";

      const { error } = await supabase
        .from("coolbox_inquiries")
        .insert({
          user_id: curUserId,
          sender_name: senderName,
          content: newInquiryContent.trim(),
          is_private: true
        });

      if (error) throw error;

      setNewInquiryContent("");
      if (senderName !== "익명") {
        localStorage.setItem('coolbox_user_nickname', senderName);
      }

      await loadInquiryData();
    } catch (error) {
      console.error("Failed to submit inquiry:", error);
      alert("문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 리워드 광고 및 보완용 전면 광고 로드
  const rewardedAd = useInAppAds(import.meta.env.VITE_ADMOB_REWARD_ID as string);
  const interstitialAd = useInAppAds(import.meta.env.VITE_ADMOB_INTERSTITIAL_ID as string);

  // 인앱 결제 훅 연동
  const { purchaseProduct } = useInAppPurchase();

  // 메뉴 아이템 구성 (오픈챗방은 유저 요청대로 파스텔 노란색 테마 적용)
  const menuItems = [
    {
      id: "story",
      label: t("STORY_TITLE", "쿨박스 이야기"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
      onClick: () => {
        if (onOpenStory) {
          onOpenStory();
        } else {
          setIsLetterOpen(true); // 내장 손편지 모달 열기
        }
        setIsOpen(false);
      },
      color: "var(--point-blue)", // 💡 전역 정규식 우회 및 투명도 에러 방지를 위해 순수 CSS 변수 사용
    },
    {
      id: "chat",
      label: t("INQUIRY_TITLE", "소통 창구"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      onClick: () => {
        setIsInquiryOpen(true);
        setIsOpen(false);
      },
      color: "#FFE066", // ⭐ 유저 요청: 화사한 파스텔 노란색
      isHighlight: true, // 파스텔 노란색 말풍선 강조 마킹
    },
    {
      id: "coffee",
      label: t("SUPPORT_BTN", "응원해요"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      ),
      onClick: () => {
        setIsSupportOpen(true);
        setIsOpen(false);
      },
      color: "#FF4D4F", // 다홍빛 레드
    },
  ];

  return (
    <>
      {/* 1. 소통 레이아웃 (메인 우측 하단 광고 위 정렬) */}
      <div
        style={{
          position: "fixed",
          bottom: "160px", // [미세조정: 소통 플로팅 메뉴 하단 위치]
          right: "24px", // [미세조정: 소통 플로팅 메뉴 우측 여백]
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "12px",
        }}
      >
        {/* 메뉴 아이템들 - CSS transition 기반 */}
        {isOpen && (
          <div
            style={{
              display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end",
              animation: 'talkroom-fade-in 0.2s ease-out'
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                className="talkroom-menu-btn"
                onClick={item.onClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 20px",
                  borderRadius: "16px",
                  background: "rgba(28, 28, 30, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: item.id === "story"
                    ? "1px solid var(--point-blue)"
                    : `1px solid ${item.color}66`,
                  color: "var(--text-primary)",
                  boxShadow: item.id === "chat"
                    ? "0 8px 24px rgba(255, 224, 102, 0.25)"
                    : "0 8px 24px rgba(0,0,0,0.3)",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontWeight: "800",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: item.color, display: "flex", alignItems: "center" }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 🛠️ 소통 플로팅 메인 버튼 (스패너 모양) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          id="guide-spanner-btn" /* [미세조정: 온보딩 가이드 타겟 ID] */
          style={{
            width: "40px", /* [미세조정: 스패너 버튼 가로 크기] */
            height: "40px", /* [미세조정: 스패너 버튼 세로 크기] */
            borderRadius: "20px",
            background: isOpen ? COLORS.BLUE : "#ffffff",
            backdropFilter: "blur(20px)",
            border: "1px solid #fa0606ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.3s, transform 0.1s",
            position: "relative",
          }}
        >
          {isOpen ? (
            // 닫기 X 아이콘
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            // 스패너 Wrench 아이콘
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.BLUE} strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          )}
          {!isOpen && (
            <div
              style={{
                position: "absolute",
                top: "-3px",
                right: "-3px",
                background: "#f77375ff",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                fontSize: "10px",
                fontWeight: "900",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
              }}
            >
              !
            </div>
          )}
        </button>
      </div>

      {/* 2. 쿨박스 이야기 (프리미엄 엽서 테마) */}
      {isLetterOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "24px",
            animation: 'talkroom-fade-in 0.25s ease-out'
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(28, 28, 30, 0.95)",
              color: "#FFFFFF",
              width: "100%",
              maxWidth: "340px",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              border: `1.5px solid ${COLORS.BLUE}88`,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              backdropFilter: "blur(20px)",
              animation: 'talkroom-slide-up 0.3s ease-out'
            }}
          >
            {/* 편지 상단 장식 */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "28px" }}></span>
              <h3 
                className="talkroom-modal-title"
                style={{ fontSize: "20px", fontWeight: "bold", color: "var(--point-blue)", marginTop: "8px" }}
              >
                {t("STORY_TITLE")}
              </h3>
            </div>

            {/* 편지 본문 */}
            <div
              style={{
                fontSize: "15px",
                lineHeight: "1.5",
                marginBottom: "24px",
                whiteSpace: "pre-wrap",
                color: "#D1D6DB",
              }}
            >
              {t("STORY_LETTER")}
            </div>

            {/* 편지 하단 닫기 버튼 */}
            <button
              onClick={() => setIsLetterOpen(false)}
              style={{
                ...BUTTON_STYLE.PRIMARY,
                width: "100%",
                height: BUTTON_SIZE.HEIGHT,
                borderRadius: BUTTON_SIZE.RADIUS,
                fontSize: "16px",
                fontWeight: BUTTON_SIZE.FONT_WEIGHT,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(72, 128, 238, 0.25)",
              }}
            >
              {t("STORY_CLOSE")}
            </button>
          </div>
        </div>
      )}

      {/* 3. 개발자 후원 선택 모달 */}
      {isSupportOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "24px",
            animation: 'talkroom-fade-in 0.25s ease-out'
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(28, 28, 30, 0.95)",
              color: "#FFFFFF",
              width: "100%",
              maxWidth: "340px",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              border: `1.5px solid ${COLORS.BLUE}88`,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              backdropFilter: "blur(20px)",
              animation: 'talkroom-slide-up 0.3s ease-out'
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "28px" }}>☕</span>
              <h3 
                className="talkroom-modal-title"
                style={{ fontSize: "20px", fontWeight: "bold", color: "var(--point-blue)", marginTop: "8px" }}
              >
                {t("SUPPORT_TITLE")}
              </h3>
              <p style={{ fontSize: "13px", color: "#8E8E93", marginTop: "4px" }}>
                {t("SUPPORT_SUBTITLE")}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {/* 1번 옵션: 송금 후원 */}
              <button
                onClick={() => {
                  purchaseProduct("support_coffee_monthly");
                  setIsSupportOpen(false);
                }}
                style={{
                  ...BUTTON_STYLE.PRIMARY,
                  width: "100%",
                  height: BUTTON_SIZE.HEIGHT,
                  borderRadius: BUTTON_SIZE.RADIUS,
                  fontSize: "16px",
                  fontWeight: BUTTON_SIZE.FONT_WEIGHT,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  border: "none",
                }}
              >
                {t("SUPPORT_COFFEE")}
              </button>

              {/* 2번 옵션: 광고 후원 (리워드 광고 우선, 실패/미출력 시 전면 광고 보완 연동) */}
              <button
                onClick={() => {
                  if (rewardedAd.isAdLoaded) {
                    rewardedAd.showAd(() => {
                      setIsSupportOpen(false);
                    });
                  } else if (interstitialAd.isAdLoaded) {
                    interstitialAd.showAd(() => {
                      setIsSupportOpen(false);
                    });
                  }
                }}
                disabled={!rewardedAd.isAdLoaded && !interstitialAd.isAdLoaded}
                style={{
                  width: "100%",
                  height: BUTTON_SIZE.HEIGHT,
                  borderRadius: BUTTON_SIZE.RADIUS,
                  fontSize: "16px",
                  fontWeight: BUTTON_SIZE.FONT_WEIGHT,
                  cursor: (rewardedAd.isAdLoaded || interstitialAd.isAdLoaded) ? "pointer" : "not-allowed",
                  backgroundColor: (rewardedAd.isAdLoaded || interstitialAd.isAdLoaded) ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
                  color: (rewardedAd.isAdLoaded || interstitialAd.isAdLoaded) ? "#FFFFFF" : "#8E8E93",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background-color 0.2s"
                }}
              >
                {t("SUPPORT_AD")} ({(rewardedAd.isAdLoaded || interstitialAd.isAdLoaded) ? t("READY") : t("LOADING")})
              </button>
            </div>

            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsSupportOpen(false)}
              style={{
                width: "100%",
                height: BUTTON_SIZE.HEIGHT,
                borderRadius: BUTTON_SIZE.RADIUS,
                fontSize: "14px",
                fontWeight: "normal",
                cursor: "pointer",
                backgroundColor: "transparent",
                color: "#3182F6",
                border: "none"
              }}
            >
              {t("CLOSE")}
            </button>
          </div>
        </div>
      )}

      {/* 4. 문의 및 공지 소통창 모달 */}
      {isInquiryOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
            animation: 'talkroom-fade-in 0.25s ease-out'
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(28, 28, 30, 0.95)",
              color: "#FFFFFF",
              width: "100%",
              maxWidth: "420px",
              height: "95vh",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              border: `1.5px solid ${COLORS.BLUE}88`,
              display: "flex",
              flexDirection: "column",
              position: "relative",
              backdropFilter: "blur(20px)",
              animation: 'talkroom-slide-up 0.3s ease-out'
            }}
          >
            {/* 상단 타이틀 및 닫기 버튼 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "bold", color: COLORS.WHITE, margin: 0 }}>
                {t("INQUIRY_TITLE")}
              </h3>
              <button
                onClick={() => setIsInquiryOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8E8E93",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px"
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 탭 헤더 */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "16px", gap: "16px" }}>
              <button
                onClick={() => setInquiryTab("notices")}
                style={{
                  padding: "8px 12px 12px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: inquiryTab === "notices" ? `2px solid ${COLORS.BLUE}` : "2px solid transparent",
                  color: inquiryTab === "notices" ? COLORS.BLUE : "#8E8E93",
                  fontWeight: "bold",
                  fontSize: "15px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {t("TAB_NOTICES")}
              </button>
              <button
                onClick={() => setInquiryTab("inquiry")}
                style={{
                  padding: "8px 12px 12px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: inquiryTab === "inquiry" ? `2px solid ${COLORS.BLUE}` : "2px solid transparent",
                  color: inquiryTab === "inquiry" ? COLORS.BLUE : "#8E8E93",
                  fontWeight: "bold",
                  fontSize: "15px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {t("TAB_INQUIRY")}
              </button>
            </div>

            {/* 탭 콘텐츠 영역 */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "4px" }}>
              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#8E8E93" }}>
                  {t("LOADING")}
                </div>
              ) : inquiryTab === "notices" ? (
                // 공지사항 리스트
                notices.length === 0 ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#8E8E93", fontSize: "14px" }}>
                    {t("NOTICE_EMPTY")}
                  </div>
                ) : (
                  notices.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "16px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.05)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "bold", color: COLORS.ACCENT, fontSize: "14px" }}>
                          {item.sender_name}
                        </span>
                        <span style={{ fontSize: "12px", color: "#8E8E93" }}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap", color: "#D1D6DB" }}>
                        {item.content}
                      </p>
                      {item.answer && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "12px",
                            backgroundColor: "rgba(49, 130, 246, 0.08)",
                            borderRadius: "12px",
                            borderLeft: `3px solid ${COLORS.BLUE}`
                          }}
                        >
                          <div style={{ fontSize: "12px", color: COLORS.BLUE, fontWeight: "bold", marginBottom: "4px" }}>
                            Developer Response
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap", color: "#E5E8EB" }}>
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : (
                // 1:1 문의 탭
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
                  {/* 작성 폼 */}
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      borderRadius: "16px",
                      border: "1px solid rgba(255,255,255,0.05)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#8E8E93", marginBottom: "6px", fontWeight: "bold" }}>
                        {t("INQUIRY_NAME_LABEL")}
                      </label>
                      <input
                        type="text"
                        value={newInquiryName}
                        onChange={(e) => setNewInquiryName(e.target.value)}
                        placeholder={t("INQUIRY_NAME_PLACEHOLDER")}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "10px",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#FFFFFF",
                          fontSize: "14px",
                          outline: "none"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#8E8E93", marginBottom: "6px", fontWeight: "bold" }}>
                        {t("INQUIRY_CONTENT_LABEL")}
                      </label>
                      <textarea
                        value={newInquiryContent}
                        onChange={(e) => setNewInquiryContent(e.target.value)}
                        placeholder={t("INQUIRY_CONTENT_PLACEHOLDER")}
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "12px",
                          borderRadius: "10px",
                          backgroundColor: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#FFFFFF",
                          fontSize: "14px",
                          outline: "none",
                          resize: "none",
                          fontFamily: "inherit"
                        }}
                      />
                    </div>
                    <button
                      onClick={handleSubmitInquiry}
                      disabled={isSubmitting || !newInquiryContent.trim()}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        backgroundColor: (isSubmitting || !newInquiryContent.trim()) ? "rgba(49, 130, 246, 0.4)" : COLORS.BLUE,
                        color: "#FFFFFF",
                        border: "none",
                        fontWeight: "bold",
                        cursor: (isSubmitting || !newInquiryContent.trim()) ? "not-allowed" : "pointer",
                        transition: "background-color 0.2s",
                        textAlign: "center"
                      }}
                    >
                      {isSubmitting ? t("INQUIRY_SUBMITTING") : t("INQUIRY_SUBMIT")}
                    </button>
                  </div>

                  {/* 내 문의 내역 목록 */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: "#8E8E93", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                      My Inquiry History
                    </div>
                    {inquiries.length === 0 ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, minHeight: "100px", color: "#8E8E93", fontSize: "13px" }}>
                        {t("INQUIRY_EMPTY")}
                      </div>
                    ) : (
                      inquiries.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: "14px",
                            backgroundColor: "rgba(255,255,255,0.02)",
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.04)"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: "bold",
                                backgroundColor: item.answer ? "rgba(45, 202, 114, 0.15)" : "rgba(255, 172, 0, 0.15)",
                                color: item.answer ? COLORS.GREEN : COLORS.ACCENT
                              }}
                            >
                              {item.answer ? t("INQUIRY_ANSWERED") : t("INQUIRY_ANSWER_PENDING")}
                            </span>
                            <span style={{ fontSize: "11px", color: "#8E8E93" }}>
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", color: "#D1D6DB", wordBreak: "break-all" }}>
                            {item.content}
                          </p>
                          {item.answer && (
                            <div
                              style={{
                                marginTop: "10px",
                                padding: "10px",
                                backgroundColor: "rgba(45, 202, 114, 0.05)",
                                borderRadius: "8px",
                                borderLeft: `2.5px solid ${COLORS.GREEN}`
                              }}
                            >
                              <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.4", color: "#E5E8EB" }}>
                                {item.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes talkroom-fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes talkroom-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
