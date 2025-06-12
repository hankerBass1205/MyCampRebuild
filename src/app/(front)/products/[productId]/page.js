"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useProductCart } from "@/hooks/useProductCart"; // ✅ 引入購物車鉤子
import { useSession } from "next-auth/react";

import "@/styles/pages/products/detail.css";
import ComponentsImageSwiper from "@/components/products/imageSwiper";
import ProductStarRateComponent from "@/components/products/ProductStarRate";

import { showCartAlert } from "@/utils/sweetalert"; // 老大做好的 SweetAlert
import { ToastContainerComponent, favoriteToast } from "@/utils/toast"; // 老大吐司
import { formatPrice } from "@/utils/formatPrice";

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  //數量狀態
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useProductCart(); // ✅ 取得 `addToCart` 函數
  const [isFavorite, setIsFavorite] = useState(false); // ✅ 記錄是否收藏
  const { data: session } = useSession();

  // ✅ 讀取商品資訊
  useEffect(() => {
    fetch(`/api/products/${productId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((error) => console.error("Error fetching product", error));
  }, [productId]);

  // ✅ 檢查商品是否在願望清單
  useEffect(() => {
    async function checkFavoriteStatus() {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/products/productFav");
        if (res.status === 401) return;
        if (!res.ok) throw new Error("無法獲取願望清單");
        const data = await res.json();
        const exists = data.wishlist.some(
          (item) => item.item_id === Number(productId)
        );
        setIsFavorite(exists);
      } catch (error) {
        console.error("檢查收藏狀態失敗:", error);
      }
    }
    checkFavoriteStatus();
  }, [productId]);

  // ✅ 加入/移除願望清單
  const handleAddFav = async () => {
    if (!session?.user) {
      showCartAlert.confirm("請先登入才能收藏商品").then((result) => {
        if (result.isConfirmed) router.push("/auth/login");
      });
      return;
    }
    try {
      if (isFavorite) {
        // ✅ 移除收藏
        const res = await fetch("/api/products/productFav", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: product.id }),
        });

        if (!res.ok) throw new Error("無法移除收藏");

        setIsFavorite(false);
        // console.log("🔴 取消收藏成功，執行 favoriteToast.removeSuccess()");
        favoriteToast.removeSuccess(); // ✅ 顯示移除成功吐司
        window.dispatchEvent(new Event("productFavUpdate"));
      } else {
        // ✅ 加入收藏
        const res = await fetch("/api/products/productFav", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: product.id }),
        });

        if (!res.ok) throw new Error("無法加入收藏");

        setIsFavorite(true);
        // console.log("❤️ 加入收藏成功，執行 favoriteToast.addSuccess()");
        favoriteToast.addSuccess(); // ✅ 顯示加入成功吐司
        window.dispatchEvent(new Event("productFavUpdate"));
      }
    } catch (error) {
      console.error("❌ 更新收藏狀態錯誤:", error);
    }
  };

  // ✅ 點擊「加入購物車」的處理函式
  const handleAddToCart = async (quantity) => {
    if (!product) return;

    try {
      const success = await addToCart(product.id, quantity); // ✅ `addToCart()` 若回傳 `false`，代表未登入
      if (!success) return; // ✅ 未登入時，直接結束，不跳出「商品已加入購物車！」

      showCartAlert.success("商品已加入購物車！"); // ✅ 只有成功加入時才顯示
    } catch (error) {
      console.error("加入購物車錯誤:", error);
      showCartAlert.error("加入購物車失敗，請稍後再試！");
    }
  };

  if (!product)
    return <div className="container mt-5 text-center">載入中...</div>;

  // console.log(product.stock);

  return (
    <div className="container mt-5">
      <div className="row">
        {/* 主圖片輪播 */}
        <div className="col-lg-8">
          <ComponentsImageSwiper product={product} />
        </div>

        {/* 商品資訊 */}
        <div className="col-lg-4 p-info">
          <div>
            <h2 className="text-p-name">{product.name}</h2>
          </div>
          <div className="mt-5">
            <h4 className="text-p-price">${formatPrice(product.price)}</h4>
          </div>
          <div className="mt-5">
            <p className="text-p-description">{product.description}</p>
          </div>

          <div className="mt-5">
            <p className="text-p-stock">剩餘庫存 : {product.stock}</p>
          </div>

          {/* 數量 */}
          <div className="quantity item-style d-flex mt-5">
            <button
              onClick={() => {
                if (quantity <= 1) return;
                setQuantity(quantity - 1);
              }}
            >
              -
            </button>
            <input
              className="w-100 text-center"
              type="text"
              value={quantity}
              readOnly
            />
            <button
              onClick={() => {
                if (quantity >= product.stock) return;
                setQuantity(quantity + 1);
              }}
            >
              +
            </button>
          </div>

          <div className="mt-4 row">
            {/* ✅ 按鈕綁定 `handleAddToCart`  handleAddFav */}
            <div className="col-2 g-0">
              <button
                className={`btn btn-add-fav mb-3 `}
                onClick={() => handleAddFav()}
                disabled={product.stock === 0}
              >
                <i
                  className={`fa-heart fa-lg ${
                    isFavorite ? "fa-solid text-danger" : "fa-regular"
                  }`}
                ></i>
              </button>
            </div>
            <div className="col-10">
              <button
                className="btn btn-add-cart "
                onClick={() => handleAddToCart(quantity)}
                disabled={product.stock === 0}
              >
                {product.stock > 0 ? "加入購物車" : "已售完！請等待補貨！"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProductStarRateComponent />
      <ToastContainerComponent />
    </div>
  );
}
