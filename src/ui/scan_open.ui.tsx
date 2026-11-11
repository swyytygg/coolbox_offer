import { useRef } from "react";
import { COLORS, BUTTON_STYLE, BUTTON_SIZE, SAFE_AREA } from "./style/constants.ui";
import { isTossAppEnv, triggerNativeCamera, triggerNativeAlbum } from "../utils/camera_bridge";
import { useTranslation } from "react-i18next";

interface ScanOpenProps {
  isOpen: boolean;
  onFileSelected: (file: File) => void;
  onBase64Selected: (base64: string) => void;
  onCancel: () => void;
}

/**
 * ScanOpen UI - 영수증 분석 옵션 선택 바텀 시트 (토스 브릿지 + HTML5 하이브리드 무적 버전)
 */
export function ScanOpen({ isOpen, onFileSelected, onBase64Selected, onCancel }: ScanOpenProps) {
  const { t } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isToss = isTossAppEnv();

  // 폴백용 HTML5 카메라 격발
  const triggerCameraFallback = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
      cameraInputRef.current.click();
    }
  };

  // 폴백용 HTML5 앨범 격발
  const triggerAlbumFallback = () => {
    if (albumInputRef.current) {
      albumInputRef.current.value = "";
      albumInputRef.current.click();
    }
  };

  const handleCameraClick = async () => {
    if (isToss) {
      console.log("[Toss Bridge] 네이티브 카메라 호출 기동...");
      const base64 = await triggerNativeCamera();
      if (base64) onBase64Selected(base64);
    } else {
      console.log("[Browser] 일반 모바일 브라우저 카메라 폴백 기동...");
      triggerCameraFallback();
    }
  };

  const handleAlbumClick = async () => {
    if (isToss) {
      console.log("[Toss Bridge] 네이티브 앨범 호출 기동...");
      const base64 = await triggerNativeAlbum();
      if (base64) onBase64Selected(base64);
    } else {
      console.log("[Browser] 일반 모바일 브라우저 앨범 폴백 기동...");
      triggerAlbumFallback();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div 
      onClick={onCancel}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)', // 우리 서비스 톤에 맞춘 짙은 배경
        zIndex: 5000, display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', 
          backgroundColor: '#1C1C1E', // 팝업 내부 배경
          borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
          padding: `32px 24px calc(${SAFE_AREA.BOTTOM} + 52px) 24px`, // 하단 여백 40px 이상 추가 확보
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)'
        }}
      >
        {/* 숨겨진 파일 인풋 (일반 브라우저 클릭 시 iOS/안드로이드 하드웨어 철저 우회) */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={cameraInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
        <input 
          type="file" 
          accept="image/*" 
          ref={albumInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />

        {/* 핸들 바 */}
        <div style={{ width: '40px', height: '5px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px', margin: '0 auto 24px auto' }} />

        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFF', marginBottom: '8px' }}>{t("SCAN_RECEIPT_TITLE", "영수증 분석하기")}</h3>
        <p style={{ fontSize: '15px', color: COLORS.GREY_80, marginBottom: '36px' }}>
          {t("SCAN_RECEIPT_DESC", "요정이 품목을 자동으로 등록해 드려요")}</p>

        {/* 3단 버튼 레이아웃 적용 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 버튼 1: 카메라 (주버튼) */}
          <button 
            onClick={handleCameraClick}
            style={{ 
              ...BUTTON_STYLE.PRIMARY, width: '100%', 
              height: BUTTON_SIZE.HEIGHT, borderRadius: BUTTON_SIZE.RADIUS, 
              fontSize: '17px', fontWeight: BUTTON_SIZE.FONT_WEIGHT, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {t("SCAN_CAMERA", "📷 카메라로 주세요")}
          </button>

          {/* 버튼 2: 앨범 (부버튼) */}
          <button 
            onClick={handleAlbumClick}
            style={{ 
              ...BUTTON_STYLE.SECONDARY, width: '100%', 
              height: BUTTON_SIZE.HEIGHT, borderRadius: BUTTON_SIZE.RADIUS, 
              fontSize: '17px', fontWeight: BUTTON_SIZE.FONT_WEIGHT,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {t("SCAN_ALBUM", "🖼️ 앨범에서 주세요")}
          </button>

          {/* 버튼 3: 취소 (가장 낮은 중요도) */}
          <button 
            onClick={onCancel}
            style={{ 
              ...BUTTON_STYLE.TERTIARY, width: '100%', 
              height: BUTTON_SIZE.HEIGHT, borderRadius: BUTTON_SIZE.RADIUS, 
              fontSize: '17px', fontWeight: BUTTON_SIZE.FONT_WEIGHT,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {t("CANCEL", "취소")}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
          from { transform: translateY(100%); } 
          to { transform: translateY(0); } 
        }
      `}</style>
    </div>
  );
}
