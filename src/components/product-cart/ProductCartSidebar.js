"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProductCart } from "@/hooks/useProductCart";
import styles from "@/styles/pages/product-cart/ProductCartSidebar/ProductCartSidebar.module.css";
import Link from "next/link";
import { formatPrice } from "@/utils/formatPrice";

export function ProductCartSidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const { cart, fetchCart, productCartCount, setProductCartCount } =
    useProductCart();

  useEffect(() => {
    if (isOpen) {
      fetchCart(); // ✅ 開啟側邊欄時，獲取最新購物車數據
    }
  }, [isOpen, fetchCart]);

  // 當購物車數據改變時更新購物車數量
  useEffect(() => {
    setProductCartCount(cart.length);
  }, [cart, setProductCartCount]);

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`offcanvas-backdrop fade ${isOpen ? "show" : "d-none"}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* 側邊欄 */}
      <div
        className={`offcanvas offcanvas-end ${isOpen ? "show" : ""} ${
          styles.sidebar
        }`}
        tabIndex="-1"
      >
        <div className="offcanvas-header border-bottom">
          <h4 className={`offcanvas-title ${styles.pCartSidebarTitle}`}>
            商品購物車 ({productCartCount})
          </h4>
          <button
            type="button"
            className="btn-close"
            onClick={() => setIsOpen(false)}
          ></button>
        </div>

        <div className="offcanvas-body">
          {cart.length === 0 ? (
            <div className="text-center">
              <p className="text-muted mb-5">購物車內沒有商品</p>
              <Link
                href="/products"
                className={`${styles.sidebarCartButton} mt-5`}
                onClick={() => setIsOpen(false)}
              >
                去逛逛
              </Link>
            </div>
          ) : (
            <ul className="list-group">
              {cart.map((item) => (
                <li key={item.product_id} className={`list-group-item `}>
                  <Link
                    href={`/products/${item.product_id}`}
                    onClick={() => setIsOpen(false)}
                    className={`${styles.productSidebarLink}`}
                  >
                    <div className={`${styles.productSidebarItem}`}>
                      <img
                        src={`/images/products/${item.product_image}`}
                        alt={item.product_name}
                        className={` ${styles.productSidebarImage} mb-3`}
                      />
                      <div className="flex-grow-1">
                        <p className="mb-3">{item.product_name}</p>
                        <small className="text-muted">
                          數量: {item.quantity}
                        </small>
                      </div>
                      <span className="fw-bold mt-3">
                        NT$ {formatPrice(item.product_price * item.quantity)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="offcanvas-footer p-3 border-top text-center">
          <button
            className={`${styles.sidebarCartButton} w-100`}
            onClick={() => {
              router.push("/product-cart/cart");
              setIsOpen(false);
            }}
          >
            查看購物車
          </button>
        </div>
      </div>
    </>
  );
}
