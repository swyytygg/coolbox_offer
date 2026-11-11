import { useState, useEffect } from "react";
import { COLORS, NAVIGATION, SAFE_AREA, APP_DIALOGS } from "./style/constants.ui";
import { TermsModal } from "./terms_modal.ui";
import { SFX } from "../utils/shooting_sfx";
import { supabase } from "../utils/supabase";
import { useDialog } from "./DialogProvider";
import { updateUserGlobalNickname } from "../api/fridge";
import { useTranslation } from "react-i18next";
import { safeLocalStorage } from "../utils/safe_storage";
import { GuideRenderer } from "./guide"; // 🚀 가이드 레이아웃 임포트

interface LeftUIProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFridgeList: () => void;
}

/**
 * 쿨박스 좌측 사이드 서랍 (Menu Drawer)
 * 수정 사항: 테마 토글 하단에 냉장고 목록 관리 바로가기 버튼 추가하여 구조 단순화
 */
export function LeftUI({ isOpen, onClose, onOpenFridgeList }: LeftUIProps) {
  const dialog = useDialog();
  const { t, i18n } = useTranslation();
  const [termType, setTermType] = useState<"terms" | "privacy" | null>(null);
  
  // 닉네임 입력 및 저장 상태
  const [nickname, setNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 라이트/다크모드 상태 관리 (시스템 기본 감지 및 로컬스토리지 저장 지원)
  const [isLight, setIsLight] = useState(() => {
    const stored = localStorage.getItem('coolbox_theme');
    if (stored) {
      return stored === 'light';
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isLight) {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('coolbox_theme', 'light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('coolbox_theme', 'dark');
    }
  }, [isLight]);

  // 서랍이 열릴 때 데이터베이스 또는 로컬스토리지에서 닉네임 로드
  useEffect(() => {
    const loadNickname = async () => {
      const localNick = localStorage.getItem('coolbox_user_nickname');
      if (localNick) {
        setNickname(localNick);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('coolbox_members')
          .select('nickname')
          .eq('user_id', session.user.id)
          .not('nickname', 'is', null)
          .limit(1);
          
        if (data && data.length > 0 && data[0].nickname) {
          setNickname(data[0].nickname);
          localStorage.setItem('coolbox_user_nickname', data[0].nickname);
        }
      }
    };
    if (isOpen) {
      loadNickname();
    }
  }, [isOpen]);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      await dialog.openAlert(APP_DIALOGS.NICKNAME_VALIDATION_ERROR);
      return;
    }

    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // 1. 데이터베이스 업데이트 (이 유저가 참여한 모든 냉장고 멤버 닉네임 일괄 변경)
      await updateUserGlobalNickname(session.user.id, nickname.trim());
      
      // 2. 로컬스토리지에 캐싱
      localStorage.setItem('coolbox_user_nickname', nickname.trim());
      
      SFX.playModify(); // 성공 효과음
      await dialog.openAlert(APP_DIALOGS.NICKNAME_SAVE_SUCCESS);
    } catch (err: any) {
      await dialog.openAlert(APP_DIALOGS.NICKNAME_SAVE_FAILURE(err.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* 서랍 본체 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '300px',
        backgroundColor: COLORS.BACKGROUND,
        borderRight: `1px solid ${COLORS.GREY_80}`,
        zIndex: 2000,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-out',
        padding: '24px',
        paddingTop: `calc(${SAFE_AREA.TOP} + 20px)`,
        paddingBottom: `calc(${SAFE_AREA.BOTTOM} + 25px)`,
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* 1. 닫기 버튼 (우측 상단) */}
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

        {/* 2. 회원 프로필 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: `2px solid ${COLORS.WHITE}`,
            backgroundColor: COLORS.BACKGROUND,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            👤
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <input
              type="text"
              placeholder={t("NICKNAME_SETTINGS", "닉네임 설정")}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              id="guide-menu-nickname-input" /* [미세조정: 온보딩 가이드 닉네임 입력 ID] */
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                border: `2px solid ${COLORS.WHITE}`,
                borderRadius: '12px',
                color: COLORS.WHITE,
                fontSize: '15px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSaveNickname}
              disabled={isSaving}
              style={{
                width: '100%',
                height: '40px',
                backgroundColor: COLORS.BLUE,
                color: COLORS.WHITE,
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                opacity: isSaving ? 0.7 : 1,
                transition: 'opacity 0.2s ease'
              }}
            >
              {isSaving ? t("SAVING", "저장 중...") : t("NICKNAME_SAVE", "닉네임 저장")}
            </button>
          </div>
        </div>

        {/* 2.5 화면 테마 스위처 (해와 달 모양 토글) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          backgroundColor: '#1C1C1E',
          borderRadius: '16px',
          marginTop: '20px',
          width: '100%',
          border: '1px solid transparent',
          transition: 'all 0.2s ease'
        }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: COLORS.GREY_80 }}>{t('THEME', '화면 테마')}</span>
          <div 
            onClick={() => setIsLight(!isLight)}
            id="guide-menu-theme-btn" /* [미세조정: 온보딩 가이드 테마 토글 ID] */
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: isLight ? '#E5E8EB' : '#2C2C2E',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '16px', transform: 'translateY(-1px)' }}>{isLight ? '☀️' : '🌙'}</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: isLight ? '#191F28' : '#FFFFFF' }}>
              {isLight ? t('THEME_LIGHT', '라이트') : t('THEME_DARK', '다크')}
            </span>
          </div>
        </div>

        {/* 2.6 언어 선택 스위처 (KO / EN 토글) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          backgroundColor: '#1C1C1E',
          borderRadius: '16px',
          marginTop: '12px',
          width: '100%',
          border: '1px solid transparent',
          transition: 'all 0.2s ease'
        }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: COLORS.GREY_80 }}>{t('LANGUAGE', '언어 / Language')}</span>
          <div 
            onClick={() => {
              const nextLng = i18n.language.startsWith("ko") ? "en" : "ko";
              i18n.changeLanguage(nextLng);
              safeLocalStorage.setItem("coolbox_language", nextLng);
              SFX.playDetails();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: isLight ? '#E5E8EB' : '#2C2C2E',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '16px', transform: 'translateY(-1px)' }}>🌐</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: isLight ? '#191F28' : '#FFFFFF' }}>
              {i18n.language.startsWith("ko") ? "한국어" : "English"}
            </span>
          </div>
        </div>

        {/* 2.75 냉장고 목록 관리 바로가기 버튼 */}
        <div 
          onClick={() => {
            SFX.playDetails();
            onOpenFridgeList();
          }}
          id="guide-menu-fridge-list-btn" /* [미세조정: 온보딩 가이드 냉장고 목록 가기 ID] */
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: '#1C1C1E',
            borderRadius: '16px',
            marginTop: '12px',
            width: '100%',
            border: '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: COLORS.GREY_80 }}>{t('MANAGE_FRIDGES', '냉장고 목록 관리')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: COLORS.BLUE }}>{t('GO_TO', '이동하기')}</span>
            <span style={{ fontSize: '14px', color: COLORS.BLUE }}>&gt;</span>
          </div>
        </div>

        {/* 빈 유연 영역으로 하단 요소를 바닥으로 밀어냄 */}
        <div style={{ flex: 1 }} />

        {/* 4. 약관 및 로그아웃 영역 (정확한 20px 마진 탑 구성) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* 약관 및 정책 링크 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '13px',
            color: COLORS.GREY_80,
          }}>
            <span
              onClick={() => {
                SFX.playDetails();
                setTermType('terms');
              }}
              style={{ color: COLORS.GREY_80, textDecoration: 'none', cursor: 'pointer' }}
            >
              {t('TERMS_OF_USE', '이용약관')}
            </span>
            <span style={{ color: '#444' }}>|</span>
            <span
              onClick={() => {
                SFX.playDetails();
                setTermType('privacy');
              }}
              style={{ color: COLORS.GREY_80, textDecoration: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {t('PRIVACY_POLICY', '개인정보처리방침')}
            </span>
          </div>

          <div style={{ height: '20px' }} />

          {/* 로그아웃 버튼 */}
          <button
            onClick={async () => {
              SFX.playDetails();
              const isConfirmed = await dialog.openConfirm(APP_DIALOGS.LOGOUT_CONFIRM);
              if (isConfirmed) {
                try {
                  await supabase.auth.signOut();
                  localStorage.clear();
                  window.location.reload();
                } catch (err) {
                  await dialog.openAlert(APP_DIALOGS.LOGOUT_FAILURE);
                }
              }
            }}
            style={{
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              border: `2px solid ${isLight ? '#191F28' : COLORS.WHITE}`,
              borderRadius: '12px',
              cursor: 'pointer',
              color: isLight ? '#191F28' : COLORS.WHITE,
              backgroundColor: 'transparent',
              fontSize: '15px',
              fontWeight: 'bold'
            }}
          >
            {t('LOGOUT', '로그아웃')} 
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 8L21 12M21 12L17 16M21 12H9M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 배경 흐림 및 반투명 차단 레이어 (zIndex: 1999) */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1999
          }}
        />
      )}

      {/* 📜 이용약관 / 개인정보처리방침 인앱(Toss 미니앱 전용) 뷰어 장착 */}
      <TermsModal
        isOpen={termType !== null}
        type={termType}
        onClose={() => setTermType(null)}
      />

      {/* 🚀 가이드 레이아웃 설치 (첫 1회 자동 실행)  "지속 테스트 가능 코드 forceShow={true}"*/}
      {isOpen && <GuideRenderer context="menu" />}
    </>
  );
}
