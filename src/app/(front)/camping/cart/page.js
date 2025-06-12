"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaUser, FaCheckCircle, FaCheck } from "react-icons/fa";
import {
  CalendarIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Link from "next/link";
import { showCartAlert } from "@/utils/sweetalert";
import { motion, AnimatePresence } from "framer-motion";
import Loading from '@/components/Loading';
import 'react-toastify/dist/ReactToastify.css';
import { cartToast, ToastContainerComponent } from "@/utils/toast";

// 新增步驟狀態常數
const STEPS = [
  { 
    id: 1, 
    label: '確認購物車',
    subLabel: '當前',
    icon: FaShoppingCart,
    description: '檢視並確認您的營位選擇'
  },
  { 
    id: 2, 
    label: '填寫資料',
    subLabel: '下一步',
    icon: FaUser,
    description: '填寫聯絡人與預訂資訊'
  },
  { 
    id: 3, 
    label: '完成預訂',
    icon: FaCheckCircle,
    description: '確認訂單並完成預訂'
  }
];

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState(null);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [hoveredStep, setHoveredStep] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // === 計算函數 ===
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateItemTotal = (item) => {
    if (!item.start_date || !item.end_date || !item.price) return 0;
    const days = calculateDays(item.start_date, item.end_date);
    return item.price * days * item.quantity;
  };

  const calculateTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      if (canCalculatePrice(item)) {
        const itemTotal = calculateItemTotal(item);
        return total + itemTotal;
      }
      return total;
    }, 0);
  }, [cartItems]);

  // === 輔助函數 ===
  const canCalculatePrice = (item) => {
    return item.start_date && item.end_date && item.spot_name;
  };

  const canUpdateQuantity = (item) => {
    return item.start_date && item.end_date && item.spot_name;
  };

  const calculateSubtotal = (item) => {
    if (!canCalculatePrice(item)) return 0;
    return (item.total_price || 0) * (item.quantity || 1);
  };

  // === API 操作函數 ===
  const handleQuantityChange = async (cartId, newQuantity, item) => {
    try {
      // 先檢查數量限制
      if (newQuantity < 1 || newQuantity > item.max_quantity) {
        return;
      }

      setIsLoading(true); // 開始載入

      // 計算新的總價
      const newTotalPrice = item.unit_price * newQuantity * calculateDays(item.start_date, item.end_date);

      const response = await fetch(`/api/camping/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId,
          quantity: newQuantity,
          totalPrice: newTotalPrice
        })
      });

      if (!response.ok) {
        throw new Error('更新數量失敗');
      }

      // 更新本地狀態，包含總價的更新
      setCartItems(prevItems =>
        prevItems.map(cartItem =>
          cartItem.id === cartId
            ? { 
                ...cartItem, 
                quantity: newQuantity,
                total_price: newTotalPrice
              }
            : cartItem
        )
      );

      // 設置高亮效果
      setHighlightedItem(cartId);
      setTimeout(() => setHighlightedItem(null), 1000);

      // 觸發購物車更新事件
      window.dispatchEvent(new Event('cartUpdate'));

      // 使用 cartToast 顯示成功訊息
      cartToast.updateSuccess();

    } catch (error) {
      // console.error('更新數量錯誤:', error);
      cartToast.error('更新數量失敗，請稍後再試');
    } finally {
      setIsLoading(false); // 結束載入
    }
  };

  const handleRemoveItem = async (cartId) => {
    try {
      // 先詢問用戶是否確定要刪除
      const result = await showCartAlert.confirm(
        "確定要移除此商品？",
        "移除後將無法復原"
      );

      if (!result.isConfirmed) return;

      const response = await fetch(`/api/camping/cart`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cartId })
      });

      if (!response.ok) {
        throw new Error("移除商品失敗");
      }

      // 從購物車列表中移除該商品
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id !== cartId)
      );

      // 顯示成功訊息
      showCartAlert.success("商品已從購物車中移除");

      // 觸發購物車更新事件
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      // console.error("移除商品失敗:", error);
      showCartAlert.error("移除失敗，請稍後再試");
    }
  };

  // === 效果處理 ===
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // === 優化效能 ===
  const memoizedTotal = useMemo(() => calculateTotal(), [calculateTotal]);

  // === 資料載入 ===
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/camping/cart');
      
      if (response.status === 401) {
        const result = await showCartAlert.confirm('請先登入', '登入後即可查看購物車內容');
        if (result.isConfirmed) {
          const currentPath = window.location.pathname;
          router.push('/auth/login');
          localStorage.setItem('redirectAfterLogin', currentPath);
        } else {
          router.push('/camping/activities');
        }
        return;
      }

      if (!response.ok) {
        throw new Error('獲取購物車失敗');
      }

      const data = await response.json();
      setCartItems(data.cartItems || []);
    } catch (error) {
      // console.error('獲取購物車錯誤:', error);
      cartToast.error('獲取購物車失敗，請稍後再試');
    } finally {
      setLoading(false);
      setIsPageLoaded(true);
    }
  };

  // 頁面載入時立即獲取數據
  useEffect(() => {
    fetchCartItems();
  }, []);

  // 監聽購物車更新事件
  useEffect(() => {
    const handleCartUpdate = async () => {
      await fetchCartItems();
    };

    window.addEventListener('cartUpdate', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdate', handleCartUpdate);
    };
  }, []);

  // 計算有效的總金額（只計算已完善資訊的項目）
  const calculateValidTotal = () => {
    return cartItems.reduce((total, item) => {
      if (canCalculatePrice(item)) {
        return total + (item.total_price || 0);
      }
      return total;
    }, 0);
  };

  // 檢查是否有未完善的項目
  const hasIncompleteItems = () => {
    return cartItems.some((item) => !canCalculatePrice(item));
  };

  // 前往結帳時的檢查
  const handleCheckout = () => {
    if (hasIncompleteItems()) {
      showCartAlert.warning("請先完善所有商品的預訂資訊");
      return;
    }
    router.push("/camping/checkout");
  };

  // 處理價格動畫
  useEffect(() => {
    const targetTotal = calculateTotal();
    const steps = 20; // 動畫步驟數
    const stepDuration = 50; // 每步時間（毫秒）
    const increment = (targetTotal - animatedTotal) / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep < steps) {
        setAnimatedTotal((prev) => prev + increment);
        currentStep++;
      } else {
        setAnimatedTotal(targetTotal); // 確保最終值精確
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [calculateTotal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <motion.div className="container mx-auto px-4 py-8">
      <ToastContainerComponent />
      <Loading isLoading={isLoading} />
      <motion.div className="container mx-auto px-4 py-12">
        {/* 步驟進度條 */}
        <div className="mb-16 relative z-0">
          <div className="relative flex justify-between max-w-4xl mx-auto">
            {STEPS.map((step, index) => (
              <motion.div 
                key={step.id} 
                className="flex flex-col items-center relative z-0 group w-full"
              >
                {/* 連接線 - 降低 z-index */}
                {index < STEPS.length - 1 && (
                  <div className="absolute h-[5px] top-[18px] left-[calc(50%+20px)] right-[calc(-50%+20px)] bg-[var(--tertiary-brown)] -z-10">
                    {step.id === 1 && (
                      <>
                        {/* 基礎流動效果 */}
                        <motion.div
                          className="absolute top-0 left-0 h-full w-full -z-10"
                          style={{
                            background: "linear-gradient(90deg, var(--primary-brown) 0%, var(--secondary-brown) 50%, var(--primary-brown) 100%)",
                            backgroundSize: "200% 100%",
                            opacity: 0.8
                          }}
                          animate={{
                            backgroundPosition: ["0% 0%", "100% 0%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                        {/* 光點流動效果 */}
                        <motion.div
                          className="absolute top-0 left-0 h-full w-[30px] -z-10"
                          style={{
                            background: "linear-gradient(90deg, transparent 0%, var(--primary-brown) 50%, transparent 100%)",
                            opacity: 0.9
                          }}
                          animate={{
                            x: ["-100%", "400%"],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                      </>
                    )}
                  </div>
                )}
                
                {/* 步驟圓圈 - 確保在連接線上方 */}
                <div className="relative z-10">
                  <motion.div 
                    className={`w-10 h-10 rounded-full border-[4px] flex items-center justify-center
                      ${step.id === 1 
                        ? 'bg-[var(--primary-brown)] border-[var(--primary-brown)]' 
                        : 'bg-[var(--tertiary-brown)] border-[var(--tertiary-brown)]'}
                      transition-colors duration-300 relative`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    {step.id === 1 ? (
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
                  <span className={`block text-base font-medium
                    ${step.id === 1 
                      ? 'text-[var(--primary-brown)]' 
                      : 'text-[var(--gray-3)]'}`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div className="bg-white rounded-lg shadow-md overflow-hidden">
          {cartItems.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="mb-6 text-[var(--primary-brown)] flex flex-col items-center gap-3"
              >
                <motion.div
                  className="text-3xl font-bold tracking-wider"
                  animate={{ 
                    opacity: [0.5, 1, 0.5],
                    y: [-2, 2, -2]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  CAMPING
                </motion.div>
                <motion.div 
                  className="text-sm text-[var(--gray-4)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  探索你的露營旅程
                </motion.div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/camping/activities"
                  className="inline-flex justify-center gap-2 px-8 py-2 bg-[var(--primary-brown)] text-white rounded-lg hover:bg-[var(--secondary-brown)] transition-all 
                  no-underline hover:no-underline"
                >
                  <motion.span
                    animate={{ x: [-5, 0, -5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex items-center"
                  >
                    →
                  </motion.span>
                  <span className="flex items-center">開始探索露營活動</span>
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <div className="divide-y divide-[var(--gray-6)]">
              <AnimatePresence mode="popLayout">
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-4 sm:p-6 transition-colors duration-200 ease-in-out relative ${
                      highlightedItem === item.id ? "bg-[var(--gray-7)]" : ""
                    }`}
                  >
                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                      {/* 左側：商品圖片 (佔 2 欄) */}
                      <Link
                        href={`/camping/activities/${item.activity_id}`}
                        className="col-span-2 no-underline hover:no-underline"
                        onClick={(e) => {
                          if (!item.activity_id) {
                            e.preventDefault();
                            // console.log('No activity_id available');
                          }
                        }}
                      >
                        <div className="relative w-24 h-24">
                          <Image
                            src={item.main_image ? `/uploads/activities/${item.main_image}` : "/default-activity.jpg"}
                            alt={item.title}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      </Link>

                      {/* 中間：標題、地點和日期 (佔 6 欄) */}
                      <div className="col-span-6 flex  items-center">
                        <Link
                          href={`/camping/activities/${item.activity_id}`}
                          className="flex-1 no-underline hover:no-underline"
                          onClick={(e) => {
                            if (!item.activity_id) {
                              e.preventDefault();
                              // console.log('No activity_id available');
                            }
                          }}
                        >
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-[var(--gray-1)] mb-2">
                              {item.activity_name}
                            </h3>
                            <div className="space-y-1 text-sm text-[var(--gray-3)]">
                              <div className="flex items-center gap-2">
                                <HomeIcon className="h-4 w-4" />
                                <span>{item.spot_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                <span>
                                  {format(new Date(item.start_date), "yyyy/MM/dd")} - 
                                  {format(new Date(item.end_date), "yyyy/MM/dd")}
                                  <span className="ml-1">
                                    {calculateDays(item.start_date, item.end_date)} 晚
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>

                        {/* 數量調整區塊 - 獨立於 Link 之外 */}
                        <div className="flex items-center gap-2 ml-4 h-full">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.id, item.quantity - 1, item);
                            }}
                            disabled={item.quantity <= 1 || isLoading}
                            className={`p-2 rounded-full transition-all duration-200
                              ${item.quantity <= 1 || isLoading 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-[var(--gray-7)] active:scale-95'}`}
                            whileHover={{ scale: item.quantity <= 1 ? 1 : 1.1 }}
                            whileTap={{ scale: item.quantity <= 1 ? 1 : 0.95 }}
                          >
                            <FaMinus className="w-3 h-3 text-[var(--gray-3)]" />
                          </motion.button>
                          
                          <motion.span 
                            className="w-8 text-center font-medium"
                            key={item.quantity}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            {item.quantity}
                          </motion.span>
                          
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.id, item.quantity + 1, item);
                            }}
                            disabled={item.quantity >= item.max_quantity || isLoading}
                            className={`p-2 rounded-full transition-all duration-200
                              ${item.quantity >= item.max_quantity || isLoading
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-[var(--gray-7)] active:scale-95'}`}
                            whileHover={{ scale: item.quantity >= item.max_quantity ? 1 : 1.1 }}
                            whileTap={{ scale: item.quantity >= item.max_quantity ? 1 : 0.95 }}
                          >
                            <FaPlus className="w-3 h-3 text-[var(--gray-3)]" />
                          </motion.button>
                        </div>
                      </div>

                      {/* 右側：價格資訊 (佔 4 欄) */}
                      <div className="col-span-4 text-right flex flex-col justify-center h-24">
                        <div className="text-sm text-[var(--gray-3)] mb-1">
                          NT$ {Number(item.unit_price).toLocaleString()} × 
                          {calculateDays(item.start_date, item.end_date)} 晚 × 
                          {item.quantity} 營位
                        </div>
                        <div className="text-xl font-bold text-[var(--primary-brown)]">
                          NT$ {Number(item.total_price).toLocaleString()}
                        </div>
                      </div>

                      {/* 加入刪除按鈕 - 調整位置 */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-500 transition-colors"
                        title="移除商品"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden flex flex-col gap-4">
                      {/* 商品基本信息 */}
                      <div className="flex gap-4">
                        {/* 商品圖片 */}
                        <Link
                          href={`/camping/activities/${item.activity_id}`}
                          className="flex-shrink-0 no-underline hover:no-underline"
                        >
                          <div className="relative w-20 h-20">
                            <Image
                              src={item.main_image ? `/uploads/activities/${item.main_image}` : "/default-activity.jpg"}
                              alt={item.title}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        </Link>

                        {/* 商品信息 */}
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-[var(--gray-1)] mb-1">
                            {item.activity_name}
                          </h3>
                          <div className="space-y-1 text-xs text-[var(--gray-3)]">
                            <div className="flex items-center gap-1">
                              <HomeIcon className="h-3 w-3" />
                              <span>{item.spot_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              <span>
                                {format(new Date(item.start_date), "yyyy/MM/dd")} -
                                {format(new Date(item.end_date), "yyyy/MM/dd")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 刪除按鈕 */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-gray-500 hover:text-red-500"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 價格和數量控制 */}
                      <div className="flex justify-between items-center pt-2 border-t border-[var(--gray-6)]">
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.id, item.quantity - 1, item);
                            }}
                            disabled={item.quantity <= 1 || isLoading}
                            className={`p-2 rounded-full transition-all duration-200
                              ${item.quantity <= 1 || isLoading 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-[var(--gray-7)] active:scale-95'}`}
                            whileHover={{ scale: item.quantity <= 1 ? 1 : 1.1 }}
                            whileTap={{ scale: item.quantity <= 1 ? 1 : 0.95 }}
                          >
                            <FaMinus className="w-3 h-3" />
                          </motion.button>
                          <motion.span 
                            className="w-8 text-center"
                            key={item.quantity}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            {item.quantity}
                          </motion.span>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item.id, item.quantity + 1, item);
                            }}
                            disabled={item.quantity >= item.max_quantity || isLoading}
                            className={`p-2 rounded-full transition-all duration-200
                              ${item.quantity >= item.max_quantity || isLoading
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-[var(--gray-7)] active:scale-95'}`}
                            whileHover={{ scale: item.quantity >= item.max_quantity ? 1 : 1.1 }}
                            whileTap={{ scale: item.quantity >= item.max_quantity ? 1 : 0.95 }}
                          >
                            <FaPlus className="w-3 h-3" />
                          </motion.button>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[var(--gray-3)]">
                            NT$ {Number(item.unit_price).toLocaleString()} × {calculateDays(item.start_date, item.end_date)}晚
                          </div>
                          <div className="text-lg font-bold text-[var(--primary-brown)]">
                            NT$ {Number(item.total_price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* 總計卡片區域 - 響應式調整 */}
          <div className="border-t border-[#F5F1EA] p-4 sm:p-6 bg-white">
            <div className="space-y-3 hidden md:block">
              {/* 商品小計列表 */}
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 items-center">
                    {/* 商品名稱 - 修正連結路徑 */}
                    <div className="col-span-6">
                      <Link
                        href={`/camping/activities/${item.activity_id}`}
                        className="font-bold text-[var(--gray-1)] hover:text-[var(--primary-brown)] transition-colors duration-300 no-underline hover:no-underline cursor-pointer"
                        onClick={(e) => {
                          if (!item.activity_id) {
                            e.preventDefault();
                            // console.log('No activity_id available');
                          }
                        }}
                      >
                        {item.activity_name}
                      </Link>
                    </div>
                    {/* 價格計算明細 */}
                    <div className="col-span-4 text-right text-sm text-[var(--gray-3)]">
                      NT$ {Number(item.unit_price).toLocaleString()} × 
                      {calculateDays(item.start_date, item.end_date)} 晚 × 
                      {item.quantity} 營位
                    </div>
                    {/* 小計金額 */}
                    <div className="col-span-2 text-right text-[var(--primary-brown)]">
                      NT$ {Number(item.total_price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* 分隔線 */}
              <div className="my-4 border-t border-[#F5F1EA]"></div>

              {/* 總金額 */}
              <div className="grid grid-cols-12 items-center">
                <div className="col-span-6">
                  <span className="font-bold text-lg text-[var(--gray-1)]">總計金額</span>
                </div>
                <div className="col-span-6 text-right">
                  <span className="text-xl font-bold text-[var(--primary-brown)]">
                    NT$ {cartItems.reduce((sum, item) => sum + Number(item.total_price), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 分隔線 */}
              <div className="my-4 border-t border-[#F5F1EA]"></div>

              {/* 操作按鈕 */}
              <div className="flex justify-between items-center">
                <Link
                  href="/camping/activities"
                  className="group flex items-center gap-2 px-6 py-2 text-[var(--primary-brown)] bg-white rounded-lg border border-[var(--primary-brown)] 
                  transition-all duration-300 font-bold no-underline hover:no-underline relative overflow-hidden
                  active:scale-95 transform"
                >
                  <motion.span
                    animate={{ x: [-5, 0, -5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex items-center relative z-10"
                  >
                    ←
                  </motion.span>
                  <span className="relative z-10 no-underline hover:no-underline">繼續購物</span>
                  {/* 滑動效果背景 */}
                  <div className="absolute inset-0 bg-[var(--gray-7)] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                </Link>

                <button
                  onClick={handleCheckout}
                  disabled={hasIncompleteItems()}
                  className={`px-8 py-2 rounded-lg font-bold transform transition-all duration-300 active:scale-95 ${
                    hasIncompleteItems()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[var(--primary-brown)] hover:bg-[var(--secondary-brown)]"
                  } text-white`}
                >
                  前往結帳
                </button>
              </div>
            </div>

            {/* Mobile 總計 */}
            <div className="md:hidden space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">總計金額</span>
                <span className="text-xl font-bold text-[var(--primary-brown)]">
                  NT$ {cartItems.reduce((sum, item) => sum + Number(item.total_price), 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                <Link
                  href="/camping/activities"
                  className="w-full text-center py-2.5 text-[var(--primary-brown)] bg-white rounded-lg border border-[var(--primary-brown)] no-underline hover:no-underline"
                >
                  繼續購物
                </Link>
                <button
                  onClick={handleCheckout}
                  disabled={hasIncompleteItems()}
                  className={`w-full py-2.5 rounded-lg font-bold ${
                    hasIncompleteItems()
                      ? "bg-gray-400"
                      : "bg-[var(--primary-brown)]"
                  } text-white`}
                >
                  前往結帳
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
