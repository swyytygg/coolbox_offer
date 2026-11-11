const getEnvVal = (key: string, fallback: string = ''): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || fallback;
    }
  } catch (e) {
    // Ignore
  }
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || fallback;
    }
  } catch (e) {
    // Ignore
  }
  return fallback;
};

export const SUPABASE_URL = getEnvVal('VITE_SUPABASE_URL', '');
export const SUPABASE_KEY = getEnvVal('VITE_SUPABASE_KEY', '');
export const TELEGRAM_BOT_TOKEN = getEnvVal('VITE_TELEGRAM_BOT_TOKEN', '');
export const TELEGRAM_CHAT_ID = getEnvVal('VITE_TELEGRAM_CHAT_ID', '');
export const NAVER_CLIENT_ID = getEnvVal('VITE_NAVER_CLIENT_ID', '');
export const NAVER_CLIENT_SECRET = getEnvVal('VITE_NAVER_CLIENT_SECRET', '');
export const NAVER_OCR_URL = getEnvVal('VITE_NAVER_OCR_URL', '');
export const NAVER_OCR_SECRET = getEnvVal('VITE_NAVER_OCR_SECRET', '');
export const OPENROUTER_API_KEY = getEnvVal('VITE_OPENROUTER_API_KEY', '');
export const AI_MODEL_MAIN = getEnvVal('VITE_AI_MODEL_MAIN', 'google/gemini-2.0-flash-001');
export const AI_MODEL_SUB1 = getEnvVal('VITE_AI_MODEL_SUB1', 'openai/gpt-4o');
export const AI_MODEL_SUB2 = getEnvVal('VITE_AI_MODEL_SUB2', 'anthropic/claude-3.5-sonnet');

export const isDevMode = (): boolean => {
  try {
    // 1. Vite 기본 개발 모드 감지
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
      return true;
    }

    // 2. 브라우저/웹뷰 URL의 쿼리 스트링 감지 (?dev=true 또는 ?debug=true)
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dev') === 'true' || params.get('debug') === 'true') {
        try {
          sessionStorage.setItem('coolbox_forced_dev_mode', 'true');
        } catch (e) {
          // Ignore
        }
        return true;
      }
    }

    // 3. 세션스토리지 또는 로컬스토리지 보존 플래그 감지 (새로고침/재실행 시에도 유지)
    if (typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('coolbox_forced_dev_mode') === 'true') {
        return true;
      }
    }
    if (typeof localStorage !== 'undefined') {
      if (localStorage.getItem('coolbox_forced_dev_mode') === 'true') {
        return true;
      }
    }
  } catch (e) {
    // Ignore
  }
  return false;
};
