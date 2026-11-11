import { useState, useEffect } from "react";
import { MainUI } from "./ui/style";
import { ScanOnboardingPage } from "./pages/ScanOnboardingPage";
import { supabase } from "./utils/supabase";
import { safeLocalStorage } from "./utils/safe_storage";
import { isDevMode } from "./utils/safe_env";
import { syncTossAnonymousKey } from "./utils/toss_bridge";
import { useTranslation } from "react-i18next";

/**
 * 쿨박스 앱의 관제탑 (App Controller)
 * 로직(Pages)과 디자인(UI)을 연결하는 최종 관리자입니다.
 * [수정] 수파베이스 데이터 통신 로직을 제거하여, 앱 켜자마자 로딩 없이 화면이 뜨게 복구했습니다.
 */
function App() {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<'onboarding' | 'main'>('onboarding');
  const [scanStartStep, setScanStartStep] = useState<'starter' | 'options'>('starter');

  useEffect(() => {
    // [0단계] 초대 링크 파라미터 감지 및 주머니(로컬스토리지)에 보관 (온보딩 우회 없이 정상 진행)
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get('inviteGroupId');
    if (inviteId) {
      safeLocalStorage.setItem('coolbox_invite_group_id', inviteId);
    }

    // [1단계] 앱 진입 시 토스 유저 식별키 획득 및 DB 동기화 (백그라운드 비동기 실행)
    syncTossAnonymousKey();

    // 화면 블로킹 없이, 로컬 스토리지 확인만으로 0.1초 만에 화면을 띄웁니다.
    const hasFridge = safeLocalStorage.getItem('coolbox_has_fridge') === 'true';
    if (hasFridge) {
      if (inviteId) {
        // [신규 로직] 4. 자신의 냉장고가 있는 기존 유저 -> 챗방(초대한 유저의 메인)으로 진입 전 백그라운드 합류
        import('./utils/auth_engine').then(({ joinSharedFridgeDirectly }) => {
          joinSharedFridgeDirectly(inviteId).then((success) => {
            if (success) {
              safeLocalStorage.setItem('coolbox_active_group_id', inviteId);
              safeLocalStorage.removeItem('coolbox_invite_group_id');
            }
          });
        });
      }
      setCurrentView('main');
    } else {
      setCurrentView('onboarding');
      setScanStartStep('starter');
    }

    // WebView 푸시 알림 토큰 수신 리스너
    const handleWebViewMessage = async (event: any) => {
      try {
        let messageData;
        if (typeof event.data === 'string') {
          messageData = JSON.parse(event.data);
        } else {
          messageData = event.data;
        }

        if (messageData?.type === 'REGISTER_PUSH_TOKEN' && messageData?.token) {
          console.log("[WebView] 푸시 토큰 수신:", messageData.token);
          
          // 익명 로그인 또는 세션 확보
          const { data: { session } } = await supabase.auth.getSession();
          let curUserId = session?.user?.id;
          if (!curUserId) {
            const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();
            if (!signInError && authData.user) {
              curUserId = authData.user.id;
            }
          }

          if (curUserId) {
            // Supabase coolbox_user_push_tokens 에 업서트
            const { error } = await supabase
              .from('coolbox_user_push_tokens')
              .upsert({
                user_id: curUserId,
                expo_push_token: messageData.token
              }, { onConflict: 'expo_push_token' });
            
            if (error) {
              console.error("[WebView] 푸시 토큰 저장 실패:", error);
            } else {
              console.log("[WebView] 푸시 토큰 저장 성공!");
            }
          }
        }
      } catch (err) {
        // JSON 파싱 예외 등 방어 처리
      }
    };

    window.addEventListener('message', handleWebViewMessage);
    document.addEventListener('message', handleWebViewMessage as any);

    return () => {
      window.removeEventListener('message', handleWebViewMessage);
      document.removeEventListener('message', handleWebViewMessage as any);
    };
  }, []);

  // [개발자 전용] 초기화 함수
  const resetApp = async () => {
    try {
      // 1. 수파베이스 Auth 세션을 완전히 로그아웃 처리하여 캐시 클리어
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("SignOut during reset failed:", err);
    }

    // 2. 로컬 저장소(가이드 이력, 세션 등) 완전 리셋
    safeLocalStorage.clear();
    try {
      localStorage.clear();
    } catch (e) {}

    // 3. 페이지 새로고침 (새로운 익명 유저 ID 발급)
    window.location.reload();
  };

  // 온보딩 또는 스캔 완료 시 실행되는 최종 관문
  const handleFlowComplete = () => {
    safeLocalStorage.setItem('coolbox_has_fridge', 'true');
    setCurrentView('main');
  };

  return (
    <>
      {currentView === 'onboarding' ? (
        <div className="theme-dark app-container" style={{ backgroundColor: '#000' }}>
          <ScanOnboardingPage
             onComplete={handleFlowComplete}
             initialStep={scanStartStep}
          />
        </div>
      ) : (
        <div className="theme-light app-container" style={{ backgroundColor: 'var(--bg-app)' }}>
          <MainUI onStartScan={() => {
            setScanStartStep('options'); // 기존 유자는 바로 옵션창으로!
            setCurrentView('onboarding');
          }} />
        </div>
      )}

      {/* [개발자 전용] 플로팅 초기화 버튼 (우측 하단) */}
      {isDevMode() && (
        <button
          onClick={resetApp}
          style={{
            position: 'fixed', bottom: '110px', right: '20px', zIndex: 2000,
            padding: '8px 12px', backgroundColor: 'rgba(243, 102, 34, 0.6)',
            color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '10px',
            cursor: 'pointer', backdropFilter: 'blur(4px)'
          }}
        >
          {t('DEV_RESET', '개발용 초기화')}
        </button>
      )}
    </>
  );
}

export default App;
