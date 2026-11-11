/**
 * Shooting Motion Animation Variants
 * 식재료가 날아가는 물리 애니메이션 설정을 관리합니다.
 *
 * [변경] targetSlot(번호) 대신 실제 픽셀 벡터(dx, dy)를 받아 동적 경로 계산.
 * getBoundingClientRect()로 계산된 값이 들어오므로 기기별 분기 불필요.
 */

export const getFlightAnimation = (dx: number, dy: number) => {
  // dy는 음수 (골대가 항상 위에 있음). peakY는 골대보다 30% 더 높이 솟구침
  const peakY = dy * 1.3;
  const landY = dy;
  const targetX = dx;

  // 이동 거리(픽셀)에 비례한 비행 시간 — 가까우면 빠르게, 멀면 느리게
  const distance = Math.sqrt(dx * dx + dy * dy);
  const duration = Math.max(0.65, Math.min(0.95, distance / 700));

  return {
    animate: {
      y: [0, peakY, landY], // 위로 솟구쳤다가 골대로 정확히 낙하
      x: [0, targetX],      // 골대 좌우 위치로 정확히 이동
      scale: [1, 0.80, 0.70],
      rotate: [0, 1440],    // 두 바퀴 앞구르기
      opacity: [1, 0.90, 0],
    },
    transition: {
      duration: duration,
      times: [0, 0.65, 1],
      ease: "easeOut" as any,
    }
  };
};

export const SPRING_BACK = {
  type: "spring",
  stiffness: 350,
  damping: 25
};
