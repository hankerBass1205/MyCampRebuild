"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import SearchBar from "./search-bar";
import SortAndFilter from "./sort-filter";
import Pagination from "./Pagination";
import { useRouter } from "next/navigation";
import "bootstrap-icons/font/bootstrap-icons.css";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

import "../styles/components/_pagination.scss"; // 新增這行
import { motion } from "framer-motion";
export default function ArticlesAndFavoritesDetails() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [filterOption, setFilterOption] = useState(""); // 修改這行
  const [currentPage, setCurrentPage] = useState(1); // 新增這行
  const [itemsPerPage] = useState(5); // 新增這行
  const router = useRouter();

  const [articles, setArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [expandedItems, setExpandedItems] = useState({}); // 新增這行
  const [loading, setLoading] = useState(true); // 加載狀態
  const [removingFavoriteId, setRemovingFavoriteId] = useState(null); // 添加要移除收藏的ID狀態
  const [animatingSort, setAnimatingSort] = useState(false); // 添加排序動畫狀態
  const [animatingFilter, setAnimatingFilter] = useState(false);
  const [animatingSearch, setAnimatingSearch] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
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

    const userId = session.user.id;

    axios
      .get(`/api/member/articles/${userId}`)
      .then((response) => {
        setArticles(response.data);
        setTimeout(() => setLoading(false), 2000);
      })
      .catch((error) => {
        setTimeout(() => setLoading(false), 1000); // 延遲2秒後設置加載狀態為false
        if (error.response && error.response.status === 404) {
          console.log("沒有文章");
        } else {
          console.error("There was an error fetching the articles!", error);
        }
      });

    axios
      .get(`/api/member/my-favorites/${userId}`)
      .then((response) => {
        // 添加前端去重邏輯，確保沒有重複的收藏文章
        const uniqueFavorites = Array.from(
          new Map(response.data.map((item) => [item.id, item])).values()
        );
        setFavorites(uniqueFavorites);
      })
      .catch((error) => {
        if (error.response && error.response.status === 404) {
          console.log("沒有收藏文章");
        } else {
          console.error("There was an error fetching the favorites!", error);
        }
      });
  }, [session, status]);

  const handleSearch = (term) => {
    setAnimatingSearch(true);
    setSearchTerm(term);
    setCurrentPage(1); // 當搜尋條件改變時，重置到第一頁

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingSearch(false);
    }, 300);
  };

  // 修改排序處理函數，確保排序應用到當前過濾後的項目
  const handleSortChange = (option) => {
    setAnimatingSort(true); // 開始排序動畫
    setSortOption(option);
    setCurrentPage(1); // 重置到第一頁，確保看到排序效果

    // 300毫秒後結束排序動畫效果
    setTimeout(() => {
      setAnimatingSort(false);
    }, 300);
  };

  // 修改篩選處理函數，保持當前排序
  const handleFilterChange = (option) => {
    setAnimatingFilter(true); // 開始篩選動畫
    setFilterOption(option);
    setCurrentPage(1); // 當篩選條件改變時，重置到第一頁

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingFilter(false);
    }, 300);
  };

  const handleEditClick = (article) => {
    setEditingArticleId(article.id);
    // 將HTML轉換為純文本
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = article.content;
    setEditedContent(tempDiv.textContent);

    // 滾動到文章位置
    const articleElement = document.getElementById(`article-${article.id}`);
    if (articleElement) {
      const offset = 110; // 設置偏移量
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = articleElement.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleSaveClick = (articleId) => {
    // 將純文本轉換為安全HTML
    const sanitizedHTML = editedContent
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
    axios
      .put(`/api/member/articles/${session.user.id}`, {
        id: articleId,
        content: sanitizedHTML,
      })
      .then((response) => {
        setArticles((prevArticles) =>
          prevArticles.map((article) =>
            article.id === articleId
              ? { ...article, content: sanitizedHTML }
              : article
          )
        );
        setEditingArticleId(null);
        setEditedContent("");
      })
      .catch((error) => {
        console.error("There was an error updating the article!", error);
      });
  };

  const handleFavoriteClick = (articleId) => {
    const isFavorite = favorites.some((fav) => fav.id === articleId);

    if (isFavorite) {
      // 設置正在移除的ID，觸發動畫
      setRemovingFavoriteId(articleId);

      // 延遲刪除API請求，以便動畫完成
      setTimeout(() => {
        axios
          .delete(`/api/member/my-favorites/${session.user.id}/${articleId}`)
          .then(() => {
            setFavorites((prevFavorites) =>
              prevFavorites.filter((fav) => fav.id !== articleId)
            );
            setRemovingFavoriteId(null); // 重置移除狀態
          })
          .catch((error) => {
            console.error("There was an error removing the favorite!", error);
            setRemovingFavoriteId(null); // 錯誤時也要重置狀態
          });
      }, 500); // 等待500毫秒以便完成動畫
    } else {
      // 添加收藏時使用彈跳動畫
      axios
        .post(`/api/member/my-favorites/${session.user.id}`, { articleId })
        .then(() => {
          // 要獲取文章的完整數據，所以我們需要從 articles 找到對應的文章
          const articleToAdd = [...articles, ...favorites].find(
            (article) => article.id === articleId
          );

          if (articleToAdd) {
            setFavorites((prevFavorites) => [...prevFavorites, articleToAdd]);
          }
        })
        .catch((error) => {
          console.error("There was an error adding the favorite!", error);
        });
    }
  };

  const filteredArticles = articles.filter(
    (article) =>
      (article.title?.includes(searchTerm) ||
        article.content?.includes(searchTerm) ||
        article.name?.includes(searchTerm) || // 修改這裡
        article.article_category_name?.includes(searchTerm) ||
        article.date?.includes(searchTerm) ||
        article.type?.includes(searchTerm)) &&
      (filterOption === "articles" || filterOption === "")
  );

  const filteredFavorites = favorites.filter(
    (article) =>
      (article.title?.includes(searchTerm) ||
        article.content?.includes(searchTerm) ||
        article.name?.includes(searchTerm) || // 修改這裡
        article.article_category_name?.includes(searchTerm) ||
        article.date?.includes(searchTerm) ||
        article.type?.includes(searchTerm)) &&
      (filterOption === "favorites" || filterOption === "")
  );

  // 抽出排序邏輯成為獨立函數，以便複用
  const applySorting = (items, sortBy) => {
    if (!sortBy) return items;

    return [...items].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === "views") {
        return b.views - a.views;
      } else if (sortBy === "article_like") {
        return b.article_like - a.article_like;
      }
      return 0;
    });
  };

  // 更新合併和排序邏輯 - 先確定是什麼類型的數據，然後應用排序
  const combinedItems = React.useMemo(() => {
    let itemsToSort = [];

    if (filterOption === "favorites") {
      // 確保收藏列表中沒有重複文章
      const uniqueFavoritesMap = new Map();
      filteredFavorites.forEach((favorite) => {
        uniqueFavoritesMap.set(favorite.id, favorite);
      });
      itemsToSort = Array.from(uniqueFavoritesMap.values());
    } else if (filterOption === "articles") {
      itemsToSort = filteredArticles;
    } else {
      // 創建一個 Map 來存儲唯一的文章，使用 ID 作為鍵
      const uniqueItemsMap = new Map();

      // 首先添加所有的文章
      filteredArticles.forEach((article) => {
        uniqueItemsMap.set(article.id, article);
      });

      // 然後添加收藏的文章，如果已存在則跳過
      filteredFavorites.forEach((favorite) => {
        if (!uniqueItemsMap.has(favorite.id)) {
          uniqueItemsMap.set(favorite.id, favorite);
        }
      });

      // 將 Map 轉換回數組
      itemsToSort = Array.from(uniqueItemsMap.values());
    }

    // 應用排序邏輯
    return applySorting(itemsToSort, sortOption);
  }, [filteredArticles, filteredFavorites, filterOption, sortOption]);

  // 更新分頁計算，確保每次都從已排序的數據中切片
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = combinedItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(combinedItems.length / itemsPerPage);

  const sortOptions = [
    { value: "", label: "未選擇" },
    { value: "date", label: "日期" },
    { value: "views", label: "瀏覽數" },
    { value: "article_like", label: "收藏數" },
  ];

  const filterOptions = [
    { value: "", label: "全部文章" },
    { value: "articles", label: "我的文章" },
    { value: "favorites", label: "我的收藏" },
    // ...其他類型
  ];

  // 新增工具函数
  const truncateHTML = (html, maxLength) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const text = div.textContent || div.innerText || "";
    return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
  };

  // 修改 toggleExpand 函數，添加滾動功能
  const toggleExpand = (id) => {
    const isCurrentlyExpanded = expandedItems[id];

    setExpandedItems((prevExpandedItems) => ({
      ...prevExpandedItems,
      [id]: !prevExpandedItems[id],
    }));

    // 如果是從展開狀態變為收起狀態，滾動到卡片頂部
    if (isCurrentlyExpanded) {
      setTimeout(() => {
        const articleElement = document.getElementById(`article-${id}`);
        if (articleElement) {
          const rect = articleElement.getBoundingClientRect();
          const scrollTop = document.documentElement.scrollTop;
          const finalPosition = rect.top + scrollTop - 110; // 減去頁首的 110px

          // 平滑滾動到指定位置
          window.scrollTo({
            top: finalPosition,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  };

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

  return (
    <div className="articles-and-favorites-details">
      <h1>我的文章與收藏</h1>
      <SortAndFilter
        sortOptions={sortOptions}
        filterOptions={filterOptions}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
        currentSort={sortOption}
        currentFilter={filterOption}
      />
      <SearchBar
        placeholder="搜尋文章或收藏..."
        onSearch={handleSearch}
        value={searchTerm}
      />

      {/* 添加篩選標籤顯示 */}
      {(sortOption || filterOption || searchTerm) && (
        <div className="active-filters">
          {sortOption && (
            <span className="filter-tag">
              排序：
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
              篩選:
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
              搜尋: "{searchTerm}"
              <button className="tag-remove" onClick={() => handleSearch("")}>
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* 使用動畫容器，使排序和篩選動畫更平滑 */}
      <div
        ref={containerRef}
        className={`article-items-container ${
          animatingSort || animatingFilter || animatingSearch ? "sorting" : ""
        }`}
      >
        {loading ? (
          Array(itemsPerPage)
            .fill()
            .map((_, index) => (
              <motion.div
                key={index}
                className="articles-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* 添加骨架屏的內部結構元素 */}
                <div className="skeleton-title"></div>
                <div className="skeleton-content"></div>

                <div className="skeleton-footer"></div>
              </motion.div>
            ))
        ) : (
          <>
            {currentItems.length === 0 ? (
              searchTerm ? (
                <div className="no-data">
                  <p>沒有符合搜尋條件的文章</p>
                </div>
              ) : filterOption === "articles" ? (
                <div className="no-data">
                  <p>沒有發文紀錄</p>
                </div>
              ) : filterOption === "favorites" ? (
                <div className="no-data">
                  <p>沒有收藏的文章</p>
                </div>
              ) : (
                <div className="no-data">
                  <p>沒有文章與收藏，去觀看文章或分享心得吧</p>
                </div>
              )
            ) : (
              currentItems.map((item, index) => (
                <motion.div
                  key={index}
                  id={`article-${item.id}`} // 添加這行
                  className={`article-card ${
                    removingFavoriteId === item.id ? "removing" : ""
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  layout // 添加 layout 屬性以實現流暢的重新排序
                >
                  <div className="article-header">
                    <img
                      src={`/images/member/${item.avatar}`}
                      alt={item.name} // 修改這裡
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/default-avatar.png";
                      }}
                    />
                    <div className="article-nickname">{item.name}</div>
                    <div className="article-meta">
                      <span className="me-2">瀏覽數: {item.views}</span>
                      {item.created_at !== item.updated_at ? (
                        <span>
                          修改日期:{" "}
                          {new Date(item.updated_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span>
                          新增日期:{" "}
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="article-body">
                    <h2>{item.title}</h2>
                    <div className="article-content">
                      {editingArticleId === item.id ? (
                        <textarea
                          className="form-control d-inline-flex focus-ring text-decoration-none"
                          rows={5}
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <div className="collapsible-content">
                          <motion.div
                            initial={{ height: "4.5em", opacity: 1 }}
                            animate={{
                              height: expandedItems[item.id] ? "auto" : "4.5em",
                              opacity: 1,
                            }}
                            transition={{ duration: 0.5 }}
                            style={{ overflow: "hidden" }}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html: item.content,
                              }}
                            />
                          </motion.div>
                          {item.content.length > 200 && (
                            <span
                              className="toggle-expand"
                              onClick={() => toggleExpand(item.id)}
                            >
                              {expandedItems[item.id]
                                ? "收起全文 ▲"
                                : "展開全文 ▼"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="article-footer">
                    <span>文章分類：{item.article_category_name}</span>
                    <span>{item.type}</span>
                    <div className="article-actions">
                      {item.created_by === session.user.id && ( // 確保只有使用者本人的文章顯示修改按鈕
                        <>
                          {editingArticleId === item.id ? (
                            <>
                              <button onClick={() => handleSaveClick(item.id)}>
                                保存
                              </button>
                              <button onClick={() => setEditingArticleId(null)}>
                                取消
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleEditClick(item)}>
                              修改文章
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handleFavoriteClick(item.id)}
                        className={`favorite-button ${
                          removingFavoriteId === item.id
                            ? "removing"
                            : favorites.some((fav) => fav.id === item.id)
                            ? "active"
                            : ""
                        }`}
                      >
                        {favorites.some((fav) => fav.id === item.id)
                          ? "❤️"
                          : "🤍"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </>
        )}
      </div>

      {!loading && combinedItems.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
