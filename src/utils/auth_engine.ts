import { supabase } from "./supabase";
import { reportErrorToTelegram, reportEventToTelegram } from "./telegram_logger";
import { safeLocalStorage } from "./safe_storage";

/**
 * [핵심 로직] 익명 로그인 및 초기 냉장고 그룹("우리집 냉장고")을 생성하는 엔진
 * 이 로직은 앱 시작 시점이 아닌, 사용자가 "영수증 주세요"를 누르고 사진을 선택하는 첫 액션을 취했을 때만 백그라운드에서 조용히 동작합니다.
 */
export const createAnonymousSessionAndFridge = async () => {
  try {
    // 1. 현재 세션 확인 (이미 있는지)
    const { data: { session } } = await supabase.auth.getSession();
    let userId = session?.user?.id;

    // 2. 세션이 없다면 즉시 익명 로그인 처리
    if (!session) {
      const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
      userId = authData.user?.id;
    }

    if (!userId) throw new Error("유저 ID가 생성되지 않았어요.");

    // 3. 이미 소속된 냉장고 그룹이 있는지 확인
    const { data: memberData } = await supabase
      .from('coolbox_members')
      .select('group_id')
      .eq('user_id', userId)
      .limit(1);

    if (memberData && memberData.length > 0) return memberData[0].group_id;

    // 4. 소속된 곳이 없으면 새 그룹 '우리집 냉장고' 생성
    const { data: groupData, error: groupError } = await supabase
      .from('coolbox_groups')
      .insert({ name: '우리집 냉장고' })
      .select()
      .single();

    if (groupError) throw groupError;

    // 5. 유저를 방장으로 등록 시 식별키도 함께 저장
    const tossAnonymousKey = safeLocalStorage.getItem('toss_anonymous_key');

    const { error: joinError } = await supabase
      .from('coolbox_members')
      .insert({
        group_id: groupData.id,
        user_id: userId,
        role: 'owner',
        toss_anonymous_key: tossAnonymousKey || null
      });

    if (joinError) throw joinError;

    // [신규] 주머니에 초대장(티켓)이 있다면 초대받은 방에도 동시 가입 처리
    const inviteGroupId = safeLocalStorage.getItem('coolbox_invite_group_id');
    if (inviteGroupId) {
      const { error: joinInviteError } = await supabase.from('coolbox_members').insert({
        group_id: inviteGroupId,
        user_id: userId,
        role: 'member',
        toss_anonymous_key: tossAnonymousKey || null
      });

      if (!joinInviteError || joinInviteError.code === '23505') {
        // 초대받은 방을 메인에서 최우선으로 보여주기 위해 활성 방으로 세팅
        safeLocalStorage.setItem('coolbox_active_group_id', inviteGroupId);
        // 티켓 사용 완료 후 폐기
        safeLocalStorage.removeItem('coolbox_invite_group_id');
      } else {
        console.warn("초대받은 방 가입 실패:", joinInviteError);
        // 실패했으므로 가입되지 않은 것으로 보고, 자신이 만든 방을 활성 방으로 세팅
        safeLocalStorage.setItem('coolbox_active_group_id', groupData.id);
      }
    } else {
      // 초대받지 않은 순수 신규 유저는 자기가 방금 만든 방을 활성 방으로 세팅
      safeLocalStorage.setItem('coolbox_active_group_id', groupData.id);
    }

    return groupData.id;
  } catch (err) {
    console.error("Auth Engine Error (Using local fallback):", err);
    reportErrorToTelegram("익명아이디 발급 또는 냉장고 생성 불발", err);
    
    // 💻 오프라인/로컬 테스트용 강력한 Fallback 보장 (사용성 보존!)
    const fallbackId = "local_fridge_group_id";
    return fallbackId;
  }
};

/**
 * [핵심 로직] 냉장고 이름 변경 처리기
 */
export const updateFridgeName = async (groupId: string, newName: string) => {
  if (!groupId || !newName) return;
  const { error } = await supabase
    .from('coolbox_groups')
    .update({ name: newName })
    .eq('id', groupId);

  if (error) {
    console.error("냉장고 이름 업데이트 실패:", error);
    reportErrorToTelegram("냉장고 이름 변경 불발", error);
  }
};

