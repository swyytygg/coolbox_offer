import { useState } from "react";
import { COLORS, BUTTON_STYLE, BUTTON_SIZE, SAFE_AREA } from "./style/constants.ui";
import { useTranslation } from "react-i18next";

interface PersonalConsentProps {
  isOpen: boolean;
  onAgree: () => void;
  onDecline: () => void;
}

/**
 * PersonalConsent (개인_동의) 바텀시트 모달 컴포넌트
 * - 사용자의 영수증 수집 및 활용 동의를 구하는 프리미엄 디자인의 서랍 모달입니다.
 * - 체크박스를 누르면 체크 상태가 토글되며, 동의함 버튼의 활성/비활성 상태가 동적으로 변경됩니다.
 */
export function PersonalConsent({ isOpen, onAgree, onDecline }: PersonalConsentProps) {
  const { t } = useTranslation();
  const [isChecked, setIsChecked] = useState(false);

  // 체크박스 토글 이벤트
  const handleCheckboxToggle = () => {
    setIsChecked((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onDecline}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 5000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 0.25s ease-out' // 애니메이션 시간 일치 (0.25s -> 0.3s)
      }}
    >
      {/* 바텀시트 컨테이너 (토스풍 프리미엄 디자인 설계) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '430px', // 일반 모바일 폰 뷰 사이즈 가이드 고정
          backgroundColor: '#111111', // 토스 다크모드 시그니처 딥블랙
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          padding: '24px',
          paddingBottom: SAFE_AREA.MARGIN_BOTTOM_LARGE,
          boxSizing: 'border-box',
          animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)' // CookAlarm과 슬라이드업 타이밍 및 가속 곡선 완벽 일치 (0.35s -> 0.4s)
        }}
      >
        {/* 상단 드래그 핸들바 디자인 */}
        <div style={{
          width: '40px',
          height: '4px',
          backgroundColor: '#3A3A3C',
          borderRadius: '2px',
          margin: '0 auto 24px auto',
        }} />

        {/* 타이틀 및 상세 설명 영역 (스크롤 전면 배제, 가독성 극대화) */}
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.BLUE, marginBottom: '12px', lineHeight: 1.4, marginTop: 0 }}>
            {t("CONSENT_TITLE", "영수증 텍스트 인식 기능을 위한 동의")}
          </h2>
          
          <p style={{ fontSize: '14.5px', color: COLORS.GREY_80, lineHeight: 1.6, marginBottom: '12px', marginTop: 0 }}>
            {t("CONSENT_DESC_1", "이 기능은 촬영 또는 업로드한 영수증 사진의 텍스트를 인식하여 앱에 쉽게 기록할 수 있도록 도와줍니다.")}
          </p>
          <p style={{ fontSize: '14.5px', color: COLORS.GREY_80, lineHeight: 1.6, marginBottom: '14px', marginTop: 0 }}>
            {t("CONSENT_DESC_2", "기능을 사용하기 위해 아래 영수증 사진 파일의 수집 및 활용에 대한 동의가 필요합니다.")}
          </p>
        </div>

        {/* 커스텀 버튼식 체크박스 */}
        <div 
          onClick={handleCheckboxToggle}
          style={{ 
            backgroundColor: '#1C1C1E', padding: '16px', borderRadius: '16px', marginBottom: '24px',
            cursor: 'pointer', userSelect: 'none', display: 'flex', flexDirection: 'column', gap: '12px',
            border: isChecked ? `1px solid ${COLORS.BLUE}` : '1px solid transparent',
            transition: 'all 0.2s ease-out'
          }}
        >
          <div style={{ fontSize: '13px', color: COLORS.GREY_80, lineHeight: 1.5 }}>
            {t("CONSENT_NOTICE", "※ 전송된 데이터는 영수증 텍스트를 읽기 위해서만 사용되며, 다른 개인정보는 수집하지 않습니다.")}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              backgroundColor: isChecked ? COLORS.BLUE : '#111111',
              border: isChecked ? 'none' : `1.5px solid ${COLORS.GREY_80}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease-out'
            }}>
            {/* 체크마크 svg */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontSize: '15px', color: '#FFF', fontWeight: 'bold' }}>
              {t("CONSENT_CHECKBOX", "영수증 사진 파일의 수집 및 활용에 동의합니다.")}
            </span>
          </div>
        </div>

        {/* 동작 버튼 영역 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* 부버튼: 동의 안 함 (SECONDARY) */}
          <button 
            onClick={onDecline}
            style={{ 
              ...BUTTON_STYLE.SECONDARY, 
              flex: 1, 
              height: BUTTON_SIZE.HEIGHT, 
              borderRadius: BUTTON_SIZE.RADIUS, 
              fontSize: '16px', 
              fontWeight: BUTTON_SIZE.FONT_WEIGHT,
              cursor: 'pointer'
            }}
          >
            {t("DECLINE", "동의 안 함")}
          </button>
          
          {/* 주버튼: 동의함 (PRIMARY) */}
          <button 
            onClick={onAgree}
            style={{ 
              ...BUTTON_STYLE.PRIMARY, 
              flex: 1, 
              height: BUTTON_SIZE.HEIGHT, 
              borderRadius: BUTTON_SIZE.RADIUS, 
              fontSize: '16px', 
              fontWeight: BUTTON_SIZE.FONT_WEIGHT,
              opacity: isChecked ? 1 : 0.4, 
              transition: 'all 0.2s ease-out',
              cursor: isChecked ? 'pointer' : 'not-allowed'
            }}
            disabled={!isChecked}
          >
            {t("AGREE", "동의함")}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
          from { transform: translateY(100%); } 
          to { transform: translateY(0); } 
        }
      `}</style>
    </div>
  );
}
