import { memo, RefObject } from "react";
import { COLORS, ICONS } from "./style/constants.ui";


interface GridProps {
  targetSlot?: number | null;
  recommendedCategory?: string;
  isShooting?: boolean;
  slotRefs?: RefObject<HTMLDivElement>[]; // 골대 DOM 좌표 읽기용
}

// 2D 우주 격자 이미지 맵핑 (사용자 제공 리소스)
const GRID_IMAGES = {
  냉동: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/green_grid.webp",
  냉장: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/orenge_grid.webp",
  신선: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/yellow_grid.webp",
  실외: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/pink_grid.webp",
} as const;

/**
 * Grid UI - 2D 원근 그리드 배경 및 골대 부품
 */
export const Grid = memo(function Grid({
  targetSlot,
  recommendedCategory,
  isShooting,
  slotRefs
}: GridProps) {
  const slots = [
    { label: '냉동', key: '냉동', src: ICONS['냉동'] },
    { label: '냉장', key: '냉장', src: ICONS['냉장'] },
    { label: '신선', key: '신선', src: ICONS['신선'] },
    { label: '실외', key: '실외', src: ICONS['실외'] }
  ];

  // 조준 상태 또는 추천 카테고리에 맞춰 동적으로 배경 이미지 선택
  let activeGridKey: keyof typeof GRID_IMAGES = '냉장'; // 기본값

  if (targetSlot === 0) activeGridKey = '냉동';
  else if (targetSlot === 1) activeGridKey = '냉장';
  else if (targetSlot === 2) activeGridKey = '신선';
  else if (targetSlot === 3) activeGridKey = '실외';
  else if (recommendedCategory === '냉동' || recommendedCategory === 'frozen') activeGridKey = '냉동';
  else if (recommendedCategory === '냉장' || recommendedCategory === 'chilled') activeGridKey = '냉장';
  else if (recommendedCategory === '신선' || recommendedCategory === 'fresh') activeGridKey = '신선';
  else if (recommendedCategory === '실외' || recommendedCategory === 'outer') activeGridKey = '실외';

  const backgroundImage = GRID_IMAGES[activeGridKey];

  return (
    <div style={{
      position: 'absolute',
      top: 0, bottom: 0, left: 0, right: 0,
      pointerEvents: 'none', zIndex: 1, overflow: 'hidden'
    }}>
      {/* 2D 원근 그리드 배경 이미지 */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        opacity: 1,
        transition: 'background-image 0.2s ease-in-out'
      }} />

      {/* 지평선 부근의 골대 (아이콘 + 형광 효과 통합) */}
      <div style={{
        position: 'absolute',
        top: '27%', // 2D 배경의 소실점에 알맞게 위치 지정 (수동 조절 가능)
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '30px',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
      }}>
        {slots.map((item, index) => {
          const isTargeted = targetSlot === index;
          const isRecommended = recommendedCategory === item.key && !isShooting;
          
          return (
            <div key={index} ref={slotRefs?.[index]} style={{
              width: '45px', 
              height: '45px',
              borderRadius: '50%',
              // 조준 시 형광 초록, 추천 시 블루 테두리
              border: isTargeted ? '4px solid #00FF00' : `4px solid ${isRecommended ? COLORS.BLUE : 'rgba(255,255,255,0.2)'}`,
              boxShadow: isTargeted ? '0 0 50px #00FF00' : (isRecommended ? `0 0 40px ${COLORS.BLUE}` : 'none'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              transition: 'all 0.2s'
            }}>
              <img src={item.src} alt={item.label} style={{ width: '36px', height: '36px', objectFit: 'contain', willChange: 'auto' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
});
