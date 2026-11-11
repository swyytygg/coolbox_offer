/**
 * 쿨박스 식재료 캐릭터 동작사전 및 대화 엔진 (Character Motion & Dialogue Dictionary)
 * 
 * 1. 캐릭터가 취할 수 있는 다양한 감정/물리 동작(CSS/Framer Motion 기반)을 선언합니다.
 * 2. 식재료의 잔여일수(daysLeft)에 따른 동적 말풍선 및 애니메이션 매핑을 처리합니다.
 * 3. 신규 유저 온보딩 진입 시, 배추 요정이 화면 중앙으로 깡총깡총 뛰어나와 입고게임을 설명하는 가이드 연출 시퀀스를 정의합니다.
 * 4. 제공된 6가지 천상계 파스텔톤 말풍선 스킨을 캐릭터의 우측 상단 10px 오프셋 위치에 둥둥 뜨게 매핑합니다.
 */

export type MotionType =
  | 'IDLE' | 'TILT' | 'JUMP' | 'SHAKE' | 'SWEAT' | 'GHOST'
  | 'WALK' | 'RUN' | 'SPRINT' | 'BLINK' | 'SPIN' | 'SWAY_HIP' | 'TILT_HEAD' | 'WAVE_HAND';

export interface MotionConfig {
  name: string;
  cssClass: string;
  description: string;
}

// 1. 동작 사전에 정의된 물리 모션 목록
export const CHARACTER_MOTIONS: Record<MotionType, MotionConfig> = {
  IDLE: {
    name: '아이들',
    cssClass: 'motion-idle',
    description: '가볍게 위아래로 제자리 뛰기 (기본 달리기/호핑)',
  },
  TILT: {
    name: '기우뚱',
    cssClass: 'motion-tilt',
    description: '좌우로 번갈아가며 흔들흔들 두리번대기 (정적)',
  },
  JUMP: {
    name: '뿅 뛰기',
    cssClass: 'motion-jump',
    description: '스프링처럼 아주 높이 솟구쳤다가 바닥으로 쫀득하게 압축 (역동적)',
  },
  SHAKE: {
    name: '덜덜덜',
    cssClass: 'motion-shake',
    description: '소비기한 임박으로 바르바르 떨며 안절부절못함 (긴급)',
  },
  SWEAT: {
    name: '땀방울',
    cssClass: 'motion-sweat',
    description: '머리맡에 땀방울(💦) 또는 느낌표(❗) 팝업이 번쩍임',
  },
  GHOST: {
    name: '유령',
    cssClass: 'motion-ghost',
    description: '반투명한 상태로 중력을 거슬러 위아래로 둥실둥실 떠다님 (폐기 완료)',
  },
  WALK: {
    name: '걷기',
    cssClass: 'motion-walk',
    description: '3일전 가볍고 느린 호핑 보행',
  },
  RUN: {
    name: '달리기',
    cssClass: 'motion-run',
    description: '2일전 서두르는 러닝 동작',
  },
  SPRINT: {
    name: '빨리뛰기',
    cssClass: 'motion-sprint',
    description: '1일전 쫀득한 고속 점핑 보행',
  },
  BLINK: {
    name: '눈깜박',
    cssClass: 'motion-blink',
    description: '가만히 있다가 가끔 톡! 하고 감았다 뜨는 듯한 느낌',
  },
  SPIN: {
    name: '빙글빙글',
    cssClass: 'motion-spin',
    description: '180도 좌우 반전하며 제자리 걸음하는 연출',
  },
  SWAY_HIP: {
    name: '허리흔들',
    cssClass: 'motion-sway-hip',
    description: '상체 축은 고정되고 엉덩이를 좌우로 씰룩씰룩 흔듦',
  },
  TILT_HEAD: {
    name: '고개갸우뚱',
    cssClass: 'motion-tilt-head',
    description: '갸우뚱 갸우뚱 물음표 던지기',
  },
  WAVE_HAND: {
    name: '손흔들기',
    cssClass: 'motion-wave-hand',
    description: '좌우 미세 흔들림 및 인사 율동',
  },
};

