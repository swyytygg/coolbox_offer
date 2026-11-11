import { MASTER_CATALOG, getFullImageUrl } from "./master_data";
import { supabase } from "./supabase";
import i18n from "./i18n";

// 수파베이스 coolbox_master_catalog 테이블의 최신 키워드 사전을 메모리에 캐싱
export let cachedCatalog: any[] = [];

// 모듈 로드 시 백그라운드에서 즉시 수파베이스 데이터 로드 시작
(async () => {
  try {
    const { data } = await supabase
      .from('coolbox_master_catalog')
      .select('id, name, name_ko, name_en, keywords, keywords_en, default_storage, shelf_life, image_url');
    if (data && data.length > 0) {
      cachedCatalog = data;
      console.log(`[ItemMatcher] 수파베이스 키워드 마스터 사전 로드 성공 (${data.length}개 카테고리)`);
    }
  } catch (err: any) {
    console.error("[ItemMatcher] 수파베이스 데이터 로드 실패 (로컬 마스터 폴백 사용):", err);
  }
})();

// 데이터 보장을 위한 비동기 사전 로더
export const ensureCatalogLoaded = async () => {
  if (cachedCatalog.length > 0) return cachedCatalog;
  try {
    const { data } = await supabase
      .from('coolbox_master_catalog')
      .select('id, name, name_ko, name_en, keywords, keywords_en, default_storage, shelf_life, image_url');
    if (data && data.length > 0) {
      cachedCatalog = data;
    }
  } catch (err) {
    console.error("[ItemMatcher] ensureCatalogLoaded 실패:", err);
  }
  return cachedCatalog;
};

/**
 * 🧹 상품명 문자열에서 괄호, 대괄호, 쉼표, 특수문자, 영문자, 불필요 공백을 완벽하게 제거하는 정제 엔진
 * [업그레이드] 활성화된 언어가 영어인 경우, 영문자 식재료 이름 보존을 위해 알파벳 삭제 제외
 */
