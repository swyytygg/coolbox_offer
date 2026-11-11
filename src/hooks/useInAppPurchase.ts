import { useDialog } from "../ui/DialogProvider";
import { supabase } from "../utils/supabase";
import { useCallback, useEffect, useState } from "react";

export interface IapProductListItem {
  sku: string;
  displayName: string;
  description: string;
  displayAmount: string;
  iconUrl?: string;
}

interface UseInAppPurchaseReturn {
  products: IapProductListItem[];
  purchaseProduct: (sku: string) => void;
  restorePendingOrders: () => Promise<void>;
  /** 상품 목록 조회 중일 때 true */
  productsLoading: boolean;
  /** 결제 진행 중인 상품의 sku. 없으면 null */
  purchasingSku: string | null;
}

const MOCK_PRODUCTS: IapProductListItem[] = [
  {
    sku: "support_coffee_monthly",
    displayName: "커피 한 잔 월간 후원",
    description: "매월 $0.99로 무제한 스캔권 받고 커피 한 잔으로 쿨박스를 후원해요.",
    displayAmount: "월 $0.99",
    iconUrl: ""
  },
  {
    sku: "ocr_monthly",
    displayName: "광고 제거 구독",
    description: "매월 $2.9로 광고 없이 영수증 무제한으로 자동 등록해 보세요.",
    displayAmount: "월 $2.9",
    iconUrl: ""
  },
  {
    sku: "fridge_addon_3",
    displayName: "냉장고 추가 3대 패키지",
    description: "$4.9로 냉장고를 최대 3대까지 추가로 개설할 수 있습니다.",
    displayAmount: "$4.9",
    iconUrl: ""
  },
  {
    sku: "fridge_addon_5",
    displayName: "냉장고 추가 5대 패키지",
    description: "$9.9로 냉장고를 최대 5대까지 추가로 개설할 수 있습니다.",
    displayAmount: "$9.9",
    iconUrl: ""
  }
];

export function useInAppPurchase(): UseInAppPurchaseReturn {
  const dialog = useDialog();

  const [products, setProducts] = useState<IapProductListItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [purchasingSku, setPurchasingSku] = useState<string | null>(null);

  useEffect(() => {
    setProductsLoading(true);
    const timer = setTimeout(() => {
      setProducts(MOCK_PRODUCTS);
      setProductsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const purchaseProduct = useCallback(
    async (sku: string) => {
      const product = MOCK_PRODUCTS.find((p) => p.sku === sku);
      if (!product) return;

      setPurchasingSku(sku);

      try {
        const isConfirmed = await dialog.openConfirm({
          title: "인앱 상품 구매",
          description: `"${product.displayName}" 상품(${product.displayAmount})을 구매하시겠습니까?`,
        });

        if (isConfirmed) {
          // 로컬 스토리지에 구매 기록 저장
          localStorage.setItem(`coolbox_purchased_${sku}`, "true");

          // 결제 이벤트 전파
          window.dispatchEvent(new CustomEvent("coolbox_iap_change", { detail: { sku } }));

          // 로그인 세션이 존재하면 Supabase의 coolbox_members 데이터 갱신도 모사
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log("[IAP] Supabase DB sync completed for user ID:", session.user.id);
          }

          await dialog.openAlert({
            title: "구매 완료",
            description: `"${product.displayName}" 상품 구매가 완료되었습니다.`,
          });
        }
      } catch (error) {
        console.error("인앱결제 실패:", error);
      } finally {
        setPurchasingSku(null);
      }
    },
    [dialog]
  );

  const restorePendingOrders = useCallback(async () => {
    console.log("[IAP] restorePendingOrders - 완료");
    localStorage.setItem("coolbox_purchased_ocr_monthly", "true");
    window.dispatchEvent(new CustomEvent("coolbox_iap_change", { detail: { sku: "ocr_monthly" } }));
  }, []);

  return {
    products,
    purchaseProduct,
    restorePendingOrders,
    productsLoading,
    purchasingSku,
  };
}

export function useOcrSubscription(): boolean {
  const [isAdFree, setIsAdFree] = useState(() => {
    return (
      localStorage.getItem("coolbox_purchased_ocr_monthly") === "true" ||
      localStorage.getItem("coolbox_purchased_fridge_addon_3") === "true" ||
      localStorage.getItem("coolbox_purchased_fridge_addon_5") === "true"
    );
  });

  useEffect(() => {
    const handleIapChange = () => {
      setIsAdFree(
        localStorage.getItem("coolbox_purchased_ocr_monthly") === "true" ||
        localStorage.getItem("coolbox_purchased_fridge_addon_3") === "true" ||
        localStorage.getItem("coolbox_purchased_fridge_addon_5") === "true"
      );
    };

    window.addEventListener("coolbox_iap_change", handleIapChange);
    return () => {
      window.removeEventListener("coolbox_iap_change", handleIapChange);
    };
  }, []);

  return isAdFree;
}