// 2. 제공된 6가지 초프리미엄 파스텔톤 말풍선 스킨 .webp 주소
export const BUBBLE_BACKGROUND_IMAGES = {
  YELLOW: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/101.webp",      // 노랑
  PURPLE: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/102.webp",      // 퍼플
  PINK: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/103.webp",        // 분홍
  ORANGE: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/104.webp",      // 주황
  LIGHT_GREEN: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/105.webp", // 연두
  BLUE: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/106.webp",        // 파란
};

/**
 * 🏀 슬램던크 전용 말풍선 스타일 생성기 (위치 보정 가이드 포함)
 * - bottom: 캐릭터(100px)로부터의 상하 거리. 예: '105px'에서 위로 올리고 싶으면 '115px' 등으로 수정
 * - width / height: 말풍선의 가로/세로 규격. 문구 길이에 맞춰 크기 수정 가능
 * - padding: 말풍선 webp 이미지 꼬리표 영역을 고려한 내부 글씨 마진 (상 우 하 좌 순서)
 */
export const SLAMDUNK_BUBBLE_STYLE = (bubbleUrl: string) => ({
  position: 'absolute' as const,
  bottom: '65px',               // ◀ [위치보정] 상하 위치 조절 (높일수록 캐릭터와 멀어짐)
  left: '35%',
  transform: 'translateX(-50%)',
  width: '180px',                // ◀ [크기보정] 가로 크기 조절
  height: '180px',                // ◀ [크기보정] 세로 크기 조절
  boxSizing: 'border-box' as const, // ◀ [추가] 패딩 크기가 늘어나도 전체 말풍선 크기가 변하지 않게 고정
  backgroundImage: `url(${bubbleUrl})`,
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 8px 18px 8px',   // ◀ [정렬보정] 말풍선 내부 글자 여백 조절 (아래쪽 18px로 꼬리표 회피)
  pointerEvents: 'none' as const,
  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
});

// 무작위로 말풍선 스킨 주소를 뽑아오는 헬퍼 함수
export const getRandomBubbleImage = (): string => {
  const urls = Object.values(BUBBLE_BACKGROUND_IMAGES);
  const randomIndex = Math.floor(Math.random() * urls.length);
  return urls[randomIndex];
};

// 3. 소비 기한(daysLeft)에 따른 동적 감정 말풍선 대화 세트
export const STATUS_DIALOG_DICTIONARY = {
  FRESH: [
    "여긴 정말 천국이네! 시원하고 상쾌해~ ❄️",
    "아직 쌩쌩하니까 나중에 맛있게 먹어줘! 🥦",
    "냉장고 문 너무 오래 열지 마~ 추워! 🥶",
    "나랑 같이 신나게 냉장고 레이스 뛰어볼래? 🏃‍♂️",
    "신선함 충전 완료! 오늘도 활기차게 출발! ✨"
  ],
  NORMAL: [
    "나 슬슬 맛있는 냄새 풍길 준비 완료! 🍳",
    "요리에 나를 넣어보는 건 어때? 잘 어울릴걸! 😉",
    "조금만 이따 먹어주면 더 달콤해질지도~ 🍯",
    "잊지 말고 기억해 줘! 나 여기 구석에 살고 있어! 👀",
    "오늘 저녁 반찬은 내가 주인공인가? 🍲"
  ],
  WARNING: [
    "앗 뜨거워! 아니, 냉장고인데 왜 내 몸이 아슬아슬하지? 💦",
    "SOS! 나 좀 제일 먼저 구출해서 요리해 줘! 😭",
    "지금 안 먹으면 후회할 텐데.. 진짜 맛있을 때라고! 🚨",
    "시간이 째깍째깍 흐르고 있어! 빨리 꺼내 줘! ⏱️",
    "나 버려지기 싫어! 맛있는 반찬으로 환생시켜 줘! 🙏"
  ],
  EXPIRED: [
    "으스스... 내 몸이 둥실 떠오르고 있어.. 유령 소환! 👻",
    "흐아아.. 다음 생엔 더 빨리 꺼내 먹어줘.. 😢",
    "지켜주지 못해 미안해.. 유령이 되어 냉장고를 떠돕니다.. 🕯️",
    "흑흑.. 골든타임을 넘겨버렸잖아.. 버려지지 않게 조심해줘! 💔"
  ]
};

