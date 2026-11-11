// 토스 인앱 환경 감지기 - 글로벌 독립 앱이므로 항상 false 반환
export const isTossAppEnv = (): boolean => {
  return false;
};

// HTML5 동적 파일 입력기를 이용한 카메라 격발 (Base64 형식 반환)
export const triggerNativeCamera = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // 모바일 카메라 호출 유도
    
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string || null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    
    input.click();
  });
};

// HTML5 동적 파일 입력기를 이용한 앨범 이미지 격발 (Base64 형식 반환)
export const triggerNativeAlbum = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string || null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    
    input.click();
  });
};
