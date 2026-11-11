import { useRef } from "react";

export function useEasterEgg(tapCountThreshold: number = 5, timeWindowMs: number = 1500) {
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  const handleCharacterTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < timeWindowMs) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapRef.current = now;

    if (tapCountRef.current >= tapCountThreshold) {
      try {
        localStorage.setItem("coolbox_forced_dev_mode", "true");
        alert("✨ [개발자 모드 활성화]\n우측 하단에 빨간색 '개발용 초기화' 버튼이 생성되었습니다!");
        window.location.reload();
      } catch (err) {
        console.error("Easter egg save failed:", err);
      }
    }
  };

  return { handleCharacterTap };
}
