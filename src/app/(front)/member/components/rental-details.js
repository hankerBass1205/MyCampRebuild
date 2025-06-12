// components/RentalDetails.js
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, Button } from "react-bootstrap";
import { motion, AnimatePresence, color } from "framer-motion";
import Swal from "sweetalert2";
import axios from "axios";
import Pagination from "./Pagination";
import SearchBar from "./search-bar";
import { useRouter } from "next/navigation"; // 引入 useRouter
import { useSession } from "next-auth/react"; // 引入 useSession

const RentalDetails = () => {
  const { data: session } = useSession();
  const [leases, setLeases] = useState([]);
  const [filteredLeases, setFilteredLeases] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true); // 加載狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const router = useRouter(); // 使用 useRouter
  const cardRefs = useRef([]); // 用於存儲卡片的引用
  const [animatingSearch, setAnimatingSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null); // 新增容器參考

  // 添加價格格式化函數
  const formatPrice = (price) => {
    // 確保價格是數字
    const numPrice = typeof price === "string" ? parseFloat(price) : price;

    // 處理價格為無效數字的情況
    if (isNaN(numPrice)) return "$0";

    // 千分位格式化
    return "$" + numPrice.toLocaleString("en-US");
  };

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

    const fetchLeases = async () => {
      try {
        const response = await fetch(`/api/member/rental/${session.user.id}`);
        const data = await response.json();

        if (response.ok) {
          // 確保價格字段為數字類型
          const formattedLeases = data.leases.map((lease) => ({
            ...lease,
            lease_price: parseFloat(lease.lease_price),
            product_price: parseFloat(lease.product_price),
          }));

          setLeases(formattedLeases);
          setFilteredLeases(formattedLeases);
        } else {
          Swal.fire({
            icon: "error",
            title: "錯誤",
            text: data.error || "獲取數據失敗",
            confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
          });
        }
      } catch (error) {
        Swal.fire("錯誤", "無法連接到伺服器", "error");
      } finally {
        setLoading(false); // 加載完成
      }
    };

    fetchLeases();
  }, [session, router]);

  const LeaseCountdown = ({ startDate, endDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    // 當日期改變時重新計算
    useEffect(() => {
      setTimeLeft(calculateTimeLeft());

      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);

      return () => clearInterval(timer);
    }, [startDate, endDate]); // 添加 startDate 作為依賴

    function calculateTimeLeft() {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);

      // 檢查是否未開始
      if (now < start) {
        const difference = start - now;
        return {
          isUpcoming: true,
          天: Math.floor(difference / (1000 * 60 * 60 * 24)),
          時: Math.floor((difference / (1000 * 60 * 60)) % 24),
          分: Math.floor((difference / 1000 / 60) % 60),
          秒: Math.floor((difference / 1000) % 60),
        };
      }

      // 檢查是否已過期
      if (now > end) {
        return "expired";
      }

      // 進行中，計算剩餘時間
      const difference = end - now;
      return {
        isUpcoming: false,
        天: Math.floor(difference / (1000 * 60 * 60 * 24)),
        時: Math.floor((difference / (1000 * 60 * 60)) % 24),
        分: Math.floor((difference / 1000 / 60) % 60),
        秒: Math.floor((difference / 1000) % 60),
      };
    }

    // 修改渲染邏輯，處理未開始和已過期情況
    return (
      <div className="countdown d-flex">
        {timeLeft === "expired" ? (
          <span className="expired-text">已過期</span>
        ) : timeLeft.isUpcoming ? (
          <>
            <span>距離開始：</span>
            {Object.entries(timeLeft)
              .filter(([key]) => key !== "isUpcoming")
              .map(([unit, value]) => (
                <div key={unit} className="countdown-unit">
                  <span>{value}</span>
                  {unit}
                </div>
              ))}
          </>
        ) : (
          <>
            <span>剩餘時間：</span>
            {Object.entries(timeLeft)
              .filter(([key]) => key !== "isUpcoming")
              .map(([unit, value]) => (
                <div key={unit} className="countdown-unit">
                  <span>{value}</span>
                  {unit}
                </div>
              ))}
          </>
        )}
      </div>
    );
  };

  // 根據視窗剩餘空間自動判斷展開方向 - 增加安全檢查
  const getSmartExpandDirection = (index, element) => {
    // 確保 window 和 element 都存在
    if (typeof window === "undefined" || !element) return "bottom";

    try {
      const cardRect = element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      if (cardRect.left < viewportWidth * 0.25) return "right";
      if (cardRect.right > viewportWidth * 0.75) return "left";
      return "bottom";
    } catch (error) {
      console.error("獲取展開方向時發生錯誤:", error);
      return "bottom"; // 發生錯誤時的預設展開方向
    }
  };

  // 更新租借狀態判斷邏輯，增加"未開始"狀態
  const getLeaseStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (now < startDate) {
      return "upcoming"; // 未開始
    } else if (now > endDate) {
      return "expired"; // 已過期
    } else {
      return "active"; // 進行中
    }
  };

  // 計算兩個日期之間的天數差，不包括起始日
  const calculateDaysDifference = (startDate, endDate) => {
    // 確保日期是正確的 Date 物件
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 設定為每天的同一時間點以避免時區和夏令時問題
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // 計算毫秒差並轉換為天數
    const timeDiff = end.getTime() - start.getTime();
    // 不再使用 Math.ceil，改為 Math.floor 確保正確的天數計算
    return Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));
  };

  // 處理延長租借，修改確認按鈕顏色
  const handleExtend = async (leaseId, currentEndDate, productPrice) => {
    // 確保日期格式一致，避免時區問題
    const currentEnd = new Date(new Date(currentEndDate).setHours(0, 0, 0, 0));

    // 最小日期設為當前結束日期的下一天
    const minDate = new Date(currentEnd);
    minDate.setDate(currentEnd.getDate() + 1);

    // 最大日期設為當前結束日期後的第 7 天（不是 8 天）
    const maxDate = new Date(currentEnd);
    maxDate.setDate(currentEnd.getDate() + 7); // 改為加 7 天，表示最多延長 7 天

    // 格式化日期為 YYYY-MM-DD，避免時區問題
    const formatDateToYMD = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const minDateStr = formatDateToYMD(minDate);
    const maxDateStr = formatDateToYMD(maxDate);
    const initialDate = minDateStr;

    const calculateAdditionalCost = (selectedDate) => {
      // 這裡是關鍵修正：從原租期結束日的下一天開始計算
      const nextDay = new Date(currentEnd);
      nextDay.setDate(currentEnd.getDate() + 1);

      // 計算從下一天到選擇日期的天數
      const days = calculateDaysDifference(nextDay, selectedDate);

      // 確保天數為正數，即使在同一天也是至少 0 天
      return Math.round((productPrice / 10) * Math.max(0, days + 1));
    };

    // 初始日期計算
    const initialCost = calculateAdditionalCost(minDate);

    const { value: newDate } = await Swal.fire({
      title: "延長租借時間",
      html: `
        <div class="date-picker-container">
          <input 
            type="date" 
            id="endDate"
            class="swal2-input date-picker"
            min="${minDateStr}"
            max="${maxDateStr}"
            value="${initialDate}"
            onchange="document.getElementById('additionalCost').textContent = Math.round(${
              productPrice / 10
            } * calculateDaysDifference('${currentEnd.toISOString()}', this.value))"
          >
          <div class="date-info">
            <span>可延長範圍：${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}</span>
            <p>額外費用: NT$<span id="additionalCost">${initialCost}</span></p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "確認延長",
      cancelButtonText: "取消",
      confirmButtonColor: "#5b4034",
      cancelButtonColor: "#9B7A5A",
      focusConfirm: false,
      didOpen: () => {
        // 為日期選擇器添加事件監聽器，計算並更新費用
        const dateInput = document.getElementById("endDate");
        const costSpan = document.getElementById("additionalCost");

        // 在全局作用域定義計算天數差的函數，供 HTML 中的 onchange 使用
        window.calculateDaysDifference = (start, end) => {
          const startDate = new Date(start);
          const endDate = new Date(end);
          const timeDiff = endDate.getTime() - startDate.getTime();
          return Math.ceil(timeDiff / (1000 * 3600 * 24));
        };

        dateInput.addEventListener("change", function () {
          const days = window.calculateDaysDifference(currentEnd, this.value);
          const cost = Math.round((productPrice / 10) * days);
          costSpan.textContent = cost;
        });
      },
      preConfirm: () => {
        const dateInput = document.getElementById("endDate");
        if (!dateInput.value) {
          Swal.showValidationMessage("請選擇日期");
        }
        return dateInput.value;
      },
    });

    if (newDate) {
      try {
        // 計算延長天數和額外費用 - 從原租期結束日的下一天開始計算
        const nextDay = new Date(currentEnd);
        nextDay.setDate(currentEnd.getDate() + 1);

        const additionalDays =
          calculateDaysDifference(nextDay, new Date(newDate)) + 1;
        const additionalCost = Math.round((productPrice / 10) * additionalDays);

        const response = await axios.post("/api/member/rental/extend", {
          leaseId,
          newDate,
          additionalCost,
        });

        if (response.data.success) {
          // 同時更新 leases 和 filteredLeases
          const updateLease = (leaseArray) =>
            leaseArray.map((lease) =>
              lease.id === leaseId
                ? {
                    ...lease,
                    appointment_end: newDate,
                    lease_price: parseFloat(lease.lease_price) + additionalCost, // 確保是數字加法
                  }
                : lease
            );

          setLeases(updateLease);
          setFilteredLeases(updateLease);

          Swal.fire({
            icon: "success",
            title: "成功",
            text: `租借時間已延長，額外費用: ${formatPrice(additionalCost)}`,
            confirmButtonColor: "#5b4034",
          });
        }
      } catch (error) {
        Swal.fire("錯誤", error.response?.data?.error || "操作失敗", "error");
      }
    }
  };

  const handleSearch = (searchValue) => {
    setAnimatingSearch(true);
    setSearchTerm(searchValue);
    const filtered = leases.filter((lease) =>
      lease.product_name.toLowerCase().includes(searchValue.toLowerCase())
    );
    setFilteredLeases(filtered);
    setCurrentPage(1);
    setTimeout(() => {
      setAnimatingSearch(false);
    }, 300);
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

  const indexOfLastLease = currentPage * itemsPerPage;
  const indexOfFirstLease = indexOfLastLease - itemsPerPage;
  const currentLeases = filteredLeases.slice(
    indexOfFirstLease,
    indexOfLastLease
  );

  return (
    <div className="rental-details">
      <div className="search-section">
        {" "}
        {/* 新增容器元素確保搜尋欄有適當佈局 */}
        <SearchBar
          placeholder="搜尋租借紀錄..."
          onSearch={handleSearch}
          value={searchTerm}
        />
        {searchTerm && (
          <div className="active-filters">
            <span className="filter-tag">
              搜尋: "{searchTerm}"
              <button className="tag-remove" onClick={() => handleSearch("")}>
                ×
              </button>
            </span>
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className={`cards-container ${animatingSearch ? "searching" : ""}`}
      >
        <AnimatePresence>
          {loading ? (
            <motion.div
              className="skeleton-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {Array(itemsPerPage)
                .fill()
                .map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    className="rental-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="skeleton-header">
                      <div className="skeleton-title-group">
                        <div className="skeleton-title"></div>
                        <div className="skeleton-date"></div>
                        <div className="skeleton-price"></div>
                      </div>
                      <div className="skeleton-arrow"></div>
                    </div>
                    <div className="skeleton-badge"></div>
                  </motion.div>
                ))}
            </motion.div>
          ) : filteredLeases.length === 0 ? (
            <motion.div
              className="no-data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p>沒有符合搜尋條件的租借紀錄</p>
            </motion.div>
          ) : (
            <motion.div
              className="leases-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {currentLeases.map((lease, index) => (
                <motion.div
                  key={lease.id}
                  layout
                  className="rental-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    delay: index * 0.05, // 添加錯落進場效果
                  }}
                  ref={(el) => (cardRefs.current[index] = el)}
                >
                  <Card>
                    <Card.Body>
                      <div
                        className="d-flex justify-content-between align-items-center"
                        onClick={() =>
                          setExpandedId(
                            expandedId === lease.id ? null : lease.id
                          )
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <div>
                          <h5>{lease.product_name}</h5>
                          <small className="text me-2">
                            租期:{" "}
                            {new Date(
                              lease.appointment_starts
                            ).toLocaleDateString()}{" "}
                            ~{" "}
                            {new Date(
                              lease.appointment_end
                            ).toLocaleDateString()}
                          </small>
                          <div className="text mb-2">
                            租借費用: NT{formatPrice(lease.lease_price)}
                          </div>
                          <span
                            className={`badge ${
                              getLeaseStatus(
                                lease.appointment_starts,
                                lease.appointment_end
                              ) === "active"
                                ? "bg-success"
                                : getLeaseStatus(
                                    lease.appointment_starts,
                                    lease.appointment_end
                                  ) === "upcoming"
                                ? "bg-warning"
                                : "bg-danger"
                            }`}
                          >
                            {getLeaseStatus(
                              lease.appointment_starts,
                              lease.appointment_end
                            ) === "active"
                              ? "租借中"
                              : getLeaseStatus(
                                  lease.appointment_starts,
                                  lease.appointment_end
                                ) === "upcoming"
                              ? "未開始"
                              : "已結束"}
                          </span>
                        </div>
                        <motion.span
                          animate={{
                            rotate: expandedId === lease.id ? 180 : 0,
                          }}
                        >
                          <div className="btn-text"> ▼</div>
                        </motion.span>
                      </div>

                      <AnimatePresence>
                        {expandedId === lease.id && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              x: (() => {
                                // 安全地取得方向
                                const element = cardRefs.current[index];
                                const direction = getSmartExpandDirection(
                                  index,
                                  element
                                );
                                return direction === "right" ? 100 : 0;
                              })(),
                              y: (() => {
                                // 安全地取得方向
                                const element = cardRefs.current[index];
                                const direction = getSmartExpandDirection(
                                  index,
                                  element
                                );
                                return direction === "bottom" ? 50 : 0;
                              })(),
                            }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="card-expand-content mt-3"
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            onDragEnd={(_, info) => {
                              if (info.offset.y > 50) setExpandedId(null);
                            }}
                          >
                            <hr />
                            <div className="row">
                              <div className="col-md-4 d-flex justify-content-center">
                                {lease.images[0] && (
                                  <img
                                    src={`/${lease.images[0]}`}
                                    alt={lease.product_name}
                                    className="img-fluid rounded"
                                    // 保持寬高比
                                  />
                                )}
                              </div>
                              <div className="col-md-8">
                                <p>{lease.description}</p>
                                {getLeaseStatus(
                                  lease.appointment_starts,
                                  lease.appointment_end
                                ) === "active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="p-1 time-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExtend(
                                        lease.id,
                                        lease.appointment_end,
                                        lease.product_price
                                      );
                                    }}
                                  >
                                    延長租借時間
                                  </Button>
                                )}
                                <LeaseCountdown
                                  startDate={lease.appointment_starts}
                                  endDate={lease.appointment_end}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card.Body>
                  </Card>
                </motion.div>
              ))}

              {/* 修改分頁控件顯示邏輯，當頁數小於等於 1 時不顯示 */}
              {Math.ceil(filteredLeases.length / itemsPerPage) > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.2 }}
                  className="pagination-wrapper"
                >
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredLeases.length / itemsPerPage)}
                    onPageChange={handlePageChange}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RentalDetails;