// 소비 기한 기준 모션, 대화, 전용 말풍선 스킨을 묶어서 반환하는 고도화 함수
export const getCharacterStatusState = (daysLeft: number) => {
  if (daysLeft <= 0) {
    return {
      motion: 'GHOST' as MotionType,
      dialogs: STATUS_DIALOG_DICTIONARY.EXPIRED,
      color: '#B0BEC5',
      bubbleBg: BUBBLE_BACKGROUND_IMAGES.PURPLE // 유령에 어울리는 신비로운 보라빛
    };
  }
  if (daysLeft < 3) {
    return {
      motion: 'SHAKE' as MotionType,
      dialogs: STATUS_DIALOG_DICTIONARY.WARNING,
      color: '#FF7043',
      bubbleBg: BUBBLE_BACKGROUND_IMAGES.ORANGE // 경고성 느낌의 오렌지빛
    };
  }
  if (daysLeft <= 7) {
    return {
      motion: 'TILT' as MotionType,
      dialogs: STATUS_DIALOG_DICTIONARY.NORMAL,
      color: '#FBC02D',
      bubbleBg: BUBBLE_BACKGROUND_IMAGES.YELLOW // 편안한 노랑빛
    };
  }
  return {
    motion: 'IDLE' as MotionType,
    dialogs: STATUS_DIALOG_DICTIONARY.FRESH,
    color: '#66BB6A',
    bubbleBg: BUBBLE_BACKGROUND_IMAGES.LIGHT_GREEN // 프레시한 연두빛
  };
};

export const getRandomSpeech = (daysLeft: number): { speech: string, bubbleBg: string } => {
  const { dialogs, bubbleBg } = getCharacterStatusState(daysLeft);
  const randomIndex = Math.floor(Math.random() * dialogs.length);
  return {
    speech: dialogs[randomIndex],
    bubbleBg
  };
};

// 4. 신규 유저 온보딩(Onboarding) 배추 요정 가이드 시퀀스 정의
export interface OnboardingGuideStep {
  step: number;
  speech: string;           // 말풍선 내용
  bubbleBg: string;         // 랜덤/지정 말풍선 배경 .webp 주소
  animation: {
    y: number[];            // 이동 경로 Y축
    x: number[];            // 이동 경로 X축
    scale: number[];        // 크기 변경
    rotate?: number[];      // 회전값
  };
  duration: number;         // 연출 시간 (초)
}

export const ONBOARDING_CHARACTER_IMAGE = "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/1.webp"; // 배추 요정 공식 웹 이미지 주소

export const ONBOARDING_GUIDE_SEQUENCE: OnboardingGuideStep[] = [
  {
    step: 1,
    speech: "안녕! 깡총깡총! 🥬\n나는 네 냉장고를 지킬 쿨박스 배추 요정이야!",
    bubbleBg: BUBBLE_BACKGROUND_IMAGES.LIGHT_GREEN, // 생기발랄 연두
    animation: {
      x: [0, 0],
      y: [400, 250],
      scale: [0.2, 1.2, 1.0],
    },
    duration: 1.2
  },
  {
    step: 2,
    speech: "지루한 식재료 정리는 가라!\n여기에 장 본 영수증을 찰칵 보여주면...",
    bubbleBg: BUBBLE_BACKGROUND_IMAGES.PINK, // 호기심 자극 분홍
    animation: {
      x: [0, 0],
      y: [250, 120],
      scale: [1.0, 1.3, 1.0],
      rotate: [0, 360],
    },
    duration: 1.5
  },
  {
    step: 3,
    speech: "냉장고 속에서 뛰노는 식재료 캐릭터를\n골대에 던져 넣는 신나는 '입고게임'이 시작돼! 🎮",
    bubbleBg: BUBBLE_BACKGROUND_IMAGES.BLUE, // 청량한 파랑
    animation: {
      x: [0, 0],
      y: [120, 80],
      scale: [1.0, 1.1, 1.0],
    },
    duration: 1.8
  },
  {
    step: 4,
    speech: "영수증 사진이 있다면 촬영을 누르고,\n없다면 아래 '체험하기'로 가볍게 시작해 봐! 📸",
    bubbleBg: BUBBLE_BACKGROUND_IMAGES.YELLOW, // 집중을 유도하는 노랑
    animation: {
      x: [0, 0],
      y: [80, 80],
      scale: [1.0, 1.05, 1.0],
    },
    duration: 2.0
  }
];

