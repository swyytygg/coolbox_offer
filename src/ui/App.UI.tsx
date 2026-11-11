import { useState } from "react";
import {
  StarterMain,
  ScanOpen,
  PersonalConsent,
  ScanningEffect,
  ScanItem,
  SlamDunk,
  MainUI
} from "./style";

export default function AppUISandbox() {
  const [step, setStep] = useState<'starter' | 'consent' | 'options' | 'scanning' | 'review' | 'slamdunk' | 'main'>('starter');
  const [hasFridge, setHasFridge] = useState(false);

  // 모의 스캔용 더미 아이템 1개
  const dummyItems = [{
    id: 1,
    name: "서울우유",
    imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/ui-assets/chilled.webp",
    location: "냉장",
    quantity: 1,
    expiryDays: 7,
    daysLeft: 7
  }];

  return (
    <div className="force-dark sandbox-mode" style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', backgroundColor: '#000' }}>

      {/* 🛠️ [대표님 전용] 상단 플로팅 네비게이션 바 (화면 간격 조율용 즉시 점프 버튼) */}
      <div style={{ position: 'fixed', top: '0px', left: '0px', width: '100%', zIndex: 9999, display: 'flex', gap: '4px', padding: '4px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', overflowX: 'auto' }}>
        {(['starter', 'options', 'consent', 'scanning', 'review', 'slamdunk', 'main'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStep(s)}
            style={{
              padding: '4px 8px', fontSize: '11px',
              background: step === s ? '#3182F6' : '#333',
              color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ width: '100%', height: '100%', paddingTop: '30px' }}> {/* 네비바 아래 여백 */}
        {/* 1. 스타터 로비 */}
        {step === 'starter' && <StarterMain onNext={() => { setHasFridge(false); setStep('options'); }} onDemo={() => { setHasFridge(false); setStep('options'); }} />}

        {/* 2. 스캔 옵션 (카메라 서랍) */}
        {step === 'options' && <ScanOpen isOpen={true} onFileSelected={() => setStep('consent')} onBase64Selected={() => setStep('consent')} onCancel={() => setStep('starter')} />}

        {/* 3. 약관 동의 (최초 1회) */}
        {step === 'consent' && <PersonalConsent isOpen={true} onAgree={() => setStep('scanning')} onDecline={() => setStep('options')} />}

        {/* 4/5. 스캐닝 찌릿찌릿 이펙트 */}
        {step === 'scanning' && <ScanningEffect isOpen={true} onComplete={() => setStep('review')} />}

        {/* 6-1. 스캔 결과 확인 서랍 */}
        {step === 'review' && <ScanItem initialItems={dummyItems} hasFridge={hasFridge} onConfirm={() => setStep('slamdunk')} onCancel={() => setStep('options')} />}

        {/* 6-2. 슬램던크 미니게임 */}
        {step === 'slamdunk' && <SlamDunk items={dummyItems} onComplete={() => setStep('main')} />}

        {/* 7. 기존 유저 메인 뷰 (여기서 [+] 누르면 1번/3번 생략하고 2번 options로 직행!) */}
        {step === 'main' && <MainUI onStartScan={() => { setHasFridge(true); setStep('options'); }} />}
      </div>
    </div>
  );
}
