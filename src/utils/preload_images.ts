/**
 * 이미지 사전 로딩(Preload) 유틸리티
 * 토스 웹뷰에서 드래그 중 이미지 깜빡임(flickering)을 원천 차단합니다.
 * 게임 진입 전에 모든 이미지를 브라우저 캐시에 미리 올려놓습니다.
 */

const preloadedImages: HTMLImageElement[] = [];

export const preloadImages = (urls: string[]): void => {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
    preloadedImages.push(img); // GC 방지를 위해 참조 유지
  });
};

/**
 * 슬램덩크 게임에 필요한 모든 이미지를 한 번에 사전 로딩합니다.
 * - 17종 식재료 캐릭터 이미지
 * - 4종 골대 아이콘 이미지
 */
export const preloadGameImages = (): void => {
  const BASE = "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public";

  const ingredientImages = Array.from({ length: 17 }, (_, i) =>
    `${BASE}/item-images/ingredients/${i + 1}.webp`
  );

  const goalIcons = [
    `${BASE}/ui-assets/fresh.webp`,
    `${BASE}/ui-assets/chilled.webp`,
    `${BASE}/ui-assets/frozen.webp`,
    `${BASE}/ui-assets/outer.webp`,
  ];

  // 말풍선 배경 이미지도 함께 사전 로딩
  const bubbleImages = Array.from({ length: 6 }, (_, i) =>
    `${BASE}/item-images/${101 + i}.webp`
  );

  // 그리드 배경 이미지
  const grids = [
    `${BASE}/item-images/green_grid.webp`,
    `${BASE}/item-images/orenge_grid.webp`,
    `${BASE}/item-images/yellow_grid.webp`,
    `${BASE}/item-images/pink_grid.webp`,
  ];

  preloadImages([...ingredientImages, ...goalIcons, ...bubbleImages, ...grids]);
};
