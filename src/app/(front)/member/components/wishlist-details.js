"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SearchBar from "./search-bar";
import SortAndFilter from "./sort-filter";
import "bootstrap-icons/font/bootstrap-icons.css";
import Swal from "sweetalert2";
import { useProductCart } from "@/hooks/useProductCart";
import Pagination from "./Pagination";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function WishlistDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const { addToCart } = useProductCart();

  // 新增狀態
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [animatingSearch, setAnimatingSearch] = useState(false);
  const [animatingSort, setAnimatingSort] = useState(false);
  const [animatingFilter, setAnimatingFilter] = useState(false);

  const itemsPerPage = 5; // 每頁顯示的願望清單項目數量

  // 新增容器參考
  const containerRef = useRef(null);

  useEffect(() => {
    // if (status === "loading") return;

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
        confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
      });
      router.push("/auth/login");
      return;
    }

    const fetchWishlistItems = async () => {
      try {
        const response = await axios.get(
          `/api/member/wishlist/${session.user.id}`
        );
        setWishlistItems(response.data);
        setFilteredItems(response.data);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        if (error.response && error.response.status === 404) {
          console.log("沒有願望清單項目");
        } else {
          console.error("獲取願望清單失敗", error);
        }
      }
    };

    fetchWishlistItems();
  }, [session, status, router]);

  // 處理搜尋 - 添加 null 檢查
  const handleSearch = (term) => {
    setAnimatingSearch(true);
    setSearchTerm(term);

    const filtered = wishlistItems.filter((item) => {
      // 添加 item.item_name 的 null 檢查
      const itemName = item.item_name || "";
      return itemName.toLowerCase().includes(term.toLowerCase());
    });

    setFilteredItems(filtered);
    setCurrentPage(1);

    setTimeout(() => {
      setAnimatingSearch(false);
    }, 300);
  };

  // 處理排序 - 改進 null 值處理
  const handleSortChange = (option) => {
    setAnimatingSort(true);
    setSortOption(option);

    const sorted = [...filteredItems].sort((a, b) => {
      if (option === "date_asc") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      } else if (option === "date_desc") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      } else if (option === "price_asc") {
        // 處理 null 和 undefined 的價格
        const aPrice =
          a.item_price === null || a.item_price === undefined
            ? 0
            : typeof a.item_price === "object" && a.item_price !== null
            ? a.item_price.min || 0
            : a.item_price || 0;

        const bPrice =
          b.item_price === null || b.item_price === undefined
            ? 0
            : typeof b.item_price === "object" && b.item_price !== null
            ? b.item_price.min || 0
            : b.item_price || 0;

        return aPrice - bPrice;
      } else if (option === "price_desc") {
        // 處理 null 和 undefined 的價格
        const aPrice =
          a.item_price === null || a.item_price === undefined
            ? 0
            : typeof a.item_price === "object" && a.item_price !== null
            ? a.item_price.max || 0
            : a.item_price || 0;

        const bPrice =
          b.item_price === null || b.item_price === undefined
            ? 0
            : typeof b.item_price === "object" && b.item_price !== null
            ? b.item_price.max || 0
            : b.item_price || 0;

        return bPrice - aPrice;
      }
      return 0;
    });

    setFilteredItems(sorted);
    setCurrentPage(1);

    setTimeout(() => {
      setAnimatingSort(false);
    }, 300);
  };

  // 處理篩選 - 添加 null 檢查
  const handleFilterChange = (option) => {
    setAnimatingFilter(true);
    setFilterOption(option);

    const filtered = wishlistItems.filter((item) => {
      // 先應用搜尋條件 - 添加 null 檢查
      const itemName = item.item_name || "";
      const matchesSearch = itemName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // 再應用篩選條件
      const matchesFilter = option === "" || item.type === option;

      return matchesSearch && matchesFilter;
    });

    setFilteredItems(filtered);
    setCurrentPage(1);

    setTimeout(() => {
      setAnimatingFilter(false);
    }, 300);
  };

  const handleAddToCart = async (item) => {
    try {
      if (item.type === "camp") {
        // 營地/活動購物車處理方式不變
        const response = await axios.post("/api/member/activity-cart", {
          user_id: session.user.id,
          activity_id: item.item_id,
          quantity: 1,
        });

        if (response.status === 200) {
          Swal.fire({
            icon: "success",
            title: "已加入購物車",
            text: "營地/活動已成功加入購物車",
            confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
          });
        }
      } else {
        // 商品購物車 - 正確使用 addToCart 函數
        // 直接傳遞 item_id 和數量 1，而不是傳遞整個對象
        const success = await addToCart(item.item_id, 1);

        if (success) {
          Swal.fire({
            icon: "success",
            title: "已加入購物車",
            text: "商品已成功加入購物車",
            confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
          });
        }
      }
    } catch (error) {
      console.error("加入購物車錯誤:", error);
      Swal.fire({
        icon: "error",
        title: "加入購物車失敗",
        text: error.message || "請稍後再試",
        confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
      });
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await axios.delete(`/api/member/wishlist/${session.user.id}`, {
        data: { id: itemId },
      });

      // 更新狀態，移除已刪除的項目
      setWishlistItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId)
      );
      setFilteredItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId)
      );

      Swal.fire({
        icon: "success",
        title: "已從願望清單移除",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "刪除失敗",
        text: "請稍後再試",
      });
    }
  };

  // 修改分頁處理函數，添加滾動功能
  const handlePageChange = (page) => {
    setCurrentPage(page);

    // 添加延遲，確保內容更新後再滾動
    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  // 更新總頁數
  useEffect(() => {
    setTotalPages(Math.ceil(filteredItems.length / itemsPerPage));
  }, [filteredItems, itemsPerPage]);

  // 分頁後的項目
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 定義排序與篩選選項
  const sortOptions = [
    { value: "", label: "未排序" },
    { value: "date_asc", label: "日期（舊到新）" },
    { value: "date_desc", label: "日期（新到舊）" },
    { value: "price_asc", label: "價格（低到高）" },
    { value: "price_desc", label: "價格（高到低）" },
  ];

  const filterOptions = [
    { value: "", label: "全部類型" },
    { value: "product", label: "商品" },
    { value: "camp", label: "營地/活動" },
  ];

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatPrice = (price) => {
    // 處理 null 值
    if (price === null || price === undefined) {
      return "";
    }

    if (typeof price === "object" && price !== null) {
      const min = price.min || 0;
      const max = price.max || 0;
      return `${min.toLocaleString("zh-TW")} ~ NT$${max.toLocaleString(
        "zh-TW"
      )}`;
    }
    return price ? Math.floor(price).toLocaleString("zh-TW") : "";
  };

  return (
    <div className="wishlist-details">
      <h1>願望清單</h1>

      <div className="controls-container">
        <div className="control-row">
          {" "}
          {/* 將控制項包裝在額外的容器中 */}
          <SortAndFilter
            sortOptions={sortOptions}
            filterOptions={filterOptions}
            onSortChange={handleSortChange}
            onFilterChange={handleFilterChange}
            currentSort={sortOption}
            currentFilter={filterOption}
          />
        </div>
        <div className="search-section">
          {" "}
          {/* 新增搜尋區域容器 */}
          <SearchBar
            placeholder="搜尋願望清單..."
            onSearch={handleSearch}
            value={searchTerm}
          />
        </div>
      </div>

      {/* 篩選標籤顯示 */}
      {(searchTerm || sortOption || filterOption) && (
        <div className="active-filters">
          {searchTerm && (
            <span className="filter-tag">
              搜尋: "{searchTerm}"
              <button className="tag-remove" onClick={() => handleSearch("")}>
                ×
              </button>
            </span>
          )}
          {sortOption && (
            <span className="filter-tag">
              排序: {sortOptions.find((opt) => opt.value === sortOption).label}
              <button
                className="tag-remove"
                onClick={() => handleSortChange("")}
              >
                ×
              </button>
            </span>
          )}
          {filterOption && (
            <span className="filter-tag">
              篩選:
              {filterOptions.find((opt) => opt.value === filterOption).label}
              <button
                className="tag-remove"
                onClick={() => handleFilterChange("")}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* 添加 ref 到容器 */}
      <div
        ref={containerRef}
        className={`wishlist-items-container ${
          animatingSearch || animatingSort || animatingFilter ? "sorting" : ""
        }`}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            // 加載狀態顯示骨架屏
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {Array(itemsPerPage)
                .fill()
                .map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    className="wishlist-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* 添加骨架屏內部結構元素 */}
                    <div className="skeleton-content">
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line"></div>
                      <div className="skeleton-date"></div>
                      <div className="skeleton-price"></div>
                    </div>
                    <div className="skeleton-actions"></div>
                  </motion.div>
                ))}
            </motion.div>
          ) : currentItems.length === 0 ? (
            // 沒有項目時顯示的提示文字
            <motion.div
              key="no-data"
              className="no-data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p>
                {searchTerm
                  ? "沒有符合搜尋條件的項目"
                  : filterOption === "product"
                  ? "沒有加入願望清單的商品"
                  : filterOption === "camp"
                  ? "沒有加入願望清單的營地/活動"
                  : "願望清單中沒有項目"}
              </p>
            </motion.div>
          ) : (
            // 顯示願望清單項目
            <motion.div
              key="items-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {currentItems.map((item, index) => (
                <motion.div
                  className="wishlist-item"
                  key={item.id || `item-${index}`}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      delay: index * 0.05,
                    },
                  }}
                  exit={{ opacity: 0 }}
                >
                  <div className="wishlist-image">
                    <img
                      src={
                        item.item_image
                          ? item.type === "camp"
                            ? `/uploads/activities/${item.item_image}`
                            : `/images/products/${item.item_image}`
                          : "/images/camps/default/default.jpg"
                      }
                      alt={item.item_name}
                    />
                  </div>
                  <div className="wishlist-content">
                    <Link
                      href={
                        item.type === "camp"
                          ? `/camping/activities/${item.item_id}`
                          : `/products/${item.item_id}`
                      }
                    >
                      <div className="wishlist-title">{item.item_name}</div>
                    </Link>
                    <div className="wishlist-text">
                      類型：{item.type === "camp" ? "營地/活動" : "商品"}
                    </div>
                    <div className="wishlist-subtitle">
                      {item.item_description}
                    </div>
                    <div className="wishlist-date">
                      <p>新增日期：{formatDate(item.created_at)}</p>
                    </div>

                    <div className="wishlist-price">
                      NT${formatPrice(item.item_price)}
                    </div>
                  </div>
                  <div className="wishlist-actions">
                    <button onClick={() => handleAddToCart(item)}>
                      加入購物車
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(item.id)}
                    >
                      移除
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 分頁控制，當頁數大於 1 時才顯示 */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.2 }}
          className="pagination-container"
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </motion.div>
      )}
    </div>
  );
}
