/**
 * Toss Bridge SDK 연동 전담 엔진 (글로벌 독립 앱 대응 개편 버전)
 * - 기존 토스 SDK의 API를 전부 모의(Mock) 처리하거나 웹 표준 API로 안전하게 치환합니다.
 */

import { safeLocalStorage } from "./safe_storage";
import { supabase } from "./supabase";

// 로컬 스토리지 키
const SCAN_COUNT_KEY = 'coolbox_scan_count';

/**
 * 1. 스캔 횟수를 체크하고 증가시킵니다.
 */
export const checkAndIncrementScanCount = (): { currentCount: number; needsLogin: boolean } => {
  const currentCount = parseInt(safeLocalStorage.getItem(SCAN_COUNT_KEY) || '0', 10);
  const nextCount = currentCount + 1;
  safeLocalStorage.setItem(SCAN_COUNT_KEY, nextCount.toString());

  // 6회 이상부터는 정식 로그인 유도 (True 반환)
  return {
    currentCount: nextCount,
    needsLogin: nextCount >= 6
  };
};

/**
 * 2. 리워드 광고 호출 (모의 동작)
 */
export const showRewardAd = (onAdComplete: () => void) => {
  console.log("[Bridge] 리워드 광고 호출됨 (Standalone 모의 가동)");
  // 즉시 또는 짧은 타이머 후에 완료 콜백 호출
  onAdComplete();
};

/**
 * 3. 정식 간편 로그인 요청 (로그아웃 후 또는 OAuth 전환 시 유도)
 */
export const requestTossLogin = async () => {
  console.log("[Bridge] 간편 로그인 요청 - OAuth 로그인 유도 권장");
};

/**
 * 4. 결제 요청 (모의 동작)
 */
export const requestTossPay = async (amount: number, orderName: string) => {
  console.log(`[Bridge] 결제 요청: ${orderName} (${amount}원) - Standalone 모의 가동`);
};

/**
 * 5. 스마트 햅틱 진동 피드백
 * - 일반 모바일 브라우저 환경이면 HTML5 진동(navigator.vibrate)을 쏩니다.
 * - PC 데스크톱 브라우저 환경이면 콘솔 로그만 찍고 부드럽게 통과합니다.
 */
export const triggerHaptic = (type: 'success' | 'warning' | 'error' | 'impactLight' | 'impactMedium' | 'impactHeavy' = 'success') => {
  try {
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      if (type === 'success' || type === 'impactLight') {
        window.navigator.vibrate(35);
      } else if (type === 'warning' || type === 'impactMedium') {
        window.navigator.vibrate([40, 30, 40]);
      } else {
        window.navigator.vibrate(120);
      }
      console.log(`[Bridge Haptic] 브라우저 진동 실행 완료: ${type}`);
    }
  } catch (err) {
    console.warn("[Bridge Haptic] 진동 피드백 실행 실패:", err);
  }
};

/**
 * [1단계] 토스 유저 식별키(Anonymous Key) 발급 및 동기화 -> 글로벌 스탠드얼론에서는 불필요하므로 no-op
 */
export const syncTossAnonymousKey = async () => {
  console.log("[Bridge] syncTossAnonymousKey - Standalone 모드이므로 스킵");
};

/**
 * [3단계] 핵심 액션(영수증 스캔 완료) 시 토스 포인트 프로모션 지급 -> 글로벌 스탠드얼론에서는 불필요하므로 no-op
 */
export const triggerReceiptReward = async () => {
  console.log("[Bridge] triggerReceiptReward - Standalone 모드이므로 스킵");
};
