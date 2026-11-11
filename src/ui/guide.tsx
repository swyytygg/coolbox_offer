import { useState, useEffect, useRef } from 'react';
import { GUIDE_STEPS } from './guide_data';
import { safeLocalStorage } from '../utils/safe_storage';
import { useTranslation } from 'react-i18next';

interface GuideRendererProps {
  // 현재 활성화된 화면 컨텍스트 (예: 'main', 'chat', 'menu', 'fridge_list', 'main_body')
  context: 'main' | 'chat' | 'menu' | 'fridge_list' | 'main_body';

  // 가이드가 완료되었을 때 실행되는 콜백 함수 (선택 사항)
  onComplete?: () => void;

  // 강제로 가이드를 다시 보여주고 싶을 때 true로 전달 (디버그/설정용)
  forceShow?: boolean;
}

/**
 * 쿨박스 통합 1회성 사용방법 설명 컴포넌트 (Onboarding Guide Renderer)
 * 
 * [동작 특징]
 * 1. 캐릭터와 말풍선이 하나의 상위 컨테이너로 묶여 함께 이동합니다 (단일 블록화).
 * 2. 대상 엘리먼트의 실시간 위치를 추적하여 화면 밖으로 나가지 않게 제어합니다 (반응형 뷰포트 클램핑).
 * 3. 요정 캐릭터는 0px에서 35px로 스케일업되며 뿅 튀어나오고, 가벼운 점프(Hop) 모션을 취합니다.
 * 4. 약 2초 후 다음 가이드로 자동 진행되며, 사용자가 직접 클릭하여 수동으로 넘길 수도 있습니다.
 */
