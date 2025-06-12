"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  FaCheckCircle,
  FaCreditCard,
  FaMoneyBill,
  FaLine,
  FaFileAlt,
  FaUser,
  FaCampground,
  FaCalendar,
  FaUsers,
  FaClock,
  FaChevronDown,
  FaShoppingCart,
  FaCheck,
  FaBell,
  FaGoogle,
  FaEnvelope,
} from "react-icons/fa";
import { motion } from "framer-motion";
import Link from "next/link";
import Loading from "@/components/Loading";
import { useSession } from "next-auth/react";
import io from "socket.io-client";
// import dayjs from "dayjs";

// ===== 自定義工具引入 =====
import {
  orderToast, // 結帳相關提示
  ToastContainerComponent, // Toast 容器組件
} from "@/utils/toast";

// 狀態對應的中文和顏色配置
const STATUS_MAP = {
  pending: { text: "待確認", color: "text-yellow-600" },
  confirmed: { text: "已確認", color: "text-green-600" },
  cancelled: { text: "已取消", color: "text-red-600" },
};

const PAYMENT_STATUS_MAP = {
  pending: { text: "待付款", color: "text-yellow-600" },
  paid: { text: "已付款", color: "text-green-600" },
  failed: { text: "付款失敗", color: "text-red-600" },
  refunded: { text: "已退款", color: "text-gray-600" },
};

// 更新支付方式對應圖示
const PAYMENT_METHOD_MAP = {
  ecpay: {
    icon: FaCreditCard,
    text: "綠界支付",
    color: "text-blue-600",
  },
  line_pay: {
    icon: FaLine,
    text: "LINE Pay",
    color: "text-[#06C755]",
  },
  cash: {
    icon: FaMoneyBill,
    text: "現場付款",
    color: "text-green-600",
  },
};

// 計算天數的輔助函數
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// 在檔案開頭加入步驟定義
const STEPS = [
  {
    id: 1,
    label: "確認購物車",
    subLabel: "已完成",
    icon: FaShoppingCart,
    description: "檢視並確認您的營位選擇",
    className: "z-0",
  },
  {
    id: 2,
    label: "填寫資料",
    subLabel: "已完成",
    icon: FaUser,
    description: "填寫聯絡人與預訂資訊",
    className: "z-0",
  },
  {
    id: 3,
    label: "完成預訂",
    subLabel: "當前",
    icon: FaCheckCircle,
    description: "確認訂單並完成預訂",
    className: "z-0",
  },
];

