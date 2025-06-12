"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Pagination from "./Pagination";
import SortAndFilter from "./sort-filter";
import SearchBar from "./search-bar";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

export default function GetCoupons() {
  const { data: session, status } = useSession();
  const [useCoupons, setUseCoupon] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;
  const router = useRouter();
  const [sortOption, setSortOption] = useState("start_date");
  const [filterOption, setFilterOption] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false); // 添加篩選時的加載狀態

  // 添加動畫狀態控制
  const [animatingSort, setAnimatingSort] = useState(false);
  const [animatingFilter, setAnimatingFilter] = useState(false);
  const [animatingSearch, setAnimatingSearch] = useState(false);

  // 新增容器參考
  const containerRef = useRef(null);

  useEffect(() => {
    if (status === "loading") return;

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

    if (session?.user?.id) {
      setFilterLoading(true); // 開始加載時設置
      fetchUserCoupons(session.user.id);
    }
  }, [session, status, sortOption, filterOption]);

  // 添加檢查優惠券是否過期的函數
  const isExpired = (endDate) => {
    if (!endDate) return false; // 無期限不會過期
    const today = new Date();
    const expiryDate = new Date(endDate);
    return today > expiryDate;
  };

  // 判斷優惠券狀態的函數 (已使用/未使用/已過期)
  const getCouponStatus = (coupon) => {
    if (isExpired(coupon.end_date)) {
      return "已過期";
    } else {
      return coupon.coupon_status === 1 ? "未使用" : "已使用";
    }
  };

  useEffect(() => {
    // 使用 useMemo 來優化過濾邏輯，減少重複計算
    const filtered = useCoupons.filter((coupon) => {
      // 搜尋條件過濾
      const matchesSearch = coupon.coupon_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // 狀態過濾
      if (filterOption === "") return true; // 全部顯示
      if (filterOption === "expired") return isExpired(coupon.end_date); // 只顯示過期
      if (filterOption === "1")
        return coupon.coupon_status === 1 && !isExpired(coupon.end_date); // 未使用且未過期
      if (filterOption === "0")
        return coupon.coupon_status === 0 && !isExpired(coupon.end_date); // 已使用且未過期

      return true;
    });

    setFilteredCoupons(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));

    // 如果當前頁面超出總頁數，重置到第一頁
    if (
      currentPage > Math.ceil(filtered.length / itemsPerPage) &&
      filtered.length > 0
    ) {
      setCurrentPage(1);
    }
  }, [searchTerm, useCoupons, itemsPerPage, filterOption]);

  const fetchUserCoupons = async (userId) => {
    try {
      const response = await fetch(
        `/api/member/user-coupons/${userId}?sortBy=${sortOption}&filterBy=${filterOption}`
      );
      const data = await response.json();
      setUseCoupon(Array.isArray(data) ? data : []);
      setFilteredCoupons(Array.isArray(data) ? data : []);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setLoading(false);
      setFilterLoading(false); // 加載完成後設置
    } catch (error) {
      setLoading(false);
      setFilterLoading(false); // 加載完成後設置
      console.error("Failed to fetch user coupons:", error);
    }
  };

  const handleCouponClick = () => {
    router.push("/products/list");
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

  // 修改搜尋處理函數，添加動畫效果
  const handleSearch = (term) => {
    setAnimatingSearch(true);
    setSearchTerm(term);
    setCurrentPage(1);

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingSearch(false);
    }, 300);
  };

  // 修改排序處理函數，添加動畫效果
  const handleSortChange = (value) => {
    setAnimatingSort(true);
    setSortOption(value);
    setCurrentPage(1);

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingSort(false);
    }, 300);
  };

  // 修改篩選處理函數，添加動畫效果
  const handleFilterChange = (value) => {
    setAnimatingFilter(true);
    setFilterLoading(true); // 開始篩選時設置加載狀態
    setFilterOption(value);
    setCurrentPage(1);

    // 延遲關閉動畫效果
    setTimeout(() => {
      setAnimatingFilter(false);
    }, 300);
  };

  const getLevelName = (levelId) => {
    if (levelId === null) {
      return null;
    }
    switch (levelId) {
      case 1:
        return "新手";
      case 2:
        return "銅牌";
      case 3:
        return "銀牌";
      case 4:
        return "金牌";
      case 5:
        return "鑽石";
      default:
        return "未知等級";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("zh-TW", options);
  };

  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const filterOptions = [
    { value: "", label: "全部優惠券" },
    { value: "1", label: "未使用" },
    { value: "0", label: "已使用" },
    { value: "expired", label: "已過期" }, // 添加"已過期"選項
  ];

  return (
    <>
      <div className="coupon-container">
        <SortAndFilter
          sortOptions={[
            { value: "", label: "未選擇" },
            { value: "start_date", label: "開始日期" },
            { value: "uc.discount_value", label: "折扣" },
          ]}
          filterOptions={filterOptions}
          onSortChange={handleSortChange}
          onFilterChange={handleFilterChange}
          currentSort={sortOption}
          currentFilter={filterOption}
        />
        <SearchBar
          placeholder="搜尋優惠券..."
          onSearch={handleSearch}
          value={searchTerm}
        />

        {/* 添加篩選標籤顯示 */}
        {(sortOption || filterOption || searchTerm) && (
          <div className="active-filters">
            {sortOption && (
              <span className="filter-tag">
                排序:
                {sortOption === "start_date"
                  ? "開始日期"
                  : sortOption === "uc.discount_value"
                  ? "折扣"
                  : sortOption}
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
                搜尋:"{searchTerm}"
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
          className={`coupon-list ${
            animatingSort || animatingFilter || animatingSearch
              ? "animating"
              : ""
          }`}
        >
          <AnimatePresence mode="popLayout">
            {loading || filterLoading ? ( // 修改為包含 filterLoading
              Array(6)
                .fill()
                .map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    className="coupon-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* 添加骨架屏的內部結構 */}
                    <div className="skeleton-body">
                      <div className="skeleton-title"></div>
                      <div className="skeleton-line"></div>
                      <div className="skeleton-line"></div>
                      {/* <div className="skeleton-line"></div> */}
                      <div className="skeleton-code"></div>
                      <div className="skeleton-date"></div>
                    </div>
                    {/* 添加打孔效果 */}
                    <div className="punch top"></div>
                  </motion.div>
                ))
            ) : filteredCoupons.length > 0 ? (
              paginatedCoupons.map((coupon, index) => (
                <motion.div
                  className="coupon-wrapper"
                  key={coupon.user_coupon_id}
                  layoutId={`coupon-${coupon.user_coupon_id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.4,
                      delay: index * 0.05,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    y: -30,
                    transition: { duration: 0.3 },
                  }}
                  onClick={handleCouponClick}
                >
                  <div
                    className="coupon-one"
                    data-status={getCouponStatus(coupon)}
                  >
                    <div className="coupon-header">
                      {coupon.discount === "percentage"
                        ? `${coupon.user_discount_value}%`
                        : coupon.discount === "fixed"
                        ? `NT ${coupon.user_discount_value}`
                        : coupon.user_discount_value}
                    </div>
                    <div
                      className="coupon-body"
                      data-number={coupon.user_coupon_id}
                    >
                      <p data-value={coupon.coupon_name}>
                        優惠券名稱：{coupon.coupon_name}
                      </p>
                      <p
                        data-value={`NT ${Number(
                          coupon.user_min_purchase
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}`}
                      >
                        最低消費金額：NT
                        {Number(coupon.user_min_purchase).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }
                        )}
                      </p>
                      <p
                        data-value={`NT ${Number(
                          coupon.user_max_discount
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}`}
                      >
                        最高折抵金額：NT
                        {Number(coupon.user_max_discount).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }
                        )}
                      </p>

                      <p></p>

                      {getLevelName(coupon.level_id) && (
                        <p data-value={getLevelName(coupon.level_id)}>
                          會員等級：{getLevelName(coupon.level_id)}
                        </p>
                      )}

                      {/* 新增有效期限元素 */}
                      <div className="expiry-date">
                        {coupon.end_date
                          ? formatDate(coupon.end_date)
                          : "無期限"}
                      </div>
                    </div>
                    <div className="coupon-footer">
                      <p>優惠券</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                className="no-data"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <p>
                  {searchTerm
                    ? "沒有符合搜尋條件的優惠券"
                    : filterOption === "1"
                    ? "無未使用的優惠券"
                    : filterOption === "0"
                    ? "無已使用的優惠券"
                    : filterOption === "expired" // 添加對已過期的處理
                    ? "無已過期的優惠券"
                    : "目前沒有領取的優惠券"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="pagination-container">
        {!loading && filteredCoupons.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </>
  );
}
