"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import ChatWindow from "./ChatWindow";
import io from "socket.io-client";
import { motion, useDragControls } from "framer-motion";
import { IoClose } from "react-icons/io5";
import "@/styles/pages/booking/chat.css";

const ChatIcon = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragControls = useDragControls();
  const chatWindowRef = useRef(null);

  // 使用 useEffect 來管理 socket 連接
  useEffect(() => {
    if (session?.user && !socket) {
      const SOCKET_URL =
        process.env.NODE_ENV === "production"
          ? "https://camping-platform-production.up.railway.app"
          : "http://localhost:3002";

      const newSocket = io(SOCKET_URL, {
        path: "/socket.io/",
        withCredentials: true,
        query: {
          userId: session.user.id,
          userType: "member",
        },
        transports: ["websocket"],  // 只使用 websocket
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      newSocket.on("connect", () => {
        console.log("Socket 連接成功, ID:", newSocket.id);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket 連接錯誤:", error);
      });

      setSocket(newSocket);

      // 清理函數
      return () => {
        // console.log("清理 socket 連接");
        if (newSocket) {
          newSocket.disconnect();
          setSocket(null);
        }
      };
    }
  }, [session?.user?.id]); // 只依賴 userId

  // 新增點擊外部關閉的 effect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && 
          chatWindowRef.current && 
          !chatWindowRef.current.contains(event.target) &&
          !event.target.closest('.chat-trigger')) {  // 排除觸發按鈕
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleChatClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPosition({ x: 0, y: 0 });
  };

  const startDragging = (event) => {
    dragControls.start(event);
  };

  return (
    <div className="fixed bottom-0 right-0 z-[5]">
      {!isOpen && (
        <motion.div
          className="fixed bottom-0 chat-trigger min-w-[120px]
            left-1/2 transform -translate-x-1/2
            md:left-auto md:transform-none 
            md:right-[150px] lg:right-[200px]"
          whileHover={{ 
            x: -5,
            transition: { type: "spring", stiffness: 400 }
          }}
        >
          <button
            onClick={handleChatClick}
            className="group flex items-center gap-2 bg-[#5F7A68] text-white px-4 pb-1.5 pt-2 rounded-t-lg
              transition-all duration-300 hover:bg-[#6B8E7B] shadow-lg w-full"
          >
            <div className="flex items-center gap-2">
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                whileHover={{ rotate: 15 }}  // 圖示旋轉效果
                transition={{ type: "spring", stiffness: 300 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </motion.svg>
              <span className="text-sm font-medium whitespace-nowrap group-hover:tracking-wide transition-all duration-300">
                線上客服
              </span>
            </div>
          </button>
        </motion.div>
      )}

      {isOpen && (
        <motion.div
          ref={chatWindowRef}
          initial={{ opacity: 0, y: 520 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              type: "spring",
              damping: 25,
              stiffness: 200
            }
          }}
          exit={{ opacity: 0, y: 520 }}
          className="fixed bottom-0 right-0 w-full sm:w-[360px] min-w-[320px] sm:mr-4 z-[999]"
        >
          <div className="
            h-[570px]
            bg-white shadow-xl border border-gray-200 
            flex flex-col rounded-t-lg overflow-hidden
            w-full sm:w-[360px] min-w-[320px]
            relative
          ">
            {/* 標題欄 */}
            <div 
              className="chat-header bg-[#5F7A68] text-white p-2 cursor-move select-none flex-shrink-0"
              onPointerDown={startDragging}
            >
              <div className="flex justify-between items-center px-2">
                <motion.div 
                  className="flex items-center gap-2"
                  initial={false}
                  animate={{ x: 0 }}
                  whileHover={{ x: 3 }}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <div className="flex flex-col ms-2">
                    <span className="font-medium">智能客服中心</span>
                    <span className="text-xs text-green-100 hidden sm:block">24小時線上服務</span>
                  </div>
                </motion.div>

                <button
                  onClick={handleClose}
                  className="hover:bg-black/10 p-1 rounded-full transition-colors"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 內容區域 */}
            {session?.user ? (
              // 已登入用戶顯示聊天窗口
              <ChatWindow socket={socket} onClose={handleClose} className="flex-1" />
            ) : (
              // 未登入用戶顯示登入提示
              <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                <div className="w-20 h-20 rounded-full bg-[#F3F7F3] flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#6B8E7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-[#4A3C31] mb-2">需要登入才能使用聊天功能</h3>
                  <p className="text-[#9F9189] max-w-sm mb-6">
                    登入後即可使用線上客服功能，與我們的服務人員即時溝通
                  </p>
                  <button
                    onClick={() => signIn()}
                    className="px-8 py-2 bg-[#6B8E7B] text-white rounded-full
                      hover:bg-[#5F7A68] active:scale-95
                      transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    立即登入
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatIcon;
