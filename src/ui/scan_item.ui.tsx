import { useState } from "react";
import { COLORS, BUTTON_STYLE, SAFE_AREA } from "./style/constants.ui";
import { ItemAdd } from "./item_add.ui";
import { useEffect } from "react";
import { MOTION_KEYFRAMES_CSS } from "../utils/character_motions";
import { useTranslation } from "react-i18next";

interface ScanItemProps {
  initialItems?: any[]; // 부모 컴포넌트(서버 통신부)에서 받아올 진짜 결과
  hasFridge?: boolean; // ◀ 기존 냉장고 보유 여부 추가
  // [수정] 부모 컨테이너가 낙장불입 시점에 이름까지 일괄 DB 처리할 수 있도록 customFridgeName 인수 추가
  onConfirm: (items: any[], customFridgeName: string) => void;
  onCancel: () => void;
}

const locKeyMap = {
  '신선': 'STORAGE_FRESH',
  '냉장': 'STORAGE_CHILLED',
  '냉동': 'STORAGE_FROZEN',
  '실외': 'STORAGE_OUTSIDE'
} as const;

/**
 * ScanItem UI - 스캔 후 인식된 품목을 검토하는 화면
 */
export function ScanItem({ initialItems = [], hasFridge = false, onConfirm, onCancel }: ScanItemProps) {
  const { t } = useTranslation();
  // 부모로부터 넘겨받은 스캔 결과를 로컬 상태로 관리 (유저가 직접 추가/수정 가능하도록)
  const [items, setItems] = useState<any[]>(initialItems);

  // 데이터가 뒤늦게 들어올 경우 동기화
  useEffect(() => {
    if (initialItems.length > 0) setItems(initialItems);
  }, [initialItems]);

  // [State] 서랍 제어
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // [신규] 냉장고 이름 제어 (기존 냉장고가 있을 경우 빈 값으로 시작)
  const [fridgeName, setFridgeName] = useState(hasFridge ? "" : t("MY_FRIDGE_DEFAULT_NAME", "우리집 냉장고"));
  const [showTooltip, setShowTooltip] = useState(!hasFridge);

  // 툴팁은 4초 후 자동 사라짐
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  // 품목 수정 열기
  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  // 품목 추가 열기
  const handleAddClick = () => {
    setSelectedItem(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  // 서랍 데이터 저장 핸들러
  const handleSave = (updatedItem: any) => {
    if (drawerMode === 'edit') {
      setItems(prev => prev.map(it => it.id === updatedItem.id ? { ...it, ...updatedItem, daysLeft: updatedItem.expiryDays } : it));
    } else {
      const newItem = {
        ...updatedItem,
        id: Date.now(),
        daysLeft: updatedItem.expiryDays
      };
      setItems(prev => [...prev, newItem]);
    }
    setDrawerOpen(false);
  };

  // 품목 삭제 핸들러
  const handleDelete = (id: number) => {
    setItems(prev => prev.filter(it => it.id !== id));
    setDrawerOpen(false);
  };


  return (
    <div style={{ 
      backgroundColor: "#000", height: '100%', 
      display: 'flex', flexDirection: 'column', color: '#FFF',
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{MOTION_KEYFRAMES_CSS}</style>
      {/* 헤더 영역 */}
      <header style={{ 
        paddingTop: SAFE_AREA.HEADER_PADDING_TOP, 
        paddingLeft: '24px', paddingRight: '24px', marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div onClick={onCancel} style={{ cursor: 'pointer', opacity: 0.8, padding: '4px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '8px' }}>{t("REVIEW_TITLE", "영수증 분석 결과")}</h1>
        
        {/* [신규] 냉장고 이름 수정 영역 (신규 가입 유저에게만 노출) */}
        {!hasFridge && (
          <div style={{ position: 'relative', marginTop: '16px', marginBottom: '8px' }}>
            {showTooltip && (
              <div 
                className="tooltip-glow-shake"
                style={{ 
                  position: 'absolute', top: '60px', left: '0', 
                  backgroundColor: COLORS.BLUE, color: '#FFF', padding: '14px 14px', 
                  borderRadius: '12px', fontSize: '16px', fontWeight: 'bold',
                  zIndex: 10
                }}
              >
                {t("FRIDGE_CREATED_CONGRATS", "🎉 냉장고가 만들어졌어요! 예쁜 이름주세요")}
                <div style={{ position: 'absolute', top: '-5px', left: '20px', width: '10px', height: '10px', backgroundColor: COLORS.BLUE, transform: 'rotate(45deg)' }} />
              </div>
            )}
            <input 
              type="text" 
              value={fridgeName}
              onChange={(e) => setFridgeName(e.target.value)}
              style={{ 
                backgroundColor: '#1C1C1E', border: `2px solid ${COLORS.WHITE}`, 
                color: COLORS.BLUE, padding: '14px 16px', borderRadius: '12px', 
                fontSize: '18px', fontWeight: 'bold', width: '100%', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}
        <p style={{ fontSize: '15px', color: COLORS.GREY_80, marginTop: hasFridge ? '0px' : '8px' }}>{t("ALL_READY", "모든 준비가 완료됐어요")}</p>
      </header>

      {/* 품목 리스트 영역 */}
      <main style={{ flex: 1, overflowY: 'auto', paddingLeft: '24px', paddingRight: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item, index) => (
          <div key={item.id || index} style={{
            backgroundColor: '#1C1C1E', borderRadius: '20px', padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* 캐릭터 이미지 영역 */}
              {item.imageUrl && (
                <div style={{
                  width: '64px', height: '64px', backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: '48px', height: 'auto', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
                </div>
              )}
              
              {/* 텍스트 영역 */}
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>{t(item.name, item.name)}</div>
                <div style={{ fontSize: '13px', display: 'flex', gap: '8px' }}>
                  <span style={{ color: COLORS.BLUE, fontWeight: 'bold' }}>{t(locKeyMap[item.location as keyof typeof locKeyMap] || item.location, item.location)}</span>
                  <span style={{ color: COLORS.GREY_80 }}>• {item.quantity}{t("QTY_UNIT", "개")}</span>
                  <span style={{ color: COLORS.ORANGE }}>• {t("DAYS_LEFT_LABEL", "{{count}}일 남음", { count: item.daysLeft })}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleEditClick(item)}
              style={{
                backgroundColor: 'transparent', border: `2px solid ${COLORS.WHITE}`, borderRadius: '12px',
                width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke={COLORS.BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}

        {/* 품목 추가 버튼 */}
        <button 
          onClick={handleAddClick}
          style={{
            ...BUTTON_STYLE.SECONDARY,
            width: '100%', height: '70px', borderRadius: '20px',
            fontSize: '20px', marginTop: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: COLORS.WHITE, gap: '8px', cursor: 'pointer',
            flexShrink: 0 // 💡 이 스타일 한 줄만 추가해 주세요!
          }}
        >
          <span>+ {t("ADD_SUBMIT", "추가해요")}</span>
        </button>
      </main>

      {/* 하단 안내 및 확인 버튼 영역 */}
      <footer style={{ padding: '24px', paddingBottom: SAFE_AREA.FOOTER_PADDING_BOTTOM }}>
        <div style={{
          backgroundColor: '#151410', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px',
          display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid rgba(255, 215, 0, 0.1)'
        }}>
          <span style={{ fontSize: '18px' }}>✨</span>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFD700' }}>{t("SCAN_REVIEW_ALERT", "입고 전 마지막으로 확인해 주세요!\n품목이 누락될 수 있어요")}</div>
        </div>

        <button 
          onClick={() => {
            // [의도 반영] 이 확인 버튼 클릭 완료가 최종 입고 확정입니다.
            // 직접 DB를 호출하던 기존 비동기 방식 대신, 수동 수정한 fridgeName을 부모로 안전하게 이관합니다.
            onConfirm(items, fridgeName);
          }}
          style={{ 
            ...BUTTON_STYLE.PRIMARY, 
            width: '100%', height: '64px', borderRadius: '24px', 
            fontSize: '20px', fontWeight: 'bold' 
          }}
        >
          {t("CONFIRM", "확인했어요")}
        </button>
      </footer>

      {/* [통합 서랍] 품목 추가/수정용 */}
      <ItemAdd 
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        initialData={selectedItem}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
