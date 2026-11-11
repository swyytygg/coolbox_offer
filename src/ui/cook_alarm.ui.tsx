import { generateQueries } from "../utils/alarm_engine";
import { COLORS, SAFE_AREA } from "./style/constants.ui";
import { useTranslation } from "react-i18next";

interface CookAlarmProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'emergency' | 'recommend' | 'more' | 'none';
  items: Array<{ id: number; name: string; daysLeft?: number }>;
}

/**
 * CookAlarm UI - 집중형 알림 카드 (서랍형)
 */
export function CookAlarm({ isOpen, onClose, mode, items }: CookAlarmProps) {
  const { t } = useTranslation();
  if (!isOpen || mode === 'none' || items.length === 0) return null;

  const isEmergency = mode === 'emergency';
  const mainColor = isEmergency ? '#FF5722' : '#FFD700'; // 긴급: 주황, 추천: 노랑

  // 가장 중요한 첫 번째 아이템 하나만 강조 (Hero Item)
  const heroItem = items[0];
  const queries = generateQueries(heroItem.name);

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
        zIndex: 4000, display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', 
          backgroundColor: '#1C1C1E', borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
          padding: `20px 24px calc(${SAFE_AREA.BOTTOM} + 32px) 24px`, textAlign: 'center',
          boxShadow: `0 -10px 40px rgba(0,0,0,0.5), 0 0 20px ${mainColor}22`,
          borderTop: `1px solid ${mainColor}33`,
          animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)'
        }}
      >
        {/* 서랍 핸들 */}
        <div style={{ width: '40px', height: '5px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px', margin: '0 auto 30px auto' }} />

        {/* 헤더 아이콘 */}
        <div style={{ fontSize: '56px', marginBottom: '24px', filter: `drop-shadow(0 0 10px ${mainColor}44)` }}>
          {isEmergency ? '🕒' : '🍲'}
        </div>

        {/* 타이틀 */}
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: mainColor, marginBottom: '12px' }}>
          {isEmergency ? t("ALERT_SHELF_LIFE", "소비기한 임박 알림") : mode === 'more' ? t("MORE_RECIPE_SEARCH", "추천 맞춤 검색 더보기") : t("SMART_RECIPE_RECOMMEND", "오늘의 스마트 추천")}
        </h2>
        
        <p style={{ fontSize: '16px', color: '#EEE', marginBottom: '32px', lineHeight: '1.5' }}>
          {isEmergency 
            ? <>{t("HERO_ITEM_URGENT_DETAIL", { name: t(heroItem.name, heroItem.name), daysLeft: heroItem.daysLeft, defaultValue: `${heroItem.name}의 신선도 시간이 없어요! (D-${heroItem.daysLeft})` })}</>
            : <>{t("HERO_ITEM_RECIPE_DETAIL", { name: t(heroItem.name, heroItem.name), defaultValue: `${heroItem.name}를 활용한 재미있는 정보를 확인해요.` })}</>
          }
        </p>

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {queries.map((q, idx) => (
            <button 
              key={idx}
              onClick={() => {
                window.open(`https://search.naver.com/search.naver?query=${q.query}`, '_blank');
                onClose();
              }}
              style={{ 
                width: '100%', padding: '18px', borderRadius: '18px', 
                backgroundColor: idx === 0 ? mainColor : 'transparent', 
                border: `2px solid ${mainColor}`,
                color: (!isEmergency && idx === 0) ? COLORS.BLUE : '#FFF', 
                textShadow: (!isEmergency && idx === 0) ? '0 0 0.5px rgba(0,0,0,0.5)' : 'none',
                fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: idx === 0 ? `0 8px 20px ${mainColor}44` : 'none'
              }}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div 
          onClick={onClose}
          style={{ fontSize: '14px', color: COLORS.GREY_80, cursor: 'pointer', textDecoration: 'underline' }}
        >
          {t("REMIND_LATER", "나중에 다시 알림")}
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