// 過濾掉 AbortError 相關的錯誤
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args) => {
    // 過濾掉 AbortError 相關的錯誤
    if (
      args[0]?.includes?.("Fetch request failed: AbortError") ||
      args[0]?.message?.includes?.("AbortError") ||
      args[0]?.includes?.("signal is aborted")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

// 訂單完成頁面
export default function OrderCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const orderId = searchParams.get("orderId");
  // 修改摺疊狀態的預設值，全部預設為收合
  const [expandedSections, setExpandedSections] = useState({
    orderInfo: false,
    contactInfo: false,
    bookingItems: false,
  });

  useEffect(() => {
    // 1. 處理未登入狀態
    if (status === "unauthenticated") {
      router.replace("/auth/login");  // 使用 replace 而不是 push
      return;
    }

    // 2. 處理登入狀態
    if (status === "authenticated" && orderId) {
      fetchOrderData();
    }

    // 3. Loading 狀態不做特別處理
    if (status === "loading") {
      return;
    }
  }, [status, orderId, router]);

  const fetchOrderData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/camping/checkout/complete?orderId=${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order data");
      }
      const data = await response.json();
      setOrderData(data);
    } catch (error) {
      console.error("Error fetching order data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 切換摺疊狀態的函數
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // ---------------------------------------

  // 用來追蹤每個訂單的 socket 連接狀態
  const socketConnections = {};

  // 使用靜態變數追蹤已發送的訂單，避免重複發送(好像是這個解決了發送兩次)
  const sentOrders = new Set();

  // 訂單完成後發出 socket 通知
  const sendOrderNotification = async (orderData, userId) => {
    // 防止重複發送
    if (sentOrders.has(orderData.order_id)) {
      // console.log('=== 訂單頁面: 此訂單通知已發送過 ===');
      return;
    }

    return new Promise((resolve, reject) => {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
        query: { 
          userId, 
          userType: "member",
          isNewSession: "false"
        },
        path: "/socket.io/",
        reconnection: true,
        transports: ["websocket"],
      });

      // 設置連接超時
      const connectionTimeout = setTimeout(() => {
        console.error('=== 訂單頁面: Socket 連接超時 ===');
        socket.disconnect();
        sentOrders.delete(orderData.order_id);
        reject(new Error('Socket connection timeout'));
      }, 5000);

      // 等待服務器確認通知
      socket.once('newNotification', (notification) => {
        clearTimeout(connectionTimeout);
        // console.log('=== 訂單頁面: 收到通知確認 ===', notification);
        
        // 先觸發通知更新事件（更新計數）
        window.dispatchEvent(new Event('notificationUpdate'));
        
        // 確保 DOM 更新後再顯示提醒框
        setTimeout(() => {
          // 這裡不需要呼叫 orderToast，因為 NotificationBell 會處理提醒框
          socket.disconnect();
          resolve(notification);
        }, 100);
      });

      socket.once("connect", () => {
        // console.log("=== 訂單頁面: Socket 連接成功 ===");
        sentOrders.add(orderData.order_id);

        const notificationData = {
          userId,
          type: 'order',
          title: '訂單通知',
          content: `您的訂單 ${orderData.order_id} 已完成預訂！`,
          orderId: orderData.order_id,
          totalAmount: orderData.total_amount,
          campName: orderData.activity_name,
          spotType: orderData.spot_name,
          checkInDate: orderData.start_date,
          checkOutDate: orderData.end_date,
          nights: orderData.nights,
          paymentMethod: orderData.payment_method,
          paymentStatus: orderData.payment_status,
          orderData: {  
            orderId: orderData.order_id,
            campName: orderData.activity_name,
            checkInDate: orderData.start_date,
            checkOutDate: orderData.end_date,
            amount: orderData.total_amount
          }
        };

        // console.log('=== 訂單頁面: 準備發送通知資料 ===', notificationData);
        socket.emit("orderComplete", notificationData);
      });

      socket.once("connect_error", (error) => {
        clearTimeout(connectionTimeout);
        console.error("=== 訂單頁面: Socket 連接錯誤 ===", error);
        sentOrders.delete(orderData.order_id);
        socket.disconnect();
        reject(error);
      });
    });
  };

  // 在 useEffect 外部定義函數
  const createGoogleCalendarEvent = async (orderData) => {
    // 檢查 localStorage
    const hasCalendarEvent = localStorage.getItem(`calendar_event_${orderId}`);
    if (hasCalendarEvent) {
      // console.log('已經建立過 Google Calendar 事件');
      return;
    }

    try {
      const calendarResponse = await fetch(
        "/api/camping/google-calendar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderId,
            items: orderData.items,
            contactName: orderData.contact_name,
            contactEmail: orderData.contact_email,
          }),
        }
      );

      const calendarResult = await calendarResponse.json();
      if (calendarResult.success) {
        localStorage.setItem(`calendar_event_${orderId}`, 'true');
        // console.log('Google Calendar Events Created');
        // orderToast.success('已新增行程到 Google 日曆');
      } else {
        // console.error("Failed to create calendar events:", calendarResult.error);
        orderToast.error("無法新增到 Google 日曆，請稍後再試");
      }
    } catch (error) {
      // console.error("Error creating calendar events:", error);
      orderToast.error("新增 Google 日曆時發生錯誤，請稍後再試");
    }
  };

  // 在獲取訂單資料後發送通知
  useEffect(() => {
    if (!orderId || !session?.user) return;

    const hasNotified = localStorage.getItem(`notified_${orderId}`);
    if (hasNotified) {
      // console.log("此訂單已發送過通知");
      return;
    }

    const handleOrderData = async () => {
      try {
        // 先標記為已通知，避免重複發送
        localStorage.setItem(`notified_${orderId}`, "true");
        
        const response = await fetch(
          `/api/camping/checkout/complete?orderId=${orderId}`
        );
        const data = await response.json();

        // 訂單完成後發出 socket 通知
        await sendOrderNotification(data, session.user.id);
      } catch (error) {
        // console.error("訂單通知發送失敗:", error);
        orderToast.error("訂單通知發送失敗，請稍後再試");
        // 發送失敗時移除標記，允許重試
        localStorage.removeItem(`notified_${orderId}`);
      }
    };

    handleOrderData();
  }, [orderId, session]);

  // ---------------------------------------

  // 訂單完成頁面，line 通知、google 日曆通知
  useEffect(() => {
    const hasSocketNotified = localStorage.getItem(`socket_notified_${orderId}`);
    const hasLineNotified = localStorage.getItem(`line_notified_${orderId}`);
    let isSubscribed = true;

    if (!orderId || !session?.user) return;

    const handleOrderData = async () => {
      try {
        const response = await fetch(`/api/camping/checkout/complete?orderId=${orderId}`);
        const data = await response.json();

        if (!isSubscribed) return;
        setOrderData(data);

        // 處理 Socket 通知
        if (!hasSocketNotified) {
          localStorage.setItem(`socket_notified_${orderId}`, "true");
          await sendOrderNotification(data, session.user.id);
        }

        // 只有當用戶是使用 LINE 登入時才發送 LINE 通知
        if (!hasLineNotified && session?.user?.loginType === "line") {
          localStorage.setItem(`line_notified_${orderId}`, "true");
          await fetch(`/api/camping/line-order-notification/${orderId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
        }

        // 只有當用戶是使用 Google 登入時才添加到 Google Calendar
        if (session?.user?.loginType === "google") {
          await createGoogleCalendarEvent(data);
        }

        // 觸發購物車更新
        window.dispatchEvent(new Event("cartUpdate"));

      } catch (error) {
        localStorage.removeItem(`line_notified_${orderId}`);
        localStorage.removeItem(`socket_notified_${orderId}`);
        if (isSubscribed) {
          orderToast.error("發生未預期的錯誤");
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    handleOrderData();

    return () => {
      isSubscribed = false;
    };
  }, [orderId, router, session]);

  // 添加測試發送按鈕的處理函數
  // const handleTestNotification = async () => {
  //   console.log('=== 訂單頁面: 點擊測試發送按鈕 ===');
  //   if (!orderData || !session?.user) {
  //     console.log('=== 訂單頁面: 缺少訂單資料或用戶資訊 ===');
  //     return;
  //   }

  //   try {
  //     const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  //       query: { 
  //         userId: session.user.id,
  //         userType: "member"
  //       }
  //     });

  //     socket.on('connect', () => {
  //       console.log('=== 訂單頁面: Socket 連接成功 ===', socket.id);
        
  //       const notificationData = {
  //         userId: session.user.id,
  //         type: 'order',
  //         title: '測試訂單通知',
  //         orderId: orderData.order_id,
  //         totalAmount: orderData.total_amount,
  //         campName: orderData.activity_name,
  //         spotType: orderData.spot_name,
  //         checkInDate: orderData.start_date,
  //         checkOutDate: orderData.end_date,
  //         nights: orderData.quantity,
  //         paymentMethod: orderData.payment_method,
  //         paymentStatus: orderData.payment_status
  //       };

  //       console.log('=== 訂單頁面: 發送測試通知資料 ===', notificationData);
  //       socket.emit('orderComplete', notificationData);
  //     });

  //     socket.on('newNotification', (notification) => {
  //       console.log('=== 訂單頁面: 收到通知確認 ===', notification);
  //       // 觸發全局事件，通知 NotificationBell 組件更新
  //       window.dispatchEvent(new Event('notificationUpdate'));
        
  //       // 顯示成功提示
  //       orderToast.success('測試通知發送成功！');
        
  //       // 斷開連接
  //       socket.disconnect();
  //     });

  //     socket.on('connect_error', (error) => {
  //       console.error('=== 訂單頁面: Socket 連接失敗 ===', error);
  //       orderToast.error('測試通知發送失敗');
  //       socket.disconnect();
  //     });

  //   } catch (error) {
  //     console.error('=== 訂單頁面: 測試發送失敗 ===', error);
  //     orderToast.error('測試通知發送失敗');
  //   }
  // };

  if (isLoading) {
    return <Loading isLoading={isLoading} />;
  }

  // 如果沒有訂單資料，顯示找不到訂單資料的頁面
  if (!orderData) {
    return (
      <div className="min-h-screen bg-[var(--lightest-brown)] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg
                className="w-24 h-24 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </motion.div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            找不到訂單資料
          </h2>
          <p className="text-gray-600 mb-8">
            您的訂單資料可能已過期或不存在，請重新進行預訂。
          </p>

          <div className="space-y-3">
            <Link
              href="/camping/activities"
              className="no-underline block w-full bg-[var(--primary-brown)] text-white py-3 px-6 rounded-lg hover:bg-[var(--secondary-brown)] transition-colors duration-300"
            >
              瀏覽營地活動
            </Link>
            <Link
              href="/"
              className="no-underline block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-300"
            >
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 訂單完成頁面
  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* 步驟進度條 */}
        <div className="mb-3 relative z-0">
          <div className="relative flex justify-between max-w-4xl mx-auto">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.id}
                className="flex flex-col items-center relative z-0 group w-full"
              >
                {/* 連接線 - 降低 z-index */}
                {index < STEPS.length - 1 && (
                  <div className="absolute h-[5px] top-[18px] left-[calc(50%+20px)] right-[calc(-50%+20px)] bg-[var(--tertiary-brown)] -z-10">
                    {step.id <= 2 && (
                      <>
                        {/* 基礎流動效果 */}
                        <motion.div
                          className="absolute top-0 left-0 h-full w-full -z-10"
                          style={{
                            background:
                              "linear-gradient(90deg, var(--primary-brown) 0%, var(--secondary-brown) 50%, var(--primary-brown) 100%)",
                            backgroundSize: "200% 100%",
                            opacity: 0.8,
                          }}
                          animate={{
                            backgroundPosition: ["0% 0%", "100% 0%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        {/* 光點流動效果 */}
                        <motion.div
                          className="absolute top-0 left-0 h-full w-[30px] -z-10"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, var(--primary-brown) 50%, transparent 100%)",
                            opacity: 0.9,
                          }}
                          animate={{
                            x: ["-100%", "400%"],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      </>
                    )}
                  </div>
                )}

                {/* 步驟圓圈 */}
                <div className="relative z-10">
                  <motion.div
                    className={`w-10 h-10 rounded-full border-[4px] flex items-center justify-center
                      ${
                        step.id <= 3
                          ? "bg-[var(--primary-brown)] border-[var(--primary-brown)]"
                          : "bg-[var(--tertiary-brown)] border-[var(--tertiary-brown)]"
                      }
                      transition-colors duration-300 relative`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    {step.id <= 3 ? (
                      <FaCheck className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-sm font-medium text-white">
                        {step.id}
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* 步驟文字 */}
                <motion.div
                  className="mt-4 text-center relative z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <span
                    className={`block text-base font-medium
                    ${
                      step.id <= 3
                        ? "text-[var(--primary-brown)]"
                        : "text-[var(--gray-3)]"
                    }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 訂單完成圖示和標題 */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div
              className="w-20 h-20 rounded-full bg-[var(--primary-brown)] 
              flex items-center justify-center mx-auto"
            >
              <FaCheckCircle className="text-white text-4xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--primary-brown)] mb-2 m-0">
            訂單完成
          </h1>
          <p className="text-[var(--gray-3)] m-0">
            訂單編號：
            <span className="text-[var(--primary-brown)]">
              {orderData?.order_id || "0"}
            </span>
          </p>
        </div>

        {/* 主要按鈕區 - 修改 hover 效果 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => router.push("/")}
            className="group w-full py-2 px-4 text-[var(--primary-brown)] 
              border-2 border-[var(--primary-brown)] rounded-lg 
              hover:bg-[var(--secondary-brown)] hover:text-white
              transition-all duration-300 ease-in-out"
          >
            <span className="font-medium m-0">回到首頁</span>
          </button>
          <button
            onClick={() => router.push("/member/purchase-history")}
            className="w-full py-2 px-4 bg-[var(--primary-brown)] text-white 
              rounded-lg hover:bg-[var(--secondary-brown)] transition-colors duration-300"
          >
            <span className="font-medium m-0">查看訂單</span>
          </button>
        </div>

        {/* 新增提示訊息區域 - 手機版優化 */}
        <motion.div 
          className="text-sm text-[var(--gray-3)] space-y-3 md:space-y-2 mb-6 md:mb-8 px-4 md:px-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* LINE 登入提示 */}
          <motion.div 
            className="flex items-start md:items-center gap-3 md:justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
          >
            <div className="flex-shrink-0 mt-1 md:mt-0">
              <FaLine className="w-5 h-5 md:w-4 md:h-4 text-[#00B900]" />
            </div>
            <p className="m-0 text-sm md:text-base leading-5 md:leading-normal">
              使用 LINE 登入且已加入好友的使用者，將收到訂單通知
            </p>
          </motion.div>

          {/* Google 登入提示 */}
          <motion.div 
            className="flex items-start md:items-center gap-3 md:justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.9, ease: "easeOut" }}
          >
            <div className="flex-shrink-0 mt-1 md:mt-0">
              <FaGoogle className="w-5 h-5 md:w-4 md:h-4 text-[#4285F4]" />
            </div>
            <p className="m-0 text-sm md:text-base leading-5 md:leading-normal">
              使用 Google 帳號登入的使用者，訂單將自動同步至 Google 日曆
            </p>
          </motion.div>

          {/* 一般登入提示 */}
          <motion.div 
            className="flex items-start md:items-center gap-3 md:justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.1, ease: "easeOut" }}
          >
            <div className="flex-shrink-0 mt-1 md:mt-0">
              <FaEnvelope className="w-5 h-5 md:w-4 md:h-4 text-[#666666]" />
            </div>
            <p className="m-0 text-sm md:text-base leading-5 md:leading-normal">
              一般登入的使用者，可至會員中心查看訂單資訊
            </p>
          </motion.div>
        </motion.div>

        {/* 折疊式資訊區 - 增加間距 */}
        <div className="space-y-6">
          {/* 訂單資訊 */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection("orderInfo")}
              className="w-full px-6 py-2 flex justify-between items-center text-left
                hover:bg-[var(--lightest-brown)] transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-[var(--primary-brown)]" />
                <span className="text-lg font-medium m-0">訂單資訊</span>
              </div>
              <div
                className={`transform transition-transform duration-300 
                ${expandedSections.orderInfo ? "rotate-180" : "rotate-0"}`}
              >
                <FaChevronDown />
              </div>
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden
              ${
                expandedSections.orderInfo
                  ? "max-h-[500px] opacity-100 py-6"
                  : "max-h-0 opacity-0 py-0"
              }`}
            >
              <div className="px-6">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="訂單日期"
                    value={format(
                      new Date(orderData.created_at),
                      "yyyy/MM/dd HH:mm"
                    )}
                  />
                  <InfoItem
                    label="付款方式"
                    value={PAYMENT_METHOD_MAP[orderData.payment_method]?.text}
                    icon={PAYMENT_METHOD_MAP[orderData.payment_method]?.icon}
                    color={PAYMENT_METHOD_MAP[orderData.payment_method]?.color}
                  />
                  <InfoItem
                    label="訂單狀態"
                    value={STATUS_MAP[orderData.status]?.text}
                    color={STATUS_MAP[orderData.status]?.color}
                  />
                  <InfoItem
                    label="付款狀態"
                    value={PAYMENT_STATUS_MAP[orderData.payment_status]?.text}
                    color={PAYMENT_STATUS_MAP[orderData.payment_status]?.color}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 聯絡人資訊 */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection("contactInfo")}
              className="w-full px-6 py-2 flex justify-between items-center text-left
                hover:bg-[var(--lightest-brown)] transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <FaUser className="text-[var(--primary-brown)]" />
                <span className="text-lg font-medium m-0">聯絡人資訊</span>
              </div>
              <div
                className={`transform transition-transform duration-300 
                ${expandedSections.contactInfo ? "rotate-180" : "rotate-0"}`}
              >
                <FaChevronDown />
              </div>
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden
              ${
                expandedSections.contactInfo
                  ? "max-h-[500px] opacity-100 py-6"
                  : "max-h-0 opacity-0 py-0"
              }`}
            >
              <div className="px-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="px-4 py-2 rounded-lg bg-[var(--lightest-brown)]">
                    <p className="text-[var(--gray-3)] text-sm mb-2 m-0">
                      姓名
                    </p>
                    <p className="text-[#AC7654] font-medium m-0">
                      {orderData.contact_name}
                    </p>
                  </div>

                  <div className="px-4 py-2 rounded-lg bg-[var(--lightest-brown)]">
                    <p className="text-[var(--gray-3)] text-sm mb-2 m-0">
                      電話
                    </p>
                    <p className="text-[#AC7654] font-medium m-0">
                      {orderData.contact_phone}
                    </p>
                  </div>

                  <div className="px-4 py-2 rounded-lg bg-[var(--lightest-brown)]">
                    <p className="text-[var(--gray-3)] text-sm mb-2 m-0">
                      電子信箱
                    </p>
                    <p className="text-[#AC7654] font-medium m-0">
                      {orderData.contact_email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 預訂項目 */}
          <div className="bg-white rounded-lg shadow-sm">
            {/* 標題按鈕 RWD */}
            <button
              onClick={() => toggleSection("bookingItems")}
              className="w-full px-4 md:px-6 py-2 md:py-3 flex justify-between items-center text-left
                hover:bg-[var(--lightest-brown)] transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <FaCampground className="text-[var(--primary-brown)] text-base md:text-lg" />
                <span className="text-base md:text-lg font-medium m-0">預訂項目</span>
              </div>
              <div
                className={`transform transition-transform duration-300 
                ${expandedSections.bookingItems ? "rotate-180" : "rotate-0"}`}
              >
                <FaChevronDown className="text-base md:text-lg" />
              </div>
            </button>

            {/* 展開內容區 RWD */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden
              ${
                expandedSections.bookingItems
                  ? "max-h-[1000px] opacity-100 py-4 md:py-6"
                  : "max-h-0 opacity-0 py-0"
              }`}
            >
              <div className="px-4 md:px-6">
                <div className="space-y-3 md:space-y-4">
                  {orderData.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 md:p-4 rounded-lg bg-[var(--lightest-brown)]"
                    >
                      {/* 上半部資訊 RWD */}
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-4 mb-3 md:mb-4">
                        <div className="flex-grow">
                          <h3 className="text-base md:text-lg font-bold text-[var(--primary-brown)] mb-1 md:mb-2">
                            {item.activity_name}
                          </h3>
                          <p className="text-sm md:text-base text-[var(--secondary-brown)] m-0">
                            {item.spot_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg md:text-xl font-bold text-[var(--primary-brown)] m-0">
                            NT$ {Math.round(item.unit_price).toLocaleString()}
                          </p>
                          <p className="text-xs md:text-sm text-[var(--gray-3)] m-0">
                            / 每晚
                          </p>
                        </div>
                      </div>

                      {/* 下半部詳細資訊 RWD */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                        <BookingDetail
                          icon={FaCalendar}
                          label="入營"
                          value={format(new Date(item.start_date), "yyyy/MM/dd")}
                          className="text-xs md:text-sm"
                        />
                        <BookingDetail
                          icon={FaCalendar}
                          label="拔營"
                          value={format(new Date(item.end_date), "yyyy/MM/dd")}
                          className="text-xs md:text-sm"
                        />
                        <BookingDetail
                          icon={FaUsers}
                          label="數量"
                          value={`${item.quantity} 個`}
                          className="text-xs md:text-sm"
                        />
                        <BookingDetail
                          icon={FaClock}
                          label="住宿天數"
                          value={`${calculateDays(item.start_date, item.end_date)} 晚`}
                          className="text-xs md:text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainerComponent />
    </div>
  );
}

// 資訊項目元件
const InfoItem = ({ label, value, icon: Icon, color }) => (
  <div className="flex flex-col">
    <span className="text-[var(--gray-3)] text-sm mb-1">{label}</span>
    <div className="flex items-center gap-2">
      {Icon && <Icon className={`${color || "text-[var(--primary-brown)]"}`} />}
      <span className={`font-medium ${color || "text-[var(--primary-brown)]"}`}>
        {value}
      </span>
    </div>
  </div>
);

// 預訂詳情元件
const BookingDetail = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-center gap-2 text-[var(--gray-3)] ${className}`}>
    <Icon className="text-[var(--secondary-brown)] w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
    <span className="m-0">
      {label}：{value}
    </span>
  </div>
);
