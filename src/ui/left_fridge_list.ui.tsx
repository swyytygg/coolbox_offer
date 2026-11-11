import { useState, useEffect, useRef } from "react";
import { COLORS, NAVIGATION, SAFE_AREA, APP_DIALOGS } from "./style/constants.ui";
import { SFX } from "../utils/shooting_sfx";
import { supabase } from "../utils/supabase";
import { fetchUserFridgeGroups, createNewFridgeGroup, deleteFridgeGroup, updateCustomGroupName, updateGlobalFridgeName } from "../api/fridge";
import { useDialog } from "./DialogProvider";
import { useTranslation } from "react-i18next";
import { GuideRenderer } from "./guide"; // 🚀 가이드 레이아웃 임포트

interface LeftFridgeListProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroupId: string | null;
  onSwitchGroup: (groupId: string) => void;
  onRefreshFridgeName?: () => void;
}

export function LeftFridgeList({ isOpen, onClose, currentGroupId, onSwitchGroup, onRefreshFridgeName }: LeftFridgeListProps) {
  const { t } = useTranslation();
  const dialog = useDialog();
  const [userId, setUserId] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [newFridgeName, setNewFridgeName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; groupId: string; currentName: string; value: string; role: string } | null>(null);

  // 냉장고 목록 조회 로직
  const loadGroups = async (uid: string) => {
    const userGroups = await fetchUserFridgeGroups(uid);
    setGroups(userGroups);
  };

  useEffect(() => {
    const getSessionAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await loadGroups(session.user.id);
      }
    };
    if (isOpen) {
      getSessionAndLoad();
    }
  }, [isOpen]);

  const handleCreateFridge = async () => {
    if (!newFridgeName.trim() || !userId || isCreatingRef.current) return;

    isCreatingRef.current = true;
    setIsCreating(true);

    // ⭐ [비즈니스 정책] 일반 회원은 직접 생성(소유)하는 냉장고 개수를 최대 1개로 제한
    const ownedCount = groups.filter(g => g.role === 'owner').length;
    if (ownedCount >= 1) {
      await dialog.openAlert(APP_DIALOGS.FRIDGE_LIMIT);
      isCreatingRef.current = false;
      setIsCreating(false);
      return;
    }

    try {
      SFX.playAdd();
      await createNewFridgeGroup(userId, newFridgeName.trim());
      setNewFridgeName("");
      await loadGroups(userId);
    } catch (err) {
      await dialog.openAlert(APP_DIALOGS.FRIDGE_CREATE_FAILURE);
    } finally {
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  };

  const handleDeleteFridge = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 냉장고 전환 방지
    if (!userId) return;

    const isConfirmed = await dialog.openConfirm(APP_DIALOGS.FRIDGE_DELETE_CONFIRM);
    if (!isConfirmed) return;

    try {
      SFX.playConsume();
      await deleteFridgeGroup(groupId, userId);
      await loadGroups(userId);

      // 만약 활성 냉장고를 지웠다면 다른 그룹으로 즉시 스위칭
      if (groupId === currentGroupId) {
        const remaining = groups.filter(g => g.id !== groupId);
        if (remaining.length > 0) {
          onSwitchGroup(remaining[0].id);
        }
      }
    } catch (err: any) {
      await dialog.openAlert(APP_DIALOGS.FRIDGE_DELETE_FAILURE(err.message));
    }
  };

  const handleRenameFridge = (groupId: string, currentName: string, role: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 냉장고 전환 방지
    if (!userId) return;
    setRenameModal({
      isOpen: true,
      groupId,
      currentName,
      value: currentName,
      role
    });
  };

  const renderFridgeItem = (group: any) => {
    const isActive = group.id === currentGroupId;
    const isOwner = group.role === 'owner';
    const isFirstItem = groups[0]?.id === group.id;

    return (
      <div
        key={group.id}
        onClick={() => {
          if (isActive) return;
          SFX.playDetails();
          onSwitchGroup(group.id);
        }}
        id={isFirstItem ? "guide-fridge-item-first" : undefined} /* [미세조정: 온보딩 가이드 첫 번째 냉장고 아이템 ID] */
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: isActive ? 'rgba(49, 130, 246, 0.12)' : '#1C1C1E',
          border: isActive ? `1.5px solid ${COLORS.BLUE}` : `1px solid ${COLORS.BORDER}`,
          cursor: isActive ? 'default' : 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
          <span style={{
            fontSize: '15px',
            fontWeight: isActive ? 'bold' : 'normal',
            color: isActive ? COLORS.BLUE : COLORS.WHITE,
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textAlign: 'left'
          }}>
            {group.name}
          </span>
          <span
            onClick={(e) => handleRenameFridge(group.id, group.name, group.role, e)}
            style={{ 
              fontSize: '12px', 
              cursor: 'pointer', 
              opacity: 0.6, 
              padding: '2px 6px', 
              borderRadius: '6px', 
              backgroundColor: '#2C2C2E',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={t("RENAME", "이름 변경")}
          >
            ✏️
          </span>
        </div>
        
        {isOwner ? (
          <button
            onClick={(e) => handleDeleteFridge(group.id, e)}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.ORANGE,
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            －
          </button>
        ) : (
          <span style={{ fontSize: '11px', color: COLORS.GREY_50 }}>{t("MEMBER", "멤버")}</span>
        )}
      </div>
    );
  };

  const ownedGroups = groups.filter(g => g.role === 'owner');
  const joinedGroups = groups.filter(g => g.role !== 'owner');

  return (
    <>
      {/* 서랍 본체 (zIndex: 2100으로 왼쪽 메인 메뉴 위에 얹힘) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '300px',
        backgroundColor: COLORS.BACKGROUND,
        borderRight: `1px solid ${COLORS.GREY_80}`,
        zIndex: 2100,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-out',
        padding: '24px',
        paddingTop: `calc(${SAFE_AREA.TOP} + 20px)`,
        paddingBottom: `calc(${SAFE_AREA.BOTTOM} + 25px)`,
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* 1. 닫기 버튼 (뒤로가기 < 아이콘) */}
        <div
          onClick={onClose}
          style={{
            color: NAVIGATION.BACK_ICON_COLOR,
            fontSize: '24px',
            cursor: 'pointer',
            marginBottom: '20px',
            textAlign: 'right'
          }}
        >
          &lt;
        </div>

        {/* 2. 타이틀 */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: COLORS.WHITE, 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <img 
              src="https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/logo.png" 
              alt="logo" 
              style={{ height: '22px', width: 'auto', objectFit: 'contain' }} 
            />
            {t("MANAGE_FRIDGES", "냉장고 목록 관리")}
          </h2>
          <p style={{ fontSize: '13px', color: COLORS.GREY_80, margin: '4px 0 0 0' }}>{t("MANAGE_FRIDGES_DESC", "가족과 함께 쓸 냉장고를 만들고 관리하세요")}</p>
        </div>

        {/* 3. 새 냉장고 생성 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.GREY_80, paddingLeft: '4px' }}>{t("CREATE_NEW_FRIDGE", "➕ 새 냉장고 만들기")}</span>
          <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder={t("NEW_FRIDGE_NAME_PLACEHOLDER", "새 냉장고 이름")}
              value={newFridgeName}
              onChange={(e) => setNewFridgeName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFridge()}
              style={{ 
                width: '200px', // 가로 너비를 150px로 컴팩트하게 제한!
                height: '40px',
                padding: '0 14px',
                backgroundColor: '#2C2C2E',
                border: `1px solid ${COLORS.BORDER}`,
                borderRadius: '10px',
                color: COLORS.WHITE,
                fontSize: '15px',
                outline: 'none'
              }}
            />
            <button 
              onClick={handleCreateFridge}
              disabled={isCreating}
              style={{ 
                background: COLORS.BLUE,
                color: COLORS.WHITE,
                border: 'none',
                width: '40px', 
                height: '40px', 
                borderRadius: '10px',
                fontSize: '30px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: isCreating ? 0.6 : 1,
                transition: 'opacity 0.2s ease',
                marginRight: '5px' // 폭을 줄이고 우측에 안정적인 30~40px 마진 여백 확보
              }}
            >
              +
            </button>
          </div>
        </div>

        <div style={{ height: '24px' }} />

        {/* 4. 참여 중인 냉장고 목록 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minHeight: 0 }}>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 'bold', 
            color: COLORS.GREY_80, 
            paddingLeft: '4px', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <img 
              src="https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/logo.png" 
              alt="logo" 
              style={{ height: '14px', width: 'auto', objectFit: 'contain' }} 
            />
            {t("JOINED_FRIDGES_LABEL", "참여 중인 냉장고")} ({groups.length})
          </span>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
            {/* 👑 내가 만든 냉장고 섹션 */}
            {ownedGroups.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.ACCENT, paddingLeft: '4px', letterSpacing: '0.5px' }}>{t("OWNED_FRIDGES", "👑 내가 만든 냉장고")}</span>
                {ownedGroups.map((group) => renderFridgeItem(group))}
              </div>
            )}

            {/* 👥 공유받은 냉장고 섹션 */}
            {joinedGroups.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.BLUE, paddingLeft: '4px', letterSpacing: '0.5px' }}>{t("SHARED_FRIDGES", "👥 공유받은 냉장고")}</span>
                {joinedGroups.map((group) => renderFridgeItem(group))}
              </div>
            )}
          </div>
        </div>

        {/* 빈 유연 영역으로 하단 요소를 바닥으로 밀어냄 */}
        <div style={{ flex: 1 }} />
      </div>

      {/* 배경 흐림 및 반투명 차단 레이어 (zIndex: 2099) */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 2099
          }}
        />
      )}

      {/* ✏️ 냉장고 비밀 이름 변경용 프리미엄 토스 스타일 모달 */}
      {renameModal && renameModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '24px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '320px',
            backgroundColor: COLORS.CARD,
            border: `1.5px solid ${COLORS.BORDER}`,
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'scaleUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.WHITE }}>
                {renameModal.role === 'owner' ? t("RENAME_GLOBAL_TITLE", "냉장고 공식 이름 설정") : t("RENAME_CUSTOM_TITLE", "나만 볼 냉장고 이름 설정")}
              </span>
              <span style={{ fontSize: '13px', color: COLORS.GREY_80, whiteSpace: 'pre-wrap' }}>
                {renameModal.role === 'owner'
                  ? t("RENAME_GLOBAL_DESC", "모든 참가자에게 동일하게 보여질\n공식 냉장고 간판을 달아주세요!")
                  : t("RENAME_CUSTOM_DESC", "방장의 냉장고 이름과 내 것이 헷갈릴 때, 나만 다르게 볼 이름을 지어주세요!")}
              </span>
            </div>

            <input
              type="text"
              value={renameModal.value}
              onChange={(e) => setRenameModal({ ...renameModal, value: e.target.value })}
              placeholder={t("INPUT_FRIDGE_NAME_PLACEHOLDER", "냉장고 이름을 지어주세요")}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: COLORS.BACKGROUND,
                border: `1.5px solid ${COLORS.BORDER}`,
                borderRadius: '14px',
                color: COLORS.WHITE,
                fontSize: '15px',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setRenameModal(null)}
                style={{
                  flex: 1,
                  height: '48px',
                  backgroundColor: 'transparent',
                  color: COLORS.GREY_80,
                  border: `1.5px solid ${COLORS.BORDER}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t("CANCEL")}
              </button>
              <button
                onClick={async () => {
                  try {
                    if (renameModal.role === 'owner') {
                      await updateGlobalFridgeName(renameModal.groupId, userId!, renameModal.value.trim());
                    } else {
                      await updateCustomGroupName(renameModal.groupId, userId!, renameModal.value.trim());
                    }
                    await loadGroups(userId!);
                    SFX.playModify();
                    if (onRefreshFridgeName) {
                      onRefreshFridgeName();
                    }
                    setRenameModal(null);
                  } catch (err: any) {
                    await dialog.openAlert(APP_DIALOGS.FRIDGE_RENAME_FAILURE(err.message));
                  }
                }}
                style={{
                  flex: 1,
                  height: '48px',
                  backgroundColor: COLORS.BLUE,
                  color: COLORS.WHITE,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t("SAVE")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 가이드 레이아웃 설치 (첫 1회 자동 실행)  "지속 테스트 가능 코드 forceShow={true}" */}
      {isOpen && <GuideRenderer context="fridge_list" />}
    </>
  );
}
