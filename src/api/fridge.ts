import { supabase } from "../utils/supabase";
import { reportErrorToTelegram } from "../utils/telegram_logger";

/**
 * 🔍 기존 소속된 냉장고 그룹 ID가 있다면 최신 단일 ID를 반환하고, 없으면 생성합니다.
 */
export const getOrCreateFridgeGroup = async (userId: string) => {
  // 1. 유저가 이미 소속된 그룹이 있는지 확인
  const { data: memberData, error: memberError } = await supabase
    .from('coolbox_members')
    .select('group_id')
    .eq('user_id', userId)
    .limit(1);

  if (memberError) {
    reportErrorToTelegram("냉장고 멤버십 조회 실패", memberError);
  }
  if (memberData && memberData.length > 0) return memberData[0].group_id;

  // 2. 없으면 새 그룹 생성
  const { data: groupData, error: groupError } = await supabase
    .from('coolbox_groups')
    .insert({ name: '나만의 냉장고' })
    .select()
    .single();

  if (groupError) {
    reportErrorToTelegram("새 냉장고 그룹 생성 실패", groupError);
    throw groupError;
  }

  // 3. 유저를 그룹장으로 등록
  const { error: joinError } = await supabase
    .from('coolbox_members')
    .insert({
      group_id: groupData.id,
      user_id: userId,
      role: 'owner'
    });

  if (joinError) {
    reportErrorToTelegram("냉장고 그룹장 등록 실패", joinError);
    throw joinError;
  }

  return groupData.id;
};

/**
 * 📋 유저가 참여 중인 모든 냉장고 그룹(역할 포함) 목록을 조회합니다.
 */
