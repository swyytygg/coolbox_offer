import { useState, useEffect } from "react";
import { MASTER_CATALOG } from "../utils/master_data";
import { getLocalTodayDate } from "../utils/coolbox_engine";
import { supabase } from "../utils/supabase";
import { findMatchedCatalogItem } from "../utils/item_matcher";

export function useItemAddLogic(mode: 'add' | 'edit' | 'detail', initialData?: any) {
  const [name, setName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiryDays, setExpiryDays] = useState(7);
  const [location, setLocation] = useState<'신선' | '냉장' | '냉동' | '실외'>('냉장');
  const [quantity, setQuantity] = useState(1);
  const [showQuickExpiry, setShowQuickExpiry] = useState(false);
  const [dbMatchedImgUrl, setDbMatchedImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'add') {
      setName("");
      setPurchaseDate(getLocalTodayDate());
      setExpiryDays(7);
      setQuantity(1);
      setLocation(initialData?.location || '냉장');
      setDbMatchedImgUrl(null);
    } else if (initialData) {
      setName(initialData.name || "");
      setPurchaseDate(initialData.purchaseDate || getLocalTodayDate());
      setExpiryDays(initialData.daysLeft ?? initialData.expiryDays ?? 7);
      setQuantity(initialData.quantity || 1);
      setLocation(initialData.location || '냉장');
      setDbMatchedImgUrl(null);
    }
  }, [mode, initialData]);

  useEffect(() => {
    const checkDbAlias = async () => {
      if (!name.trim()) {
        setDbMatchedImgUrl(null);
        return;
      }
      const cleanName = name.trim();

      const localMatch = findMatchedCatalogItem(cleanName);
      if (localMatch) {
        setDbMatchedImgUrl(null);
        return;
      }

      try {
        const { data } = await supabase
          .from('coolbox_knowledge_master')
          .select('category_id')
          .or(`item_name.eq.${cleanName},aliases.cs.{${cleanName}}`)
          .maybeSingle();

        if (data && data.category_id && data.category_id !== 15) {
          const master = MASTER_CATALOG.find(m => m.id === data.category_id);
          if (master) {
            setDbMatchedImgUrl(master.imageUrl);
            return;
          }
        }
      } catch (err) { }

      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke('analyze-receipt-v2', {
          body: {
            action: 'classify',
            text: cleanName
          }
        });

        if (aiError) throw new Error(aiError.message || aiError);

        const aiCategoryText = aiData?.choices?.[0]?.message?.content?.trim() || "";
        const matchNums = aiCategoryText.match(/\d+/);
        if (matchNums) {
          const aiId = parseInt(matchNums[0], 10);
          if (aiId >= 1 && aiId <= 17 && aiId !== 15) {
            const master = MASTER_CATALOG.find(m => m.id === aiId);
            if (master) {
              setDbMatchedImgUrl(master.imageUrl);
              await supabase.from('coolbox_knowledge_master').upsert([
                { item_name: cleanName, aliases: [cleanName], category_id: aiId }
              ], { onConflict: 'item_name' });
            }
          }
        }
      } catch (err) { }
    };

    const timer = setTimeout(checkDbAlias, 400);
    return () => clearTimeout(timer);
  }, [name]);

  const isDetail = mode === 'detail';
  const matchedCatalogItem = findMatchedCatalogItem(name);
  const dynamicImageUrl = (isDetail && initialData?.imageUrl) 
    ? initialData.imageUrl 
    : (matchedCatalogItem?.imageUrl || dbMatchedImgUrl || initialData?.imageUrl || "https://krkqifswnbnbgyvhisdk.supabase.co/storage/v1/object/public/item-images/ingredients/15.webp");

  return {
    name, setName,
    purchaseDate, setPurchaseDate,
    expiryDays, setExpiryDays,
    location, setLocation,
    quantity, setQuantity,
    showQuickExpiry, setShowQuickExpiry,
    isDetail, dynamicImageUrl
  };
}
