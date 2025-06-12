'use client';
// ===== 核心套件引入 =====
import { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { showLoginAlert } from "@/utils/sweetalert";  // 引入 sweetalert
import { useDebounce } from '@/hooks/useDebounce';

// ===== 購物車圖標元件 =====
// 功能：顯示購物車圖標和商品數量，處理未登入狀態的路徑儲存
// 參數：onClick - 點擊事件處理函數
export function CartIcon({ onClick }) {
  // ===== 狀態管理 =====
  const { data: session, status } = useSession();  // 用戶登入狀態
  const [itemCount, setItemCount] = useState(0);   // 購物車商品數量
  const [isAnimating, setIsAnimating] = useState(false);  // 動畫狀態

  // 防抖處理購物車數量獲取
  const debouncedFetchCount = useDebounce(async () => {
    // 如果還在載入或未登入，不需要獲取數據
    if (status === 'loading' || !session) {
      setItemCount(0);
      return;
    }
    
    try {
      const response = await fetch('/api/camping/cart');
      
      if (!response.ok) {
        throw new Error('獲取購物車失敗');
      }
      
      const data = await response.json();
      setItemCount(data.cartItems?.length || 0);
    } catch (error) {
      await showLoginAlert.error('獲取購物車數量失敗');
      setItemCount(0);
    }
  }, 300);

  // 防抖處理動畫效果
  const debouncedAnimation = useDebounce(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, 300);

  // 只在登入狀態變化時獲取數據
  useEffect(() => {
    if (status === 'authenticated') {
      debouncedFetchCount();
    } else {
      setItemCount(0);
    }
  }, [status]);

  // 分開處理 cartUpdate 事件
  useEffect(() => {
    const handleCartUpdate = () => {
      if (status === 'authenticated') {
        debouncedFetchCount();
        debouncedAnimation();
      }
    };

    window.addEventListener('cartUpdate', handleCartUpdate);
    return () => window.removeEventListener('cartUpdate', handleCartUpdate);
  }, [status]);

  // ===== 渲染購物車圖標 =====
  return (
    <div 
      className="fixed bottom-20 right-4 md:right-8 z-50 bg-white p-3 rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      onClick={onClick}
    >
      {/* 購物車基本圖標 */}
      <FaShoppingCart 
        className="w-5 h-5 md:w-6 md:h-6 text-gray-600" 
      />
      
      {/* 購物車數量標記 */}
      {itemCount > 0 && (
        <span 
          className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs 
            rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center
            ${isAnimating ? 'animate-bounce-once' : ''}`}
        >
          {itemCount}
        </span>
      )}
    </div>
  );
} 