export const fetchUserFridgeGroups = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('coolbox_members')
      .select(`
        group_id,
        role,
        custom_group_name,
        coolbox_groups (
          id,
          name,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (error) {
      reportErrorToTelegram("유저 냉장고 그룹 목록 조회 실패", error);
      return [];
    }

    if (!data) return [];

    return data.map((m: any) => ({
      id: m.coolbox_groups?.id,
      name: m.custom_group_name || m.coolbox_groups?.name || "이름 없는 냉장고",
      role: m.role,
      createdAt: m.coolbox_groups?.created_at
    })).filter(g => g.id); // null 방지
  } catch (err) {
    console.error("fetchUserFridgeGroups exception:", err);
    return [];
  }
};

/**
 * ➕ 사용자가 입력한 이름으로 새로운 냉장고 그룹을 생성하고 자신을 그룹장(owner)으로 설정합니다.
 */
export const createNewFridgeGroup = async (userId: string, name: string) => {
  try {
    const { data: groupData, error: groupError } = await supabase
      .from('coolbox_groups')
      .insert({ name })
      .select()
      .single();

    if (groupError) {
      reportErrorToTelegram("새 냉장고 그룹 생성 실패", groupError);
      throw groupError;
    }

    const { error: joinError } = await supabase
      .from('coolbox_members')
      .insert({
        group_id: groupData.id,
        user_id: userId,
        role: 'owner'
      });

    if (joinError) {
      reportErrorToTelegram("냉장고 그룹장 등록 실패", joinError);
      throw joinError;
    }

    return groupData;
  } catch (err) {
    console.error("createNewFridgeGroup exception:", err);
    throw err;
  }
};

/**
 * ❌ 냉장고 그룹을 삭제합니다. (그룹장 권한 검증 포함)
 */
export const deleteFridgeGroup = async (groupId: string, userId: string) => {
  try {
    // 1. 소유자(owner) 여부 확인
    const { data: memberData, error: memberError } = await supabase
      .from('coolbox_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (memberError || !memberData || memberData.role !== 'owner') {
      throw new Error("냉장고 소유자(그룹장)만 삭제할 수 있습니다.");
    }

    // 2. 하위 데이터 선행 삭제 (DB의 Cascade 설정 누락 방어 및 무조건 삭제 보장)
    await supabase.from('coolbox_members').delete().eq('group_id', groupId);
    await supabase.from('coolbox_messages').delete().eq('group_id', groupId);
    await supabase.from('coolbox_inventory').delete().eq('group_id', groupId);

    // 3. 그룹 최상위 삭제
    const { error } = await supabase
      .from('coolbox_groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      reportErrorToTelegram("냉장고 그룹 삭제 실패", error);
      throw error;
    }
    return true;
  } catch (err) {
    console.error("deleteFridgeGroup exception:", err);
    throw err;
  }
};

/**
 * 📋 냉장고 그룹에 소속된 모든 멤버 목록을 조회합니다.
 */
export const fetchGroupMembers = async (groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('coolbox_members')
      .select('id, user_id, nickname, role, joined_at')
      .eq('group_id', groupId)
      .order('role', { ascending: false }); // owner가 상단에 표시되도록 정렬

    if (error) {
      reportErrorToTelegram("그룹 멤버 목록 조회 실패", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("fetchGroupMembers exception:", err);
    return [];
  }
};

/**
 * ❌ [방장 전용] 특정 멤버를 냉장고 그룹에서 퇴출(강퇴)시킵니다.
 */
export const evictGroupMember = async (groupId: string, memberId: string, ownerUserId: string) => {
  try {
    // 1. 요청자가 진짜 방장(owner)인지 검증
    const { data: ownerCheck, error: checkError } = await supabase
      .from('coolbox_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', ownerUserId)
      .single();

    if (checkError || !ownerCheck || ownerCheck.role !== 'owner') {
      throw new Error("방장만 멤버를 내보낼 수 있습니다.");
    }

    // 2. 해당 멤버 삭제
    const { error } = await supabase
      .from('coolbox_members')
      .delete()
      .eq('id', memberId)
      .eq('group_id', groupId);

    if (error) {
      reportErrorToTelegram("그룹 멤버 강퇴 실패", error);
      throw error;
    }
    return true;
  } catch (err) {
    console.error("evictGroupMember exception:", err);
    throw err;
  }
};

/**
 * 🚪 멤버가 스스로 냉장고 그룹에서 탈퇴합니다. (방장은 탈퇴 불가, 삭제만 가능)
 */
export const leaveFridgeGroup = async (groupId: string, userId: string) => {
  try {
    const { data: memberCheck, error: checkError } = await supabase
      .from('coolbox_members')
      .select('id, role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (checkError || !memberCheck) {
      throw new Error("참여 중인 냉장고가 아닙니다.");
    }

    if (memberCheck.role === 'owner') {
      throw new Error("방장은 탈퇴할 수 없습니다. 대신 냉장고 목록 관리에서 냉장고를 삭제해 주세요.");
    }

    const { error } = await supabase
      .from('coolbox_members')
      .delete()
      .eq('id', memberCheck.id);

    if (error) {
      reportErrorToTelegram("그룹 탈퇴 실패", error);
      throw error;
    }
    return true;
  } catch (err) {
    console.error("leaveFridgeGroup exception:", err);
    throw err;
  }
};

/**
 * ✍️ 사용자의 닉네임을 가입된 모든 냉장고 멤버 정보에서 일괄 수정/저장합니다.
 */
export const updateUserGlobalNickname = async (userId: string, newNickname: string) => {
  try {
    const { error } = await supabase
      .from('coolbox_members')
      .update({ nickname: newNickname })
      .eq('user_id', userId);

    if (error) {
      reportErrorToTelegram("유저 글로벌 닉네임 일괄 변경 실패", error);
      throw error;
    }
    return true;
  } catch (err) {
    console.error("updateUserGlobalNickname exception:", err);
    throw err;
  }
};

/**
 * ✍️ [방장 전용] 냉장고 그룹의 공식 간판 이름을 전역으로 수정합니다.
 */
export const updateGlobalFridgeName = async (groupId: string, ownerUserId: string, newName: string) => {
  try {
    // 1. 요청자가 진짜 방장(owner)인지 검증
    const { data: ownerCheck, error: checkError } = await supabase
      .from('coolbox_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', ownerUserId)
      .single();

    if (checkError || !ownerCheck || ownerCheck.role !== 'owner') {
      throw new Error("방장만 냉장고의 공식 이름을 바꿀 수 있습니다.");
    }

    // 2. 그룹 테이블의 공식 이름 변경
    const { error } = await supabase
      .from('coolbox_groups')
      .update({ name: newName })
      .eq('id', groupId);

    if (error) {
      reportErrorToTelegram("냉장고 공식 이름 변경 실패", error);
      throw error;
    }
    return true;
  } catch (err) {
    console.error("updateGlobalFridgeName exception:", err);
    throw err;
  }
};

/**
 * ✍️ [회원 전용] 나만 보는 개별 냉장고 커스텀 이름(비밀 별칭)을 설정/수정합니다.
 */
export const updateCustomGroupName = async (groupId: string, userId: string, customName: string) => {
  try {
    const { error } = await supabase
      .from('coolbox_members')
      .update({ custom_group_name: customName || null }) // 비어있으면 기본 이름으로 초기화
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      reportErrorToTelegram("개인화 냉장고 이름 변경 실패", error);
      throw error;
    }
    return true;
  } catch (err) {
    console.error("updateCustomGroupName exception:", err);
    throw err;
  }
};

/**
 * 🤫 다른 멤버에 대한 나만 보는 비밀 별칭을 등록/수정/삭제합니다.
 */
export const upsertMemberPrivateAlias = async (userId: string, targetUserId: string, groupId: string, customAlias: string) => {
  try {
    if (!customAlias || customAlias.trim() === '') {
      // 별명이 비어 있으면 기존 비밀 별칭 삭제 (기본 닉네임으로 롤백)
      const { error } = await supabase
        .from('coolbox_member_aliases')
        .delete()
        .eq('user_id', userId)
        .eq('target_user_id', targetUserId)
        .eq('group_id', groupId);

      if (error) {
        reportErrorToTelegram("비밀 별칭 삭제 실패", error);
        throw error;
      }
      return null;
    }

    // 값이 존재하면 Upsert 수행
    const { data, error } = await supabase
      .from('coolbox_member_aliases')
      .upsert({
        user_id: userId,
        target_user_id: targetUserId,
        group_id: groupId,
        custom_alias: customAlias.trim()
      }, {
        onConflict: 'user_id,target_user_id,group_id'
      })
      .select()
      .single();

    if (error) {
      reportErrorToTelegram("비밀 별칭 upsert 실패", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error("upsertMemberPrivateAlias exception:", err);
    throw err;
  }
};

/**
 * 📋 특정 냉장고 내에서 설정한 나만 보는 비밀 별칭 목록을 전체 조회합니다.
 */
export const fetchMemberPrivateAliases = async (userId: string, groupId: string) => {
  try {
    const { data, error } = await supabase
      .from('coolbox_member_aliases')
      .select('target_user_id, custom_alias')
      .eq('user_id', userId)
      .eq('group_id', groupId);

    if (error) {
      reportErrorToTelegram("비밀 별칭 목록 조회 실패", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("fetchMemberPrivateAliases exception:", err);
    return [];
  }
};