export function GuideRenderer({ context, onComplete, forceShow = false }: GuideRendererProps) {
  // 현재 속한 컨텍스트의 가이드 단계 필터링
  const steps = GUIDE_STEPS.filter(step => step.context === context);
  const { t } = useTranslation(); // 💡 추가
  // 해당 컨텍스트에 표시할 가이드 단계가 없거나 이미 완료했다면 렌더링하지 않음
  const localStorageKey = `coolbox_guide_completed_${context}`;
  const isCompletedBefore = safeLocalStorage.getItem(localStorageKey) === 'true';

  const [currentIdx, setCurrentIdx] = useState(0);
  const [subIdx, setSubIdx] = useState(0); // 말풍선 내 서브 문장 인덱스
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [spotlightCoords, setSpotlightCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isDone, setIsDone] = useState(false);
  const [isTargetReady, setIsTargetReady] = useState(false); // 💡 타겟 엘리먼트 위치 획득 여부

  const retryTimerRef = useRef<any>(null);
  const retryCountRef = useRef(0); // 💡 타겟 로드 재시도 횟수
  const spotlightRef = useRef<HTMLDivElement | null>(null); // 💡 절대 기준 컨테이너 검출용 ref
  const step = steps[currentIdx];

  // 가이드 보이기 여부 초기 판단
  useEffect(() => {
    if (steps.length === 0) return;
    if (isCompletedBefore && !forceShow) {
      setIsDone(true);
      return;
    }

    // UI 로드가 완전히 완료된 후 가이드가 시작되도록 약간의 딜레이를 줍니다 (0.5초)
    const startDelay = setTimeout(() => {
      setVisible(true);
      setCurrentIdx(0);
      setSubIdx(0);
    }, 500);

    return () => clearTimeout(startDelay);
  }, [context, isCompletedBefore, forceShow, steps.length]);

  // 대상 엘리먼트의 정확한 위치 계산 (반응형 대응 및 화면 밖 이탈 방지)
  const calculatePosition = () => {
    if (!step) return;

   // 💡 여기에 PADDING 변수 정의를 추가합니다.
  const PADDING = 10; 


    // 대상 요소를 ID/클래스 셀렉터로 조회
    const targetEl = document.querySelector(step.targetSelector);
    if (!targetEl) {
      // 💡 최대 15번(1.5초) 시도 후에도 없으면 다음 단계로 스킵 (예: 일반 회원은 초대 버튼이 없음)
      if (retryCountRef.current >= 15) {
        console.warn(`Target element ${step.targetSelector} not found. Skipping step.`);
        proceedNext();
        return;
      }

      retryCountRef.current += 1;
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

   // 💡 부모 relative/absolute 컨테이너의 시작 위치 가져오기 (offsetParent를 통해 오프셋 자동 상쇄)
    const parentEl = spotlightRef.current?.offsetParent || document.querySelector('.app-container');
    const containerRect = parentEl ? parentEl.getBoundingClientRect() : { left: 0, top: 0 };

    // 요정 캐릭터 크기 및 말풍선 가로/세로 규격
    const charSize = step.characterSize * 1.8;
    const bWidth = step.bubbleWidth;
    const bHeight = step.bubbleHeight;

    // 전체 가이드 블록의 대략적인 크기
    const totalWidth = bWidth;
    const totalHeight = bHeight + charSize -15 ; // 말풍선 + 캐릭터 + 간격(10px)

    // 기본 배치 좌표 (대상 엘리먼트의 정중앙 기준 계산)
    let left = rect.left + rect.width / 2 - totalWidth / 2 + scrollX + step.offsetX - containerRect.left;
    let top = rect.top + scrollY + step.offsetY - containerRect.top;

    // 정렬 방향(align)에 따른 배치 오프셋 계산
    if (step.align === 'top') {
      top = rect.top - totalHeight + scrollY + step.offsetY - containerRect.top;
    } else if (step.align === 'bottom') {
      top = rect.bottom + scrollY + step.offsetY - containerRect.top;
    } else if (step.align === 'left') {
      left = rect.left - totalWidth + scrollX + step.offsetX - containerRect.left;
      top = rect.top + rect.height / 2 - totalHeight / 2 + scrollY + step.offsetY - containerRect.top;
    } else if (step.align === 'right') {
      left = rect.right + scrollX + step.offsetX - containerRect.left;
      top = rect.top + rect.height / 2 - totalHeight / 2 + scrollY + step.offsetY - containerRect.top;
    }

    // 🚨 [반응형 핵심 안전장치] 가이드 블록이 화면 밖(뷰포트)으로 탈출하지 않도록 좌표 클램핑 (Clamping)
    const viewportWidth = document.querySelector('.app-container')?.clientWidth || window.innerWidth;
    const viewportHeight = document.querySelector('.app-container')?.clientHeight || window.innerHeight;
    const safetyMargin = 16; // 화면 가장자리 최소 여백 (16px)

    // 가로축 경계 검사 및 보정
    if (left < safetyMargin) {
      left = safetyMargin;
    } else if (left + totalWidth > viewportWidth - safetyMargin) {
      left = viewportWidth - totalWidth - safetyMargin;
    }

    // 세로축 경계 검사 및 보정
    if (top < safetyMargin) {
      top = safetyMargin;
    } else if (top + totalHeight > viewportHeight - safetyMargin) {
      top = viewportHeight - totalHeight - safetyMargin;
    }

    // 스포트라이트 영역 좌표 설정 (대상 엘리먼트 기준) 시작 위치를 패딩 크기만큼 왼쪽/위쪽으로 당김 (- PADDING)
    setSpotlightCoords({
      top: rect.top  - containerRect.top - PADDING,
      left: rect.left  - containerRect.left - PADDING,
      // 크기는 양옆/상하 여백이 다 들어나므로 두 배로 늘림 (+ PADDING * 2)
      width: rect.width + (PADDING * 2),
      height: rect.height + (PADDING * 2)
    });

    setCoords({ top, left });
    setIsTargetReady(true); // 💡 타겟 위치 계산 완료!
  };

  // 단계/서브 단계 변경 시 위치 재조정
  useEffect(() => {
    if (!visible || !step) return;

    // 💡 새 단계로 진입 시 타겟 준비상태 및 재시도 카운트 초기화
    setIsTargetReady(false);
    retryCountRef.current = 0;

    // 위치 갱신
    calculatePosition();

    // 💡 서랍 슬라이딩 애니메이션 및 레이아웃 이동에 대응하기 위해 진입 후 1.5초간 100ms 주기로 위치 보정
    const positionInterval = setInterval(calculatePosition, 100);
    const stopIntervalTimeout = setTimeout(() => {
      clearInterval(positionInterval);
    }, 1500);

    // 윈도우 리사이즈 및 스크롤 시에도 실시간 위치 재계산 등록
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      clearInterval(positionInterval);
      clearTimeout(stopIntervalTimeout);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [currentIdx, subIdx, visible, step]);

  // 다음 가이드 단계로 진행
  const handleNext = () => {
    // 1. 채팅방 우측 상단 메뉴 버튼일 경우 자동으로 클릭하여 서랍을 열고 350ms 대기 후 진행
    if (step && step.targetSelector === '#guide-chat-menu-btn') {
      const targetEl = document.querySelector(step.targetSelector) as HTMLElement;
      if (targetEl) {
        targetEl.click();
        setTimeout(() => {
          proceedNext();
        }, 350);
        return;
      }
    }
    
    // 2. 좌측 메뉴 서랍 내 냉장고 목록 바로가기 버튼일 경우 자동으로 클릭하여 목록을 열고 350ms 대기 후 진행
    if (step && step.targetSelector === '#guide-menu-fridge-list-btn') {
    // 💡 마지막 서브 메시지("확인해요") 상태일 때만 실제 버튼을 누르고 완료 처리를 함 
    const isLastSubMessage = subIdx === step.message.length - 1;
      if (isLastSubMessage) {
        safeLocalStorage.setItem(localStorageKey, 'true'); // 닫히기 전에 완료 상태 선제적 저장

      const targetEl = document.querySelector(step.targetSelector) as HTMLElement;
      if (targetEl) {
        targetEl.click();
        setTimeout(() => {
          proceedNext();
        }, 350);
        return;
      }
    }
  }
    proceedNext();
  };

  const proceedNext = () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current); retryCountRef.current = 0;  // 💡 타이머 클리어
    if (step && subIdx + 1 < step.message.length) {
      setSubIdx(prev => prev + 1);
    } else {
      setSubIdx(0);
      if (currentIdx + 1 < steps.length) {
        setCurrentIdx(prev => prev + 1);
      } else {
        // 모든 단계가 완료됨
        setVisible(false);
        setIsDone(true);
        safeLocalStorage.setItem(localStorageKey, 'true');
        if (onComplete) onComplete();
      }
    }
  };

  if (isDone || !visible || !step || !isTargetReady) return null;

  // 요정 캐릭터 전체 이미지 주소 빌드
  const characterImageUrl = `https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/${step.characterId}.webp`;

  return (
    <>
      {/* 🚀 인라인 CSS 주입 (동작/모션 및 등장 애니메이션) */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* 1. 요정 캐릭터 0px -> 65px 스케일업 등장 애니메이션 */
        @keyframes guide-scale-up {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);  
            opacity: 1;
          }
        }

        /* 2. 깡총깡총 점프 (Squash & Stretch 적용) */
        @keyframes guide-hop {
          0%, 100% {
            transform: translateY(0) scaleY(1) scaleX(1);
          }
          40% {
            transform: translateY(-14px) scaleY(1.1) scaleX(0.9);
          }
          50% {
            transform: translateY(-14px) scaleY(1) scaleX(1);
          }
          85% {
            transform: translateY(0) scaleY(0.85) scaleX(1.15);
          }
        }

        /* 3. 말풍선 뿅! 나타나는 페이드 효과 */
        @keyframes guide-bubble-fade {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* 4. 말풍선 텍스트 슬라이드 인 (오른쪽 -> 왼쪽) */
        @keyframes guide-text-slide-in {
          from {
            transform: translateX(12px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .guide-container-block {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 99999; /* 모든 다이얼로그 및 드로어보다 최상위 레이어 보장 */
          pointer-events: auto;
          cursor: pointer;
        }

        /* 등장 애니메이션을 처리할 래퍼 */
        .guide-character-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: ${step.characterSize * 1.8}px;
          height: ${step.characterSize * 1.8}px;
          transform-origin: bottom center;
          animation: guide-scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* 점프 애니메이션을 처리할 이미지 */
        .guide-character-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform-origin: bottom center;
          animation: guide-hop 1s ease-in-out infinite;
        }

        .guide-bubble-anim-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
          animation: guide-bubble-fade 0.3s ease-out forwards;
        }

        .guide-bubble-box {
          position: relative;
          background-size: 100% 100%;
          background-repeat: no-repeat;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          margin-bottom: -20px;
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.25));
          word-break: keep-all;
        }

        .guide-bubble-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }

        .guide-bubble-text {
          font-family: 'Inter', 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 17px;
          line-height: 1.45;
          white-space: pre-wrap;
          margin: 0;
          animation: guide-text-slide-in 0.25s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }

        .guide-bubble-dots {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }

        .guide-bubble-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .guide-bubble-dot.active {
          transform: scale(1.2);
        }

        /* 스포트라이트 하이라이트 박스 */
        .guide-spotlight {
          position: absolute;
          z-index: 99997; /* backdrop보다 위에, 캐릭터-말풍선보다는 아래에 배치 */
          border-radius: 12px;
          /* 그림자를 매우 크게 주고 투명도를 조절하여 주변을 어둡게 */
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45); 
          border: 2.5px dashed #ffffff; /* 하얀 점선 테두리로 명확히 강조 */
          pointer-events: none; /* 클릭 이벤트가 관통되도록 처리 */
          transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* 전체 투명 뒷배경을 클릭해도 다음 가이드로 넘어가도록 처리 */
        .guide-backdrop-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: transparent; /* 스포트라이트의 box-shadow가 어둡게 하므로 투명 처리 */
          z-index: 99996;
          pointer-events: auto;
        }
      `}} />

      {/* 1. 전체 화면 클릭 배리어 (어디든 누르면 다음으로 통과) */}
      <div className="guide-backdrop-overlay" onClick={handleNext} />

      {/* 2. 대상 엘리먼트 스포트라이트 하이라이트 */}
      <div
        ref={spotlightRef}
        className="guide-spotlight"
        style={{
          top: `${spotlightCoords.top}px`,
          left: `${spotlightCoords.left}px`,
          width: `${spotlightCoords.width}px`,
          height: `${spotlightCoords.height}px`,
        }}
      />

      {/* 3. 📦 캐릭터-말풍선 단일 그룹 블록 */}
      <div
        className="guide-container-block"
        style={{
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          width: `${step.bubbleWidth}px`,
        }}
        onClick={handleNext}
      >
        {/* 1. 노란색 고정 말풍선 (align이 bottom인 경우 상하 반전으로 꼬리 방향 전환) */}
        <div className="guide-bubble-anim-wrapper">
          <div
            className="guide-bubble-box"
            style={{
              backgroundImage: `url(${step.bubbleBgUrl})`,
              width: `${step.bubbleWidth}px`,
              height: `${step.bubbleHeight}px`,
              transform: step.align === 'bottom' ? 'scaleY(-1)' : undefined,
              padding: step.align === 'bottom' ? '22px 14px 12px 14px' : '12px 14px 22px 14px',
            }}
          >
            <div
              className="guide-bubble-content"
              style={{
                transform: step.align === 'bottom' ? 'scaleY(-1)' : undefined,
              }}
            >
            <p
              key={`${currentIdx}-${subIdx}`}
              className="guide-bubble-text"
              style={{ color: step.textColor }}
            >
             {t(`GUIDE_${context}_STEP_${step.step}_MSG_${subIdx}`, step.message[subIdx])}

            </p>
            {/* 여러 문장일 때 도트 표시 */}
            {step.message.length > 1 && (
              <div className="guide-bubble-dots">
                {step.message.map((_, i) => (
                  <span
                    key={i}
                    className={`guide-bubble-dot ${i === subIdx ? 'active' : ''}`}
                    style={{
                      backgroundColor: i === subIdx ? step.textColor : 'rgba(0,0,0,0.15)'
                    }}
                  />
                ))}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* 2. 등장 스케일업(래퍼) & 깡총 모션(이미지) 요정 캐릭터 */}
        <div className="guide-character-wrapper">
          <img
            src={characterImageUrl}
            alt="가이드 요정"
            className="guide-character-img"
          />
        </div>
      </div>
    </>
  );
}
