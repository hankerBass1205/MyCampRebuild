"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { showCartAlert } from "@/utils/sweetalert";

const ProductCartContext = createContext(null);

export function ProductCartProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cart, setCart] = useState([]); // 購物車內容
  const [isProductCartOpen, setIsProductCartOpen] = useState(false);
  const [productCartCount, setProductCartCount] = useState(0); // 商品數量
  const { data: session } = useSession();

  // 讀取購物車
  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/product-cart", {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 401) {
        // ✅ 讓 confirm 彈窗確實等待用戶回應
        const result = await showCartAlert.confirm(
          "請先登入才能查看購物車內容"
        );

        if (result.isConfirmed) {
          router.push("/auth/login");
        } else {
          setIsProductCartOpen(false); // ✅ 確保按取消時關閉購物車
        }

        return;
      }

      if (!res.ok) throw new Error("無法獲取購物車");

      const data = await res.json();
      setCart(data);
      setProductCartCount(data.length); // ✅ 更新購物車數量
    } catch (error) {
      console.error("購物車讀取失敗:", error);
    }
  }, [router]);

  // 當有商品新增時，重新獲取購物車
  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!session?.user) {
        showCartAlert.confirm("請先登入才能加入購物車").then((result) => {
          if (result.isConfirmed) router.push("/auth/login");
        });
        return;
      }
      try {
        const res = await fetch("/api/product-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });

        if (!res.ok) throw new Error("加入購物車失敗");

        await fetchCart(); // ✅ 商品加入後自動更新購物車
        return true;
      } catch (error) {
        console.error("加入購物車錯誤:", error);
        return false;
      }
    },
    [fetchCart, router]
  );

  return (
    <ProductCartContext.Provider
      value={{
        cart,
        addToCart,
        fetchCart,
        isProductCartOpen,
        setIsProductCartOpen,
        productCartCount,
        setProductCartCount,
      }}
    >
      {children}
    </ProductCartContext.Provider>
  );
}

export function useProductCart() {
  const context = useContext(ProductCartContext);
  if (!context) {
    throw new Error("useProductCart 必須在 ProductCartProvider 內使用");
  }
  return context;
}
