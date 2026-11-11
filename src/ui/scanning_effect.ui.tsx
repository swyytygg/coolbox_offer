import { useState, useEffect, useRef } from "react";
import { COLORS } from "./style/constants.ui";
import { useInAppAds } from "../hooks/useInAppAds";
import { useOcrSubscription } from "../hooks/useInAppPurchase";
import { useTranslation } from "react-i18next";
import { preloadGameImages } from "../utils/preload_images";

interface ScanningEffectProps {
  isOpen: boolean;
  onComplete: () => void;
  isNewUser?: boolean; // 신규유저(냉장고 미보유): 전면광고 직행 / 기존유저: 리워드→실패시 전면광고
}

/**
 * ScanningEffect UI - 프리미엄 카드 스타일 스캔 화면 (이미지 2번 디자인)
 */
export function ScanningEffect({ isOpen, onComplete, isNewUser = false }: ScanningEffectProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const rewardedAd = useInAppAds(import.meta.env.VITE_ADMOB_REWARD_ID as string);
  const interstitialAd = useInAppAds(import.meta.env.VITE_ADMOB_INTERSTITIAL_ID as string);
  const adShownRef = useRef(false);
  const [isAdShowing, setIsAdShowing] = useState(false);
  const isOcrSubscribed = useOcrSubscription();
  const isAdFree = isOcrSubscribed || isNewUser;

  useEffect(() => {
    if (!isOpen) {
      adShownRef.current = false;
      setIsAdShowing(false);
      setProgress(0);
      return;
    }

    // 💡 스캔이 시작되는 즉시 백그라운드에서 전체 리소스 사전 다운로드 시작!
    preloadGameImages();

    const intervalTime = isAdFree ? 15 : 150; // 광고가 없으면 약 1.5초(15ms * 100), 광고가 있으면 15초(150ms * 100)

    const interval = setInterval(() => {
      setProgress(prev => {
        if (isAdShowing) {
          if (prev >= 98) return 98; // 광고 중에는 98%에서 대기
          return prev + 1;
        }

        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isOpen, onComplete, isAdFree, isAdShowing]);

  // 광고 자동 팝업 트리거 (1초 경과 시점인 7% 이상에서만 실행)
  useEffect(() => {
    if (!isOpen) return;
    if (isAdFree) return; // 광고 제거 대상 유저는 광고 자동 팝업을 시도조차 않고 우회!
    if (adShownRef.current) return;
    if (progress < 1) return; // 0~7% (약 1초) 7->1로 변경 (로딩지연 통제) 자연스러운 스캔 연출 후 실행

    // 1% 이상이 되었을 때, 광고가 완전히 로딩될 때까지 계속 체크하며 기다림
    if (rewardedAd.isSupported) {
      if (isNewUser) {
        // [신규유저] 리워드 광고 건너뜀 → 전면광고 직행 (진입 허들 최소화)
        if (interstitialAd.isAdLoaded) {
          console.log("[Toss Ads] 스캔 중 - 신규유저 전면광고 자동 팝업");
          adShownRef.current = true;
          setIsAdShowing(true);
          interstitialAd.showAd(() => {
            setIsAdShowing(false); // 광고 종료 후 스캔 재개
          });
        }
      } else {
        // [기존유저] 리워드 광고 1순위, 실패 시 전면광고 폴백
        if (rewardedAd.isAdLoaded) {
          console.log("[Toss Ads] 스캔 중 - 기존유저 리워드 광고 자동 팝업");
          adShownRef.current = true;
          setIsAdShowing(true);
          rewardedAd.showAd(() => {
            setIsAdShowing(false); // 광고 종료 후 스캔 재개
          });
        }
        // 리워드 광고 실패(hasError) 판정 시 전면 광고 폴백
        else if (rewardedAd.hasError && interstitialAd.isAdLoaded) {
          console.log("[Toss Ads] 스캔 중 - 기존유저 리워드 실패 → 전면광고 폴백");
          adShownRef.current = true;
          setIsAdShowing(true);
          interstitialAd.showAd(() => {
            setIsAdShowing(false); // 광고 종료 후 스캔 재개
          });
        }
      }
    }
  }, [isOpen, progress, rewardedAd.isAdLoaded, interstitialAd.isAdLoaded, rewardedAd.isSupported, isNewUser, isAdFree]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#000', // 배경은 완전 블랙
      zIndex: 6000, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* 1. 프리미엄 분석 카드 */}
      <div className="scan-slide-up-05" style={{
        position: 'relative', width: '100%', maxWidth: '340px',
        backgroundColor: 'rgba(28, 28, 30, 0.8)', backdropFilter: 'blur(20px)',
        borderRadius: '40px', padding: '60px 24px', textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '20px',
        // 전체적으로 40px 위로 올림 transform: 'translateY(-80px)',
      }}>
        {/* AD 배지 */}
        <div
          onClick={() => {
            if (rewardedAd.isSupported) {
              if (isNewUser) {
                // [신규유저] 전면광고만 수동 실행
                if (interstitialAd.isAdLoaded) {
                  console.log("[Toss Ads] 신규유저 전면광고 수동 실행...");
                  adShownRef.current = true;
                  setIsAdShowing(true);
                  interstitialAd.showAd(() => {
                    setIsAdShowing(false);
                  });
                }
              } else {
                // [기존유저] 리워드 1순위, 없으면 전면광고
                if (rewardedAd.isAdLoaded) {
                  console.log("[Toss Ads] 기존유저 리워드 광고 수동 실행...");
                  adShownRef.current = true;
                  setIsAdShowing(true);
                  rewardedAd.showAd(() => {
                    setIsAdShowing(false);
                  });
                } else if (interstitialAd.isAdLoaded) {
                  console.log("[Toss Ads] 기존유저 리워드 실패 → 전면광고 수동 실행...");
                  adShownRef.current = true;
                  setIsAdShowing(true);
                  interstitialAd.showAd(() => {
                    setIsAdShowing(false);
                  });
                }
              }
            }
          }}
          style={{
            position: 'absolute', top: '24px', right: '24px',
            backgroundColor: (rewardedAd.isAdLoaded || interstitialAd.isAdLoaded) ? 'rgba(72, 128, 238, 0.2)' : 'rgba(255,255,255,0.1)',
            padding: '4px 8px',
            borderRadius: '6px', fontSize: '10px',
            color: (rewardedAd.isAdLoaded || interstitialAd.isAdLoaded) ? COLORS.BLUE : COLORS.GREY_80,
            cursor: (rewardedAd.isAdLoaded || interstitialAd.isAdLoaded) ? 'pointer' : 'default',
            border: (rewardedAd.isAdLoaded || interstitialAd.isAdLoaded) ? `1px solid ${COLORS.BLUE}` : 'none',
            transition: 'all 0.2s ease-out',
            zIndex: 10
          }}
        >
          {rewardedAd.isAdLoaded ? t("WATCH_AD_GIFT", "광고 보기 🎁") : (interstitialAd.isAdLoaded ? t("WATCH_AD_FAST", "광고 보기 ⚡") : "AD")}
        </div>

        <div style={{ color: COLORS.BLUE, fontSize: '13px', fontWeight: 'bold', marginBottom: '16px', letterSpacing: '0.5px' }}>
          COOLBOX PREMIUM
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFF', lineHeight: '1.4', marginBottom: '40px', wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>
          {isAdFree ? t("FAST_SCAN_DESC") : t("SLOW_SCAN_DESC")}
        </h2>

        <div style={{ fontSize: '48px', fontWeight: 'bold', color: COLORS.BLUE, marginBottom: '8px' }}>
          {progress}%
        </div>

        <div style={{ fontSize: '14px', color: COLORS.GREY_80, marginBottom: '60px' }}>
          {t("ANALYZING", "분석 중...")}
        </div>

        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
          {t("WAIT_A_MOMENT")}
        </div>
      </div>

      {/* 하단 스캔 중 버튼 (진행바 포함) */}
      <div className="scan-slide-up-06" style={{
        width: '100%', maxWidth: '340px', height: '64px',
        borderRadius: '32px', border: `2px solid ${COLORS.BLUE}`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        // 버튼도 세트로 40px 올림  transform: 'translateY(-75px)',
      }}>
        {/* 버튼 내부 게이지 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${progress}%`, backgroundColor: 'rgba(49, 130, 246, 0.2)',
          transition: 'width 0.1s linear'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
          <div style={{
            width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#FFF', borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '17px', fontWeight: 'bold', color: '#FFF' }}>
            {t("SCANNING")} {progress}%
          </span>
        </div>
      </div>

      {/* 우측 하단 탐정요정 & 말풍선 추가 (절대 좌표로 가려짐 완벽 방지) */}
      {/* 말풍선 */}
      <div style={{
        position: 'fixed', right: '25px', bottom: '45px',
        width: '230px', height: '230px',
        backgroundImage: `url('https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/101.webp')`,
        backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '30px 20px 0px 20px',
        filter: 'drop-shadow(0 4px 15px rgba(0,0,0,0.4))',
        zIndex: 9999
      }} className="scan-fade-in-up-08">
        <span style={{
          color: '#111', fontSize: '15px', fontWeight: 'bold',
          textAlign: 'center', lineHeight: '1.4', paddingBottom: '30px',
          whiteSpace: 'pre-line'
        }}>
          {isAdFree ? t("FAIRY_FAST_SPEECH") : t("FAIRY_SLOW_SPEECH")}
        </span>
      </div>

      {/* 탐정요정 (15.webp) - 크기 80px로 확대 */}
      <img
        src="https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/15.webp"
        alt="Detective Fairy"
        className="scan-fade-in-up-10"
        style={{
          position: 'fixed', left: '44px', bottom: '30px',
          width: '150px', height: 'auto',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))',
          zIndex: 9999
        }}
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUpCard { from { transform: translateY(-40px); opacity: 0; } to { transform: translateY(-80px); opacity: 1; } }
        @keyframes slideUpBtn  { from { transform: translateY(-35px); opacity: 0; } to { transform: translateY(-75px); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .scan-slide-up-05 { animation: slideUpCard 0.5s ease-out both; }
        .scan-slide-up-06 { animation: slideUpBtn  0.6s ease-out both; }
        .scan-fade-in-up-08 { animation: fadeInUp 0.8s ease-out both; }
        .scan-fade-in-up-10 { animation: fadeInUp 1s ease-out both; }
      `}</style>
    </div>
  );
}