/**
 * [신규] 개인정보 동의서 수파베이스 저장 처리기
 */
export const savePrivacyConsent = async (isAgreed: boolean = true) => {
  try {
    // 1. 현재 세션 확인 및 익명 세션 발급
    const { data: { session } } = await supabase.auth.getSession();
    let userId = session?.user?.id;

    if (!session) {
      const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
      userId = authData.user?.id;
    }

    if (!userId) throw new Error("유저 ID를 발급받지 못했어요.");

    // 2. 동의 내역 테이블에 순수 등록 (INSERT만 허용하는 사장님의 RLS 보안 정책과 100% 동기화)
    const { error } = await supabase
      .from('coolbox_privacy_consents')
      .insert({
        user_id: userId,
        consent_type: 'receipt_ocr',
        is_agreed: isAgreed
      });

    // 만약 동일 유저의 동의서가 이미 데이터베이스에 존재하여 중복 고유 키 제약 위반(23505)이 발생한 경우,
    // 이미 안전하게 기록이 확보되어 있다는 증빙이므로 성공으로 간주하고 부드럽게 통과시킵니다.
    if (error && error.code !== '23505') {
      throw error;
    }
    return userId;
  } catch (err) {
    console.error("savePrivacyConsent Error (Using local fallback):", err);
    reportErrorToTelegram("동의서 저장 중 오류 발생", err);
    
    // 💻 오프라인/로컬 테스트용 Fallback 유저 ID 반환 (사용성 보존!)
    return "local_user_id";
  }
};

/**
 * [신규] 초대 코드 생성 및 합류 (텔레그램 로깅 포함)
 */
export const createInviteCode = async (groupId: string) => {
  try {
    // 실제로는 토스 브릿지나 딥링크를 생성하는 로직
    // 임시 모의 로직
    const code = `COOL-${groupId.substring(0, 4).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;
    return code;
  } catch (err) {
    console.error("초대코드 생성 실패", err);
    reportErrorToTelegram("초대코드 (생성) 불발", err);
    return null;
  }
};

export const joinWithInviteCode = async (inviteCode: string, userId: string) => {
  try {
    // 임시 초대코드 검증 로직 (실제로는 DB 조회)
    if (!inviteCode || !inviteCode.startsWith('COOL-')) {
      throw new Error("유효하지 않은 초대코드에요.");
    }
    // 성공했다고 가정
    reportEventToTelegram("멤버 초대 합류했어요", `User ${userId} joined via ${inviteCode}`);
    return true;
  } catch (err) {
    console.error("초대코드 합류가 안돼요", err);
    reportErrorToTelegram("초대코드 (합류) 불발", err);
    return false;
  }
};

/**
 * [신규] 기존 유저 다이렉트 합류 처리기 (온보딩 및 방 개설 생략)
 */
export const joinSharedFridgeDirectly = async (groupId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return false;
    
    const tossAnonymousKey = safeLocalStorage.getItem('toss_anonymous_key');
    
    const { error } = await supabase.from('coolbox_members').insert({
      group_id: groupId,
      user_id: session.user.id,
      role: 'member',
      toss_anonymous_key: tossAnonymousKey || null
    });
    
    if (error && error.code !== '23505') throw error; // 이미 가입된 경우 무시
    
    return true;
  } catch (err) {
    console.error("기존 유저 다이렉트 합류 에러:", err);
    return false;
  }
};

/**
 * [신규] 토스 인가 코드(Authorization Code)를 서버(Edge Function)로 전송
 * 프론트 UI 로직이나 레이아웃(Safe Area)을 절대 건드리지 않고 백엔드 통신만 전담합니다.
 */
export const exchangeTossAuthCode = async (authorizationCode: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    console.log("[Auth Engine] 백엔드(toss-login)로 인가 코드 전달 시작...");
    const { data, error } = await supabase.functions.invoke('toss-login', {
      body: { authorizationCode }
    });

    if (error) {
      console.error("[Auth Engine] 백엔드 연동 에러:", error);
      return false;
    }
    
    console.log("[Auth Engine] 백엔드 연동 성공:", data);
    return true;
  } catch (err) {
    console.error("[Auth Engine] 예기치 않은 서버 연동 예외 발생:", err);
    return false;
  }
};
