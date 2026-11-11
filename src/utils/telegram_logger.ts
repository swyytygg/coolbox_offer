/**
 * 텔레그램 봇을 통한 시스템 에러 및 중요 알림 전송 유틸리티
 */

import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "./safe_env";

/**
 * 텔레그램으로 텍스트 메시지 전송
 */
export const sendTelegramMessage = async (message: string) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("텔레그램 환경변수가 설정되지 않아 메시지를 보낼 수 없습니다.");
    return;
  }
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML' // HTML 태그(<b>, <code> 등) 지원
      })
    });
  } catch (err) {
    console.error("텔레그램 발송 실패:", err);
  }
};

/**
 * 앱 내 치명적인 에러를 텔레그램으로 보고 (방장 호출)
 */
export const reportErrorToTelegram = (context: string, error: any) => {
  const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
  const time = new Date().toLocaleString('ko-KR');
  
  const text = `🚨 <b>[Coolbox Error Report]</b>
<b>위치:</b> ${context}
<b>내용:</b> <code>${errorMessage}</code>
<b>시간:</b> ${time}`;

  return sendTelegramMessage(text);
};

/**
 * 주요 이벤트 발생 시 알림 (가입, 결제 등)
 */
export const reportEventToTelegram = (eventName: string, details: string) => {
  const text = `✨ <b>[Coolbox Event]</b>: ${eventName}\n${details}`;
  return sendTelegramMessage(text);
};
