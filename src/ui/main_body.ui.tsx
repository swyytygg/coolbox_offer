import { useState, useEffect, useMemo, memo, useRef } from "react";
import { COLORS, FONT_SIZE } from "./style/constants.ui";
import { calculatePages, getInfiniteIndex, calculateGrid } from "../utils/wheel";
import { FridgeItem, getRunnerStyle, getBadgeLabel } from "../utils/coolbox_engine";
import { MOTION_KEYFRAMES_CSS } from "../utils/character_motions";
import { useTranslation } from "react-i18next";
import { GuideRenderer } from "./guide"; // 🚀 가이드 레이아웃 임포트


// 💡 1-1. 진성 랜덤 개별 캐릭터 컴포넌트
function DynamicCharacterCard({ item, onOpenDetail }: { item: any; onOpenDetail: (item: any) => void }) {
  const { t } = useTranslation();
  const [motionClass, setMotionClass] = useState("");
  
  useEffect(() => {
    // 1~6초 사이의 최초 랜덤 딜레이 후 시작
    const initialDelay = Math.random() * 5000 + 1000;
    let timeoutId: NodeJS.Timeout;

    const triggerRandomMotion = () => {
      // 4가지 모션 중 하나를 완벽하게 무작위로 선택
      const motions = [
        { c: "motion-power-jump" },
        { c: "motion-fat-thin-dance" },
        { c: "motion-heartbeat-cheer" },
        { c: "motion-dizzy-wobble" }
      ];
      const randomChoice = motions[Math.floor(Math.random() * motions.length)];
      
      setMotionClass(randomChoice.c);

      // 모션 실행 후 (1.6초) 애니메이션 클래스를 빼서 휴식 상태로 전환
      setTimeout(() => {
        setMotionClass("");
        
        // 다음 동작까지 랜덤하게 3~12초 대기
        const nextRest = Math.random() * 9000 + 3000;
        timeoutId = setTimeout(triggerRandomMotion, nextRest);
      }, 1600);
    };

    timeoutId = setTimeout(triggerRandomMotion, initialDelay);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className="guide-food-card" /* [미세조정: 온보딩 가이드 캐릭터 카드 클래스] */
      style={{
        aspectRatio: '1', borderRadius: '18px', backgroundColor: 'transparent', 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', width: '100%', maxHeight: '100%', minHeight: 0,
        position: 'relative', overflow: 'visible' 
      }}
    >
      
      <img
        src={item.imageUrl}
        alt={item.name}
        className={motionClass}
        style={{ width: '70px', height: '70px', objectFit: 'contain', position: 'relative', zIndex: 5 }}
      />
      <div style={{
        fontSize: '15px', color: COLORS.GREY_80, marginTop: '4px', width: '100%',
        textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl'
      }}>
        {t(item.name) || (item.name)}
      </div>
    </div>
  );
}

interface MainBodyProps {
  fridgeName: string;
  inventory: FridgeItem[];
  emergencyPlayers: FridgeItem[];
  onOpenAlarm: () => void;
  onOpenDetail: (item: any) => void;
  currentSectionIdx: number;
  onSectionChange: (idx: number) => void;
  latestDeleteMsg: string | null;
  onOpenDirectAdd?: (category: string) => void;
}

/**
 * 쿨박스 워터휠(Waterwheel) 바디 - 로직 분리 및 고도화 버전
 */
export const MainBody = memo(function MainBody({
  fridgeName, inventory, emergencyPlayers, onOpenAlarm, onOpenDetail,
  currentSectionIdx, onSectionChange, latestDeleteMsg, onOpenDirectAdd
}: MainBodyProps) {
  const { t } = useTranslation();
  // 1. 상태 및 상수 정의
  const [gridConfig, setGridConfig] = useState({ cols: 3, rows: 3 });
  const containerRef = useRef<HTMLDivElement>(null);

  // [로직 변경] 이제 데이터는 MainUI에서 props로 전달받습니다.
  const categorizedInventory = useMemo(() => ({
    "메인": [],
    "냉장": inventory.filter(i => i.location === '냉장'),
    "신선": inventory.filter(i => i.location === '신선'),
    "냉동": inventory.filter(i => i.location === '냉동'),
    "실외": inventory.filter(i => i.location === '실외'),
  }), [inventory]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        setGridConfig(calculateGrid(width, height));
      } else {
        setGridConfig(calculateGrid(window.innerWidth, window.innerHeight));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  const itemsPerPage = gridConfig.cols * gridConfig.rows;
  const PAGES = calculatePages(categorizedInventory, itemsPerPage);
  const totalPageCount = PAGES.length;

  const hasEmergency = emergencyPlayers.length > 0;

  // 3. 스와이프 로직 (무한 물레방아)
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const minSwipeDistance = 50;

  const handleStart = (clientX: number) => setDragStart(clientX);
  const handleMove = (clientX: number) => { if (dragStart !== null) setDragOffset(clientX - dragStart); };
  const handleEnd = () => {
    if (dragStart !== null) {
      if (Math.abs(dragOffset) > minSwipeDistance) {
        const direction = dragOffset > 0 ? 'prev' : 'next';
        onSectionChange(getInfiniteIndex(currentSectionIdx, direction, totalPageCount));
      }
    }
    setDragStart(null);
    setDragOffset(0);
  };

  const COMPARTMENT_ICONS = {
    "신선": "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/fresh.webp?v=2",
    "냉장": "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/chilled.webp?v=2",
    "냉동": "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/frozen.webp?v=2",
    "실외": "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/outer.webp?v=2"
  };

  return (
    <div
      ref={containerRef}
      id="guide-swipe-area" /* [미세조정: 온보딩 가이드 스와이프 영역 ID] */
      style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', color: COLORS.TEXT_PRIMARY }}
      onTouchStart={(e) => handleStart(e.targetTouches[0].clientX)}
      onTouchMove={(e) => handleMove(e.targetTouches[0].clientX)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {/* 상단 헤더: 냉장고 이름 및 긴급 알림 +20->10px*/}
      <div style={{
        textAlign: 'center',
        paddingTop: currentSectionIdx === 0
          ? 'calc(var(--safe-top) )'   /* +20->10px*/
          : 'calc(var(--safe-top) )', /* +20->10px*/
        paddingBottom: '30px' // 여백을 더 확보하여 하단과 분리
      }}>
        <h2 style={{ fontSize: FONT_SIZE.TITLE, fontWeight: 'bold', marginBottom: '10px' }}>{t(fridgeName, fridgeName)}</h2>

        {/* 알림/비서 메시지 영역 - 겹침 방지를 위해 마진 확보 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <div
            onClick={hasEmergency ? onOpenAlarm : undefined}
            style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {hasEmergency ? (
              <span style={{ color: COLORS.ACCENT, fontSize: '15px', fontWeight: 'bold' }}>🖐️ {t(emergencyPlayers[0].name, emergencyPlayers[0].name)}! {t("BYE_ITEM", "곧 작별해요")}</span>
            ) : (
              <span style={{ color: COLORS.GREY_50, fontSize: '14px' }}>👋 {t("FAIRY_KEEPING", "요정이 지키고 있어요")}</span>
            )}
          </div>
        </div>

        {/* 🤖 12시간 실시간 자동 소멸형 유령 비서 말풍선 (유저 손그림 매칭 영역) */}
        {latestDeleteMsg && (
          <div style={{
            position: 'absolute',          // <-- 🌟 3차원으로 공중에 띄웁니다! (아래 그리드를 절대 안 밀어냄)
            left: '50%',                  // <--🌟 가로 기준 정중앙 정렬 시작
            transform: 'translateX(-50%)', // <--🌟 좌측으로 절반 당겨서 완전 대칭 중앙 일치
            top: '100px',                  // <--🌟 알림 문자를 10px 위로 올림 (110px -> 100px)
            // 수정 위에 코드 삽입 
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1000,                  // <-- 🌟 아래 수납칸보다 위에 그려지도록 순서 보장
            width: 'max-content',          // <-- 🌟 양옆 텍스트 크기에 맞춘 유동적 폭 설정
            animation: 'coolbox-bubble-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <div style={{
              backgroundColor: '#1C1C1E',                      // 쿨박스 시그니처 웜 차콜 배경 (고정)
              border: `1px solid rgba(255, 215, 0, 0.15)`,   // 시그니처 골드 테마 라인
              borderRadius: '16px',
              padding: '10px 16px',
              color: '#FFFFFF',                                // 백색 텍스트 (고정)
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',      // 럭셔리 쉐도우
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{latestDeleteMsg}</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes coolbox-bubble-in {
          from { opacity: 0; transform: translateY(-10px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* 메인 콘텐츠: 가로 스크롤 섹션 (동적 페이지 반영) */}
      <div style={{
        flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden',
        width: `${totalPageCount * 100}%`,
        transform: `translateX(calc(-${currentSectionIdx * (100 / totalPageCount)}% + ${dragOffset}px))`,
        transition: dragStart === null ? 'transform 0.4s cubic-bezier(0.2, 0, 0, 1)' : 'none',
        alignItems: 'center' // 중앙 정렬 강화
      }}>
        {PAGES.map((page, idx) => (
          <div key={`${page.type}-${idx}`} 
            className={idx === currentSectionIdx ? "active-section" : ""} /* [미세조정: 활성 섹션 클래스] */
            style={{
              boxSizing: 'border-box', // padding에 의한 너비 초과 및 좌측 쏠림 방지
              width: `${100 / totalPageCount}%`,
              height: '100%',
              padding: '0 24px',
              paddingBottom: '0' // 부모의 안전지역 통제와 중복되는 하드코딩 패딩 제거
            }}>
            <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', height: '100%', position: 'relative' }}>
              <style>{MOTION_KEYFRAMES_CSS}</style>
              {page.type === 'main' ? (
                <>
                  {/* [고도화] 소비임박 러닝 선수단 등장 */}
                  {/* 여기의 top, marginTop, absolute 위치를 아무리 고쳐도 각 수납칸 그리드에는 0% 영향도 주지 않습니다. */}
                  <div style={{
                    position: 'absolute', top: 'calc(3% + 20px)', left: '0px', width: '100%',
                    display: 'flex', flexDirection: 'column', gap: '3px', // 간격 2-3px 확장
                    opacity: hasEmergency ? 1 : 0, transition: 'opacity 0.5s'
                  }}>
                    {emergencyPlayers.slice(0, 3).map((p) => {
                      const runnerStyle = getRunnerStyle(p.daysLeft);
                      const badgeLabel = getBadgeLabel(p.daysLeft);

                      // 메인 화면 카운트다운 전용 모션 매핑
                      // 걷기(3일), 달리기(2일), 빨리뛰기(1일), 덜덜(오늘:0일), 유령(폐기:-1일)
                      let animationClass = "motion-walk";
                      if (p.daysLeft < 0) animationClass = "motion-ghost";
                      else if (p.daysLeft === 0) animationClass = "motion-shake";
                      else if (p.daysLeft === 1) animationClass = "motion-sprint";
                      else if (p.daysLeft === 2) animationClass = "motion-run";
                      else if (p.daysLeft >= 3) animationClass = "motion-walk";

                      // 데이터 변경 디버깅
                      console.log(`[Runner Update] ${p.name}: daysLeft=${p.daysLeft}, motionClass=${animationClass}`);

                      return (
                        <div
                          key={`${p.id}-${p.daysLeft}`} // daysLeft를 키에 포함하여 위치 변경 시 리액트가 확실히 반응하도록 함
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(p);
                          }}
                          className={animationClass}
                          style={{
                            position: 'relative', left: `calc(${runnerStyle.left} - 5px)`, // % 문자열이 들어있으므로 px은 제거하고 마이너스(-) 앞뒤 공백 필수
                            width: 'min(15cqw, 70px)', display: 'flex', flexDirection: 'column', alignItems: 'center',
                            cursor: 'pointer', transition: 'left 1.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            filter: runnerStyle.filter,
                            zIndex: 100
                          }}
                        >
                          {/* 정면 뱃지 (폐기선수는 왼쪽, 나머지는 오른쪽) */}
                          <div style={{
                            position: 'absolute',
                            right: p.daysLeft < 0 ? 'auto' : 'calc(-1 * min(9cqw, 40px))',
                            left: p.daysLeft < 0 ? 'calc(-1 * min(9cqw, 40px))' : 'auto',
                            top: '15%',
                            width: 'min(9cqw, 40px)',
                            height: 'min(7cqw, 30px)',
                            backgroundColor: p.daysLeft < 0 ? COLORS.GREY_80 : COLORS.ACCENT,
                            borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}>
                            <span style={{ fontSize: 'min(3.2cqw, 15px)', color: COLORS.WHITE, fontWeight: 'bold' }}>
                              {t(badgeLabel, badgeLabel)}
                            </span>
                          </div>

                          <img
                            src={p.imageUrl}
                            style={{
                              width: 'min(15cqw, 70px)',
                              height: 'min(12cqh, 70px)', // 아이콘/인디케이터가 밀고 올라오면 유동적으로 축소되도록 vh 적용
                              objectFit: 'contain'
                            }}
                            alt="" // alt 텍스트가 화면을 덮지 않도록 비움
                          />

                          {/* 발아래 이름 (가독성을 위한 테마 대응) */}
                          <div style={{
                            fontSize: 'min(3.8cqw, 15px)', color: COLORS.TEXT_PRIMARY, fontWeight: 'bold',
                            marginTop: '2px', textAlign: 'center', width: '100%',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            textShadow: '0 2px 4px rgba(255,255,255,0.5)' // 라이트/다크 양립을 위한 옅은 글로우
                          }}>
                            {t(p.name, p.name)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 🗑️ 우측 고정 쓰레기통 영역 (소비/비우기 시각 가이드)border: '10px dashed rgba(255, 59, 48, 0.3)', */}
                  {hasEmergency && (
                    <div style={{
                      position: 'absolute',
                      right: '6px',
                      top: '40%',                        // 45 -> 40
                      transform: 'translateY(-50%)',
                      width: '45px',
                      height: '65px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(131, 53, 49, 0.08)',
                    
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 50,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out'
                    }}>
                      <svg width="35" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6M10 11V17M14 11V17" stroke="#e7847cff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}

                  {/* 2. 메인 바디 - 스크롤 가변 영역 */}
                  <div 
                    id="guide-shortcuts" /* [미세조정: 온보딩 가이드 숏컷 영역 ID] */
                    style={{
                      display: 'flex', justifyContent: 'center', gap: '35px', alignItems: 'center',
                      position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                      bottom: hasEmergency ? '3%' : '50%',
                      transition: 'bottom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                    {Object.entries(COMPARTMENT_ICONS).map(([name, url]) => {
                      // 카테고리의 첫 번째 페이지 인덱스를 동적으로 찾아서 정확히 첫 칸으로 이동시킵니다.
                      const targetIdx = PAGES.findIndex(p => p.type === name);
                      return (
                        <img key={name} onClick={() => onSectionChange(targetIdx)} src={url} alt={name} style={{ width: 'min(8cqw, 36px)', height: 'min(8cqw, 36px)', cursor: 'pointer', opacity: 0.8 }} />
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                  {/* 🥦 칸 이름 표시 - 상단 고정 (이미지 2번 반영) */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    paddingTop: '60px', flexShrink: 0 // <--🌟 알림 문자와 겹치지 않게 이미지를 10px 아래로 내림 (30px -> 40px)
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', backgroundColor: COLORS.INNER,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.2px solid ${COLORS.BORDER}`
                    }}>
                      <img src={COMPARTMENT_ICONS[page.type as keyof typeof COMPARTMENT_ICONS]} alt={page.type} style={{ width: '28px', height: '28px' }} />
                    </div>
                    <span style={{ fontSize: FONT_SIZE.TITLE, fontWeight: 'bold', color: COLORS.TEXT_PRIMARY }}>
                      {page.type === 'main' ? t('메인') : `${t(page.type)}${page.label.includes('(') ? ' ' + page.label.substring(page.label.indexOf('(')) : ''}`}
                    </span>
                  </div>

                  {/* 캐릭터 그리드 (3열 2행) - 화면 중앙 배치 (가로폭 제한 및 반응형 gap 적용) */}
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
                    transform: 'translateY(-15px)' // 👈 전체 그리드 끌어올리기
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
                      gap: 'min(6cqh, 40px) 4%', // 세로 줄간격은 화면 비율(cqh)로, 가로 간격은 %로 유연하게 처리
                      width: '100%',
                      maxWidth: '320px', // 아이폰 375px 화면 기준 너무 흩어지지 않고 오밀조밀하게 모이도록 너비 제한
                      paddingTop: '10px',
                      paddingBottom: '40px' // 푸터 공간 고려 30 -> 40 *****
                    }}>

                      {page.items.map((item: any, localIdx: number) => {
                        if (item.isAddPlaceholder) {
                          return (
                            <div
                              key={item.id}
                              onClick={() => onOpenDirectAdd?.(page.type)}
                              className="guide-food-card-placeholder" /* [미세조정: 가이드 카드 플레이스홀더 클래스] */
                              id="guide-food-add-btn" /* [미세조정: 가이드 식품 추가 ID] */
                              style={{
                                aspectRatio: '1', borderRadius: '18px',
                                backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              {/* 냉장고 개별 직접 추가 버튼 (파란 테두리, 파란 +) */}
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                backgroundColor: 'transparent',
                                border: `2px solid ${COLORS.BLUE}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 5V19M5 12H19" stroke={COLORS.BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                              {/* 여백용 투명 div를 배치해 다른 캐릭터들과 수직 정렬 정밀 매칭 */}
                              <div style={{ fontSize: '10px', marginTop: '4px', height: '12px' }} />
                            </div>
                          );
                        }
                        return (
                          <DynamicCharacterCard 
                            key={`${item.id}-${localIdx}`} 
                            item={item} 
                            onOpenDetail={onOpenDetail} 
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 인디케이터: 동적 페이지 수에 대응 */}
      <div style={{
        height: '20px',
        marginTop: '4px',
        marginBottom: '8px',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexShrink: 0
      }}>
        {PAGES.map((_, idx) => (
          <div
            key={idx}
            onClick={() => onSectionChange(idx)}
            style={{
              width: idx === currentSectionIdx ? '24px' : '8px',
              height: '3px', borderRadius: '4px',
              backgroundColor: idx === currentSectionIdx ? COLORS.BLUE : 'rgba(128, 128, 128, 0.6)',
              transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>

      {/* 🚀 가이드 레이아웃 설치 (첫 1회 자동 실행) "지속 테스트 가능 코드 forceShow={true}" */}
      {currentSectionIdx > 0 && <GuideRenderer context="main_body"  />}
    </div>
  );
});
