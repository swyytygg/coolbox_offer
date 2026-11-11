import { useState, useEffect } from "react";
import {
  StarterMain,
  ScanOpen,
  ScanningEffect,
  ScanItem,
  SlamDunk,
  LoginNudge,
  PersonalConsent
} from "../ui/style";
// [수정] 수파베이스 냉장고 이름 변경 및 익명 로그인 유틸 추가 연동, 동의서 수파베이스 저장 함수 추가
import { createAnonymousSessionAndFridge, updateFridgeName, savePrivacyConsent } from "../utils/auth_engine";
import { checkScanLimitAllowed, incrementScanLimit, getWeekStartDate } from "../utils/scan_limit";
import { processReceiptImage } from "../utils/ocr_engine";
import { triggerHaptic, triggerReceiptReward } from "../utils/toss_bridge";
import { reportErrorToTelegram } from "../utils/telegram_logger";
import { supabase } from "../utils/supabase";
// AnimatePresence 제거: 토스 웹뷰 렌더링 락 방지, 각 컴포넌트가 자체 CSS transition 사용

import { safeLocalStorage } from "../utils/safe_storage";
// Base64 문자열을 HTML5 File 객체로 안전하게 변환하는 헬퍼 유틸리티
const base64ToFile = (base64: string, filename: string): File => {
  let base64WithHeader = base64;
  if (!base64.startsWith("data:")) {
    base64WithHeader = `data:image/jpeg;base64,${base64}`;
  }
  const arr = base64WithHeader.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

interface ScanOnboardingPageProps {
  onComplete: () => void;
  initialStep?: 'starter' | 'options';
}

/**
 * ScanOnboardingPage - 온보딩 스캔 흐름의 로직 컨테이너
 */
export function ScanOnboardingPage({ onComplete, initialStep = 'starter' }: ScanOnboardingPageProps) {
  const [step, setStep] = useState<'starter' | 'consent' | 'options' | 'scanning' | 'review' | 'slamdunk'>(initialStep);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // OCR 처리를 위한 파일 저장
  const [rawOcrMeta, setRawOcrMeta] = useState<any>(null); // AI 학습용 수집을 위한 메타데이터 보존
  const [rawOcrItems, setRawOcrItems] = useState<any>(null); // AI 학습용 수집을 위한 원본 아이템 보존
  const [onboardingType, setOnboardingType] = useState<'receipt' | 'demo' | null>(null); // 가입 경로 판별용 상태

  const isExistingUser = safeLocalStorage.getItem('coolbox_has_fridge') === 'true';

  // 통합 로그인 넛지 모드 상태 관리
  const [nudgeMode, setNudgeMode] = useState<'unlimited' | 'reward' | 'point' | null>(null);

  useEffect(() => {
    // [버그 픽스] 팝업을 닫은 직후 새로고침이나 뒤로가기 등으로 스캔을 끝까지 마치지 못하면, 
    // 무시 플래그가 로컬 스토리지에 영구 고착되어 팝업이 다시는 뜨지 않는 치명적인 버그를 해결합니다.
    safeLocalStorage.removeItem('coolbox_nudge_dismissed_this_scan');

    // [버그 픽스] 기존 유저가 앱 진입 시 카메라창(options)으로 직행할 때, 렌더링 전에 한도 검사 수행 (깜빡임 방지)
    if (isExistingUser && initialStep === 'options') {
      const limitCheck = checkScanLimitAllowed();
      if (!limitCheck.allowed || limitCheck.needsLoginNudge) {
        setStep('starter');
        setNudgeMode(limitCheck.nudgeMode);
      }
    }
  }, [isExistingUser, initialStep]);

  // 단계 변경 및 스캔 한도/로그인 넛지 선제 가로채기
  useEffect(() => {
    console.log(`[Scan Step] ${step}`);

    if (step === 'options') {
      const limitCheck = checkScanLimitAllowed();

      if (!limitCheck.allowed || limitCheck.needsLoginNudge) {
        setStep('starter'); // ◀ 카메라 서랍 즉시 언마운트 (칠흑 같은 검은 배경 확보)
        setNudgeMode(limitCheck.nudgeMode);
      }
    }
  }, [step]);

  const handleDemoExperience = async () => {
    try {
      console.log("[Demo] 영수증 없이 가상 체험 온보딩 게임 전체 흐름 시작...");

      // [의도 반영] 영수증이 없는 유저도 최종 확인 버튼을 누를 때까지 세션/냉장고 ID 개설을 철저히 유보합니다. (조기 세션 발급 코드 제거)

      // 2. 가상 체험용 5종 피규어 선수단 준비 (채소, 생선, 과자, 육류, 딸기)
      // DB Insert 충돌(Update로 오인)을 막기 위해 고정 id 부여를 삭제합니다.
      const demoItems = [
        {
          id: "90001",
          name: "가상 채소",
          imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/1.webp", // 1. 채소
          location: "신선",
          quantity: 1,
          expiryDays: 3,
          daysLeft: 3
        },
        {
          id: "90002",
          name: "가상 생선",
          imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/4.webp", // 2. 생선 (수산물)
          location: "냉장",
          quantity: 1,
          expiryDays: 2,
          daysLeft: 2
        },
        {
          id: "90003",
          name: "가상 과자",
          imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/10.webp", // 3. 과자
          location: "실외",
          quantity: 1,
          expiryDays: 30,
          daysLeft: 30
        },
        {
          id: "90004",
          name: "가상 고기",
          imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/3.webp", // 4. 육류
          location: "신선",
          quantity: 1,
          expiryDays: 1,
          daysLeft: 1
        },
        {
          id: "90005",
          name: "가상 과일",
          imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/5.webp", // 5. 딸기
          location: "신선",
          quantity: 1,
          expiryDays: 0,
          daysLeft: 0
        }
      ];

      setScannedItems(demoItems);
      setSelectedFile(null); // 영수증 없는 가상 체험이므로 파일은 null로 설정 (ScanningEffect의 즉각 완료 보증)

      // 3. 스캐닝 찌릿찌릿 효과 진입!
      setStep('scanning');
    } catch (err) {
      console.error("[Demo] 체험하기 흐름 처리 오류:", err);
    }
  };

  const handleStarterNext = () => {
    // [의도 반영] 영수증 주세요 클릭 시 동의서 단계로 전환합니다. (StarterMain 언마운트)
    setOnboardingType('receipt');
    setStep('consent');
  };

  const handleDemoClick = () => {
    // 영수증 없이 체험하기 클릭 시에도 동일하게 동의서 단계로 유도합니다.
    setOnboardingType('demo');
    setStep('consent');
  };

  const handleConsentAgree = () => {
    // 🔒 [한도 사전 검사] 동의 후 다음 단계로 넘어가기 직전에 먼저 한도를 분석합니다.
    if (isExistingUser) {
      const limitCheck = checkScanLimitAllowed();
      if (!limitCheck.allowed || limitCheck.needsLoginNudge) {
        setStep('starter'); // 홈 단계로 고정하여 카메라창(options) 렌더링을 차단!
        setNudgeMode(limitCheck.nudgeMode);
        return;
      }
    }
    // 동의서가 수락되면 즉시 로컬(유저의 폰)에만 임시 기록하고 가입 경로에 맞춰 분기 처리합니다.
    safeLocalStorage.setItem('coolbox_privacy_agreed', 'true');

    if (onboardingType === 'demo') {
      handleDemoExperience();
    } else {
      setStep('options');
    }
  };

  const handleConsentDecline = () => {
    setStep('starter');
  };

  const handleDirectBase64 = (base64Str: string) => {
    try {
      const file = base64ToFile(base64Str, "receipt.jpg");
      console.log("[Toss Bridge] 네이티브 사진 변환 및 로드 완료:", file.name);
      setSelectedFile(file);
      setStep('scanning'); // ◀ 지연 없이 즉시 스캔 이펙트로 이동
    } catch (error) {
      console.error("[Toss Bridge] 사진 변환 및 상태 지정 중 에러:", error);
    }
  };

  // [의도 반영] 영수증 주세요 미연동에 따른 handlePrivacyAgree 함수 삭제 (Warning 제거)

  const handleFileChange = async (file: File) => {
    console.log("파일 선택 완료:", file.name);
    setSelectedFile(file); // 선택된 파일을 상태에 저장
    setStep('scanning'); // ◀ 지연 없이 즉시 스캔 이펙트로 이동
  };

  return (
    <div className="force-dark" style={{ width: '100%', height: '100%' }}>
      {/* 단계별 UI */}
      {step === 'starter' && !nudgeMode && (
        <StarterMain onNext={handleStarterNext} onDemo={handleDemoClick} />
      )}

      {step === 'consent' && (
        <PersonalConsent
          isOpen={true}
          onAgree={handleConsentAgree}
          onDecline={handleConsentDecline}
        />
      )}

      {step === 'options' && (
        <ScanOpen
          isOpen={true}
          onFileSelected={handleFileChange}
          onBase64Selected={handleDirectBase64}
          onCancel={() => {
            if (isExistingUser) {
              console.log("기존 유저 취소 -> 메인 화면 즉시 이동");
              onComplete();
            } else {
              console.log("신규 유저 취소 -> starter 로비 이동");
              setStep('starter');
            }
          }}
        />
      )}

      {step === 'scanning' && (
        <ScanningEffect
          isOpen={true}
          isNewUser={!isExistingUser}
          onComplete={async () => {
            if (!selectedFile) {
              setStep('review');
              return;
            }

            // 영수증 OCR 분석 및 마스터데이터 매핑 시작
            const result = await processReceiptImage(selectedFile);

            // 화면용 데이터(UI display items)를 스캔 리스트에 세팅
            setScannedItems(result.uiDisplayItems);

            // 유저가 확인 버튼을 누를 때 consumer_intelligence에 적재하기 위해 원본 보존
            setRawOcrMeta(result.rawMetaData);
            setRawOcrItems(result.rawItems);

            // 스캔 완료 성공 진동 피드백 제공
            triggerHaptic('success');

            setStep('review');
          }}
        />
      )}

      {step === 'review' && (
        <ScanItem
          initialItems={scannedItems}
          hasFridge={isExistingUser}
          onConfirm={async (items, customFridgeName) => {
            try {
              // 👉 [3단계 추가] 영수증 등록 버튼 클릭 즉시 토스 포인트 지급 콜백 실행
              triggerReceiptReward();

              // [의도 반영: 만남의 광장 최종 통합 저장 처리기]
              // 1. 유저가 확인 버튼을 마침내 클릭하는 이 낙장불입의 시점에 익명 세션과 진짜 냉장고 그룹을 수파베이스에 일괄 개설 및 동기화합니다.
              console.log("[Onboarding] '확인했어요' 버튼 클릭 감증 -> 백그라운드 익명 가입 및 냉장고 정식 등록 시작...");

              const gid = await createAnonymousSessionAndFridge();
              if (!gid) {
                alert("냉장고 개설 중 시스템 오류가 발생했어요. 다시 시도해 주세요.");
                return;
              }

              // 2. 입력 창에 적은 예쁜 냉장고 이름을 새 그룹에 업데이트 동기화
              if (customFridgeName && customFridgeName !== "우리집 냉장고") {
                await updateFridgeName(gid, customFridgeName)
              }


              // 3. [최종 동의서 수파베이스 등록] 이 낙장불입 확인 단계에서 동의서를 비로소 수파베이스 DB에 기록 보존합니다.
              if (!isExistingUser) {
                await savePrivacyConsent(true);
              }


              // 4. 발급된 Refrigerator ID를 로깅 처리
              console.log("[Onboarding] 발급된 Refrigerator ID:", gid);

              // 5. 유저의 수집동의(Privacy Consent)를 최종 완성 상태로 로컬에 영구 보존
              safeLocalStorage.setItem('coolbox_privacy_agreed', 'true');

              // 📅 [핵심 보완] 냉장고 개설 주차 시작일 저장 (1주차 신규 혜택 보장 및 2주차 이탈 방지 기둥 형성)
              const currentWeekStart = getWeekStartDate();
              safeLocalStorage.setItem('coolbox_fridge_created_week', currentWeekStart);

              console.log("[Onboarding] 세션/냉장고 생성 및 동의 완료! Group ID:", gid);

              // 6. [AI 학습용 지식창고 적재] 영수증 스캔 전체 텍스트 원본 및 유저의 최종 컨펌 결과를 consumer_intelligence에 로깅
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id;

                await supabase.from('consumer_intelligence').insert({
                  user_id: userId || null,
                  store_name: rawOcrMeta?.storeName || null,
                  purchase_date: rawOcrMeta?.purchaseDate || null,
                  trace_id: `TRC-${Date.now()}`,
                  raw_ocr_json: { meta: rawOcrMeta, items: rawOcrItems },
                  confirmed_items: items, // 유저가 최종적으로 수정/승인한 식재료 배열
                  metadata: { source: "vision_agent", is_delivery: rawOcrMeta?.isDelivery },
                  image_url: null // WebP 이미지 업로드는 생략하고 완전히 버림
                });
                console.log("[Onboarding] AI 지식창고(consumer_intelligence) 적재 성공");
              } catch (logErr) {
                console.error("[Onboarding] AI 지식창고 적재 중 에러 발생 (스캔 흐름은 방해하지 않음):", logErr);
              }

              setScannedItems(items);
              setStep('slamdunk');
            } catch (err) {
              console.error("확인 프로세스 오류:", err);
              reportErrorToTelegram("온보딩 냉장고 등록 최종 확인 프로세스 오류", err);
              alert("냉장고를 등록하는 과정에서 오류가 발생했어요. 잠시 후 다시 확인해 주세요.");
            }
          }}
          onCancel={() => {
            if (isExistingUser) {
              console.log("기존 유저 취소 -> 메인 화면 즉시 이동");
              onComplete();
            } else {
              console.log("신규 유저 취소 -> 영수증 주기 options 체험 루프 이동");
              setStep('options');
            }
          }}
        />
      )}

      {step === 'slamdunk' && (
        <SlamDunk
          onComplete={() => {
            incrementScanLimit(); // 🏀 슬램던크 성공 골인 시점에만 최종 1회 충전 카운팅!!
            onComplete();
          }}
          items={scannedItems}
        />
      )}

      {/* 통합 로그인 권유 넛지 모달 연동 (TDS 320px 규격 완벽 적용) */}
      {nudgeMode && (
        <LoginNudge
          isOpen={nudgeMode !== null}
          mode={nudgeMode}
          onClose={() => {
            setNudgeMode(null);
            // 다음에 할게요 선택 시 이번 스캔 허용 임시 키 세팅
            safeLocalStorage.setItem('coolbox_nudge_dismissed_this_scan', 'true');
            // 0.25초 지연 후 비회원 자격으로 즉시 카메라 서랍 열기
            setTimeout(() => {
              setStep('options');
            }, 250);
          }}
          onLoginSuccess={() => {
            setNudgeMode(null);
            // 회원 자격 획득 및 5회 권한 부여
            safeLocalStorage.setItem('coolbox_is_logged_in', 'true');
            safeLocalStorage.removeItem('coolbox_nudge_dismissed_this_scan');
            // 0.25초 지연 후 회원 자격으로 즉시 카메라 서랍 열기
            setTimeout(() => {
              setStep('options');
            }, 250);
          }}
        />
      )}

    </div>
  );
}
