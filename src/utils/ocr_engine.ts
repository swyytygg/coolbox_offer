import { MASTER_CATALOG, getFullImageUrl } from "./master_data";
import { supabase } from "./supabase";
import { reportErrorToTelegram } from "./telegram_logger";
import { getLocalTodayDate } from "./coolbox_engine";
import { cachedCatalog, ensureCatalogLoaded, findMatchedCatalogItem, sanitizeItemName } from "./item_matcher";
// safe_env 임포트 제거 (네이버 OCR 미사용)
// getRecallIntelligence 제거 (Edge Function OCR 이관으로 미사용)

// 1. 이미지를 WebP 기반 Base64로 변환 (용량 최적화)
const fileToWebPBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 브라우저가 스캔바 및 광고 애니메이션을 먼저 그릴 수 있도록 숨 쉴 틈(비동기 양보) 부여
        requestAnimationFrame(() => {
          setTimeout(() => {
            try {
              const canvas = document.createElement("canvas");
              // 최대 해상도 제한 (1200px)
              const MAX_WIDTH = 1200;
              let width = img.width;
              let height = img.height;

              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) return reject("Canvas 2D context 생성을 실패했습니다.");

              ctx.drawImage(img, 0, 0, width, height);
              // WebP 포맷으로 압축 (품질 0.8)
              const webpBase64 = canvas.toDataURL("image/webp", 0.8);
              resolve(webpBase64);
            } catch (err) {
              reject(err);
            }
          }, 0);
        });
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * 🚫 비식품(배달비, 추가금액, 쇼핑백 등)을 판별하여 필터링하는 엔진
 */
export function isNonFoodItem(name: string): boolean {
  if (!name) return true;
  const cleanName = sanitizeItemName(name).trim();
  
  const nonFoodKeywords = [
    "배달비", "배달료", "배송비", "배송료", "배송", "배달", 
    "추가금액", "추가금", "옵션금액", "옵션금", "추가", 
    "쇼핑백", "비닐봉투", "봉투", "종량제", "박스",
    "할인", "쿠폰", "적립", "부가세", "소계", "합계",
    "포장비", "포장료", "용기값", "용기", "보증금"
  ];
  
  return nonFoodKeywords.some(keyword => cleanName.includes(keyword) || name.includes(keyword));
}

// 2. 마스터 데이터 기반 UI용 품목 맵핑 (수파베이스 실시간 키워드 사전 활용)
const mapToUIItem = (ocrItem: any, rawMeta?: any) => {
  const rawName = ocrItem.name || "";
  const itemName = sanitizeItemName(rawName);
  let target: any = null;
  
  const activeCatalog = cachedCatalog.length > 0 ? cachedCatalog : MASTER_CATALOG;

  // 0 순위: 배달 여부 선제 판단
  const deliveryApps = ["쿠팡이츠", "coupang eats", "배민", "배달의민족", "배달의 민족", "요기요", "땡겨요", "배달특급"];
  let finalMarketName = rawMeta?.storeName || "";
  let finalMarketBranch = rawMeta?.purchaseRegion || "";

  const isDelivery = rawMeta?.isDelivery === true || 
                     deliveryApps.some(app => finalMarketName.toLowerCase().includes(app.toLowerCase()));

  // 🥇 1순위: 대표님 말씀대로! 여기서 item_matcher.ts에 만들어둔 '점수제 매칭 함수(findMatchedCatalogItem)'를 연동 호출합니다!
  const matchedData = findMatchedCatalogItem(itemName, isDelivery);
  if (matchedData && matchedData.id !== 15) {
     target = activeCatalog.find(m => m.id === matchedData.id);
  }

  // 🥈 2순위: 사전에 일치하는 단어가 없을 때만 AI가 내려준 category_id 사용 (단, 15번 미분류가 아닐 때만 믿음)
  if (!target && ocrItem.category_id && ocrItem.category_id !== 15) {
    target = activeCatalog.find(m => m.id === ocrItem.category_id);
  }

  // 🥉 3순위: 그래도 없으면 15번(미분류) 폴백
  if (!target) {
    target = activeCatalog.find(m => m.id === 15)!;
  }

  if (isDelivery) {
    const appName = rawMeta?.deliveryApp || 
                    deliveryApps.find(app => finalMarketName.toLowerCase().includes(app.toLowerCase())) || 
                    "배달";
    const realRestaurant = rawMeta?.restaurantName || rawMeta?.purchaseRegion || "배달 전문점";
    finalMarketName = `${realRestaurant} (${appName})`;
    
    // AI가 음식점 이름과 지역명을 제대로 구별했다면 지역명 유지
    const realRegion = (rawMeta?.purchaseRegion && rawMeta?.purchaseRegion !== realRestaurant)
      ? rawMeta.purchaseRegion
      : "";
    finalMarketBranch = realRegion || "배달 지점";
  }

  return {
    id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: sanitizeItemName(itemName) || itemName, // 🔥 핵심: 원래 영수증의 음식명에서 숫자 및 불필요 기호 완벽 제거 유지
    location: target.default_storage || target.location || '냉장', // 유저가 게임에서 선택할 초기 추천값
    quantity: Math.max(1, ocrItem.quantity || 1),
    daysLeft: target.shelf_life ?? target.defaultExpiry ?? 7, // 유통기한이 아닌 마스터데이터 '소비기한' 기준
    purchaseDate: getLocalTodayDate(), // 영수증 날짜 무시, 입고날짜(오늘) 기준
    imageUrl: getFullImageUrl(target.image_url || target.imageUrl),
    
    // 💡 물가 히스토리(coolbox_price_history) 저장을 위한 메타데이터 주입
    rawName: ocrItem.name,
    price: ocrItem.price || 0,
    categoryId: target.id,
    marketName: finalMarketName,
    marketBranch: finalMarketBranch,
    purchaseTime: rawMeta?.purchaseDateTime || ""
  };
};

