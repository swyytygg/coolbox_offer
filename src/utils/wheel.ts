/**
 * 워터휠(Waterwheel) 및 페이지네이션 핵심 로직
 */

/**
 * 식재료 데이터를 받아 페이지별로 분할합니다.
 */
export const calculatePages = (mockItems: any, itemsPerPage: number) => {
  const pages: any[] = [{ type: 'main', label: '메인', items: [] }];
  const categories: Array<'신선' | '냉장' | '냉동' | '실외'> = ["신선", "냉장", "냉동", "실외"];
  
  categories.forEach(cat => {
    const rawItems = mockItems[cat] || [];
    // 식재료 목록 끝에 '직접 추가 버튼용 가상 아이템'을 미리 삽입하여 페이징을 자동화합니다.
    const items = [...rawItems, { id: `add-placeholder-${cat}`, isAddPlaceholder: true }];
    const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
    
    for (let i = 0; i < totalPages; i++) {
      pages.push({
        type: cat,
        label: totalPages > 1 ? `${cat} (${i + 1}/${totalPages})` : cat,
        items: items.slice(i * itemsPerPage, (i + 1) * itemsPerPage),
        pageIdx: i
      });
    }
  });
  return pages;
};

/**
 * 무한 루프를 위한 다음 인덱스를 계산합니다.
 */
export const getInfiniteIndex = (currentIndex: number, direction: 'prev' | 'next', totalCount: number) => {
  if (direction === 'prev') {
    return (currentIndex - 1 + totalCount) % totalCount;
  }
  return (currentIndex + 1) % totalCount;
};

/**
 * 기기 사이즈에 따른 최적의 그리드 수(cols, rows)를 결정합니다.
 */
export const calculateGrid = (width: number, height: number) => {
  let cols = 3;
  let rows = 2;
  
  if (width < 360) cols = 2;
  
  if (height < 600) rows = 2;
  else if (height < 800) rows = 2;
  
  return { cols, rows };
};
