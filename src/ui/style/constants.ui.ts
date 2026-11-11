/**
 * [쿨박스 디자인 헌법]
 * 이 파일은 앱의 모든 색상, 크기, 버튼 스타일을 결정하는 '중앙 통제소'입니다.
 * 수치를 직접 입력하기보다 여기서 정의된 값을 사용해 '일관성'을 유지하세요.
 * 
 * [금지 사항]
 * - 빨간색(Red) 사용 절대 금지: 경고나 강조는 ORANGE나 ACCENT(골드)를 사용하세요.
 * - 연한 회색 글씨 금지: 작은 글씨에 연한 회색을 쓰면 노안이나 저시력자가 읽기 힘듭니다. 
 *   중요 정보는 반드시 TEXT_PRIMARY를 사용하세요.
 */
import i18n from "../../utils/i18n";


export const COLORS = {
  // [테마 대응 배경색]
  BACKGROUND: 'var(--bg-app)',
  CARD: 'var(--bg-card)',
  INNER: 'var(--bg-inner)',

  // [포인트 컬러]
  BLUE: 'var(--point-blue, #3182F6)',   // 토스 권장: 다크는 #4000대(#4880EE), 라이트는 #3000대(#3182F6) 자동 이원화
  ORANGE: '#F36622', 
  YELLOW: '#FFC342', 
  GREEN: '#2DCA72',  
  ACCENT: '#FFAC00',

  // [가독성 중심 회색 단계]
  TEXT_PRIMARY: 'var(--text-primary)',     // (100) 가장 진한색
  GREY_80: 'var(--text-secondary)',        // (80) 진한 회색 - 본문 및 중요 보조 정보
  GREY_50: '#8B95A1',                      // (50) 중간 회색 - 덜 중요한 보조 정보
  
  BORDER: 'var(--border-primary)',         // (20) 선/구분용 (글씨 사용 금지)
  WHITE: '#FFFFFF',
  BLACK: '#000000',
};

export const FONT_SIZE = {
  // [가독성 보장] 노안을 고려해 기본 폰트를 더 키웁니다.
  BODY: '16px',     // 일반 본문
  SUB: '14px',      // 최소 가독 크기 (이보다 작으면 안 됨)
  TITLE: '22px',    // 소제목
  HEADER: '26px',   // 대제목

  // [규정] 네비게이션용 기호 (<, >, v, ^) 최소 크기
  ICON_NAV: '10px',
};

/**
 * [버튼 헌법 - 사이즈 및 레이아웃]
 * 높이, 둥글기 등 모든 버튼의 물리적 규격을 통일합니다.
 */
export const BUTTON_SIZE = {
  HEIGHT: '56px',       // [통일 규격] 모든 메인/서브 버튼의 높이
  RADIUS: '16px',       // [통일 규격] 버튼 모서리 둥글기
  FONT_WEIGHT: '600',   // 버튼 글씨 두께
};

/**
 * [버튼 헌법 - 테마 및 상황별 스타일]
 * 1단, 2단, 3단 배치 상황에 따라 엄격하게 적용합니다.
 */
export const BUTTON_STYLE = {   
  // [1단] 하나만 있는 경우 (단독 주버튼)
  // 조건: 토스 파랑 바탕 / 흰 글씨
  PRIMARY: {
    background: COLORS.BLUE,
    color: COLORS.WHITE,
    border: 'none',
  },

  // [2단] 두 개의 버튼이 있는 경우의 부버튼 (거절/취소)
  // 조건: 테두리만 있는 스타일, 파란색 테두리 및 파란색 글자 고정 (#3182F6)
  SECONDARY: {
    background: 'transparent',
    color: '#3182F6',
    border: '2px solid #3182F6',
  },

  // [3단] 세 번째 버튼 (가장 중요도가 낮은 선택지)
  // 조건: 다크/라이트 동일 - 60% 회색 테두리 / 60% 회색 글자 고정 (#8B95A1)
  TERTIARY: {
    background: 'transparent',
    color: '#8B95A1',
    border: '2px solid #8B95A1',
  }
};

