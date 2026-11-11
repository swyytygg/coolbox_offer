import { supabase } from "../utils/supabase";
import { FridgeItem } from "../utils/coolbox_engine";
import { insertDeleteNotification } from "../utils/alarm_engine";
import { reportErrorToTelegram } from "../utils/telegram_logger";
import { getFullImageUrl } from "../utils/master_data";

export const fetchInventory = async (groupId: string): Promise<FridgeItem[]> => {
  const { data, error } = await supabase
    .from('coolbox_inventory')
    .select('*')
    .eq('group_id', groupId)
    .order('purchase_date', { ascending: false });

  if (error) {
    console.error("Error fetching inventory:", error);
    reportErrorToTelegram("식재료 목록 조회 실패", error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    name: item.name,
    imageUrl: getFullImageUrl(item.image_url),
    location: item.location,
    purchaseDate: item.purchase_date,
    expiryDays: item.expiry_days,
    daysLeft: 0, // Will be calculated in the UI
    quantity: item.quantity || 1
  }));
};

export const upsertInventoryItem = async (item: Partial<FridgeItem> & { group_id: string }) => {
  const payload = {
    id: item.id || undefined,
    name: item.name,
    image_url: item.imageUrl,
    location: item.location,
    purchase_date: item.purchaseDate,
    expiry_days: item.expiryDays,
    group_id: item.group_id,
    quantity: item.quantity !== undefined ? item.quantity : 1
  };

  const { data, error } = await supabase
    .from('coolbox_inventory')
    .upsert(payload)
    .select();

  if (error) {
    reportErrorToTelegram("식재료 추가/수정 실패", error);
    throw error;
  }
  return data[0];
};

export const deleteInventoryItem = async (id: string | number) => {
  // 1. 삭제할 식재료의 이름과 소속된 그룹(group_id) 정보를 먼저 조회합니다.
  const { data: itemData, error: fetchError } = await supabase
    .from('coolbox_inventory')
    .select('name, group_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error("[Inventory API] 삭제 전 아이템 정보 조회 실패:", fetchError);
    reportErrorToTelegram("삭제 전 식재료 정보 조회 실패", fetchError);
  }

  // 2. 실제 DB에서 아이템을 물리적으로 삭제합니다.
  const { error } = await supabase
    .from('coolbox_inventory')
    .delete()
    .eq('id', id);

  if (error) {
    reportErrorToTelegram("식재료 삭제 실패", error);
    throw error;
  }
};
