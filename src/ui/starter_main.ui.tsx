import { COLORS, BUTTON_STYLE, BUTTON_SIZE, SAFE_AREA } from "./style/constants.ui";
import { useEasterEgg } from "../hooks/useEasterEgg";
import { Grid } from "./grid.ui";
import { SFX } from "../utils/shooting_sfx";
import {
  ONBOARDING_CHARACTER_IMAGE,
  BUBBLE_BACKGROUND_IMAGES,
  MOTION_KEYFRAMES_CSS
} from "../utils/character_motions";
import { useTranslation } from "react-i18next";

interface StarterMainProps {
  onNext: () => void;
  onDemo: () => void;
}

/**
 * StarterMain UI - 영수증 스캔 진입 메인 화면
 * 3D 그리드 배경과 중앙의 "영수증 주세요" 버튼이 특징입니다.
 */
export function StarterMain({ onNext, onDemo }: StarterMainProps) {
  const { t } = useTranslation();
  const ICONS = {
    "냉동": "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/frozen.webp?v=2",
    "냉장": "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/chilled.webp?v=2",
    "신선": "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/fresh.webp?v=2",
    "실외": "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/outer.webp?v=2"
  };
  // 개발용/아이콘 레퍼런스 유지용 안전 참조 (IDE 경고 해제)
  void ICONS;

  // [개발자용 이스터에그]
  const { handleCharacterTap } = useEasterEgg(5, 1500);

  return (
    <div className="force-dark" style={{
      backgroundColor: COLORS.BACKGROUND,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      color: '#FFF'
    }}>
      {/* 상단 헤더 */}
      <header style={{
        paddingTop: SAFE_AREA.HEADER_PADDING_TOP,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '20px',
        zIndex: 10
      }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
       {/*   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
           </svg> */}
          <span style={{ marginLeft: '12px', fontSize: '18px', fontWeight: 'bold' }}>{t("APP_NAME", "쿨박스")}</span>
        </div>
      </header>

      {/* 중앙 콘텐츠 영역 (아이콘 + 그리드) */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <style>{MOTION_KEYFRAMES_CSS}</style>

        {/* 3D 그리드 배경 부품 (아이콘 포함) */}
        <Grid />

        {/* 🥬 3D 그리드 정중앙 위 캐릭터 & 우측 상단 이격 10px 말풍선 가이드 */}
        <div style={{
          position: 'absolute',
          top: '50%',         // 3D 그리드의 가장 이상적인 원근감 중심점 조준
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 15,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }} className="character-wrapper">
          {/* 말풍선 가이드: 핑크 스킨을 사용하여 시선을 확 끌고 우측 상단 배치 */}
          <div
            className="character-bubble"
            style={{
              backgroundImage: `url(${BUBBLE_BACKGROUND_IMAGES.PINK})`,
            }}
          >
            <span style={{ whiteSpace: 'pre-line' }}>
              {t("STARTER_BUBBLE", "영수증 없어도 돼요!\n관리를 즐거움으로!\n스캔 중 광고가 나와요!")}
            </span>
          </div>

          {/* 깡총깡총 뛰는 배추 캐릭터 */}
          <img
            src={ONBOARDING_CHARACTER_IMAGE}
            alt="배추 요정"
            className="motion-jump" // 뿅 뛰고 착지 압축 모션 가동!
            onClick={handleCharacterTap}
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'contain',
              cursor: 'pointer'
            }}
          />
        </div>

        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)', // 양옆 20px 마진
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 10
        }}>
          {/* [1단] "영수증 주세요" 메인 버튼 (PRIMARY) */}
          <button
            onClick={() => {
              SFX.playReceiptPlease();
              onNext();
            }}
            style={{
              ...BUTTON_STYLE.PRIMARY,
              width: '100%',
              height: BUTTON_SIZE.HEIGHT,
              borderRadius: BUTTON_SIZE.RADIUS,
              fontSize: '18px',
              fontWeight: BUTTON_SIZE.FONT_WEIGHT,
              boxShadow: '0 8px 24px rgba(49,130,246,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            {t("STARTER_NEXT", "영수증 주세요")}
          </button>

          {/* [2단] "영수증 없이 체험하기" 서브 버튼 (SECONDARY) */}
          <button
            onClick={onDemo}
            style={{
              ...BUTTON_STYLE.SECONDARY,
              width: '100%',
              height: BUTTON_SIZE.HEIGHT,
              borderRadius: BUTTON_SIZE.RADIUS,
              fontSize: '17px',
              fontWeight: BUTTON_SIZE.FONT_WEIGHT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#191919', // 3D 그리드 선이 비치지 않게 솔리드 어두운색(#191919)으로 지정
              color: '#fff'
            }}>
            {t("STARTER_DEMO_START", "영수증 없이 시작해요")}
          </button>
        </div>
      </main>
    </div>
  );
}
