import { COLORS, BUTTON_STYLE, BUTTON_SIZE, ICONS, SAFE_AREA } from "./style/constants.ui";
import { useItemAddLogic } from "../hooks/useItemAddLogic";
import { useTranslation } from "react-i18next";

interface ItemAddProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: any) => void;
  onDelete?: (id: number) => void;
  mode: 'add' | 'edit' | 'detail'; // 세 가지 모드 통합
  initialData?: any;
}

const locKeyMap = {
  '신선': 'STORAGE_FRESH',
  '냉장': 'STORAGE_CHILLED',
  '냉동': 'STORAGE_FROZEN',
  '실외': 'STORAGE_OUTSIDE'
} as const;

/**
 * ItemAdd UI - 품목 추가 / 수정 / 상세 보기 통합 서랍
 */
export function ItemAdd({ isOpen, onClose, onSave, onDelete, mode, initialData }: ItemAddProps) {
  const { t } = useTranslation();
  const {
    name, setName,
    purchaseDate, setPurchaseDate,
    expiryDays, setExpiryDays,
    location, setLocation,
    quantity, setQuantity,
    showQuickExpiry, setShowQuickExpiry,
    isDetail, dynamicImageUrl
  } = useItemAddLogic(mode, initialData);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        zIndex: 8000, display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', backgroundColor: '#141414',
          borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
          padding: `20px 24px ${SAFE_AREA.MARGIN_BOTTOM_LARGE} 24px`,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)'
        }}
      >
        {/* 상단 헤더 영역 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.GREY_80 }}>
            {isDetail ? t("INGREDIENT_DETAIL", "식재료 상세 정보") : (mode === 'add' ? t("ADD_ITEM_TITLE", "품목 추가") : t("EDIT_ITEM_TITLE", "품목 수정"))}
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              backgroundColor: 'rgba(255,255,255,0.05)', border: 'none',
              color: '#FFF', fontSize: '20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* 품목 정보 (이름 + 아이콘) */}
        <div style={{ 
          display: 'flex', alignItems: 'center', 
          justifyContent: isDetail ? 'center' : 'flex-start', // 상세 모드에서 중앙 정렬
          gap: '16px', marginBottom: '32px' 
        }}>
          {/* 식품 아이콘 표시 (모든 모드에서 이름 입력값에 따라 실시간 캐릭터 실시간 피드백) */}
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            backgroundColor: COLORS.WHITE, // 흰색 단색 배경 적용
            border: `4px solid ${COLORS.BLUE}`, // 쿨박스 공식 파란색 테두리
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 6px 18px rgba(0,0,0,0.15)'
          }}>
            <img 
              src={dynamicImageUrl} 
              style={{ width: '85%', height: '85%', objectFit: 'contain' }} // contain 비율로 정밀 보전
              alt="food-icon"
            />
          </div>
          
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("INPUT_NAME_PLACEHOLDER", "이름 알려주세요")}
            style={{
              width: isDetail ? '65%' : '100%', // 상세 모드에서 너비 제한
              backgroundColor: 'transparent', border: 'none',
              borderBottom: `2px solid ${COLORS.BLUE}`, color: COLORS.WHITE,
              fontSize: '24px', fontWeight: 'bold', padding: '8px 0',
              outline: 'none',
              textAlign: isDetail ? 'center' : 'left' // 상세 모드에서 텍스트 중앙 정렬
            }}
          />
        </div>

        {/* [동일 섹션] 날짜 및 소비기한 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px' }}>
            <div style={{ fontSize: '15px', color: COLORS.GREY_80, marginBottom: '8px' }}>{t("PURCHASE_DATE", "구매 날짜")}</div>
            <input 
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              style={{ backgroundColor: 'transparent', border: 'none', color: COLORS.WHITE, fontSize: '16px', width: '100%', outline: 'none' }}
            />
          </div>

          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px', color: COLORS.GREY_80 }}>{t("EXPIRY_LIMIT", "소비 기한")}</span>
              <span onClick={() => setShowQuickExpiry(!showQuickExpiry)} style={{ fontSize: '15px', color: COLORS.WHITE, cursor: 'pointer' }}>{t("SETTING", "설정")}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <button onClick={() => setExpiryDays(d => Math.max(0, d - 1))} style={stepperBtnStyle}>-</button>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.WHITE }}>{expiryDays} <small style={{ fontSize: '16px' }}>{t("FIELD_EXPIRY_UNIT_DAYS", "일")}</small></span>
              <button onClick={() => setExpiryDays(d => d + 1)} style={stepperBtnStyle}>+</button>
            </div>
            {showQuickExpiry && (
              <div style={{
                position: 'absolute', top: '-110px', right: 0, backgroundColor: '#222', borderRadius: '16px', padding: '12px',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', zIndex: 10, border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {quickDays.map(d => (
                  <button key={d} onClick={() => { setExpiryDays(d); setShowQuickExpiry(false); }} style={quickBtnStyle}>{t("DAYS_COUNT", "{{count}}일", { count: d })}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* [동일 섹션] 보관 위치 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '15px', color: COLORS.GREY_80, marginBottom: '12px' }}>{t("FIELD_LOCATION", "보관 위치")}</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['신선', '냉장', '냉동', '실외'] as const).map(loc => (
              <div 
                key={loc}
                onClick={() => setLocation(loc)}
                style={{
                  flex: 1, aspectRatio: '1', borderRadius: '16px',
                  backgroundColor: location === loc ? 'rgba(49, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: location === loc ? `2px solid ${COLORS.BLUE}` : '2px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px'
                }}
              >
                <img src={ICONS[loc as keyof typeof ICONS]} style={{ width: '30px', height: '30px', opacity: location === loc ? 1 : 0.4 }} alt={loc} />
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: location === loc ? COLORS.BLUE : COLORS.GREY_80 }}>{t(locKeyMap[loc], loc)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* [동일 섹션] 수량 조절 */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <span style={{ fontSize: '16px', color: COLORS.GREY_80 }}>{t("FIELD_QUANTITY", "수량")}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={stepperBtnStyle}>-</button>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.WHITE }}>{quantity.toString().padStart(2, '0')} <small style={{ fontSize: '14px' }}>{t("QTY_UNIT", "개")}</small></span>
            <button onClick={() => setQuantity(q => Math.min(99, q + 1))} style={stepperBtnStyle}>+</button>
          </div>
        </div>

        {/* 하단 버튼 그룹 (2단 레이아웃 반영) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 주버튼: 추가/수정 (항상 노출) */}
          <button 
            onClick={() => {
              // 유저가 설정한 D-Day(expiryDays 상태값)를 바탕으로 실제 DB에 들어갈 총 수명 역산
              const now = new Date();
              const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const [year, month, day] = purchaseDate.split('-').map(Number);
              const startLocal = new Date(year, month - 1, day);
              const diffTime = todayLocal.getTime() - startLocal.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              
              // 유저가 세팅한 남은 날짜 + 과거부터 오늘까지 흐른 날짜 = 원래 이 식품이 가져야 할 총 수명
              const calculatedExpiryDays = expiryDays + Math.max(0, diffDays);

              onSave({ 
                ...initialData,
                name, purchaseDate, 
                expiryDays: calculatedExpiryDays, 
                location, quantity,
                imageUrl: dynamicImageUrl
              });
            }}
            style={{ 
              ...BUTTON_STYLE.PRIMARY, width: '100%', 
              height: BUTTON_SIZE.HEIGHT, borderRadius: BUTTON_SIZE.RADIUS, 
              fontSize: '18px', fontWeight: BUTTON_SIZE.FONT_WEIGHT 
            }}
          >
            {mode === 'add' ? t("ADD_SUBMIT", "추가해요") : t("EDIT_SUBMIT", "수정해요")}
          </button>
          
          {/* 부버튼: 다 먹었어요 (상세 모드일 때만 노출) */}
          {mode === 'detail' && (
            <button 
              onClick={() => onDelete?.(initialData?.id)}
              style={{ 
                ...BUTTON_STYLE.SECONDARY, width: '100%', 
                height: BUTTON_SIZE.HEIGHT, borderRadius: BUTTON_SIZE.RADIUS, 
                fontSize: '17px', fontWeight: BUTTON_SIZE.FONT_WEIGHT 
              }}
            >
             {t("FINISHED_ITEM", "다 먹었어요")}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const stepperBtnStyle: React.CSSProperties = {
  width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none',
  color: COLORS.WHITE, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};

const quickBtnStyle: React.CSSProperties = {
  padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: COLORS.WHITE, fontSize: '12px'
};

const quickDays = [3, 7, 10, 30, 60, 90];
