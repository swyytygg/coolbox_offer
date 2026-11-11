/**
 * 쿨박스 온보딩 가이드 설정 데이터 (Onboarding Guide Data Configuration)
 * 
 * [가이드 수정 가이드]
 * 사용자가 가이드의 위치, 캐릭터, 메시지, 색상, 기한 등을 쉽게 조정할 수 있도록 구성되어 있습니다.
 * 아래의 각 단계(step) 내 속성값을 변경하여 맞춤 설정해 보세요.
 */

export interface GuideStep {
  // 가이드 단계 번호 (1부터 시작)
  step: number;
  
  // 가이드 화면 컨텍스트 (main, chat, menu, fridge_list, main_body 등)
  context: 'main' | 'chat' | 'menu' | 'fridge_list' | 'main_body';
  
  // 가이드의 대상이 되는 HTML 엘리먼트의 ID Selector (이 값을 통해 정확한 위치를 추적합니다)
  targetSelector: string;
  
  // 말풍선 안에 노출할 안내 문구 (줄바꿈은 \n 사용)
  message: string[];
  
  // 배정할 캐릭터 이미지 번호 (예: '15'는 15.webp를 의미합니다)
  // 캐릭터 이미지 경로는 https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/${characterId}.webp 입니다.
  characterId: string;
  
  // 말풍선 노란색 배경 스킨 이미지 주소 (101.webp 고정)
  bubbleBgUrl: string;
  
  // 텍스트 글자 색상 (기본값: 토스 파란색 계열 #1B64DA)
  textColor: string;
  
  // 요정 캐릭터 등장 완료 시 크기 (기본값: 35px)
  characterSize: number; 
  
  // 말풍선 박스의 너비 (px 단위, 기본값: 220)
  bubbleWidth: number;
  
  // 말풍선 박스의 높이 (px 단위, 기본값: 120)
  bubbleHeight: number;
  
  // 가이드 자동 유지 시간 (ms 단위, 기본값: 2000ms = 2초)
  // duration: number;
  
  // 대상 엘리먼트 대비 말풍선 블록의 상대적인 배치 방향 ('top' | 'bottom' | 'left' | 'right')
  align: 'top' | 'bottom' | 'left' | 'right';
  
  // 미세한 좌표 조정을 위한 X, Y 오프셋 (px 단위)
  offsetX: number;
  offsetY: number;
}

// 공통 노란색 말풍선 이미지 주소 (101.webp)
const YELLOW_BUBBLE_URL = "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/101.webp";

