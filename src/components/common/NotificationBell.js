"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BellIcon, BellAlertIcon } from "@heroicons/react/24/outline";
import {
  BellIcon as BellIconSolid,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckCircleIcon,
  TrashIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/solid";
import { showConfirm, showError } from "@/utils/sweetalert";
import io from "socket.io-client";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

export default function NotificationBell() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isClearing, setIsClearing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const dropdownRef = useRef(null);

  // 初始化 Socket 連接
  useEffect(() => {
    if (session?.user && mounted) {
      const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

      // 檢查是否為真正的新會話
      const lastLoginTime = localStorage.getItem(
        `lastLogin_${session.user.id}`
      );
      const currentTime = new Date().getTime();
      const isNewSession =
        !lastLoginTime ||
        currentTime - parseInt(lastLoginTime) > 30 * 60 * 1000; // 30分鐘過期

      // 如果是新會話，更新最後登入時間
      if (isNewSession) {
        localStorage.setItem(
          `lastLogin_${session.user.id}`,
          currentTime.toString()
        );
      }

      const newSocket = io(SOCKET_URL, {
        query: {
          userId: session.user.id,
          userType: session.user.isAdmin
            ? "admin"
            : session.user.isOwner
            ? "owner"
            : "member",
          isNewSession: isNewSession.toString(), // 傳遞實際的會話狀態
        },
        path: "/socket.io/",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true,
      });

      // 添加連接狀態監聽
      newSocket.on("connect", () => {
        // console.log('=== NotificationBell: Socket 已連接 ===');
        setSocket(newSocket);
        // 連接成功後請求通知列表
        newSocket.emit("getNotifications");
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket 連接錯誤:", error);
        setSocket(null);
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("Socket 重新連接成功，嘗試次數:", attemptNumber);
      });

      newSocket.on("reconnect_error", (error) => {
        console.error("Socket 重新連接失敗:", error);
      });

      newSocket.on("disconnect", (reason) => {
        // console.log('Socket 斷開連接，原因:', reason);
        setSocket(null);
      });

      // 這個是由訂單結算畫面時發送通知傳送到通知元件
      newSocket.on("notifications", (data) => {
        try {
          // console.log('=== NotificationBell: 收到 notifications 事件 ===', data);

          // 確保每個通知都有唯一的 id
          const notificationsWithIds = data.map((notification, index) => ({
            ...notification,
            id: notification.id || `temp-${Date.now()}-${index}`,
          }));

          // 檢查是否有新的訂單通知
          const newOrderNotification = notificationsWithIds.find(
            (n) => n.type === "order" && !n.is_read
          );

          if (newOrderNotification) {
            // 檢查這個通知是否已經顯示過
            const shownNotifications = JSON.parse(
              localStorage.getItem("shownNotifications") || "[]"
            );

            if (!shownNotifications.includes(newOrderNotification.id)) {
              // console.log('=== NotificationBell: 發現新訂單通知 ===', newOrderNotification);

              // 將這個通知ID加入已顯示列表
              shownNotifications.push(newOrderNotification.id);
              localStorage.setItem(
                "shownNotifications",
                JSON.stringify(shownNotifications)
              );

              const toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                showCloseButton: false,
                timer: 6000,
                timerProgressBar: true,
                showClass: {
                  popup:
                    "animate__animated animate__fadeInRight animate__faster",
                },
                hideClass: {
                  popup:
                    "animate__animated animate__fadeOutRight animate__faster",
                },
                didOpen: (toast) => {
                  setTimeout(() => {
                    toast.classList.remove("animate-bounce");
                  }, 5000);
                },
                // willClose: () => {
                //   console.log('=== NotificationBell: 提示框即將關閉 ===');
                // }
              });

              toast.fire({
                title: "訂單已完成！",
                html: `
                  <div class="text-left">
                    <p class="text-sm text-gray-500 mb-0">查看詳細內容請點擊通知鈴鐺</p>
                  </div>
                `,
                icon: "success",
                background: "#ffffff",
                color: "var(--primary-color)",
                iconColor: "var(--status-success)",
                customClass: {
                  container: "pt-[120px]",
                  popup: "border-l-4 border-purple-500 animate-bounce",
                  title: "font-zh text-lg mb-0",
                  htmlContainer: "text-sm",
                },
                backdrop: false,
                allowOutsideClick: true,
              });
            }
          }

          setNotifications(notificationsWithIds);
          setUnreadCount(notificationsWithIds.filter((n) => !n.is_read).length);
        } catch (error) {
          console.error("處理通知數據錯誤:", error);
        }
      });

      // 這個是從後台發送的通知傳送到通知元件
      newSocket.on("newNotification", (notification) => {
        try {
          // 更新通知列表和未讀數量
          setNotifications((prev) => {
            const newNotifications = [...prev, notification];
            // 更新未讀數量
            setUnreadCount(newNotifications.filter((n) => !n.is_read).length);
            return newNotifications;
          });

          // 顯示吐司通知
          const toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            showCloseButton: true,
            timer: 3000,
            timerProgressBar: true,
            showClass: {
              popup: "animate__animated animate__fadeInRight animate__faster",
            },
            hideClass: {
              popup: "animate__animated animate__fadeOutRight animate__faster",
            },
          });

          // 通知類型樣式設定
          const styles = {
            system: {
              icon: 'info',
              text: '系統通知',
              color: '#3B82F6',
              bgColor: '#EFF6FF'
            },
            message: {  // 修改一般訊息的圖示
              icon: 'success',  // 改用 success 圖示
              text: '一般訊息',
              color: '#6B8E7B',
              bgColor: '#F0F4F1'
            },
            alert: {
              icon: 'warning',
              text: '重要提醒',
              color: '#F59E0B',
              bgColor: '#FEF3C7'
            }
          };

          const currentStyle = styles[notification.type] || styles.system;

          toast.fire({
            icon: currentStyle.icon,
            html: `
              <div class="flex flex-col gap-0.5">
                <p class="text-sm font-medium mb-0">${currentStyle.text}</p>
                <p class="text-xs opacity-75 mb-0 mt-1">點擊鈴鐺查看詳情</p>
              </div>
            `,
            background: currentStyle.bgColor,
            color: currentStyle.color,
            padding: '0.5rem',
            customClass: {
              container: 'mt-[120px]',
              popup: 'p-2',
              htmlContainer: 'm-0'
            }
          });
        } catch (error) {
          console.error('處理新通知錯誤:', error);
        }
      });

      // 添加更多事件監聽來 debug
      newSocket.onAny((eventName, ...args) => {
        console.log(`=== NotificationBell: 收到事件 ${eventName} ===`, args);
      });

      // 清理函數
      return () => {
        if (newSocket) {
          console.log("清理 Socket 連接");
          newSocket.off("connect");
          newSocket.off("connect_error");
          newSocket.off("reconnect");
          newSocket.off("reconnect_error");
          newSocket.off("disconnect");
          newSocket.off("notifications");
          newSocket.off("newNotification");
          newSocket.disconnect();
          setSocket(null);
        }
      };
    }
  }, [session, mounted]);

  // 確保客戶端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  // 添加點擊外部關閉的事件處理
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // 修改：處理點擊鈴鐺
  const handleBellClick = async () => {
    if (!session?.user) {
      const result = await showConfirm("請先登入", "登入後即可查看通知內容");

      if (result.isConfirmed) {
        router.push("/auth/login");
      }
      return;
    }

    setShowDropdown(!showDropdown);
  };

  // 修改：處理標籤切換
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);

    // 只有在有 socket 連接且不是 'all' 標籤時才自動標記已讀
    if (socket && socket.connected && newTab !== "all") {
      try {
        // 找出該類型的未讀通知
        const unreadNotifications = notifications.filter(
          (n) => n.type === newTab && !n.is_read
        );

        if (unreadNotifications.length > 0) {
          // console.log('發送標記已讀請求 - type:', newTab);  // 簡單記錄發送動作

          socket.emit("markTypeAsRead", {
            type: newTab,
            userId: session.user.id,
            notificationIds: unreadNotifications.map((n) => n.id),
          });

          // 更新本地狀態
          setNotifications((prev) =>
            prev.map((n) => (n.type === newTab ? { ...n, is_read: true } : n))
          );

          // 更新未讀數量
          const newUnreadCount = notifications.filter(
            (n) => !n.is_read && n.type !== newTab
          ).length;
          setUnreadCount(newUnreadCount);
        }
      } catch (error) {
        console.error("標記已讀失敗:", error);
        showError("操作失敗", error.message || "標記已讀時發生錯誤");
      }
    }
  };

  // 格式化時間
  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 確保這個函數正確計算每種類型的未讀數量
  const getUnreadCountByType = (type) => {
    if (type === "all") {
      return unreadCount;
    }
    return notifications.filter(
      (notification) => notification.type === type && !notification.is_read
    ).length;
  };

  // 新增：根據類型過濾通知
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    return notification.type === activeTab;
  });

  // 獲取通知類型樣式
  const getTypeStyles = (type) => {
    const styles = {
      system: {
        label: "系統",
        icon: <BellIconSolid className="h-5 w-5" />,
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-600",
        borderColor: "border-indigo-500",
        hoverBg: "hover:bg-indigo-50/70",
        iconColor: "text-indigo-500",
        ringColor: "ring-indigo-200",
      },
      message: {
        label: "訊息",
        icon: <EnvelopeIcon className="h-5 w-5" />,
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-600",
        borderColor: "border-emerald-500",
        hoverBg: "hover:bg-emerald-50/70",
        iconColor: "text-emerald-500",
        ringColor: "ring-emerald-200",
      },
      alert: {
        label: "提醒",
        icon: <ExclamationTriangleIcon className="h-5 w-5" />,
        bgColor: "bg-amber-50",
        textColor: "text-amber-600",
        borderColor: "border-amber-500",
        hoverBg: "hover:bg-amber-50/70",
        iconColor: "text-amber-500",
        ringColor: "ring-amber-200",
      },
      order: {
        icon: <DocumentCheckIcon className="h-5 w-5" />,
        label: "訂單通知",
        bgColor: "bg-purple-50",
        textColor: "text-purple-600",
        borderColor: "border-purple-500",
        hoverBg: "hover:bg-purple-50/70",
        iconColor: "text-purple-500",
        ringColor: "ring-purple-200",
      },
    };
    return styles[type] || styles.system;
  };

  // 修改：處理清空通知
  const handleClearNotifications = async () => {
    if (!socket || !socket.connected) {
      console.error("Socket 未連接");
      showError("清空通知失敗", "Socket 連接已斷開，請重新整理頁面");
      return;
    }

    try {
      const result = await Swal.fire({
        title: "確定要清空所有通知嗎？",
        text: "清空後將無法恢復",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "var(--status-error)",
        cancelButtonColor: "var(--gray-6)",
        confirmButtonText: "確定清空",
        cancelButtonText: "取消",
      });

      if (result.isConfirmed) {
        setIsClearing(true);

        // 使用 Promise 包裝 socket 事件
        const clearNotifications = () =>
          new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              socket.off("notificationsCleared");
              reject(new Error("操作超時，請稍後再試"));
            }, 10000);

            socket.once("notificationsCleared", (response) => {
              clearTimeout(timeout);
              if (response.success) {
                resolve(response);
              } else {
                reject(new Error(response.message));
              }
            });

            socket.emit("clearNotifications");
          });

        // 等待清空操作完成
        const response = await clearNotifications();

        setIsClearing(false);
        setNotifications([]);
        setUnreadCount(0);

        // 顯示成功提示並自動關閉下拉選單
        Swal.fire({
          icon: "success",
          title: "通知已清空",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          setShowDropdown(false); // 關閉通知下拉選單
        });
      }
    } catch (error) {
      console.error("清空通知時發生錯誤:", error);
      setIsClearing(false);
      showError("清空通知失敗", error.message);
    }
  };

  // 修改：處理標記全部已讀
  const handleMarkAllAsRead = () => {
    if (!socket || !socket.connected) {
      showError("操作失敗", "Socket 連接已斷開，請重新整理頁面");
      return;
    }

    try {
      socket.emit("markAllAsRead", { userId: session.user.id });
      // 立即更新本地狀態
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      // 顯示成功提示並自動關閉下拉選單
      Swal.fire({
        icon: "success",
        title: "標記已讀",
        text: "已將所有通知標記為已讀",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        setShowDropdown(false); // 關閉通知下拉選單
      });
    } catch (error) {
      showError("操作失敗", error.message || "標記已讀時發生錯誤");
    }
  };

  // 確保 socket 已連接
  useEffect(() => {
    if (session?.user && mounted) {
      console.log("Socket 狀態:", socket?.connected);
      // ... 其他 socket 初始化代碼 ...
    }
  }, [session, mounted]);

  // 添加全局事件監聽
  useEffect(() => {
    const handleNotificationUpdate = () => {
      // console.log("=== NotificationBell: 收到通知更新事件 ===");
      // 重新請求通知列表
      if (socket && socket.connected) {
        socket.emit("getNotifications");
      }
    };

    // 添加事件監聽
    window.addEventListener("notificationUpdate", handleNotificationUpdate);

    // 清理函數
    return () => {
      window.removeEventListener(
        "notificationUpdate",
        handleNotificationUpdate
      );
    };
  }, [socket]);

  // 可以添加一個定期清理機制，避免 localStorage 儲存太多舊記錄
  useEffect(() => {
    const cleanupShownNotifications = () => {
      const shownNotifications = JSON.parse(
        localStorage.getItem("shownNotifications") || "[]"
      );
      // 只保留最近 100 條記錄
      if (shownNotifications.length > 100) {
        const recentNotifications = shownNotifications.slice(-100);
        localStorage.setItem(
          "shownNotifications",
          JSON.stringify(recentNotifications)
        );
      }
    };

    // 每天清理一次
    const cleanup = setInterval(cleanupShownNotifications, 24 * 60 * 60 * 1000);

    return () => {
      clearInterval(cleanup);
    };
  }, []);

  // 在客戶端渲染前返回 null 或加載狀態
  if (!mounted) {
    return (
      <div className="relative">
        <button className="relative focus:outline-none">
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>
    );
  }

  // 在登出時清除 localStorage
  const handleLogout = () => {
    if (session?.user) {
      localStorage.removeItem(`lastLogin_${session.user.id}`);
    }
    // ... 其他登出邏輯 ...
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-[#F8F6F3] transition-colors duration-200"
      >
        {/* 未讀數量大於 0 時顯示帶警示的鈴鐺，否則顯示普通鈴鐺 */}
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-5 w-5 text-[#8B7355]" />
        ) : (
          <BellIcon className="h-5 w-5 text-[#8B7355]" />
        )}

        {/* 未讀數量標記 */}
        {unreadCount > 0 && (
          <div
            className="absolute -top-2 -right-1 
            bg-[#EF4444]
            text-white 
            text-xs 
            font-medium 
            rounded-full 
            min-w-[18px] 
            h-[18px] 
            flex 
            items-center 
            justify-center 
            px-1
          "
          >
            {unreadCount}
          </div>
        )}
      </button>

      {/* 通知下拉面板 */}
      <AnimatePresence>
        {showDropdown && session?.user && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              fixed lg:absolute 
              top-[60px] lg:top-auto 
              left-0 lg:left-auto 
              right-0 lg:right-0 
              mx-2 lg:mx-0 
              lg:mt-3 
              w-[calc(100%-16px)] lg:w-[520px] 
              h-[calc(100vh-70px)] lg:h-auto 
              rounded-2xl 
              shadow-2xl 
              z-50
              border border-[#E8E4DE]
              backdrop-blur-lg bg-[#FDFBF7]/95
              ring-1 ring-[#8B7355]/10
            `}
          >
            <div className="flex flex-col h-full lg:h-[600px]">
              {/* 標題列改為露營風格 */}
              <div
                className="sticky top-0 z-10 px-3 md:px-5 py-2 
                border-b border-[#E8E4DE] 
                flex justify-between items-center 
                rounded-t-2xl
                bg-gradient-to-r from-[#F5F3F0] to-[#F0EBE6] 
                backdrop-blur-sm"
              >
                <h3 className="text-base md:text-lg font-bold text-[#5C5C5C] flex items-center gap-2 m-0">
                  <motion.div
                    animate={{
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.2, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 5,
                    }}
                  >
                    <BellIconSolid className="h-5 w-5 text-[#8B7355]" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-[#8B7355] to-[#A49B8A] text-transparent bg-clip-text">
                    通知中心
                  </span>
                </h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1.5 rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-600 
                    transition-all duration-200 hover:rotate-90 hover:shadow-md"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* 分類標籤區塊優化 */}
              <div
                className="sticky top-[52px] z-10 
                px-3 md:px-4 py-2.5 
                border-b border-[#E8E4DE] 
                bg-gradient-to-b from-[#FDFBF7] to-[#F5F3F0] 
                backdrop-blur-sm
                overflow-x-auto"  // 添加橫向滾動
              >
                {/* 移除 hidden md:flex，改為 flex */}
                <div className="flex gap-1 min-w-max">  {/* 添加 min-w-max 確保內容不會被壓縮 */}
                  {["all", "system", "message", "alert", "order"].map((tab) => {
                    const isActive = activeTab === tab;
                    const typeUnreadCount = getUnreadCountByType(tab);
                    const styles =
                      tab === "all"
                        ? {
                            label: "全部",
                            textColor: "text-[#8B7355]",
                            bgColor: "bg-[#F5F3F0]",
                            ringColor: "ring-[#E8E4DE]",
                            iconColor: "text-[#8B7355]",
                            hoverBg: "hover:bg-[#F0EBE6]",
                            icon: <BellIconSolid className="h-4 w-4" />,
                          }
                        : getTypeStyles(tab);

                    return (
                      <motion.button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          py-1.5 px-2.5 
                          rounded-lg text-xs font-medium 
                          transition-all duration-200 
                          flex items-center justify-center gap-1
                          shrink-0  // 防止按鈕被壓縮
                          ${
                            isActive
                              ? `${styles.textColor} ${styles.bgColor} ring-1 ${styles.ringColor} shadow-sm`
                              : "text-[#A49B8A] hover:bg-[#F5F3F0] hover:shadow-sm"
                          }
                          whitespace-nowrap backdrop-blur-sm
                        `}
                      >
                        <motion.div
                          className={styles.iconColor}
                          animate={
                            isActive
                              ? {
                                  rotate: [0, 10, -10, 0],
                                  scale: [1, 1.1, 1.1, 1],
                                }
                              : {}
                          }
                          transition={{ duration: 0.5 }}
                        >
                          {React.cloneElement(styles.icon, {
                            className: "h-4 w-4",
                          })}
                        </motion.div>
                        <span className="truncate">{styles.label}</span>
                        {typeUnreadCount > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`ml-0.5 px-1.5 py-0.5 
                              ${
                                tab === "all"
                                  ? "bg-indigo-500 text-white"
                                  : `${styles.bgColor} ${styles.textColor}`
                              }
                              text-[10px] rounded-full font-medium
                              min-w-[18px] h-[18px] flex items-center justify-center`}
                          >
                            {typeUnreadCount}
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* 通知列表容器優化 */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-3 md:px-4 py-2 space-y-3">
                  <AnimatePresence>
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notification, index) => {
                        const styles = getTypeStyles(notification.type);
                        return (
                          <motion.div
                            key={
                              notification.id ||
                              `notification-${Date.now()}-${index}`
                            }
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            whileHover={{ scale: 1.01 }}
                            className={`group rounded-xl 
                              border border-[#E8E4DE]
                              hover:border-[#C1A87D] 
                              hover:shadow-md hover:shadow-[#8B7355]/10
                              bg-[#FDFBF7]
                              transition-all duration-300 ease-in-out`}
                          >
                            <div className="relative">
                              <div
                                className="text-sm p-4 rounded-lg 
                                bg-[#FDFBF7] hover:bg-white
                                border border-[#E8E4DE] hover:border-[#C1A87D] 
                                transition-all duration-300"
                              >
                                {/* 通知類型與時間 */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md 
                                      text-xs font-medium ${styles.bgColor} ${styles.textColor}`}
                                    >
                                      {styles.icon}
                                      {styles.label}
                                    </span>
                                  </div>
                                  <span className="text-xs text-[#A49B8A]">
                                    {formatDate(notification.created_at)}
                                  </span>
                                </div>

                                {/* 通知標題 - 更明顯的樣式 */}
                                <h3
                                  className="text-base font-bold text-[#493A2A] mb-2.5 
                                  border-b border-[#E8E4DE] pb-2"
                                >
                                  {notification.title}
                                </h3>

                                {/* 通知內容 - 根據類型顯示不同樣式 */}
                                {notification.type === "order" ? (
                                  <div className="space-y-2 text-[#725D51]">
                                    <div
                                      className="whitespace-pre-wrap leading-relaxed bg-[#F5F3F0] 
                                      p-3 rounded-lg text-[#493A2A]"
                                    >
                                      {notification.content}
                                    </div>
                                    {notification.orderData && (
                                      <div className="mt-3 pt-3 border-t border-[#E8E4DE] space-y-2">
                                        <div className="text-[#725D51]">
                                          <span className="font-medium">
                                            訂單編號：
                                          </span>
                                          {notification.orderData.orderId ||
                                            "無資料"}
                                        </div>
                                        <div className="text-[#725D51] mt-2">
                                          <span className="font-medium">
                                            營地：
                                          </span>
                                          {notification.orderData.campName ||
                                            "無資料"}
                                        </div>
                                        {notification.orderData.checkInDate &&
                                          notification.orderData
                                            .checkOutDate && (
                                            <div className="grid grid-cols-2 gap-4 text-[#725D51] mt-2">
                                              <div>
                                                <span className="font-medium">
                                                  入營日期：
                                                </span>
                                                {formatDate(
                                                  notification.orderData
                                                    .checkInDate
                                                )}
                                              </div>
                                              <div>
                                                <span className="font-medium">
                                                  拔營日期：
                                                </span>
                                                {formatDate(
                                                  notification.orderData
                                                    .checkOutDate
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        {notification.orderData.amount && (
                                          <div className="text-[#725D51] mt-2">
                                            <span className="font-medium">
                                              金額：
                                            </span>
                                            NT${" "}
                                            {notification.orderData.amount.toLocaleString()}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className="whitespace-pre-wrap leading-relaxed 
                                    text-[#725D51] bg-[#F5F3F0] p-3 rounded-lg"
                                  >
                                    {notification.content}
                                  </div>
                                )}

                                {/* 未讀標記 */}
                                {!notification.is_read && (
                                  <div
                                    className="absolute top-2 right-2 w-2 h-2 
                                    bg-[#E53E3E] rounded-full animate-pulse"
                                  />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="px-5 py-12 text-center rounded-xl
                          border border-gray-100/50 bg-white/50 backdrop-blur-sm"
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                            opacity: [0.5, 1, 1, 0.5],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 3,
                          }}
                          className="bg-gradient-to-r from-gray-100 to-gray-50 p-6 rounded-full inline-block"
                        >
                          <BellIcon className="h-12 w-12 text-gray-300" />
                        </motion.div>
                        <p className="text-gray-500 text-sm mt-4 font-medium">
                          暫無
                          {activeTab === "all"
                            ? ""
                            : getTypeStyles(activeTab).label}
                          通知
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 底部操作區域 */}
              <div className="sticky bottom-0 z-10 
                border-t border-[#E8E4DE] 
                bg-gradient-to-b from-[#FDFBF7] to-[#F5F3F0] 
                backdrop-blur-sm 
                p-3 md:p-4 
                rounded-b-2xl"
              >
                <div className="flex justify-between gap-3">
                  {/* 全部已讀按鈕 */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      text-sm font-medium
                      text-[#8B7355] hover:text-[#6B563B]
                      hover:bg-[#F5F3F0]
                      transition-all duration-200"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>全部已讀</span>
                  </motion.button>

                  {/* 清空通知按鈕 */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClearNotifications}
                    disabled={isClearing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      text-sm font-medium
                      text-[#C1432E] hover:text-[#A93B2A]
                      transition-all duration-200
                      disabled:opacity-50
                      disabled:cursor-not-allowed"
                  >
                    {isClearing ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      </motion.div>
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                    <span>清空通知</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
