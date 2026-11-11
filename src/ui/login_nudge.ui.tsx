import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useTranslation } from "react-i18next";

interface LoginNudgeProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  mode: 'unlimited' | 'reward' | 'point';
}

/**
 * [통합] 비회원 로그인 권유 넛지 다이얼로그 (TDS 표준 320px)
 */
export function LoginNudge({ isOpen, onClose, onLoginSuccess, mode }: LoginNudgeProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
    try {
      console.log(`[LoginNudge] ${provider} 로그인 연동 시도...`);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      
      setIsSuccess(true);
      setToastMessage(t("LOGIN_IN_PROGRESS", { provider: provider === 'google' ? 'Google' : '카카오', defaultValue: `${provider === 'google' ? 'Google' : '카카오'} 로그인 중...` }));
      setTimeout(() => {
        setToastMessage(null);
        onLoginSuccess();
      }, 1500);
    } catch (err: any) {
      console.error(`[LoginNudge] ${provider} 로그인 실패`, err);
      alert(t("LOGIN_ERROR_ALERT", { message: err.message, defaultValue: `로그인 진행 중 오류가 발생했습니다: ${err.message}` }));
    }
  };

  // 모드별 텍스트 및 아이콘 설정
  const getContent = () => {
    switch (mode) {
      case 'unlimited':
      default: // 임시: 리워드, 포인트 프로모션 준비 전까지 기본값으로 사용
        return {
          icon: "🎁",
          title: t("LOGIN_NUDGE_UNLIMITED_TITLE", "무제한 무과금 안내"),
          description: (
            <span style={{ whiteSpace: 'pre-line' }}>
              {t("LOGIN_NUDGE_UNLIMITED_DESC", "무제한 무과금으로 이용 가능해요!\n로그인하면 기기가 바뀌어도\n데이터를 안전하게 보존해요.")}
            </span>
          )
        };
    }
  };

  const { icon, title, description } = getContent();

  return (
    <>
      {/* 배경 딤(Dim) - 토스 스타일 반투명 블랙 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 999,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.25s ease-out',
          willChange: 'opacity'
        }}
      />

      {/* 다이얼로그 메인 (TDS 공식 320px 규격) */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '320px',
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF', // 토스 스타일 화이트 팝업
          borderRadius: '24px',
          padding: '32px 24px',
          zIndex: 1000,
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          transform: (isVisible && !isSuccess) ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)',
          opacity: (isVisible && !isSuccess) ? 1 : 0,
          transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.25s ease-out',
          willChange: 'transform, opacity'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#191F28', marginBottom: '12px' }}>{title}</h2>
          <p style={{ fontSize: '15px', color: '#4E5968', lineHeight: 1.6, marginBottom: '28px' }}>
            {description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => handleOAuthLogin('google')}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                background: '#FFFFFF',
                color: '#191F28',
                border: '1px solid #191F28',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {t("LOGIN_WITH_GOOGLE", "Google로 시작하기")}
            </button>
            <button
              onClick={() => handleOAuthLogin('kakao')}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                background: '#FEE500',
                color: '#191F28',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {t("LOGIN_WITH_KAKAO", "카카오로 시작하기")}
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#F2F4F6',
                color: '#191F28',
                border: '1px solid #191F28',
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {t("LOGIN_NUDGE_LATER", "다음에 할게요 (스캔 진행)")}
            </button>
          </div>
        </div>
      </div>

      {/* Toss Style Toast */}
      {toastMessage && (
        <div 
          className="toss-light-toast"
          style={{
            position: 'fixed',
            bottom: '300px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '16px 28px',
            color: '#3182F6',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            zIndex: 99999,
            minWidth: '220px',
            textAlign: 'center',
            animation: 'toss-toast-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <path d="M20 6L9 17L4 12" stroke="#3182F6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      <style>{`
        .force-dark .toss-light-toast {
          background-color: #FFFFFF !important;
        }
        .force-dark .toss-light-toast span {
          color: #3182F6 !important;
          background-color: transparent !important;
        }
        @keyframes toss-toast-in {
          from { opacity: 0; transform: translate(-50%, 20px) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
      `}</style>
    </>
  );
}
