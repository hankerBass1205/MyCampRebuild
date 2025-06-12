"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SearchBar from "./search-bar";
import Swal from "sweetalert2";
import Pagination from "./Pagination";
import { motion, AnimatePresence } from "framer-motion"; // 引入 framer-motion
import Link from "next/link";
// 引入 Bootstrap Icons CSS
import "bootstrap-icons/font/bootstrap-icons.css";

export default function PurchaseHistoryDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  // const modalRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6; // 每頁顯示的訂單數量
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [converting, setConverting] = useState({});
  const [loading, setLoading] = useState(true); // 加載狀態
  const [animatingSearch, setAnimatingSearch] = useState(false);
  const [animatingFilter, setAnimatingFilter] = useState(false);
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

    axios
      .get(`/api/member/orders/${userId}`) // 在 API 請求中包含 userId
      .then((response) => {
        setOrders(response.data);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        setLoading(false); // 數據加載完成
      })
      .catch((error) => {
        setLoading(false); // 數據加載完成
        if (error.response && error.response.status === 404) {
          console.log("沒有訂單紀錄");
        } else {
          console.error("There was an error fetching the orders!", error);
        }
      });
  }, [session, status]);

  const handleSearch = (term) => {
    setAnimatingSearch(true);
    setSearchTerm(term.toLowerCase());
    setCurrentPage(1); // 重置頁碼確保能看到結果

    setTimeout(() => {
      setAnimatingSearch(false);
    }, 300);
  };

  // 確保我們的金額格式化函數正確處理營地活動總金額
  const formatAmount = (amount) => {
    // 確保金額被解析為數值
    const numAmount = parseFloat(amount) || 0;
    return numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // 根據訂單類型返回正確的付款狀態翻譯
  const getPaymentStatus = (status, orderType) => {
    if (orderType === "camp") {
      // 營地活動付款狀態: pending, paid, failed, refunded
      return status === "pending"
        ? "待付款"
        : status === "paid"
        ? "已付款"
        : status === "failed"
        ? "付款失敗"
        : "已退款";
    } else {
      // 產品訂單付款狀態: 0: 未付款, 1: 已付款 2: 退貨
      return status === 0 || status === "0"
        ? "未付款"
        : status === 1 || status === "1"
        ? "已付款"
        : "退貨";
    }
  };

  // 根據訂單類型返回正確的訂單狀態翻譯
  const getOrderStatus = (status, orderType) => {
    if (orderType === "camp") {
      // 營地活動訂單狀態: pending, confirmed, cancelled
      return status === "pending"
        ? "待確認"
        : status === "confirmed"
        ? "已確認"
        : "已取消";
    } else {
      // 產品訂單狀態: 0: 待處理, 1: 處理中, 2:已完成, 3: 已取消
      return status === 0 || status === "0"
        ? "待處理"
        : status === 1 || status === "1"
        ? "處理中"
        : status === 2 || status === "2"
        ? "已完成"
        : "已取消";
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

  // 修改總金額計算邏輯 - 使用小計、運費、優惠券折扣來計算
  const calculateOrderTotal = (order) => {
    if (!order.products || !order.products.length) return 0;

    // 計算商品總和（小計）
    const productsSum = order.products.reduce(
      (sum, product) => sum + product.unit_price * product.quantity,
      0
    );

    // 運費計算
    const shippingFee =
      order.delivery_method === "home_delivery"
        ? 100
        : order.delivery_method === "7-11"
        ? 60
        : 0;

    // 折扣金額
    const discount = order.coupon_discount || 0;

    // 最終總額 = 商品總和 + 運費 - 優惠券折扣
    return productsSum + shippingFee - discount;
  };

  // 修改搜尋過濾邏輯，直接使用 total_amount 不需再加運費
  const filteredOrders = orders.filter((order) => {
    // 使用新的計算方法獲取最終總額
    const finalTotal =
      order.order_type === "camp"
        ? parseFloat(order.total_amount) // 營地活動使用 total_amount
        : calculateOrderTotal(order); // 商品訂單使用計算方法

    // 檢查訂單內的所有商品名稱是否符合搜尋詞
    const hasMatchingProduct =
      order.products &&
      order.products.some(
        (product) =>
          product.name &&
          product.name.toString().toLowerCase().includes(searchTerm)
      );

    return (
      order.order_id.toString().toLowerCase().includes(searchTerm) ||
      finalTotal.toString().toLowerCase().includes(searchTerm) ||
      (order.payment_status &&
        getPaymentStatus(order.payment_status, order.order_type)
          .toString()
          .toLowerCase()
          .includes(searchTerm)) ||
      (order.order_status &&
        getOrderStatus(order.order_status, order.order_type)
          .toString()
          .toLowerCase()
          .includes(searchTerm)) ||
      (order.product_name &&
        order.product_name.toString().toLowerCase().includes(searchTerm)) ||
      (order.order_created_at &&
        new Date(order.order_created_at)
          .toLocaleDateString()
          .toLowerCase()
          .includes(searchTerm)) ||
      hasMatchingProduct // 新增的條件：訂單內是否有符合搜尋詞的商品/營地名稱
    );
  });

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleConvertPoints = async (orderId, amount, orderType) => {
    try {
      setConverting((prev) => ({ ...prev, [orderId]: true }));

      const response = await axios.post(
        `/api/member/orders/${session.user.id}`,
        {
          userId: session.user.id,
          orderId,
          points: Math.floor(amount * 0.001),
          orderType, // 添加訂單類型，以區分處理
        }
      );

      if (response.data.success) {
        // 更新本地狀態，標記為已兌換
        setOrders((prev) =>
          prev.map((order) =>
            order.order_id === orderId && order.order_type === orderType
              ? { ...order, converted: 1 }
              : order
          )
        );

        Swal.fire({
          icon: "success",
          title: "點數兌換成功!",
          html: `獲得積分: <b>${response.data.points}</b>`,
          confirmButtonColor: "#5B4034",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "兌換失敗",
        text: error.response?.data?.message || "已兌換過點數",
        confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
      });
    } finally {
      setConverting((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // 添加一個增強的日期格式化函數
  const formatDate = (dateString) => {
    if (!dateString) return "未指定";
    if (dateString === "0000-00-00" || dateString === "null") return "未指定";

    try {
      // 嘗試直接解析 YYYY-MM-DD 格式
      const parts = dateString.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JavaScript月份從0開始
        const day = parseInt(parts[2], 10);

        // 檢查日期部分是否為有效數字
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const date = new Date(year, month, day);

          // 檢查日期是否有效
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString();
          }
        }
      }

      // 如果特定格式解析失敗，嘗試默認解析
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }

      return "未指定";
    } catch (error) {
      console.error("日期格式化錯誤:", error, dateString);
      return "未指定";
    }
  };

  // 解析優惠券折扣值
  const parseCouponValue = (couponStr) => {
    if (!couponStr || couponStr === "無") return 0;

    try {
      // 處理百分比折扣，例如 "9折券" 或 "90%折扣"
      if (couponStr.includes("%") || couponStr.includes("折")) {
        const percentMatch = couponStr.match(/(\d+)([%折])/);
        if (percentMatch) {
          const value = parseInt(percentMatch[1], 10);
          if (percentMatch[2] === "%") {
            // 百分比折扣，例如 "10%"，表示打9折
            return value / 100;
          } else if (percentMatch[2] === "折") {
            // "9折"，表示打9折
            return value / 10;
          }
        }
      }

      // 處理固定金額折扣，例如 "NT$100折扣"
      const amountMatch = couponStr.match(/(\d+)/);
      if (amountMatch) {
        return parseInt(amountMatch[1], 10);
      }
    } catch (error) {
      console.error("解析優惠券失敗:", error, couponStr);
    }

    return 0; // 默認無折扣
  };

  // 計算折扣後金額
  const calculateDiscountedAmount = (originalAmount, couponStr) => {
    const couponValue = parseCouponValue(couponStr);

    // 如果是百分比折扣（小於1的數值代表折扣率）
    if (couponValue > 0 && couponValue < 1) {
      return originalAmount * (1 - couponValue);
    }
    // 如果是固定金額折扣
    else if (couponValue >= 1) {
      return Math.max(0, originalAmount - couponValue);
    }

    // 無優惠券或無法解析
    return originalAmount;
  };

  return (
    <div className="purchase-history-details">
      <h1>訂單歷史</h1>
      <span>
        要更詳細地查看訂單並查看與詈訂單關聯的鍵，只需單擊相應訂單的檢視訂單。
      </span>
      <SearchBar
        placeholder="搜尋訂單..."
        onSearch={handleSearch}
        value={searchTerm}
      />
      {searchTerm && (
        <div className="active-filters">
          <span className="filter-tag">
            搜尋: "{searchTerm}"{" "}
            <button className="tag-remove" onClick={() => handleSearch("")}>
              ×
            </button>
          </span>
        </div>
      )}
      <div
        ref={containerRef}
        className={`orders-container ${animatingSearch ? "searching" : ""}`}
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
                  <div key={index} className="sm-skeleton" />
                ))}
            </motion.div>
          ) : (
            <motion.div
              className="order-table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {paginatedOrders.length === 0 ? (
                <motion.div
                  className="no-data"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <p>
                    {searchTerm ? "沒有符合搜尋條件的訂單" : "沒有購買紀錄"}
                  </p>
                </motion.div>
              ) : (
                paginatedOrders.map((order, index) => (
                  <motion.div
                    className="order-card"
                    key={order.order_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05 },
                    }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    <div
                      className={`order-card-header ${
                        expandedOrder === order.order_id ? "active" : ""
                      }`}
                      onClick={() =>
                        setExpandedOrder((prev) =>
                          prev === order.order_id ? null : order.order_id
                        )
                      }
                    >
                      <span>#{order.order_id}</span>
                      <span>
                        {new Date(order.order_created_at).toLocaleDateString()}
                      </span>
                      <span>
                        NT$
                        {order.order_type === "camp"
                          ? formatAmount(parseFloat(order.total_amount))
                          : formatAmount(calculateOrderTotal(order))}
                      </span>
                      <span className={`status-${order.payment_status}`}>
                        {getPaymentStatus(
                          order.payment_status,
                          order.order_type
                        )}
                      </span>
                      <span className={`status-${order.order_status}`}>
                        {getOrderStatus(order.order_status, order.order_type)}
                      </span>
                      <button
                        className="points-convert-btn ms-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          const amount =
                            order.order_type === "camp"
                              ? order.total_amount
                              : calculateOrderTotal(order);
                          handleConvertPoints(
                            order.order_id,
                            amount,
                            order.order_type
                          );
                        }}
                        disabled={
                          order.payment_status !==
                            (order.order_type === "camp" ? "paid" : 1) ||
                          converting[order.order_id] ||
                          order.converted === 1 // 添加檢查 converted 欄位
                        }
                      >
                        {converting[order.order_id] ? (
                          <>
                            <span className="spinner-border spinner-border-sm" />
                            兌換中...
                          </>
                        ) : order.converted === 1 ? (
                          // 若已兌換，顯示不同的文本
                          <>
                            <i className="bi bi-check-circle" />
                            已兌換
                          </>
                        ) : (
                          <>
                            <i className="bi bi-arrow-repeat" />
                            兌換點數
                          </>
                        )}
                      </button>
                    </div>

                    <div
                      className={`order-card-content ${
                        expandedOrder === order.order_id ? "expanded" : ""
                      }`}
                    >
                      {/* 新增獨立的聯絡人資訊區塊 */}
                      <div className="order-details">
                        <div className="contact-info-container">
                          <div className="row">
                            <div className="col-md-6">
                              <div className="contact-info">
                                <h6 className="info-title">聯絡人資訊</h6>
                                <p>
                                  <strong>姓名:</strong> {order.recipient_name}
                                </p>
                                <p>
                                  <strong>電話:</strong> {order.recipient_phone}
                                </p>
                                {order.order_type === "product" && (
                                  <p>
                                    <strong>收件地址:</strong>{" "}
                                    {order.shipping_address}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="payment-info">
                                <h6 className="info-title">付款資訊</h6>
                                <p>
                                  <strong>付款方式:</strong>{" "}
                                  {order.payment_method === "cod"
                                    ? "貨到付款"
                                    : order.payment_method === "credit_card"
                                    ? "信用卡付款"
                                    : order.payment_method === "line_pay"
                                    ? "Line Pay"
                                    : order.payment_method === "cash"
                                    ? "付現"
                                    : order.payment_method}
                                </p>
                                {order.order_type === "product" && (
                                  <p>
                                    <strong>運送方式:</strong>{" "}
                                    {order.delivery_method === "home_delivery"
                                      ? "宅配"
                                      : order.delivery_method === "7-11"
                                      ? "超商取貨"
                                      : order.delivery_method}
                                  </p>
                                )}
                                {order.order_type === "product" &&
                                  order.used_coupon &&
                                  order.used_coupon !== "無" && (
                                    <p>
                                      <strong>優惠券:</strong>{" "}
                                      {order.used_coupon}
                                    </p>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 商品列表，移除聯絡人資訊 */}
                      {order.products?.map((product, idx) => (
                        <div className="product-item" key={idx}>
                          {product.image ? (
                            <img
                              src={
                                product.type === "camp"
                                  ? `/uploads/activities/${product.image}`
                                  : `/images/products/${product.image}`
                              }
                              alt={product.name}
                              style={{ borderRadius: "8px" }}
                            />
                          ) : (
                            <img
                              src="/images/products/default.png"
                              alt={product.name}
                              style={{ borderRadius: "8px" }}
                            />
                          )}
                          <div>
                            <h5>{product.name}</h5>
                            <small>{product.description}</small>
                          </div>
                          <div className="text ms-3">
                            {/* 只保留營地活動日期資訊 */}
                            {order.order_type === "camp" && (
                              <p>
                                營地活動日期:
                                <br />
                                {formatDate(product.product_created_at)} ~{" "}
                                {formatDate(product.product_updated_at)}
                              </p>
                            )}
                          </div>
                          <div className="text-end fw-bold ">
                            {order.order_type !== "camp" && (
                              // 如果是一般商品，顯示在原位置
                              <>
                                單價: NT$
                                {Number(product.unit_price).toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }
                                )}
                                <br /> 數量: {product.quantity}件
                                <br />
                                小計: NT$
                                {formatAmount(
                                  product.unit_price * product.quantity
                                )}
                              </>
                            )}
                          </div>
                          {/* 條件渲染：顯示運費資訊和總計，加上優惠券折扣 */}
                          {idx === order.products.length - 1 && (
                            <div className="text-end fw-bold shipping-info">
                              {order.order_type === "product" ? (
                                // 商品訂單顯示運送方式、運費和優惠券折扣
                                <>
                                  運送方式:{" "}
                                  {order.delivery_method === "home_delivery"
                                    ? "宅配"
                                    : order.delivery_method === "7-11"
                                    ? "超商取貨"
                                    : order.delivery_method}
                                  <br />
                                  運費: NT$
                                  {order.delivery_method === "home_delivery"
                                    ? "100"
                                    : order.delivery_method === "7-11"
                                    ? "60"
                                    : "0"}
                                  {/* 使用小計、運費和優惠券折扣計算總金額 */}
                                  {(() => {
                                    // 計算商品小計總和
                                    const productsSum = order.products.reduce(
                                      (sum, product) =>
                                        sum +
                                        product.unit_price * product.quantity,
                                      0
                                    );

                                    // 運費
                                    const shippingFee =
                                      order.delivery_method === "home_delivery"
                                        ? 100
                                        : order.delivery_method === "7-11"
                                        ? 60
                                        : 0;

                                    // 有優惠券折扣
                                    if (
                                      order.used_coupon &&
                                      order.used_coupon !== "無" &&
                                      order.coupon_discount
                                    ) {
                                      const discount =
                                        order.coupon_discount || 0;
                                      const finalTotal =
                                        productsSum + shippingFee - discount;

                                      return (
                                        <>
                                          <br />
                                          <span className="discount-info">
                                            使用優惠券: {order.used_coupon}
                                            <br />
                                            折扣金額: NT$
                                            {formatAmount(discount)}
                                          </span>
                                          <br />
                                          <span className="total-with-shipping">
                                            總計: NT${formatAmount(finalTotal)}
                                          </span>
                                        </>
                                      );
                                    } else {
                                      // 沒有優惠券折扣
                                      const finalTotal =
                                        productsSum + shippingFee;
                                      return (
                                        <>
                                          <br />
                                          <span className="total-with-shipping">
                                            總計: NT${formatAmount(finalTotal)}
                                          </span>
                                        </>
                                      );
                                    }
                                  })()}
                                </>
                              ) : (
                                // 營地活動顯示價格資訊，移除優惠券相關顯示
                                <>
                                  活動營位價格: <br /> NT$
                                  {Number(product.unit_price).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    }
                                  )}
                                  <br />
                                  營位: {product.quantity}個
                                  <p>
                                    預定天數:{" "}
                                    {order.nights &&
                                    order.nights !== "null" &&
                                    order.nights !== "0"
                                      ? order.nights
                                      : "1"}
                                    天
                                  </p>
                                  <span className="total-with-shipping">
                                    總計: NT$
                                    {formatAmount(
                                      parseFloat(order.total_amount)
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="points-convert-info flex justify-content-between">
                        <p>
                          <i
                            className="bi bi-info-circle"
                            style={{ marginRight: "4px" }}
                          ></i>
                          {order.order_type === "product" && (
                            <>
                              使用的優惠券: {order.used_coupon || "無"}
                              <br />
                            </>
                          )}
                          可兌換點數:{" "}
                          {Math.floor(
                            (order.order_type === "camp"
                              ? parseFloat(order.total_amount)
                              : calculateOrderTotal(order)) * 0.001
                          )}{" "}
                          點
                        </p>
                        <div className="d-flex">
                          <Link href={`/member/reviews/${order.order_id}`}>
                            <button className="points-convert-btn  ">
                              寫下評論
                            </button>
                          </Link>
                          {/* 只有當訂單類型不是營地活動時才顯示查看明細按鈕 */}
                          {order.order_type !== "camp" && (
                            <Link
                              href={`/product-cart/order-confirmation/${order.order_id}`}
                            >
                              <button className="points-convert-btn ms-3">
                                查看明細
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="pagination-container">
        {filteredOrders.length > itemsPerPage && (
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
