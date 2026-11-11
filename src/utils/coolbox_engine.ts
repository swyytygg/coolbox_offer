/**
 * 쿨박스 지능형 관리 엔진 (Coolbox Engine)
 * - 소비기한 자동 카운트다운 (오늘 날짜 기준)
 * - 선입선출(FIFO) 기반 정렬
 * - 메인 화면 노출 품목(최대 5인) 선발
 */

export interface FridgeItem {
  id: string | number;
  name: string;
  imageUrl: string;
  location: '신선' | '냉장' | '냉동' | '실외';
  purchaseDate: string; // YYYY-MM-DD
  expiryDays: number;   // 마스터 데이터상의 기본 소비기한
  daysLeft: number;     // 현재 남은 날짜 (계산된 값)
  quantity?: number;    // 수량 (기본값 1)
}


/**
 * 유저의 휴대폰 로컬 날짜를 기준으로 YYYY-MM-DD 스트링을 안전하게 반환합니다.
 * (UTC-0 변환 시차 오류를 전면 원천 방지)
 */
export const getLocalTodayDate = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

/**
 * 오늘 날짜와 구매일을 비교하여 남은 소비기한을 계산합니다.
 * (구매일 기준이 아닌, 유저의 현재 폰 날짜를 기준으로 매일 카운트다운)
 */
export const calculateRemainingDays = (purchaseDate: string, expiryDays: number): number => {
  const now = new Date();
  
  // 1. 유저 폰의 현지 날짜 자정 기준 생성 (시, 분, 초 0으로 초기화)
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // 2. 구매일("YYYY-MM-DD")을 자르고 현지 시간대 자정 기준으로 안전하게 생성
  const [year, month, day] = purchaseDate.split('-').map(Number);
  const startLocal = new Date(year, month - 1, day);
  
  // 3. 밀리초 차이를 하루 단위(86,400,000ms)로 나누어 정확히 반올림 연산
  const diffTime = todayLocal.getTime() - startLocal.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  // 남은 날짜 = 기본 소비기한 - 경과일 (폐기는 최소 -1일로 단일 고정)
  return Math.max(expiryDays - diffDays, -1);
};


/**
 * 식재료를 소비기한이 짧은 순(임박순)으로 정렬합니다. (선입선출 원칙)
 */
export const sortInventory = (items: FridgeItem[]): FridgeItem[] => {
  return [...items].sort((a, b) => a.daysLeft - b.daysLeft);
};

/**
 * 메인 화면에 등장할 '선수'들을 선발합니다.
 * - 규칙: 소비기한 3일 이내인 품목 중 상위 최대 5명
 */
export const getEmergencyPlayers = (inventory: FridgeItem[]): FridgeItem[] => {
  const urgentItems = inventory.filter(item => item.daysLeft <= 3);
  const sorted = sortInventory(urgentItems);
  return sorted.slice(0, 5); // 최대 5명 제한
};

/**
 * 추천 알림을 보낼 대상을 선정합니다.
 * - 규칙: 임박(3일 이내)은 아니지만, 현재 냉장고에서 가장 수명이 짧은 품목
 */
export const getRecommendPlayer = (inventory: FridgeItem[]): FridgeItem | null => {
  const safeItems = inventory.filter(item => item.daysLeft > 3);
  if (safeItems.length === 0) return null;
  const sorted = sortInventory(safeItems);
  return sorted[0]; // 가장 남은 날짜가 적은 것 하나 추천
};

/**
 * [러닝 게임 로직] 남은 날짜에 따른 캐릭터의 스타일(위치, 속도, 필터)을 계산합니다.
 */
export const getRunnerStyle = (daysLeft: number) => {
  // 1. 가로 위치 (D-3: 0%, D-2: 22%, D-1: 44%, 오늘: 66%, 폐기: 88%)
  let left = 0;
  if (daysLeft === 3) left = 0;
  else if (daysLeft === 2) left = 22;
  else if (daysLeft === 1) left = 44;
  else if (daysLeft === 0) left = 66;
  else if (daysLeft < 0) left = 88;

  // 2. 애니메이션 속도 (임박할수록 빨라짐)
  let speed = 0;
  if (daysLeft === 3) speed = 0.6;
  else if (daysLeft === 2) speed = 0.4;
  else if (daysLeft === 1) speed = 0.2;
  else if (daysLeft === 0) speed = 0.1;

  // 3. 필터 (폐기 시 회색 필터 적용)
  const filter = daysLeft < 0 ? 'grayscale(1) opacity(0.5)' : 'none';

  return { left: `${left}%`, speed: `${speed}s`, filter };
};

/**
 * [러닝 게임 로직] 캐릭터 뱃지에 들어갈 텍스트를 결정합니다.
 */
export const getBadgeLabel = (daysLeft: number): string => {
  if (daysLeft < 0) return 'BADGE_WASTE';
  if (daysLeft === 0) return 'BADGE_TODAY';
  return `D-${daysLeft}`;
};