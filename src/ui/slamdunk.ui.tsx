import { useState, useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { COLORS } from "./style/constants.ui";
import { Grid } from "./grid.ui";
import { SFX } from "../utils/shooting_sfx";
import { getFlightAnimation, SPRING_BACK } from "../utils/shooting_motion";
import { matchCharacterImage, processSlamDunkShot, processSkipAll } from "../utils/slamdunk";
import { triggerHaptic } from "../utils/toss_bridge";
import { preloadGameImages } from "../utils/preload_images";
import { safeLocalStorage } from "../utils/safe_storage";
import { BUBBLE_BACKGROUND_IMAGES, SLAMDUNK_BUBBLE_STYLE } from "../utils/character_motions";
import { useTranslation } from "react-i18next";

interface SlamDunkProps {
  onComplete: () => void;
  items: any[];
}

export function SlamDunk({ onComplete, items }: SlamDunkProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [targetSlot, setTargetSlot] = useState<number>(1);
  const [showBubble, setShowBubble] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false); // 일괄 수납 상태 추가
  const constraintsRef = useRef<HTMLDivElement>(null);
  const targetSlotRef = useRef<number>(1);
  const hasPulledRef = useRef<boolean>(false);
  const characterRef = useRef<HTMLDivElement>(null); // 캐릭터 DOM 위치
  const slot0Ref = useRef<HTMLDivElement>(null); // 냉동 골대
  const slot1Ref = useRef<HTMLDivElement>(null); // 냉장 골대
  const slot2Ref = useRef<HTMLDivElement>(null); // 신선 골대
  const slot3Ref = useRef<HTMLDivElement>(null); // 실외 골대
  const slotRefs = useMemo(() => [slot0Ref, slot1Ref, slot2Ref, slot3Ref], []);
  const [flightVector, setFlightVector] = useState<{ dx: number; dy: number }>({ dx: 0, dy: -400 });

  const currentItem = items[currentIndex] || { name: t("UNKNOWN", "알 수 없음"), image: '', location: '냉장' };

  // 게임 시작 전 모든 이미지 사전 로딩
  useEffect(() => {
    preloadGameImages();
  }, []);

  // 1.5초간 보이고 사라지는 신규 회원용 말풍선 제어
  useEffect(() => {
    const isNewUser = safeLocalStorage.getItem('coolbox_has_fridge') !== 'true';
    if (isNewUser && currentIndex === 0) {
      setShowBubble(true);
      const timer = setTimeout(() => {
        setShowBubble(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowBubble(false);
    }
  }, [currentIndex]);

  const currentCharacterImage = useMemo(() => matchCharacterImage(currentItem), [currentItem, currentIndex]);

  // 모든 Hook은 컴포넌트 최상위에
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const guideOpacity = useTransform(dragY, [0, 40], [0, 1]);

  // 조준 방향 각도 계산
  const arrowRotate = useTransform([dragX, dragY], (latest: any) => {
    const [x, y] = latest as [number, number];
    if (x === 0 && y === 0) return 0;
    const angle = Math.atan2(-x, y) * (180 / Math.PI);
    return Math.max(-25, Math.min(25, angle));
  });

  const visualRotate = useTransform(arrowRotate, v => v);

  const updateTarget = (_x: number, _y: number) => {
    const currentAngle = arrowRotate.get();
    let newSlot = 1;
    if (currentAngle > 10) newSlot = 3;      // 실외
    else if (currentAngle > 0) newSlot = 2;  // 신선
    else if (currentAngle > -10) newSlot = 1;// 냉장
    else newSlot = 0;                        // 냉동

    if (newSlot !== targetSlotRef.current) {
      targetSlotRef.current = newSlot;
      SFX.playPull();
      setTargetSlot(newSlot);
    }
  };

  // 일괄 저장(SKIP) 핸들러 구현
  const handleSkipAll = async () => {
    if (isAutoSaving || isShooting) return;
    setIsAutoSaving(true);

    try {
      // 현재 인덱스부터 끝까지의 남은 아이템들 추출
      const remainingItems = items.slice(currentIndex);

      // 기능 파일(utils)에 위임하여 일괄 저장 수행
      await processSkipAll(remainingItems);

      triggerHaptic("success");

      // 약간의 지연(0.8초) 피드백 후 완료 처리
      setTimeout(() => {
        setIsAutoSaving(false);
        onComplete();
      }, 800);
    } catch (error) {
      console.error("일괄 수납 처리 중 오류 발생:", error);
      setIsAutoSaving(false);
    }
  };

  const handleLaunch = async () => {
    if (isShooting || !currentItem) return;

    let dx = 0, dy = -400;
    const charEl = characterRef.current;
    const slotEl = slotRefs[targetSlot]?.current;
    if (charEl && slotEl) {
      const charRect = charEl.getBoundingClientRect();
      const slotRect = slotEl.getBoundingClientRect();
      dx = (slotRect.left + slotRect.width / 2) - (charRect.left + charRect.width / 2);
      dy = (slotRect.top + slotRect.height / 2) - (charRect.top + charRect.height / 2);
    }
    setFlightVector({ dx, dy });

    setIsShooting(true);
    SFX.playLaunch();
    triggerHaptic('impactLight');

    processSlamDunkShot(currentItem, targetSlot);

    setTimeout(() => {
      SFX.playGoal();
      triggerHaptic('success');
      setTimeout(() => {
        setIsShooting(false);
        dragX.set(0); dragY.set(0);
        targetSlotRef.current = 1;
        hasPulledRef.current = false;
        setTargetSlot(1);
        if (currentIndex < items.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          onComplete();
        }
      }, 500);
    }, 800);
  };

  return (
    <div style={{ backgroundColor: "#000", height: '100%', width: '100%', position: 'relative', overflow: 'hidden', touchAction: 'none' }}>
      <header style={{ position: 'absolute', top: '60px', width: '100%', textAlign: 'center', zIndex: 10 }}>
        {/* SKIP 버튼 - 토스 스타일 밝은 파란색 버튼, 헤더 내 절대 위치 배치 */}
        <button
          onClick={handleSkipAll}
          disabled={isAutoSaving || isShooting}
          style={{
            position: 'absolute',
            right: '20px',
            top: '0px',
            backgroundColor: '#3182F6',
            color: '#FFF',
            border: 'none',
            borderRadius: '16px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(49, 130, 246, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: (isAutoSaving || isShooting) ? 0.6 : 1,
            pointerEvents: (isAutoSaving || isShooting) ? 'none' : 'auto'
          }}
        >
          {t("SKIP", "SKIP")}
        </button>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF', margin: 0, paddingLeft: '75px', paddingRight: '75px' }}>{t("SHOOT_TO_FRIDGE", "냉장고로 슛!")} ({currentIndex + 1}/{items.length})</h2>
        <p style={{ fontSize: '14px', color: COLORS.GREY_80, margin: '4px 0 0 0' }}>{`${t(currentItem.name, currentItem.name)}! ${t("SHOOT_ITEM_DESC_SUFFIX", "알맞은 곳에 쏙!")}`}</p>
      </header>

      <Grid targetSlot={targetSlot} recommendedCategory={currentItem.location || '냉장'} isShooting={isShooting} slotRefs={slotRefs} />

      <main style={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '15vh', position: 'relative' }}>

        <div
          ref={constraintsRef}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        <div style={{ position: 'relative', width: '100px', height: '100px', zIndex: 100 }}>
          <motion.div
            drag={!isShooting}
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            onDragStart={() => SFX.init()}
            onDrag={(_: any, info: any) => {
              updateTarget(info.offset.x, info.offset.y);
              if (info.offset.y > 15 || dragY.get() > 15) {
                hasPulledRef.current = true;
              }
            }}
            onDragEnd={(_: any) => {
              if (hasPulledRef.current) {
                hasPulledRef.current = false;
                handleLaunch();
              } else {
                dragX.set(0); dragY.set(0);
              }
            }}
            style={{
              x: isShooting ? undefined : dragX,
              y: isShooting ? undefined : dragY,
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              cursor: 'grab',
              pointerEvents: 'auto'
            }}
            {...(isShooting ? getFlightAnimation(flightVector.dx, flightVector.dy) : { animate: { scale: 1, rotate: 0, opacity: 1 }, transition: SPRING_BACK } as any)}
          >
            <div style={{
              width: '100px', height: '100px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))',
              overflow: 'visible'
            }} ref={characterRef}>
              <img key={`char-${currentIndex}`} draggable={false} src={currentCharacterImage} alt={currentItem.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={(showBubble && !isShooting) ? {
              scale: [0, 1.1],
              opacity: [0, 1],
              transition: { duration: 0.6, times: [0, 1.5, 1], ease: "easeOut" }
            } : {
              scale: 0,
              opacity: 0,
              transition: { duration: 0.4, ease: "easeIn" }
            }}
            style={SLAMDUNK_BUBBLE_STYLE(BUBBLE_BACKGROUND_IMAGES.YELLOW)}
          >
            <span style={{  color: '#1C1C1E', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
              {t("PULL_AND_SHOOT", "아래로 당겨서 슛!")} 
            </span>
          </motion.div>
        </div>

        {!isShooting && (
          <motion.div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: '220px',
              display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: '12px',
              originX: 'center',
              originY: '100%',
              rotate: visualRotate,
              zIndex: 5, pointerEvents: 'none',
              opacity: guideOpacity
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.4, 1, 0.4], y: [0, -25, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                style={{
                  fontSize: '28px', color: '#00FF00',
                  textShadow: '0 0 25px #00FF00',
                  scale: 1 - (i * 0.15),
                  marginBottom: i * 6
                }}
              >
                ▲
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* 💾 일괄 저장 중 로딩 오버레이 팝업 */}
      {isAutoSaving && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}>
          {/* 토스 블루 스타일의 부드러운 스피너 */}
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(49, 130, 246, 0.2)',
            borderTop: '4px solid #3182F6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFF', margin: '0 0 8px 0' }}>
              {t("BULK_SAVING", "식재료 일괄 수납 중")}
            </h3>
            <p style={{ fontSize: '14px', color: COLORS.GREY_80, margin: 0 }}>
              {t("BULK_SAVING_DESC", "남은 {{count}}개의 식재료를 냉장고에 넣고 있어요.", { count: items.length - currentIndex })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