// 5. 수납공간 전용 캐릭터 고유 모션 매핑 (다이나믹 모션 + 로티 이펙트 조합)
export const STORAGE_ITEM_MOTIONS: Record<number, { motionClass: string, effectName: string }> = {
  1: { motionClass: 'motion-power-jump', effectName: 'dust' },
  2: { motionClass: 'motion-happy-dance', effectName: 'sparkle' },
  3: { motionClass: 'motion-cold-shiver', effectName: 'mist' },
  4: { motionClass: 'motion-cheer', effectName: 'stars' },
  5: { motionClass: 'motion-power-jump', effectName: 'sparkle' },
  6: { motionClass: 'motion-happy-dance', effectName: 'mist' },
  7: { motionClass: 'motion-cold-shiver', effectName: 'dust' },
  8: { motionClass: 'motion-cheer', effectName: 'stars' },
  9: { motionClass: 'motion-power-jump', effectName: 'stars' },
  10: { motionClass: 'motion-happy-dance', effectName: 'dust' },
  11: { motionClass: 'motion-cold-shiver', effectName: 'mist' },
  12: { motionClass: 'motion-cheer', effectName: 'sparkle' },
  13: { motionClass: 'motion-power-jump', effectName: 'mist' },
  14: { motionClass: 'motion-happy-dance', effectName: 'stars' },
  15: { motionClass: 'motion-cold-shiver', effectName: 'dust' },
  16: { motionClass: 'motion-cheer', effectName: 'sparkle' },
  17: { motionClass: 'motion-happy-dance', effectName: 'sparkle' }
};

export const getStorageMotion = (id: string | number) => {
  const numericId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, '')) || 0;
  const safeId = numericId > 0 && numericId <= 17 ? numericId : (numericId % 17) + 1; 
  return STORAGE_ITEM_MOTIONS[safeId];
};

