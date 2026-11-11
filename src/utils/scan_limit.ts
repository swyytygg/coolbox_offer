/**
 * 익명 유저용 무료 스캔 횟수 제한 및 로그인 넛지 엔진
 * 규칙 1: 1주일에 최대 5회 강제 제한
 * 규칙 2: 누적 6회째 스캔 시 로그인 유도(Nudge) 발생
 */

import { safeLocalStorage } from "./safe_storage";

interface ScanLimitData {
  totalScans: number;       // 가입 후 누적 스캔 횟수
  weeklyScans: number;      // 이번 주 스캔 횟수 (최대 5)
  weekStartDate: string;    // 이번 주 월요일 날짜
}

// 현재 날짜가 속한 주의 월요일 날짜를 YYYY-MM-DD 형태로 반환
export const getWeekStartDate = () => {
  const d = new Date();
  const day = d.getDay(); // 0(일) ~ 6(토)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 -6일전, 아니면 1(월요일)로 맞춤
  const monday = new Date(d.setDate(diff));

  // 📱 UTC(협정세계시) 변환 오류 방지: 유저 폰의 실제 로컬 연, 월, 일을 기준으로 포맷팅!
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const date = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

export const checkScanLimitAllowed = (): { 
  allowed: boolean; 
  needsLoginNudge: boolean; 
  nudgeMode: 'unlimited' | 'reward' | 'point' | null;
} => {
  const STORAGE_KEY = 'coolbox_scan_limit';
  const currentWeekStart = getWeekStartDate();

  let dataStr = safeLocalStorage.getItem(STORAGE_KEY);
  let data: ScanLimitData = dataStr ? JSON.parse(dataStr) : {
    totalScans: 0,
    weeklyScans: 0,
    weekStartDate: currentWeekStart
  };

  // 주(Week)가 바뀌었으면 주간 횟수 초기화
  if (data.weekStartDate !== currentWeekStart) {
    data.weeklyScans = 0;
    data.weekStartDate = currentWeekStart;
  }

  const isLoggedIn = safeLocalStorage.getItem('coolbox_is_logged_in') === 'true';

  // 1. 로그인 회원은 스캔 한도가 전혀 없으며 팝업 넛지도 노출하지 않음
  if (isLoggedIn) {
    return { allowed: true, needsLoginNudge: false, nudgeMode: null };
  }

  // 2. 비회원의 경우: 무제한 무료 스캔을 허용하지만, 첫 주간 1회 스캔 이후부터 순환 넛지 노출
  if (data.weeklyScans === 0) {
    return { allowed: true, needsLoginNudge: false, nudgeMode: null };
  }

  // 이미 해당 스캔 진입 전 넛지를 닫았거나 넘어갔다면 추가 팝업 없이 즉시 통과
  const isNudgeDismissed = safeLocalStorage.getItem('coolbox_nudge_dismissed_this_scan') === 'true';
  if (isNudgeDismissed) {
    return { allowed: true, needsLoginNudge: false, nudgeMode: null };
  }

  // 이번 주의 스캔 수에 맞춰 3종 로그인 넛지 모드 순환
  let nudgeMode: 'unlimited' | 'reward' | 'point';
  const nudgeIndex = (data.weeklyScans - 1) % 3;
  if (nudgeIndex === 0) {
    nudgeMode = 'unlimited';
  } else if (nudgeIndex === 1) {
    nudgeMode = 'reward';
  } else {
    nudgeMode = 'point';
  }

  return { allowed: true, needsLoginNudge: true, nudgeMode };
};

export const incrementScanLimit = (): void => {
  const STORAGE_KEY = 'coolbox_scan_limit';
  const currentWeekStart = getWeekStartDate();

  let dataStr = safeLocalStorage.getItem(STORAGE_KEY);
  let data: ScanLimitData = dataStr ? JSON.parse(dataStr) : {
    totalScans: 0,
    weeklyScans: 0,
    weekStartDate: currentWeekStart
  };

  if (data.weekStartDate !== currentWeekStart) {
    data.weeklyScans = 0;
    data.weekStartDate = currentWeekStart;
  }

  data.weeklyScans += 1;
  data.totalScans += 1;
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // 스캔 완료 시 "이번 스캔 다음에 하기" 임시 패스 상태를 제거합니다.
  safeLocalStorage.removeItem('coolbox_nudge_dismissed_this_scan');

  const isLoggedIn = safeLocalStorage.getItem('coolbox_is_logged_in') === 'true';
  const currentLimit = isLoggedIn ? "무제한" : "무제한 (로그인 넛지)";

  console.log(`[Scan Limit Incremented] 이번 주 스캔 완료: ${data.weeklyScans}/${currentLimit}회, 누적 총합: ${data.totalScans}회`);
};