export const NAVIGATION = {
  // [수정 가능] 뒤로가기 기호의 색상과 크기
  BACK_ICON_COLOR: COLORS.GREY_80,
  BACK_ICON_SIZE: '14px',
};

export const ICONS = {
  '신선': 'https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/fresh.webp?v=2',
  '냉장': 'https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/chilled.webp?v=2',
  '냉동': 'https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/frozen.webp?v=2',
  '실외': 'https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/outer.webp?v=2',
} as const;

/**
 * [안전지역(Safe Area) 디자인 헌법 - 중앙 통제]
 * - 모바일 웹뷰 노치, 홈 바텀 인디케이터 겹침 방지용 중앙 통제소입니다.
 * - 개별 UI 파일에 raw 'env(safe-area-inset-...)'를 절대 하드코딩하지 마세요.
 * - 반드시 이 상수를 사용해 레이아웃 무중단 방어막을 설계해야 합니다.
 * - AI 또는 개발자는 개별 파일 리팩토링 시 이 값을 반드시 대입해야 합니다.
 */
export const SAFE_AREA = {
  // 단독 환경 변수값 (0px 기본값 보장)
  TOP: 'env(safe-area-inset-top, 0px)',
  BOTTOM: 'env(safe-area-inset-bottom, 0px)',

  // 상단 표준 헤더용 패딩 탑 (노치 높이 + 기본 10px 마진)
  HEADER_PADDING_TOP: 'calc(env(safe-area-inset-top, 0px) + 0px)',

  // 하단 표준 고정 버튼/푸터용 패딩 바텀 (홈바 인디케이터 높이 + 기본 20px 마진)
  FOOTER_PADDING_BOTTOM: 'calc(env(safe-area-inset-bottom, 0px) + 0px)',

  // 하단 팝업 드로어/바텀 시트용 패딩 바텀 (홈바 인디케이터 높이 + 기본 16px 마진)
  DRAWER_PADDING_BOTTOM: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
  
  // 일반 바텀 마진용 (홈바 인디케이터 높이 + 기본 24px 마진)
  MARGIN_BOTTOM_LARGE: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',

  // 하단 탈퇴/로그아웃 등 특수 마진용 (홈바 인디케이터 높이 + 기본 30px 마진)
  MARGIN_BOTTOM_XLARGE: 'calc(env(safe-area-inset-bottom, 0px) + 30px)',
} as const;

/**
 * [쿨박스 표준 알림/확인 대화상자 문구 중앙 통제소]
 * - 모든 대화상자의 타이틀과 설명을 이곳에서 중앙 제어하여 일관성을 확보하고 실수를 방지합니다.
 */
