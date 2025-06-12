"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SearchBar from "./search-bar";
import "bootstrap-icons/font/bootstrap-icons.css";
import SortAndFilter from "./sort-filter";
import StarRating from "./star-rating";
import Swal from "sweetalert2";
import Pagination from "./Pagination";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// 我的評論
export default function ReviewsDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [newContent, setNewContent] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true); // 加載狀態
  const itemsPerPage = 3; // 每頁顯示的評論數量

  // 添加排序動畫狀態
  const [animatingSort, setAnimatingSort] = useState(false);
  const [animatingFilter, setAnimatingFilter] = useState(false);
  const [removingReviewId, setRemovingReviewId] = useState(null);

  // 新增容器參考
  const containerRef = useRef(null);

  useEffect(() => {
    // if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
        confirmButtonColor: "#5b4034",
      });
      router.push("/auth/login");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    const fetchReviews = async () => {
      try {
        const response = await axios.get(`/api/member/reviews/${userId}`, {
          params: { type: filterOption, sort: sortOption },
        });
        setReviews(response.data);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        setLoading(false); // 數據加載完成
      } catch (error) {
        setLoading(false); // 數據加載完成
        if (error.response && error.response.status === 404) {
          console.log("沒有評論");
        } else {
          console.error("There was an error fetching the reviews!", error);
        }
      }
    };

    fetchReviews();
  }, [session, status, filterOption, sortOption]);

  const handleSearch = (term) => {
    // 添加搜尋動畫效果
    setAnimatingSort(true);
    setSearchTerm(term);
    setCurrentPage(1);

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingSort(false);
    }, 300);
  };

  // 修改排序處理函數，添加動畫效果
  const handleSortChange = (option) => {
    setAnimatingSort(true);
    setSortOption(option);
    setCurrentPage(1);

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingSort(false);
    }, 300);
  };

  // 修改篩選處理函數，添加動畫效果
  const handleFilterChange = (option) => {
    setAnimatingFilter(true);
    setFilterOption(option);
    setCurrentPage(1);

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingFilter(false);
    }, 300);
  };

  // 抽出排序邏輯成為獨立函數
  const applySorting = (items, sortBy) => {
    if (!sortBy) return items;

    return [...items].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === "rating") {
        return b.rating - a.rating;
      }
      return 0;
    });
  };

  // 使用 useMemo 優化過濾和搜尋，減少不必要的重新運算
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // 新增防禦性檢查，確保 content 和 item_name 不是 null 或 undefined
      const content = review.content || "";
      const itemName = review.item_name || "";

      return (
        (content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          itemName.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterOption ? review.type === filterOption : true)
      );
    });
  }, [reviews, searchTerm, filterOption]);

  // 使用 useMemo 優化排序，確保排序邏輯一致
  const sortedAndFilteredReviews = useMemo(() => {
    return applySorting(filteredReviews, sortOption);
  }, [filteredReviews, sortOption]);

  // 計算分頁數據
  const paginatedReviews = useMemo(() => {
    return sortedAndFilteredReviews.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedAndFilteredReviews, currentPage, itemsPerPage]);

  // 更新總頁數計算
  useEffect(() => {
    setTotalPages(Math.ceil(filteredReviews.length / itemsPerPage));

    // 確保當前頁面有效
    if (
      currentPage > Math.ceil(filteredReviews.length / itemsPerPage) &&
      filteredReviews.length > 0
    ) {
      setCurrentPage(1);
    }
  }, [filteredReviews.length, itemsPerPage]);

  const handleRatingChange = async (itemId, newRating) => {
    try {
      await axios.post(`/api/member/reviews/${session.user.id}`, {
        itemId,
        rating: newRating,
        content: reviews.find((review) => review.item_id === itemId).content,
      });
      // 使用動畫方式更新評分
      setAnimatingSort(true);
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.item_id === itemId ? { ...review, rating: newRating } : review
        )
      );

      setTimeout(() => {
        setAnimatingSort(false);
      }, 300);
    } catch (error) {
      console.error("There was an error updating the rating!", error);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setNewContent(review.content);
  };

  const handleSaveReview = async () => {
    try {
      await axios.post(`/api/member/reviews/${session.user.id}`, {
        itemId: editingReview.item_id,
        rating: editingReview.rating,
        content: newContent,
      });
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.item_id === editingReview.item_id
            ? { ...review, content: newContent }
            : review
        )
      );
      setEditingReview(null);
      setNewContent("");
    } catch (error) {
      console.error("There was an error updating the review!", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setNewContent("");
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

  const sortOptions = [
    { value: "", label: "未選擇" },
    { value: "date", label: "日期" },
    { value: "rating", label: "評分" },
  ];

  const filterOptions = [
    { value: "", label: "未選擇" },
    { value: "product", label: "商品" },
    { value: "camp", label: "營地/活動" },
  ];

  return (
    <div className="reviews-details">
      <h1>我的評論</h1>
      <SortAndFilter
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        currentSort={sortOption}
        currentFilter={filterOption}
      />
      <SearchBar
        placeholder="搜尋評論..."
        onSearch={handleSearch}
        value={searchTerm}
      />

      {/* 添加篩選標籤顯示 */}
      {(sortOption || filterOption || searchTerm) && (
        <div className="active-filters">
          {sortOption && (
            <span className="filter-tag">
              {sortOptions.find((opt) => opt.value === sortOption)?.label}
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
              {filterOptions.find((opt) => opt.value === filterOption)?.label}
              <button
                className="tag-remove"
                onClick={() => handleFilterChange("")}
              >
                ×
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="filter-tag">
              "{searchTerm}"{" "}
              <button className="tag-remove" onClick={() => handleSearch("")}>
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* 添加 ref 到容器 */}
      <div
        ref={containerRef}
        className={`reviews-items-container ${
          animatingSort || animatingFilter ? "sorting" : ""
        }`}
      >
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array(itemsPerPage)
              .fill()
              .map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  className="reviews-skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="skeleton-image"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-meta"></div>
                    <div className="skeleton-description"></div>
                    <div className="skeleton-date"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-actions">
                      <div className="skeleton-button"></div>
                    </div>
                  </div>
                </motion.div>
              ))
          ) : paginatedReviews.length === 0 ? (
            <motion.div
              className="no-data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <p>
                {searchTerm
                  ? "沒有符合搜尋條件的評論紀錄"
                  : filterOption
                  ? `沒有${
                      filterOptions.find((opt) => opt.value === filterOption)
                        ?.label
                    }的評價紀錄`
                  : "沒有評價過商品"}
              </p>
            </motion.div>
          ) : (
            paginatedReviews.map((review, index) => (
              <motion.div
                className="review-item"
                key={`review-${review.id || review.item_id + "-" + index}`} // 修改這行，使用 review.id 或 組合 item_id 和 index
                layoutId={`review-${review.id || review.item_id + "-" + index}`} // 同樣更新 layoutId
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.4,
                    delay: index * 0.1,
                  },
                }}
                exit={{
                  opacity: 0,
                  y: -30,
                  transition: { duration: 0.3 },
                }}
              >
                <div className="review-image">
                  {review.item_image ? (
                    <img
                      src={
                        review.type === "camp"
                          ? `/uploads/activities/${review.item_image}`
                          : `/images/products/${review.item_image}`
                      }
                      alt={review.item_name}
                      style={{ borderRadius: "8px" }}
                    />
                  ) : (
                    <img
                      src="/uploads/activities/105_674d1feb03202.jpg"
                      alt="預設圖片"
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                  <StarRating
                    initialRating={review.rating}
                    onRatingChange={(newRating) =>
                      handleRatingChange(review.item_id, newRating)
                    }
                    size={38}
                  />
                  <div className="review-rating"></div>
                </div>
                <div className="review-content">
                  <div>
                    <div className="review-title">
                      <Link
                        href={
                          review.type === "camp"
                            ? `/camping/activities/${review.item_id}`
                            : `/products/${review.item_id}`
                        }
                      >
                        {review.item_name}
                      </Link>
                    </div>
                    <div className="review-date">
                      {review.type === "camp"
                        ? "類型：營地/活動"
                        : review.type === "product"
                        ? "類型：商品"
                        : review.type}
                    </div>
                    <div className="review-product-description">
                      {review.item_description}
                    </div>
                    <div className="review-date">
                      新增日期：
                      {new Date(review.created_at).toLocaleDateString("zh-TW", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>

                    {editingReview &&
                    editingReview.item_id === review.item_id ? (
                      <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        style={{ width: "100%" }}
                        className="form-control d-inline-flex focus-ring text-decoration-none"
                      />
                    ) : (
                      <span
                        className="review-text"
                        dangerouslySetInnerHTML={{ __html: review.content }}
                      />
                    )}
                  </div>

                  <div className="review-actions">
                    {editingReview &&
                    editingReview.item_id === review.item_id ? (
                      <div className="edit-actions">
                        <button onClick={handleSaveReview}>保存</button>
                        <button onClick={handleCancelEdit}>取消</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEditReview(review)}>
                        修改評論
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="pagination-container">
        {!loading && filteredReviews.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