/**
 * [2순위] OpenRouter AI 기반 상세 비전 분석 (Edge Function 호출)
 */
const tryOpenRouterOCR = async (base64Image: string) => {
  console.log(`[OCR] Supabase Edge Function (analyze-receipt-v2) 호출 시작`);
  
  const { data, error } = await supabase.functions.invoke('analyze-receipt-v2', {
    body: {
      action: 'receipt',
      image: base64Image
    }
  });

  if (error) {
    throw new Error(`Edge Function OCR failed: ${error.message || error}`);
  }

  if (data && data.items && data.items.length > 0) {
    return data; // { meta: {...}, items: [...] } 포맷
  }

  throw new Error("Edge Function OCR returned invalid items format");
};

/**
 * [메인 엔진] 영수증 이미지 전체 파이프라인 처리기
 */
export const processReceiptImage = async (file: File) => {
  try {
    // 1. 수파베이스 키워드 마스터 사전 데이터 로딩 완료 보장
    await ensureCatalogLoaded();

    // 2. 이미지를 WebP로 최적화 전환
    const webpBase64 = await fileToWebPBase64(file);
    let rawReceiptData: any = null;

    // 3. AI OCR 추출 시도 (Supabase Edge Function 호출)
    rawReceiptData = await tryOpenRouterOCR(webpBase64);

    console.log("[OCR] 상세 영수증 데이터 추출 완료:", rawReceiptData);

    // 4. UI(유저)에게 보여줄 화면용 데이터 포맷팅 (소비기한, 입고날짜, 이름, 수량만 필터링)
    const uiDisplayItems = rawReceiptData.items
      .filter((item: any) => item.name && item.name.length > 0 && !isNonFoodItem(item.name))
      .map((item: any) => mapToUIItem(item, rawReceiptData.meta));

    // 반환: 원본 메타데이터(수파베이스 저장용) + 가공된 UI아이템
    return {
      rawMetaData: rawReceiptData.meta,
      rawItems: rawReceiptData.items,
      uiDisplayItems: uiDisplayItems,
      base64Image: webpBase64 // 백그라운드 업로드용
    };

  } catch (err) {
    console.error("영수증 스캔 전체 실패:", err);
    // 🚨 텔레그램으로 심각한 에러 즉시 보고
    reportErrorToTelegram("영수증 OCR 전체 프로세스 붕괴", err);

    // 폴백 에러 처리용
    return {
      rawMetaData: null,
      rawItems: [],
      uiDisplayItems: [
        mapToUIItem({ name: '버터', quantity: 1 }),
        mapToUIItem({ name: '치킨', quantity: 1 })
      ],
      base64Image: null
    };
  }
};
