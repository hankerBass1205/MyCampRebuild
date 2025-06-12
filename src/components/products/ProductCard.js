"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { favoriteToast } from "@/utils/toast";
import { showCartAlert } from "@/utils/sweetalert";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { formatPrice } from "@/utils/formatPrice";

// ✅ 每個 `ProductCard` 進場動畫
const itemVariants = {
  hidden: { opacity: 0, y: 50 }, // ✅ 從 50px 下方進場
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 10 },
  },
};

export default function ProductCard({ product }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const checkFavoriteStatus = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/products/productFav");

      if (res.status === 401) return;
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data = await res.json();
      const exists = Array.isArray(data.wishlist)
        ? data.wishlist.some((item) => item.item_id === product.id)
        : false;
      setIsFavorite(exists);
    } catch (error) {
      if (!error.message.includes("401")) {
        console.error("檢查收藏狀態失敗:", error);
      }
    }
  }, [product.id, session]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  // ✅ 收藏/取消收藏
  const toggleFavorite = async () => {
    if (!session?.user) {
      showCartAlert.confirm("請先登入才能收藏商品").then((result) => {
        if (result.isConfirmed) router.push("/auth/login");
      });
      return;
    }

    try {
      const res = await fetch("/api/products/productFav", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: product.id }),
      });

      if (!res.ok)
        throw new Error(isFavorite ? "無法移除收藏" : "無法加入收藏");

      setIsFavorite(!isFavorite);
      isFavorite ? favoriteToast.removeSuccess() : favoriteToast.addSuccess();
      window.dispatchEvent(new Event("productFavUpdate"));
    } catch (error) {
      console.error("❌ 更新收藏狀態錯誤:", error);
    }
  };

  return (
    <motion.div className="col" variants={itemVariants}>
      <motion.div
        className="product-card"
        whileHover={{ scale: 1.02 }} // ✅ 滑鼠移入時放大
        whileTap={{ scale: 0.97 }} // ✅ 點擊時縮小
      >
        <div className="card border-0">
          <Link href={`/products/${product.id}`}>
            {" "}
            <img
              src={`/images/products/sm_${product.main_image}`}
              alt={product.name}
              className="card-img-top"
              // 如果小圖連結 404 或無法載入，就改用大圖
              onError={(e) => {
                e.currentTarget.src = `/images/products/${product.main_image}`;
              }}
            />
          </Link>
          <div className="card-body">
            <Link href={`/products/${product.id}`}>
              <h5 className="card-title mb-3">{product.name}</h5>
            </Link>
            <div className="d-flex justify-content-between mt-5 card-body-text">
              <p className="card-text">${formatPrice(product.price)}</p>
              <button
                className="border-0 bg-transparent "
                onClick={toggleFavorite}
              >
                <i
                  className={`fa-heart fa-lg ${
                    isFavorite ? "fa-solid text-danger" : "fa-regular"
                  }`}
                ></i>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