export const GUIDE_STEPS: GuideStep[] = [
  // ==========================================
  // A. 메인 화면 가이드 시나리오 (Main UI Context)
  // ==========================================
  {
    step: 1,
    context: 'main',
    targetSelector: '#guide-chat-btn', // 우측 하단 채팅방 버튼
    message: ["가족과 함께",
              "채팅해요!",
              "엄마! 삼겹살",
              "사 왔어!",
              "우리딸, 상추없다!", 
              "여보! 저녁 메뉴는?",
              "장모님! 제가 샀어요!"],
    characterId: "1", // 1.webp (채소 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA", // 진한 토스 파란색
    characterSize: 55, // 0px -> 35px 등장
    bubbleWidth: 280,
    bubbleHeight:320,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력 
   
    align: 'top', // 대상 위에 표시
    offsetX: 0,
    offsetY: 70, // 위로 10px 이격
  },
  {
    step: 2,
    context: 'main',
    targetSelector: '#guide-menu-btn', // 좌측 상단 햄버거 메뉴
    message: ["닉네임을 저장",
              "냉장고 선택은 여기"],
    characterId: "2", // 2.webp (곡식 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 65,
    bubbleWidth: 270,
    bubbleHeight: 320,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'bottom', // 대상 아래에 표시
    offsetX: 0,
    offsetY: -30,
  },
  {
    step: 3,
    context: 'main',
    targetSelector: '#guide-scan-btn', // 냉장고가 비었을 때 화면 중앙 #guide-empty-state'
    message: ["텅 빈 냉장고\n요정들이 배고파요!",
              "아래 [+] 버튼으로", 
              "영수증 주세요",
              "슛하고 냉장고를\n가득 채워주세요! 🏀",
              "영수증 스캔 중에\n광고가 나와요"],
    characterId: "3", // 3.webp (육류 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 55,
    bubbleWidth: 320,
    bubbleHeight: 350,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
   
    align: 'top',
    offsetX: 0,
    offsetY: -20,
  },
  {
    step: 4,
    context: 'main',
    targetSelector: '#guide-home-btn', // 하단 홈 탭 아이콘
    message: ["어디 있든", "홈으로 와요"],
    characterId: "4", // 4.webp (수산 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 45,
    bubbleWidth: 250,
    bubbleHeight: 250,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'top',
    offsetX: 0,
    offsetY: -30,
  },
  {
    step: 5,
    context: 'main',
    targetSelector: '#guide-chef-btn', // 하단 요리사 탭 아이콘
    message: ["건강 레시피", 
              "확인해요"],
    characterId: "5", // 5.webp (과일 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 45,
    bubbleWidth: 250,
    bubbleHeight: 250,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'top',
    offsetX: 0,
    offsetY: -10,
  },
  {
    step: 6,
    context: 'main',
    targetSelector: '#guide-spanner-btn', // 우측 하단 플로팅 스패너 (TalkRoom)
    message: ["신고는 여기에",
              "후원해 주세요"],
    characterId: "6", // 6.webp (우유 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 50,
    bubbleWidth: 250,
    bubbleHeight: 300,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'top',
    offsetX: 30,
    offsetY: 50,
  },
  {
    step: 7,
    context: 'main',
    targetSelector: '#guide-shortcuts', // 상단 카테고리 단축 아이콘 영역
    message: ["클릭하면",
              "원하는 칸으로"],
    characterId: "7", // 7.webp(알 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 45,
    bubbleWidth: 250,
    bubbleHeight: 300,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
   
    align: 'top',
    offsetX: 0,
    offsetY: -15,
  },
  {
    step: 8,
    context: 'main',
    targetSelector: '#guide-swipe-area', // 메인 바디 스와이프 영역
    message: ["화면을 좌우로 넘겨서",
              "보관재료를 확인해요"],
    characterId: "8", // 8.webp(빵 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 55,
    bubbleWidth: 300,
    bubbleHeight: 300,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
   
    align: 'top',
    offsetX: 0,
    offsetY: -12,
  },

  // ==========================================
  // B. 채팅 흐름 가이드 시나리오 (Chat & Room Management Context)
  // ==========================================
  {
    step: 1,
    context: 'chat',
    targetSelector: '#guide-chat-menu-btn', // 대화방 우측 상단 햄버거 메뉴
    message: ["메뉴를 열어보세요"],
    characterId: "10", // 10.webp (샐러드 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 65,
    bubbleWidth: 250,
    bubbleHeight: 250,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'top',
    offsetX: 0,
    offsetY: 10,
  },
  {
    step: 2,
    context: 'chat',
    targetSelector: '#guide-chat-invite-btn', // 방관리 서랍 내 초대 버튼
    message: ["가족을 초대해요"],
    characterId: "10", // 10.webp (과자 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 65,
    bubbleWidth: 250,
    bubbleHeight: 250,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'bottom',
    offsetX: 0,
    offsetY: 10,
  },
{
    step: 3,
    context: 'chat',
    targetSelector: '#guide-chat-my-member-row', // 내 비밀 별칭 수정/저장 버튼
    message: ["이름을 수정해요"],
    characterId: "15", // 15.webp (탐정 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 55,
    bubbleWidth: 250,
    bubbleHeight: 250,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'bottom',
    offsetX: 0,
    offsetY: 10,
  },
  // ==========================================
  // C. 좌측 메뉴 서랍 가이드 시나리오 (Menu Drawer Context)
  // ==========================================
  {
    step: 1,
    context: 'menu',
    targetSelector: '#guide-menu-nickname-input', // 닉네임 입력란 및 기타 메뉴
    message: ["닉네임을",
              "수정하고 저장해요"],
    characterId: "11", // 11.webp(음료 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 55,
    bubbleWidth: 280,
    bubbleHeight:280,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'bottom',
    offsetX: 0,
    offsetY: 5,
  },

   {
    step: 2,
    context: 'menu',
    targetSelector: '#guide-menu-theme-btn', // 테마 토글 버튼 영역
    message: ["테마를", "변경할 수 있어요"],
    characterId: "11", // 11.webp(음료 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 55,
    bubbleWidth: 250,
    bubbleHeight:250,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'bottom',
    offsetX: 0,
    offsetY: 10,
  },
   {
    step: 3,
    context: 'menu',
    targetSelector: '#guide-menu-fridge-list-btn', // 냉장고 목록 관리 바로가기 버튼
    message: ["냉장고 목록을", 
               "확인해요"],
    characterId: "11", // 11.webp(음료 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 45,
    bubbleWidth: 230,
    bubbleHeight:230,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'bottom',
    offsetX: 0,
    offsetY: 10,
  },
  // ==========================================
  // D. 냉장고 목록 관리 가이드 시나리오 (Fridge List Context)
  // ==========================================
  {
    step: 1,
    context: 'fridge_list',
    targetSelector: '#guide-fridge-item-first', // 내가 만든 첫 번째 냉장고 아이템 행
    message: ["내 냉장고 이름을",
              "수정하고 삭제해요",
              "삭제하면 새 냉장고를",
              "다시 만들수 있어요"],
    characterId: "12", // 12.webp(간편식 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 55,
    bubbleWidth: 280,
    bubbleHeight: 280,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'bottom',
    offsetX: 0,
    offsetY: 12,
  },
 {
    step: 2,
    context: 'fridge_list',
    targetSelector: '#guide-fridge-item-first', // 내가 만든 첫 번째 냉장고 아이템 행
    message: ["냉장고는 1인 1개",
              "가족끼리 하나씩",
              "담당하고 초대해서", 
              "공유할 수 있어요."],
    characterId: "17", // 17.webp(조미 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 65,
    bubbleWidth: 320,
    bubbleHeight: 320,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'bottom',
    offsetX: 0,
    offsetY: 5,
  },
  // ==========================================
  // E. 식재료 상세 클릭 가이드 시나리오 (Main Body / Card Click Context)
  // ==========================================
  {
    step: 1,
    context: 'main_body',
    targetSelector: '.active-section .guide-food-card, .active-section .guide-food-card-placeholder', // 상품 카드가 있으면 카드를 지목, 없으면 빈 공간 플레이스홀더를 지목
    message: ["캐릭터를 클릭해요",
              "수량을 수정하고", 
              "저장해요",
              "다 먹은건 삭제해요"],
    characterId: "13", // 13.webp(반찬 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 55,
    bubbleWidth: 280,
    bubbleHeight: 280,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'top',
    offsetX: 0,
    offsetY: -55,
  },

  {
    step: 2,
    context: 'main_body',
    targetSelector: '.active-section #guide-food-add-btn', // 현재 활성화된 화면의 [+] 버튼만 명확히 지정
    message: ["[+]를 눌러서",
              "식품 상세를", 
              "직접 입력할 수 있어요"],
    characterId: "14", // 14.webp(냉동 요정)
    bubbleBgUrl: YELLOW_BUBBLE_URL,
    textColor: "#1B64DA",
    characterSize: 45,
    bubbleWidth: 280,
    bubbleHeight: 280,          // 이미지 제작이 1:1로 되어 가로방향 정상 출력
    
    align: 'top',
    offsetX: 0,
    offsetY: 150,
  }
];