export function sanitizeItemName(rawName: string): string {
  if (!rawName) return "";
  const currentLang = i18n.language || "ko";
  
  let cleaned = rawName
    .replace(/\([^)]*\)/g, '')   // 소괄호와 그 안의 내용 제거
    .replace(/\[[^\]]*\]/g, '')  // 대괄호와 그 안의 내용 제거
    .replace(/\d+\s*(g|ml|kg|l|ea|pcs)\b/gi, ''); // 용량 단위 및 숫자 세트 제거
    
  if (currentLang.startsWith("ko")) {
    // 한국어 모드일 때만 영어 텍스트 전면 제거 (g, ml 단위 잔여물 등 청소)
    cleaned = cleaned.replace(/[a-zA-Z]/g, '');
  } else {
    // 영어(해외) 모드일 때는 영단어는 살리고 숫자만 제거
    cleaned = cleaned.replace(/\d+/g, '');
  }
  
  return cleaned
    .replace(/[,\.!?@#$%^&*_+\-=<>:;`~]/g, ' ') // 쉼표 및 특수문자를 공백으로 변환
    .replace(/\s+/g, ' ')        // 다중 공백을 단일 공백으로 압축
    .trim();
}

// 이름으로 가장 잘 어울리는 카탈로그 아이템을 찾아주는 도우미 함수 (수파베이스 키워드 사전 활용)
export const findMatchedCatalogItem = (itemName: string,
  isDeliveryReceipt: boolean = false) => {
  const sanitized = sanitizeItemName(itemName);
  const trimmed = sanitized.trim();
  if (!trimmed) return null;

  // 수파베이스 데이터가 아직 로드 전이라면 로컬 MASTER_CATALOG를 폴백으로 사용
  const activeCatalog = cachedCatalog.length > 0 ? cachedCatalog : MASTER_CATALOG;
  const isKo = (i18n.language || "ko").startsWith("ko");

  // 🚀 [4점 룰 - 0순위]: 쿠팡이츠, 배민 등 배달 플랫폼 이름이 등장하면 무조건 16번(배달/외식) 즉시 배정!
  // 🚀 [배달 영수증 처리] 배달앱 영수증인 경우, 캐릭터와 속성은 16번 강제하되 이름은 영수증 원본 음식명 사용!
  if (isDeliveryReceipt) {
    const found = activeCatalog.find((m: any) => m.id === 16);
    if (found) {
      return {
        id: found.id,
        name: itemName, // 🔥 핵심: found.name("배달/외식") 대신 원래 영수증의 음식명("뿌링클 순살") 유지
        location: found.default_storage || found.location || '냉장',
        defaultExpiry: found.shelf_life || found.defaultExpiry || 7,
        imageUrl: getFullImageUrl(found.image_url || found.imageUrl)
      };
    }
  }

  let bestMatch: { categoryId: number; priority: number; weight: number } | null = null;

  // 수파베이스에서 가져온 마스터 카테고리의 keywords 컬럼을 쪼개 대조 시도
  for (const item of activeCatalog) {
    const itemNameInCatalog = (!isKo && item.name_en) ? item.name_en : (item.name || "");
    const keywordsStr = (!isKo && item.keywords_en) ? item.keywords_en : (item.keywords || "");
    const keywordsArray = keywordsStr.split(",").map((k: string) => k.trim()).filter(Boolean);
    
    // 🔥 [버그 픽스] 카테고리의 원본 '이름(name)' 자체도 반드시 키워드에 포함하여 검사합니다.
    if (itemNameInCatalog && !keywordsArray.includes(itemNameInCatalog.trim())) {
      keywordsArray.push(itemNameInCatalog.trim());
    }

    for (const keyword of keywordsArray) {
      // 1. 전체 문장(trimmed) 기준으로 서로 포함하는지 확인 (대소문자 구분 없이)
      let isMatch = false;
      const kwLower = keyword.toLowerCase();
      const trimmedLower = trimmed.toLowerCase();
      if (trimmedLower.includes(kwLower) || kwLower.includes(trimmedLower)) {
        isMatch = true;
      } else {
        // 2. 전체 문장으로 안 맞을 때, 띄어쓰기 단위로 단어를 쪼개서 각 단어(2글자 이상)가 키워드와 매칭되는지 확인
        // (예: "하선정 장아찌" vs DB키워드 "장아찌류" -> "장아찌"가 "장아찌류"에 포함되므로 매칭 성공)
        const words = trimmed.split(/\s+/);
        for (const word of words) {
          const wordLower = word.toLowerCase();
          if (word.length >= 2 && (kwLower.includes(wordLower) || wordLower.includes(kwLower))) {
            isMatch = true;
            break;
          }
        }
      }

      if (isMatch) {
        let priority = 0;
        let weight = keyword.length;
        const kwLower = keyword.toLowerCase();
        const trimmedLower = trimmed.toLowerCase();

        // 🥇 5점: 100% 완벽 일치
        if (trimmedLower === kwLower) {
          priority = 5;
        }
        // 🥈 4점: 유저 입력 문장에 긴 키워드(4글자 이상)가 온전히 포함되어 있을 때만 4점
        else if (keyword.length >= 4 && trimmedLower.includes(kwLower)) {
          priority = 4;
        }
        // 🥉 3점: 끝부분 일치 & 3글자 이상
        else if (trimmedLower.endsWith(kwLower) && keyword.length >= 3) {
          priority = 3;
        }
        // 🏅 2.5점: 끝부분 일치 & 2글자
        else if (trimmedLower.endsWith(kwLower) && keyword.length === 2) {
          priority = 2.5;
        }
        // 🏅 2점: 시작 단어 일치
        else if (trimmedLower.startsWith(kwLower) || kwLower.startsWith(trimmedLower)) {
          priority = 2;
        }
        // 🏅 1점: 단순 포함 (중간에 끼어있는 단어라도 매칭을 살려서 미분류 방지)
        else {
          priority = 1;
        }

        // 기존에 논의했던 길이 가중치는 제외하고 priority 체계를 그대로 우선 반영합니다.
        if (
          bestMatch === null ||
          priority > bestMatch.priority ||
          (priority === bestMatch.priority && weight > bestMatch.weight)
        ) {
          bestMatch = { categoryId: item.id, priority, weight };
        }
      }
    }
  }

  if (bestMatch) {
    const found = activeCatalog.find((m: any) => m.id === bestMatch!.categoryId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        location: found.default_storage || found.location || '냉장',
        defaultExpiry: found.shelf_life || found.defaultExpiry || 7,
        imageUrl: getFullImageUrl(found.image_url || found.imageUrl)
      };
    }
  }

  // 1대1 다이렉트 매칭 (대소문자 구분 없이)
  const directMatch = activeCatalog.find((m: any) => {
    const itemNameInCatalog = (!isKo && m.name_en) ? m.name_en : (m.name || "");
    const trimmedLower = trimmed.toLowerCase();
    const catLower = itemNameInCatalog.toLowerCase();
    return trimmedLower.includes(catLower) || catLower.includes(trimmedLower);
  });
  if (directMatch && directMatch.id !== 15) {
    return {
      id: directMatch.id,
      name: directMatch.name,
      location: directMatch.default_storage || directMatch.location || '냉장',
      defaultExpiry: directMatch.shelf_life || directMatch.defaultExpiry || 7,
      imageUrl: getFullImageUrl(directMatch.image_url || directMatch.imageUrl)
    };
  }

  // 매칭 실패 시, 유저의 명확한 인지와 수정을 유도하기 위해 15번(미분류)을 당당하게 반환합니다.
  const unclassified = activeCatalog.find((m: any) => m.id === 15);
  if (unclassified) {
    return {
      id: unclassified.id,
      name: itemName, // 유저가 스캔한 원본 이름("올리브짜파게")을 보여줘야 본인이 알아보고 수정함
      location: unclassified.default_storage || unclassified.location || '냉장',
      defaultExpiry: unclassified.shelf_life || unclassified.defaultExpiry || 7,
      imageUrl: getFullImageUrl(unclassified.image_url || unclassified.imageUrl)
    };
  }

  return null;
};
