import { useEffect } from "react";
import { useInAppPurchase } from "../hooks/useInAppPurchase";

interface InAppPurchasePageProps {
  onBack: () => void;
}

export function InAppPurchasePage({ onBack }: InAppPurchasePageProps) {
  const {
    products,
    purchaseProduct,
    restorePendingOrders,
    productsLoading,
    purchasingSku,
  } = useInAppPurchase();

  useEffect(() => {
    restorePendingOrders();
  }, [restorePendingOrders]);

  // 상단 헤더 컴포넌트
  const renderHeader = () => (
    <div style={{ 
      padding: "20px 24px", 
      borderBottom: "1px solid var(--border-primary)",
      display: "flex",
      alignItems: "center"
    }}>
      <h2 style={{ 
        fontSize: "22px", 
        fontWeight: "bold", 
        margin: 0, 
        color: "var(--text-primary)" 
      }}>
        인앱결제
      </h2>
    </div>
  );

  if (productsLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--bg-app)" }}>
        {renderHeader()}
        <div style={{ padding: "24px", fontSize: "16px", color: "var(--text-secondary)" }}>
          상품을 불러오는 중...
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--bg-app)" }}>
        {renderHeader()}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "400px", 
          padding: "24px", 
          textAlign: "center" 
        }}>
          <div style={{ 
            width: "60px", 
            height: "60px", 
            borderRadius: "16px", 
            backgroundColor: "var(--bg-inner)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: "30px",
            marginBottom: "16px"
          }}>
            📄
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "var(--text-primary)", margin: "0 0 8px 0" }}>
            인앱 상품이 없어요
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 24px 0", lineHeight: "1.5" }}>
            콘솔 '인앱 결제' 메뉴에서 상품을 등록해 주세요.
          </p>
          <button 
            onClick={onBack} 
            style={{ 
              padding: "12px 24px", 
              backgroundColor: "var(--point-blue, #3182F6)", 
              color: "#FFFFFF",
              border: "none", 
              borderRadius: "12px", 
              fontSize: "15px", 
              fontWeight: "bold", 
              cursor: "pointer" 
            }}
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--bg-app)" }}>
      {renderHeader()}

      <div style={{ display: "flex", flexDirection: "column", padding: "0 24px", overflowY: "auto", flex: 1 }}>
        {products.map((product) => (
          <div 
            key={product.sku} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              padding: "20px 0", 
              borderBottom: "1px solid var(--border-primary)" 
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, overflow: "hidden" }}>
              {product.iconUrl ? (
                <img 
                  src={product.iconUrl} 
                  alt={product.displayName} 
                  style={{ width: "48px", height: "48px", borderRadius: "12px", objectFit: "cover" }} 
                />
              ) : (
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  backgroundColor: "var(--bg-inner)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "24px" 
                }}>
                  🎁
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflow: "hidden" }}>
                <span style={{ 
                  fontSize: "16px", 
                  fontWeight: "bold", 
                  color: "var(--text-primary)", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap", 
                  overflow: "hidden" 
                }}>
                  {product.displayName}
                </span>
                <span style={{ 
                  fontSize: "14px", 
                  color: "var(--text-secondary)", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap", 
                  overflow: "hidden" 
                }}>
                  {product.description}
                </span>
                <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: "500" }}>
                  {product.displayAmount}
                </span>
              </div>
            </div>
            
            <button
              disabled={purchasingSku !== null}
              onClick={() => purchaseProduct(product.sku)}
              style={{
                padding: "10px 16px", 
                backgroundColor: "var(--point-blue, #3182F6)", 
                color: "#FFFFFF",
                border: "none", 
                borderRadius: "12px", 
                fontSize: "14px", 
                fontWeight: "bold", 
                cursor: "pointer",
                opacity: purchasingSku !== null ? 0.6 : 1, 
                transition: "opacity 0.2s"
              }}
            >
              {purchasingSku === product.sku ? "구매 중..." : "구매하기"}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        style={{
          padding: "16px 24px", 
          backgroundColor: "transparent", 
          color: "var(--point-blue, #3182F6)",
          border: "none", 
          fontSize: "16px", 
          fontWeight: "bold", 
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}
      >
        ← 홈으로
      </button>
    </div>
  );
}
