import { useCallback, useEffect, useRef, useState } from "react";

// 글로벌 독립 실행용 모의 함수 선언 (TossAds 지원 불가 처리)
const loadFullScreenAd: any = undefined;
const showFullScreenAd: any = undefined;

// React Context 의존성이 없는 무적의 범용 모바일용 커스텀 토스트 구현
const showToast = (message: string) => {
  if (typeof document === "undefined") return;
  const container = document.getElementById("custom-toast-container") || (() => {
    const el = document.createElement("div");
    el.id = "custom-toast-container";
    el.style.position = "fixed";
    el.style.bottom = "50%";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.zIndex = "99999";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.gap = "8px";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement("div");
  // "보상 획득: 스캔권 1개" 문구에서 핵심 단어에 파란색 하이라이트를 주기 위해 HTML 허용
  toast.innerHTML = message.replace(/(스캔권|\d+개)/g, '<span style="color: #3182F6; font-weight: 800;">$1</span>');
  toast.style.backgroundColor = "#FFFFFF"; // 확 띄는 흰색 바탕
  toast.style.color = "#191F28";           // 또렷한 검은(다크그레이) 글자
  toast.style.padding = "14px 24px";
  toast.style.borderRadius = "16px";
  toast.style.fontSize = "16px";
  toast.style.fontWeight = "bold";
  toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
  toast.style.animation = "custom-toast-fade 2.5s forwards";
  toast.style.whiteSpace = "nowrap";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.justifyContent = "center";
  toast.style.gap = "6px";

  const styleId = "custom-toast-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @keyframes custom-toast-fade {
        0% { opacity: 0; transform: translateY(10px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
};

interface Reward {
  unitType: string;
  unitAmount: number;
}

interface UseInAppAdsReturn {
  isAdLoaded: boolean;
  isSupported: boolean;
  showAd: (onDismiss?: () => void) => void;
  lastReward: Reward | null;
  hasError: boolean;
}

// 참고문서: https://developers-apps-in-toss.toss.im/ads/intro.html
export function useInAppAds(adGroupId: string): UseInAppAdsReturn {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [hasError] = useState(false);
  const [lastReward, setLastReward] = useState<Reward | null>(null);
  const [isSupported] = useState(true); // Always true to support test ads in all environments

  // Simulate ad loading shortly after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAdLoaded(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [adGroupId]);

  /**
   * 광고를 실제로 화면에 표시합니다. (구글 애드몹 테스트 시뮬레이터 오버레이)
   */
  const showAd = useCallback((onDismiss?: () => void) => {
    if (typeof document === "undefined") {
      onDismiss?.();
      return;
    }

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "admob-simulator-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.96)";
    overlay.style.zIndex = "999999";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.color = "#FFFFFF";
    overlay.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    overlay.style.padding = "24px";
    overlay.style.boxSizing = "border-box";
    overlay.style.textAlign = "center";
    
    // Detect ad type based on ID
    const isRewarded = adGroupId === (import.meta.env.VITE_ADMOB_REWARD_ID as string);
    
    // Header
    const header = document.createElement("div");
    header.style.fontSize = "11px";
    header.style.color = "#8A8A8F";
    header.style.marginBottom = "8px";
    header.style.textTransform = "uppercase";
    header.style.letterSpacing = "1.5px";
    header.style.fontWeight = "bold";
    header.innerText = isRewarded ? "Google AdMob Rewarded Test Ad" : "Google AdMob Interstitial Test Ad";
    overlay.appendChild(header);

    // Title
    const title = document.createElement("h2");
    title.style.fontSize = "20px";
    title.style.fontWeight = "bold";
    title.style.margin = "0 0 24px 0";
    title.style.color = "#FFFFFF";
    title.style.lineHeight = "1.4";
    title.innerText = isRewarded ? "광고 시청 후 스캔권을 충전하세요" : "쿨박스 스마트 보관 추천";
    overlay.appendChild(title);

    // Ad Content Box (Visual representation of an ad)
    const contentBox = document.createElement("div");
    contentBox.style.width = "100%";
    contentBox.style.maxWidth = "300px";
    contentBox.style.height = "220px";
    contentBox.style.backgroundColor = "#1C1C1E";
    contentBox.style.border = "1px solid #2C2C2E";
    contentBox.style.borderRadius = "24px";
    contentBox.style.display = "flex";
    contentBox.style.flexDirection = "column";
    contentBox.style.alignItems = "center";
    contentBox.style.justifyContent = "center";
    contentBox.style.marginBottom = "32px";
    contentBox.style.position = "relative";
    contentBox.style.overflow = "hidden";
    contentBox.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.5)";
    
    // Ad Badge
    const adBadge = document.createElement("span");
    adBadge.innerText = "Test Ad";
    adBadge.style.position = "absolute";
    adBadge.style.top = "16px";
    adBadge.style.left = "16px";
    adBadge.style.backgroundColor = "#3182F6";
    adBadge.style.color = "#FFFFFF";
    adBadge.style.fontSize = "10px";
    adBadge.style.fontWeight = "bold";
    adBadge.style.padding = "4px 8px";
    adBadge.style.borderRadius = "6px";
    contentBox.appendChild(adBadge);

    const mainEmoji = document.createElement("div");
    mainEmoji.innerText = isRewarded ? "📺" : "⚡";
    mainEmoji.style.fontSize = "54px";
    mainEmoji.style.marginBottom = "12px";
    contentBox.appendChild(mainEmoji);

    const descText = document.createElement("div");
    descText.innerText = isRewarded ? "스캔 도우미 요정이 대기 중입니다..." : "터치하여 프리미엄 혜택을 만나보세요.";
    descText.style.fontSize = "13px";
    descText.style.color = "#8E8E93";
    descText.style.padding = "0 20px";
    descText.style.lineHeight = "1.5";
    contentBox.appendChild(descText);

    overlay.appendChild(contentBox);

    // Action button
    const actionBtn = document.createElement("button");
    actionBtn.style.padding = "16px 32px";
    actionBtn.style.width = "100%";
    actionBtn.style.maxWidth = "300px";
    actionBtn.style.borderRadius = "16px";
    actionBtn.style.fontSize = "16px";
    actionBtn.style.fontWeight = "bold";
    actionBtn.style.border = "none";
    actionBtn.style.outline = "none";
    actionBtn.style.transition = "all 0.2s ease";

    let countdown = 5;
    let intervalId: any = null;

    const closeOverlay = (earnedReward: boolean) => {
      if (intervalId) clearInterval(intervalId);
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.2s ease";
      setTimeout(() => {
        overlay.remove();
        if (earnedReward) {
          showToast("보상 획득: 스캔권 1개");
          setLastReward({ unitType: "스캔권", unitAmount: 1 });
        }
        onDismiss?.();
      }, 200);
    };

    if (isRewarded) {
      actionBtn.innerText = `광고 대기 중 (${countdown}초)`;
      actionBtn.style.backgroundColor = "#2C2C2E";
      actionBtn.style.color = "#8E8E93";
      actionBtn.disabled = true;
      actionBtn.style.cursor = "not-allowed";

      intervalId = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          actionBtn.innerText = `광고 대기 중 (${countdown}초)`;
        } else {
          clearInterval(intervalId);
          intervalId = null;
          actionBtn.innerText = "닫고 보상 받기 🎁";
          actionBtn.style.backgroundColor = "#3182F6";
          actionBtn.style.color = "#FFFFFF";
          actionBtn.disabled = false;
          actionBtn.style.cursor = "pointer";
          actionBtn.onclick = () => closeOverlay(true);
        }
      }, 1000);
    } else {
      actionBtn.innerText = "광고 닫기";
      actionBtn.style.backgroundColor = "#3182F6";
      actionBtn.style.color = "#FFFFFF";
      actionBtn.style.cursor = "pointer";
      actionBtn.onclick = () => closeOverlay(false);
    }

    overlay.appendChild(actionBtn);
    document.body.appendChild(overlay);
  }, [adGroupId]);

  return { isAdLoaded, isSupported, showAd, lastReward, hasError };
}
