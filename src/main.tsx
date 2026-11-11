// -------------------------------------------------------------
// 👑 [모드 스위칭]: 대표님 UI 간격 샌드박스 모드 vs 프로덕션 실가동 모드
// -------------------------------------------------------------
import App from "./App.tsx";                 // ◀ 프로덕션 (기존 코드 안전 보존)
// import App from "./ui/App.UI";             // ◀ (샌드박스는 별도 포트 5174 사용)

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DialogProvider } from "./ui/DialogProvider.tsx";

import "./index.css";
import "./utils/i18n";
import { reportErrorToTelegram } from "./utils/telegram_logger";

// [전역 오류 모니터링 안전장치] 토스앱 웹뷰 런타임 오류 포착 즉시 텔레그램 전송
if (typeof window !== 'undefined') {
  window.addEventListener("error", (event) => {
    const errorMsg = event.error?.stack || event.message || "Unknown JS Error";
    const context = `전역 웹뷰 JS 오류 (${event.filename ? event.filename.split('/').pop() : 'main'}:${event.lineno || 0})`;
    reportErrorToTelegram(context, errorMsg);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const errorMsg = reason instanceof Error ? reason.stack || reason.message : JSON.stringify(reason);
    const context = "전역 비동기(Promise) 미처리 오류";
    reportErrorToTelegram(context, errorMsg);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </StrictMode>,
);
