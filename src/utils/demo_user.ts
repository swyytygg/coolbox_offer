import { supabase } from "./supabase";
import { getLocalTodayDate } from "./coolbox_engine";

interface DemoItem {
  id: string;
  name: string;
  image_url: string;
  location: "신선" | "냉장" | "냉동" | "실외";
  purchase_date: string;
  expiry_days: number;
  quantity: number;
  group_id: string;
}

/**
 * demo_user - 신규 유저가 '영수증 없이 체험하기' 클릭 시,
 * Supabase 진짜 데이터베이스에 5종 가상 피규어 식재료 레코드를 입고하는 가상 체험 Seeder입니다.
 */
export const demo_user = async (groupId: string): Promise<boolean> => {
  const todayStr = getLocalTodayDate();

  const demoItems: DemoItem[] = [
    { id: "90001",
      name: "가상 곡물",
      image_url: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/1.webp", // 1. 채소
      location: "신선",
      purchase_date: todayStr,
      expiry_days: 3,
      quantity: 1,
      group_id: groupId,
    },
    { id: "90002",
      name: "가상 생선",
      image_url: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/4.webp", // 2. 생선 (수산물)
      location: "냉장",
      purchase_date: todayStr,
      expiry_days: 2,
      quantity: 1,
      group_id: groupId,
    },
    { id: "90003",
      name: "가상 과자",
      image_url: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/10.webp", // 3. 과자
      location: "실외",
      purchase_date: todayStr,
      expiry_days: 30,
      quantity: 1,
      group_id: groupId,
    },
    { id: "90004",
      name: "가상 고기",
      image_url: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/3.webp", // 4. 육류
      location: "신선",
      purchase_date: todayStr,
      expiry_days: 1,
      quantity: 1,
      group_id: groupId,
    },
    { id: "90005",
      name: "가상 과일",
      image_url: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/5.webp", // 5. 딸기 (과일류)
      location: "신선",
      purchase_date: todayStr,
      expiry_days: 0,
      quantity: 1,
      group_id: groupId,
    },
  ];

  try {
    const { error } = await supabase
      .from("coolbox_inventory")
      .insert(demoItems);

    if (error) {
      console.error("[Demo Seeder] 가상 피규어 입고 실패:", error);
      return false;
    }

    console.log("[Demo Seeder] 5종 가상 피규어 진짜 DB에 입고 완료! groupId:", groupId);
    return true;
  } catch (err) {
    console.error("[Demo Seeder] 가상 피규어 입고 중 치명적 예외 발생:", err);
    return false;
  }
};
