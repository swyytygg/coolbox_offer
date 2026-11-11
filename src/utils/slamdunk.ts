import { MASTER_CATALOG, getFullImageUrl } from "./master_data";
import { upsertInventoryItem } from "../api/inventory";
import { supabase } from "./supabase";
import { getOrCreateFridgeGroup } from "../api/fridge";
import { reportErrorToTelegram } from "./telegram_logger";
import { getLocalTodayDate } from "./coolbox_engine";

/**
 * [기능 1] 식재료 캐릭터 맵핑
 * 스캔된 식재료 이름과 가장 잘 어울리는 17종 고퀄리티 캐릭터 이미지를 찾아줍니다.
 * 못 찾으면 기본 캐릭터(15번 미분류)를 반환하여 엑스박스를 방지합니다.
 */
export const matchCharacterImage = (item: any): string => {
  // 1. 스캔 화면에서 이미 발급받은 이미지가 있다면 1순위로 사용 (완벽한 동기화)
  if (item && typeof item === 'object' && item.imageUrl) {
    return getFullImageUrl(item.imageUrl);
  }
  
  // 2. 텍스트 매칭 (fallback)
  const itemName = typeof item === 'string' ? item : item?.name;
  if (!itemName) return "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/15.webp";
  
  const matched = MASTER_CATALOG.find(m => itemName.includes(m.name) || m.name.includes(itemName));
  // 15번 이미지가 '미분류'
  return getFullImageUrl(matched?.imageUrl || "15");
};

/**
 * [기능 2] 슬램덩크 슛 입고 처리 + 영수증 물가 히스토리(coolbox_price_history) 저장
 * 유저가 조준한 칸(골대)에 맞게 식재료를 수파베이스 DB에 입고시킵니다.
 * 이 과정에서 영수증 OCR에서 수집한 상품 단가, 마트명, 원본 상품명 등을 coolbox_price_history에 완전하게 적재합니다.
 */
export const processSlamDunkShot = async (item: any, targetSlot: number) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("로그인(익명) 세션을 찾을 수 없어 입고할 수 없습니다.");
    }

    const groupId = await getOrCreateFridgeGroup(session.user.id);
    
    // 타겟 슬롯 번호(0~3)를 DB용 위치값으로 변환
    // 0:냉동, 1:냉장, 2:신선, 3:실외
    const slotMap = ['냉동', '냉장', '신선', '실외'];
    const location = slotMap[targetSlot] as any;
    
    // 사용자 캐릭터 이미지 복합 매칭
    const characterImage = matchCharacterImage(item);
    
    // 입고일은 무조건 '오늘' (유저 폰 날짜 기준)
    const today = getLocalTodayDate();
    
    // 1. 냉장고 식재료 현황 DB(coolbox_inventory)에 밀어넣기
    await upsertInventoryItem({
      name: item.name,
      imageUrl: characterImage, // 복구 완료된 완전한 URL 매핑
      location: location, // 유저가 조준한 골대 칸으로 입고
      purchaseDate: today, // 폰 기준 오늘 날짜 (선입선출의 핵심)
      expiryDays: item.daysLeft || 7, // 소비기한 (기본값 또는 스캔된 값)
      quantity: item.quantity || 1, // 👈 3팩이 고스란히 3개로 완벽히 적재
      group_id: groupId
    });

    // 2. 물가 분석용 히스토리 DB(coolbox_price_history)에 최대한 수집해서 저장!
    if (item.rawName || item.price) {
      const cleanId = String(item.categoryId || 15);
      const standardImageUrl = getFullImageUrl(cleanId);

      // 📅 요일 구하기
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const purchaseDateObj = item.purchaseTime ? new Date(item.purchaseTime) : new Date();
      const dayOfWeek = days[purchaseDateObj.getDay()] || "오늘";

      // ⏰ 시간대 구분 (오전/오후/저녁/밤/새벽)
      const hours = purchaseDateObj.getHours();
      let timeSlot = "오후";
      if (hours >= 0 && hours < 6) timeSlot = "새벽";
      else if (hours >= 6 && hours < 12) timeSlot = "오전";
      else if (hours >= 12 && hours < 18) timeSlot = "오후";
      else if (hours >= 18 && hours < 21) timeSlot = "저녁";
      else if (hours >= 21 && hours < 24) timeSlot = "밤";

      // 📦 용량/단위 추출
      const rawNameStr = item.rawName || item.name || "";
      const capacityRegex = /(\d+(?:\.\d+)?\s*(?:ml|l|g|kg|입|팩|개입|개|봉|묶음|통|p))/i;
      const capacityMatch = rawNameStr.match(capacityRegex);
      const capacity = capacityMatch ? capacityMatch[0].trim() : "";

      // 🏭 제조사 추출
      const firstWord = rawNameStr.split(/\s+/)[0] || "";
      const manufacturers = ["서울우유", "남양", "매일", "풀무원", "CJ", "씨제이", "오뚜기", "농심", "동원", "대상", "청정원", "삼양", "팔도", "하림", "해태", "롯데", "빙그레"];
      const manufacturer = manufacturers.find(m => firstWord.includes(m)) || "";

      const pricePayload = {
        purchase_date: item.purchaseTime ? item.purchaseTime.split(" ")[0] : today,
        standard_item_name: item.name,
        raw_item_name: rawNameStr,
        price: item.price || 0,
        quantity: item.quantity || 1,
        market_name: item.marketName || "일반 마트",
        market_branch: item.marketBranch || "기본 지점",
        group_id: groupId,
        receipt_image_url: standardImageUrl,
        day_of_week: dayOfWeek,
        time_slot: timeSlot,
        manufacturer: manufacturer,
        capacity: capacity
      };

      console.log("[SlamDunk] Saving price history details:", pricePayload);
      const { error: priceErr } = await supabase
        .from('coolbox_price_history')
        .insert([pricePayload]);

      if (priceErr) {
        console.error("[SlamDunk] price_history 적재 실패:", priceErr);
        reportErrorToTelegram("물가 히스토리 저장 실패", priceErr);
      } else {
        console.log("[SlamDunk] price_history 적재 성공!");
      }
    }
    
  } catch (err) {
    console.error("SlamDunk Shot Error:", err);
    reportErrorToTelegram("슬램덩크 (DB 입고) 실패", err);
  }
};

/**
 * 식재료 보관 위치에 알맞은 추천 슬롯 매핑 (0:냉동, 1:냉장, 2:신선, 3:실외)
 */
export const getRecommendedSlot = (location: string): number => {
  if (!location) return 1;
  const loc = location.toLowerCase();
  if (loc === "냉동" || loc === "frozen") return 0;
  if (loc === "냉장" || loc === "chilled") return 1;
  if (loc === "신선" || loc === "fresh") return 2;
  if (loc === "실외" || loc === "outer") return 3;
  return 1;
};

/**
 * 남은 식재료를 추천 슬롯에 맞춰 DB에 일괄 저장(SKIP) 처리
 */
export const processSkipAll = async (remainingItems: any[]): Promise<void> => {
  await Promise.all(
    remainingItems.map(item => {
      const slot = getRecommendedSlot(item.location);
      return processSlamDunkShot(item, slot);
    })
  );
};