// 6. CSS 애니메이션 및 위치 설계 (캐릭터의 우측 상단 머리 위에 노출되며 동작을 절대 가리지 않음)
export const MOTION_KEYFRAMES_CSS = `
  /* 캐릭터와 말풍선을 감싸는 부모 컨테이너 */
  .character-wrapper {
    position: relative;
    display: inline-block;
  }

  /* 천상계 말풍선 스킨 배치 디자인 (우측 머리 위 10px 이격) */
  .character-bubble {
    position: absolute;
    bottom: 105%;            /* 캐릭터 키의 105% 지점 (정수리 바로 위) */
    left: 75%;              /* 캐릭터 바디 중심 기준 우측 85% 지점으로 10px 이상 우측 시프트 */
    margin-bottom: -10px;    /* 위쪽 방향 10px 추가 이격 */
    margin-left: -95px;      /* 오른쪽 방향 10px 추가 이격 */
    width: 280px;           /* 배경 이미지 원본 세로가로비 유지 */
    height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 14px 15px 14px; /* .webp 말풍선 하단 꼬리표 영역을 침범하지 않도록 아래쪽에 안전마진 추가 */
    box-sizing: border-box;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-position: center;
    
    font-size: 16px;
    font-weight: bold;
    color: #ffffff;          /* 편안한 카본 블랙 색상 */
    line-height: 1.35;
    text-align: center;
    white-space: pre-line;
    pointer-events: none;    /* 캐릭터 클릭 입고 터치를 방해하지 않음 */
    z-index: 10;
    
    filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.12));
    animation: bubble-bounce-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* 귀엽게 바운스하며 등장 */
    transform-origin: bottom left; /* 꼬리표 시작 지점을 중심축으로 팝업 */
  }

  @keyframes bubble-bounce-in {
    from { opacity: 0; transform: scale(0.6) translate(-10px, 15px); }
    to { opacity: 1; transform: scale(1) translate(0, 0); }
  }

  /* 1. IDLE: 가벼운 호핑 */
  @keyframes motion-idle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .motion-idle {
    animation: motion-idle 1.2s ease-in-out infinite;
  }

  /* 2. TILT: 흔들흔들 */
  @keyframes motion-tilt {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-8deg); }
    75% { transform: rotate(8deg); }
  }
  .motion-tilt {
    animation: motion-tilt 1.8s ease-in-out infinite;
  }

  /* 3. JUMP: 뿅 뛰고 착지 압축 */
  @keyframes motion-jump {
    0%, 100% { transform: translateY(0) scale(1, 1); }
    40% { transform: translateY(-25px) scale(0.9, 1.1); }
    50% { transform: translateY(-30px) scale(0.85, 1.15); }
    60% { transform: translateY(-20px) scale(0.95, 1.05); }
    85% { transform: translateY(0) scale(1.15, 0.85); } /* 바닥 착지 시 쫀득하게 압축 */
  }
  .motion-jump {
    animation: motion-jump 1.5s ease-in-out infinite;
  }

  /* 4. SHAKE: 덜덜덜 공포/급박 */
  @keyframes motion-shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
  .motion-shake {
    animation: motion-shake 0.5s linear infinite;
  }

  /* 5. SWEAT: 땀방울이 위로 톡 솟아남 */
  @keyframes motion-sweat {
    0%, 100% { transform: scale(1); filter: saturate(100%); }
    50% { transform: scale(1.05); filter: saturate(150%); }
  }
  .motion-sweat {
    animation: motion-sweat 1s ease-in-out infinite;
  }

  /* 6. GHOST: 반투명 위아래 부유 */
  @keyframes motion-ghost {
    0%, 100% { transform: translateY(0); opacity: 0.55; }
    50% { transform: translateY(-12px); opacity: 0.35; }
  }
  .motion-ghost {
    animation: motion-ghost 2.5s ease-in-out infinite;
  }

  /* 7. WALK: 3일전 가볍고 느린 호핑 보행 */
  @keyframes motion-walk {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-4px) rotate(2deg); }
  }
  .motion-walk {
    animation: motion-walk 1.2s ease-in-out infinite;
  }

  /* 8. RUN: 2일전 서두르는 달리기 */
  @keyframes motion-run {
    0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
    50% { transform: translateY(-8px) rotate(-4deg) scale(1.02); }
  }
  .motion-run {
    animation: motion-run 0.6s ease-in-out infinite;
  }

  /* 9. SPRINT: 1일전 고속 쫀득한 점핑 */
  @keyframes motion-sprint {
    0%, 100% { transform: translateY(0) scale(1, 1); }
    30% { transform: translateY(-12px) scale(0.9, 1.1); }
    70% { transform: translateY(0) scale(1.1, 0.9); }
  }
  .motion-sprint {
    animation: motion-sprint 0.3s ease-in-out infinite;
  }

  /* 10. BLINK: 가끔 톡! 하고 수직으로 감았다 뜨는 펄스 */
  @keyframes motion-blink {
    0%, 90%, 100% { transform: scale(1); }
    95% { transform: scale(1, 0.15); }
  }
  .motion-blink {
    animation: motion-blink 3s ease-in-out infinite;
  }

  /* 11. SPIN: 180도 좌우 회전 제자리 걸음 */
  @keyframes motion-spin {
    0%, 100% { transform: rotateY(0deg); }
    50% { transform: rotateY(180deg); }
  }
  .motion-spin {
    animation: motion-spin 2s ease-in-out infinite;
  }

  /* 12. SWAY_HIP: 허리/엉덩이 씰룩씰룩 흔들 */
  @keyframes motion-sway-hip {
    0%, 100% { transform: skewX(0deg); }
    25% { transform: skewX(-5deg); }
    75% { transform: skewX(5deg); }
  }
  .motion-sway-hip {
    animation: motion-sway-hip 1.5s ease-in-out infinite;
  }

  /* 13. TILT_HEAD: 고개 갸우뚱 귀여움 어필 */
  @keyframes motion-tilt-head {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-10deg); }
  }
  .motion-tilt-head {
    animation: motion-tilt-head 2s ease-in-out infinite;
  }

  /* 14. WAVE_HAND: 가벼운 인사 및 좌우 율동 */
  @keyframes motion-wave-hand {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    25% { transform: translateX(-3px) rotate(-3deg); }
    75% { transform: translateX(3px) rotate(3deg); }
  }
  .motion-wave-hand {
    animation: motion-wave-hand 1.4s ease-in-out infinite;
  }

  /* 15. scan_item.ui의 냉장고이름 알림_토스블루 발광 + 쫀득한 좌우 5도 회전 */
  @keyframes tooltip-glow-shake {
    0%, 100% {
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5)) drop-shadow(0 0 4px rgba(49, 130, 246, 0.4));
      transform: rotate(0deg);
    }
    35% {
      transform: rotate(-2deg) scale(1.0);
    }
    /* 50% {
      filter: drop-shadow(0 6px 16px rgba(0,0,0,0.6)) drop-shadow(0 0 16px rgba(49, 130, 246, 0.8));
      transform: rotate(0deg);
    } */
    75% {
      transform: rotate(3deg) scale(1.03);
    }
  }
  .tooltip-glow-shake {
    animation: tooltip-glow-shake 1s ease-in-out infinite;
    transform-origin: bottom left;
  }

  /* --- 4 DYNAMIC MOTIONS (리액트가 제어하므로 순수 액션만!) --- */
  
  /* 1. 파워 점프 (Power Jump) - 쫀득함을 유지하되 찌그러짐 완화 */
  @keyframes motion-power-jump {
    0%, 100% { transform: scale(1, 1) translateY(0); }
    15% { transform: scale(1.15, 0.85) translateY(3px); }
    40% { transform: scale(0.85, 1.15) translateY(-30px); }
    50% { transform: scale(1, 1) translateY(-35px); }
    70% { transform: scale(0.95, 1.05) translateY(0); }
    85% { transform: scale(1.05, 0.95) translateY(3px); }
  }
  .motion-power-jump {
    animation: motion-power-jump 1.2s cubic-bezier(0.28, 0.84, 0.42, 1) forwards;
  }

  /* 2. 고무줄 뚱뚱/홀쭉 댄스 (Fat-Thin Dance) - 심한 왜곡 방지 */
  @keyframes motion-fat-thin-dance {
    0%, 100% { transform: scale(1, 1) translateX(0); }
    20% { transform: scale(1.2, 0.8) translateX(-5px); }
    40% { transform: scale(0.8, 1.2) translateX(5px); }
    60% { transform: scale(1.15, 0.85) translateX(-5px); }
    80% { transform: scale(0.85, 1.15) translateX(5px); }
  }
  .motion-fat-thin-dance {
    animation: motion-fat-thin-dance 1.4s ease-in-out forwards;
  }

  /* 3. 심장 쿵쾅 환호 (Heartbeat Cheer) - 튀어나오는 정도 완화 */
  @keyframes motion-heartbeat-cheer {
    0%, 100% { transform: scale(1) translateY(0); }
    15% { transform: scale(1.25) translateY(-5px); }
    25% { transform: scale(1.1) translateY(-2px); }
    40% { transform: scale(1.3) translateY(-8px); }
    60% { transform: scale(1.05) translateY(0px); }
    80% { transform: scale(1.15) translateY(-4px); }
  }
  .motion-heartbeat-cheer {
    animation: motion-heartbeat-cheer 1.5s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards;
  }

  /* 4. 어지러운 팽이/추위 (Dizzy Wobble) - 찌그러짐 최소화 및 기울기 완화 */
  @keyframes motion-dizzy-wobble {
    0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
    10% { transform: translateY(3px) rotate(-15deg) scale(1.05, 0.95); }
    30% { transform: translateY(3px) rotate(15deg) scale(1.05, 0.95); }
    50% { transform: translateY(3px) rotate(-15deg) scale(1.05, 0.95); }
    70% { transform: translateY(3px) rotate(15deg) scale(1.05, 0.95); }
    90% { transform: translateY(3px) rotate(-15deg) scale(1.05, 0.95); }
  }
  .motion-dizzy-wobble {
    animation: motion-dizzy-wobble 1.6s ease-in-out forwards;
  }
`;