export const APP_DIALOGS = {
  // 닉네임 및 별칭 관련
  get NICKNAME_VALIDATION_ERROR() {
    return {
      title: i18n.t("DIALOG_NICKNAME_VALIDATION_ERROR_TITLE", "입력 오류"),
      description: i18n.t("DIALOG_NICKNAME_VALIDATION_ERROR_DESC", "닉네임을 알려주세요!")
    };
  },
  get NICKNAME_SAVE_SUCCESS() {
    return {
      title: i18n.t("DIALOG_NICKNAME_SAVE_SUCCESS_TITLE", "닉네임 저장 완료"),
      description: i18n.t("DIALOG_NICKNAME_SAVE_SUCCESS_DESC", "새 닉네임이 저장됐어요.")
    };
  },
  NICKNAME_SAVE_FAILURE: (errMsg: string) => ({
    title: i18n.t("DIALOG_NICKNAME_SAVE_FAILURE_TITLE", "닉네임 저장 실패"),
    description: errMsg || i18n.t("DIALOG_NICKNAME_SAVE_FAILURE_DESC", "닉네임 저장 중 오류가 발생했어요.")
  }),
  ALIAS_SAVE_FAILURE: (errMsg: string) => ({
    title: i18n.t("DIALOG_ALIAS_SAVE_FAILURE_TITLE", "별칭 변경 실패"),
    description: errMsg || i18n.t("DIALOG_ALIAS_SAVE_FAILURE_DESC", "별칭 변경 중 오류가 발생했어요.")
  }),

  // 식재료 관리 관련
  get ITEM_UNKNOWN() {
    return {
      title: i18n.t("DIALOG_ITEM_UNKNOWN_TITLE", "어려워요. 알려주세요"),
      description: i18n.t("DIALOG_ITEM_UNKNOWN_DESC", "모르는 식재료에요. 자세히 알려주세요!"),
      alertButton: i18n.t("CONFIRM", "확인")
    };
  },
  get ITEM_SAVE_FAILURE() {
    return {
      title: i18n.t("DIALOG_ITEM_SAVE_FAILURE_TITLE", "저장 실패"),
      description: i18n.t("DIALOG_ITEM_SAVE_FAILURE_DESC", "저장 중 오류가 발생했어요. 잠시 후 다시 주세요.")
    };
  },
  get ITEM_DELETE_CONFIRM() {
    return {
      title: i18n.t("DIALOG_ITEM_DELETE_CONFIRM_TITLE", "정말 삭제돼요"),
      description: i18n.t("DIALOG_ITEM_DELETE_CONFIRM_DESC", "한번 삭제하면 되돌릴 수 없어요!"),
      confirmButton: i18n.t("DELETE", "삭제"),
      cancelButton: i18n.t("CANCEL", "취소")
    };
  },
  get ITEM_DELETE_FAILURE() {
    return {
      title: i18n.t("DIALOG_ITEM_DELETE_FAILURE_TITLE", "삭제 실패"),
      description: i18n.t("DIALOG_ITEM_DELETE_FAILURE_DESC", "삭제 중 오류가 발생했어요. 잠시 후 다시 주세요.")
    };
  },

  // 냉장고 그룹 관리 관련
  get FRIDGE_LIMIT() {
    return {
      title: i18n.t("DIALOG_FRIDGE_LIMIT_TITLE", "새 냉장고 생성 제한"),
      description: i18n.t("DIALOG_FRIDGE_LIMIT_DESC", "냉장고 추가는 개발 중이에요.\n각자 소유하고 모두와 공유해요.\n\n(※ 가족에게 초대받은 회원으로\n 무제한 참여 가능!)")
    };
  },
  get FRIDGE_CREATE_FAILURE() {
    return {
      title: i18n.t("DIALOG_FRIDGE_CREATE_FAILURE_TITLE", "생성 실패"),
      description: i18n.t("DIALOG_FRIDGE_CREATE_FAILURE_DESC", "새 냉장고 생성이 실패했어요.")
    };
  },
  get FRIDGE_DELETE_CONFIRM() {
    return {
      title: i18n.t("DIALOG_FRIDGE_DELETE_CONFIRM_TITLE", "냉장고가 삭제돼요"),
      description: i18n.t("DIALOG_FRIDGE_DELETE_CONFIRM_DESC", "식재료와 대화방 내역이 영구 삭제돼요."),
      confirmButton: i18n.t("CONFIRM", "확인"),
      cancelButton: i18n.t("CANCEL", "취소")
    };
  },
  FRIDGE_DELETE_FAILURE: (errMsg: string) => ({
    title: i18n.t("DIALOG_FRIDGE_DELETE_FAILURE_TITLE", "삭제 실패"),
    description: errMsg || i18n.t("DIALOG_FRIDGE_DELETE_FAILURE_DESC", "냉장고 삭제가 실패했어요.")
  }),
  FRIDGE_RENAME_FAILURE: (errMsg: string) => ({
    title: i18n.t("DIALOG_FRIDGE_RENAME_FAILURE_TITLE", "이름 변경 실패"),
    description: errMsg || i18n.t("DIALOG_FRIDGE_RENAME_FAILURE_DESC", "냉장고 이름 저장이 실패했어요.")
  }),

  // 계정 및 대화방 참여 관련
  get LOGOUT_CONFIRM() {
    return {
      title: i18n.t("DIALOG_LOGOUT_CONFIRM_TITLE", "로그아웃돼요"),
      description: i18n.t("DIALOG_LOGOUT_CONFIRM_DESC", "식재료와 대화방 내역이 영구 삭제돼요."),
      confirmButton: i18n.t("CONFIRM", "확인"),
      cancelButton: i18n.t("CANCEL", "취소")
    };
  },
  get LOGOUT_FAILURE() {
    return {
      title: i18n.t("DIALOG_LOGOUT_FAILURE_TITLE", "로그아웃 오류"),
      description: i18n.t("DIALOG_LOGOUT_FAILURE_DESC", "로그아웃이 실패했어요. 잠시 후 다시 주세요.")
    };
  },
  MEMBER_EVICT_CONFIRM: (nickname: string) => ({
    title: i18n.t("DIALOG_MEMBER_EVICT_CONFIRM_TITLE", { nickname, defaultValue: `${nickname} 님이 삭제돼요` }),
    description: i18n.t("DIALOG_MEMBER_EVICT_CONFIRM_DESC", { defaultValue: "냉장고 그룹과 대화방에서 완전히 삭제돼요." }),
    confirmButton: i18n.t("EVICT", { defaultValue: "내보내기" }),
    cancelButton: i18n.t("CANCEL", { defaultValue: "취소" })
  }),
  MEMBER_EVICT_FAILURE: (errMsg: string) => ({
    title: i18n.t("DIALOG_MEMBER_EVICT_FAILURE_TITLE", "내보내기 실패"),
    description: errMsg || i18n.t("DIALOG_MEMBER_EVICT_FAILURE_DESC", "멤버 내보내기가 실패했어요. 잠시 후 다시 주세요.")
  }),
  get LEAVE_CONFIRM() {
    return {
      title: i18n.t("DIALOG_LEAVE_CONFIRM_TITLE", "대화방에서 나가게 돼요"),
      description: i18n.t("DIALOG_LEAVE_CONFIRM_DESC", "나가면 냉장고 식재료 현황을 다시 볼 수 없어요."),
      confirmButton: i18n.t("LEAVE_FRIDGE", "나가기"),
      cancelButton: i18n.t("CANCEL", "취소")
    };
  },
  LEAVE_FAILURE: (errMsg: string) => ({
    title: i18n.t("DIALOG_LEAVE_FAILURE_TITLE", "대화방 나가기 실패"),
    description: errMsg || i18n.t("DIALOG_LEAVE_FAILURE_DESC", "대화방 나가기 실패했어요. 잠시 후 다시 주세요.")
  }),
  get OWNER_LEAVE_BLOCK() {
    return {
      title: i18n.t("DIALOG_OWNER_LEAVE_BLOCK_TITLE", "방장은 탈퇴할 수 없어요"),
      description: i18n.t("DIALOG_OWNER_LEAVE_BLOCK_DESC", "방장 탈퇴는 [냉장고 목록 관리]에서 냉장고를 삭제해 주세요.")
    };
  },

  // 인앱 광고 관련
  get AD_LOADING() {
    return {
      title: i18n.t("DIALOG_AD_LOADING_TITLE", "광고 로드 중"),
      description: i18n.t("DIALOG_AD_LOADING_DESC", "광고가 로드되는 중. 잠시 후 다시 주세요.")
    };
  },
  get AD_SANDBOX() {
    return {
      title: i18n.t("DIALOG_AD_SANDBOX_TITLE", "광고 안내"),
      description: i18n.t("DIALOG_AD_SANDBOX_DESC", "ℹ️ 일반 브라우저 환경\n샌드박스앱 환경에서는 실제 전면 광고가 팝업돼요!")
    };
  },

  // 이스터에그 관련
  get EASTER_EGG_RESET() {
    return {
      title: i18n.t("DIALOG_EASTER_EGG_RESET_TITLE", "극초기화 확인"),
      description: i18n.t("DIALOG_EASTER_EGG_RESET_DESC", "⚙️ 모든 데이터(냉장고 식재료, 세션, 제한)를 즉시 파괴하고 극초기화해요"),
      confirmButton: i18n.t("DEV_RESET", "초기화"),
      cancelButton: i18n.t("CANCEL", "취소")
    };
  }
};

