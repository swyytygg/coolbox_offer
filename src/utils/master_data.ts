/**
 * 쿨박스 식재료 마스터 카탈로그 데이터
 */

export interface MasterItem {
  id: number;
  name: string;
  name_ko?: string;
  name_en?: string;
  location: '신선' | '냉장' | '냉동' | '실외';
  defaultExpiry: number;
  imageUrl: string;
}

export const MASTER_CATALOG: MasterItem[] = [
  { id: 1, name: "채소", name_ko: "채소", name_en: "Vegetables", location: "신선", defaultExpiry: 7, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/1.webp" },
  { id: 2, name: "곡류", name_ko: "곡류", name_en: "Grains", location: "실외", defaultExpiry: 30, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/2.webp" },
  { id: 3, name: "육류", name_ko: "육류", name_en: "Meat", location: "신선", defaultExpiry: 7, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/3.webp" },
  { id: 4, name: "수산물", name_ko: "수산물", name_en: "Seafood", location: "냉장", defaultExpiry: 7, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/4.webp" },
  { id: 5, name: "과일류", name_ko: "과일류", name_en: "Fruits", location: "신선", defaultExpiry: 7, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/5.webp" },
  { id: 6, name: "유제품", name_ko: "유제품", name_en: "Dairy", location: "냉장", defaultExpiry: 7, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/6.webp" },
  { id: 7, name: "알류", name_ko: "알류", name_en: "Eggs", location: "신선", defaultExpiry: 14, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/7.webp" },
  { id: 8, name: "빵", name_ko: "빵", name_en: "Bread", location: "실외", defaultExpiry: 3, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/8.webp" },
  { id: 9, name: "샐러드", name_ko: "샐러드", name_en: "Salads", location: "신선", defaultExpiry: 3, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/9.webp" },
  { id: 10, name: "과자", name_ko: "과자", name_en: "Snacks", location: "실외", defaultExpiry: 30, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/10.webp" },
  { id: 11, name: "음료", name_ko: "음료", name_en: "Beverages", location: "냉장", defaultExpiry: 30, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/11.webp?v=2" },
  { id: 12, name: "간편식", name_ko: "간편식", name_en: "Convenience Foods", location: "냉장", defaultExpiry: 30, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/12.webp" },
  { id: 13, name: "반찬", name_ko: "반찬", name_en: "Side Dishes", location: "냉장", defaultExpiry: 3, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/13.webp?v=2" },
  { id: 14, name: "냉동식품", name_ko: "냉동식품", name_en: "Frozen Foods", location: "냉동", defaultExpiry: 30, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/14.webp" },
  { id: 15, name: "미분류", name_ko: "미분류", name_en: "Unclassified", location: "냉장", defaultExpiry: 7, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/15.webp" },
  { id: 16, name: "배달/외식", name_ko: "배달/외식", name_en: "Delivery/Dining Out", location: "신선", defaultExpiry: 0, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/16.webp?v=2" }, 
  { id: 17, name: "소스/양념", name_ko: "소스/양념", name_en: "Sauces/Seasonings", location: "실외", defaultExpiry: 30, imageUrl: "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/17.webp?v=2" }, 
  
];

// 수파베이스 DB의 "1", "2" 등 숏코드/ID 문자열을 완전한 Storage 이미지 URL로 안전하게 복원해주는 함수
export const getFullImageUrl = (imgUrl: string | null | undefined): string => {
  if (!imgUrl) return "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/15.webp";
  
  const trimmed = String(imgUrl).trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  
  // 만약 파일명 전체("1.webp") 혹은 단순 숫자 ID("1")만 들어왔을 경우 정밀 복구
  let cleanId = trimmed.replace(".webp", "");
  
  // 11, 13, 16, 17번 카테고리는 강제 갱신 쿼리파라미터(?v=2) 매핑
  const v2Ids = ["11", "13", "16", "17"];
  const versionParam = v2Ids.includes(cleanId) ? "?v=2" : "";
  
  return `https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/${cleanId}.webp${versionParam}`;
};

