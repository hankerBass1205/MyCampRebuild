'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * 登出頁面組件
 * 功能：
 * 1. 處理使用者登出流程
 * 2. 顯示登出動畫和提示
 * 3. 自動或手動重定向到首頁
 */
export default function LogoutPage() {
  // 路由控制器，用於頁面導航
  const router = useRouter();
  
  // 登出狀態管理：true = 正在登出，false = 登出完成或失敗
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef(null);
  const redirectTimeoutRef = useRef(null);
  const countdownTimeoutRef = useRef(null);

  // 修改重定向處理
  const handleRedirect = (path) => {
    // 清理所有計時器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }

    setIsRedirecting(true);
    router.replace(path);
  };

  // 當組件載入時執行登出流程
  useEffect(() => {
    let isMounted = true;

    const handleLogout = async () => {
      if (isRedirecting) return;

      try {
        await signOut({ redirect: false });
        
        if (!isMounted) return;

        timerRef.current = setInterval(() => {
          if (!isMounted) return;
          
          setCountdown((prev) => {
            const newCount = prev - 1;
            if (newCount <= 0) {
              // 清理計時器
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              // 使用 countdownTimeoutRef 來處理自動重定向
              countdownTimeoutRef.current = setTimeout(() => {
                if (isMounted) {
                  handleRedirect('/auth/login');
                }
              }, 0);
              
              return 0;
            }
            return newCount;
          });
        }, 1000);

      } catch (error) {
        console.error('登出錯誤:', error);
        if (isMounted) {
          setIsLoggingOut(false);
          setIsRedirecting(false);
        }
      }
    };

    handleLogout();

    // 清理函數
    return () => {
      isMounted = false;
      
      // 清理所有計時器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
        countdownTimeoutRef.current = null;
      }
    };
  }, [isRedirecting]);

  // 動畫變體
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // 按鈕點擊處理器
  const handleButtonClick = (path) => {
    if (isRedirecting) return;
    handleRedirect(path);
  };

  return (
    // 頁面容器：全屏高度、漸層背景
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center px-4">
      {/* 內容卡片：使用 Framer Motion 製作動畫效果 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center space-y-8"
      >
        {/* Logo 動畫 */}
        <motion.div
          className="relative w-48 h-48 mx-auto"
          animate={{
            opacity: [0.8, 1, 0.8],
            scale: [0.98, 1, 0.98],
            y: [-8, 8, -8],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
        >
          <Image
            src="/logo-loading.png"
            alt="Logout Logo"
            width={192}
            height={192}
            className="w-full h-full object-contain"
            priority
          />
        </motion.div>

        {/* 文字內容區塊 */}
        <motion.div 
          className="space-y-3"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{
            opacity: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }
          }}
        >
          <h1 className="text-2xl font-bold text-gray-800">
            {countdown > 0 ? '正在為您登出' : '登出完成'}
          </h1>
          <p className="text-gray-500">
            {countdown > 0 
              ? `請稍候片刻，${countdown} 秒後自動前往登入頁面` 
              : '感謝您的使用，期待再次見到您'}
          </p>
        </motion.div>

        {/* 按鈕群組 */}
        {!isRedirecting && countdown > 0 && (
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleButtonClick('/auth/login')}
              className="flex-1 py-2 px-6 rounded-xl 
                       bg-[#6B8E7B] text-white
                       hover:bg-[#5F7A68]
                       transition-all duration-300"
              disabled={isRedirecting}
            >
              <span>前往登入</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleButtonClick('/')}
              className="flex-1 py-2 px-6 rounded-xl 
                       border-2 border-[#6B8E7B] text-[#6B8E7B]
                       hover:bg-[#6B8E7B] hover:text-white
                       transition-all duration-300"
              disabled={isRedirecting}
            >
              <span>返回首頁</span>
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
} 