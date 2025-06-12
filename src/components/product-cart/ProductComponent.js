"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useProductCart } from "@/hooks/useProductCart"; // ✅ 使用購物車鉤子
import CartHeader from "./CartHeader";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import { formatPrice } from "@/utils/formatPrice";
import { showCartAlert } from "@/utils/sweetalert"; // 老大做好的 SweetAlert
import { ToastContainerComponent, cartToast } from "@/utils/toast";

export default function ProductComponent() {
  const { cart, fetchCart } = useProductCart(); // ✅ 取得購物車內容與 API 函數
  const router = useRouter(); // ✅ 設定路由導航

  // ✅ 頁面載入時，讀取購物車
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ✅ 更新數量
  const handleQuantityChange = async (cartItemId, change) => {
    cartToast.updateSuccess();
    try {
      const res = await fetch(`/api/product-cart/${cartItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ change }),
      });

      if (!res.ok) throw new Error("更新數量失敗");

      fetchCart(); // ✅ 重新取得最新購物車內容
    } catch (error) {
      console.error("數量變更錯誤:", error);
    }
  };

  // ✅ 刪除商品
  const handleDelete = async (cartItemId) => {
    try {
      const result = await showCartAlert.confirm(
        "確定要移除此商品？",
        "移除後將無法復原"
      );

      if (!result.isConfirmed) return;

      const res = await fetch(`/api/product-cart/${cartItemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("刪除失敗");

      fetchCart(); // ✅ 重新取得最新購物車內容
    } catch (error) {
      console.error("刪除商品錯誤:", error);
    }
  };

  // ✅ 計算總價格（使用 useMemo 避免不必要的重新計算）
  const totalPrice = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.product_price * item.quantity,
      0
    );
  }, [cart]);

  // 前往結帳函式 （檢查是否購物車為空）
  const handleCheckout = async () => {
    if (cart.length === 0) {
      // ✅ SweetAlert 提示使用者購物車為空
      const result = await showCartAlert.error(
        "購物車沒有商品喔！",
        "請先選購商品再進行結帳"
      );

      if (result.isConfirmed) {
        router.push("/products"); // ✅ 跳轉至商品列表頁
      }
    } else {
      router.push("/product-cart/fill-cart"); // ✅ 正常跳轉至結帳頁
    }
  };

  return (
    <>
      <section className="cart-product">
        <div className="container">
          <div className="main">
            <CartHeader />
            <article className="content">
              <div className="header">
                <p>商品資料</p>
                <p className="text-center">單品價錢</p>
                <p className="text-center">數量</p>
                <p className="text-center">小計</p>
                <p className="text-center" />
              </div>
              <hr />
              <div className="item-content">
                {/* ✅ 只讀取購物車內容，不做刪除或數量變更 */}
                {cart.map((item) => (
                  <CartItem
                    key={item.cart_item_id} // ✅ 確保 `key` 唯一性
                    product_id={item.product_id}
                    product_name={item.product_name}
                    product_image={item.product_image}
                    product_price={item.product_price}
                    product_stock={item.product_stock}
                    quantity={item.quantity}
                    subtotal={item.product_price * item.quantity} // ✅ 計算小計
                    onQuantityChange={(change) =>
                      handleQuantityChange(item.cart_item_id, change)
                    }
                    onDelete={() => handleDelete(item.cart_item_id)}
                  />
                ))}
              </div>
            </article>
            <hr />
            {/* ✅ 計算總金額 */}
            <CartSummary total={formatPrice(totalPrice)} />
          </div>

          <div className="mt-5 d-flex justify-content-center">
            <button
              className="submit me-3"
              onClick={() => router.push("/products")}
            >
              繼續購物
            </button>
            <button className="submit ms-3" onClick={() => handleCheckout()}>
              前往結帳
            </button>
          </div>
        </div>
      </section>
      <ToastContainerComponent />
    </>
  );
}
