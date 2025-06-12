'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaTimes, FaTrash, FaMinus, FaPlus, FaShoppingCart } from 'react-icons/fa';
import { CalendarIcon, HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { showCartAlert } from "@/utils/sweetalert";  // 引入購物車專用的 sweetalert 工具
import { useDebounce } from '@/hooks/useDebounce';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaCampground } from 'react-icons/fa'; // 引入營地圖標
import Loading from '@/components/Loading';  // 引入 Loading 組件

export function CartSidebar({ isOpen, setIsOpen }) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false); // 新增：標記數據是否已載入
  const [updatingCartId, setUpdatingCartId] = useState(null);

  // 防抖處理購物車數據獲取
  const debouncedFetchCartItems = useDebounce(async () => {
    if (!isOpen) return;
    
    try {
      const response = await fetch('/api/camping/cart');
      
      if (response.status === 401) {
        const currentPath = window.location.pathname + window.location.search;
        const result = await showCartAlert.confirm('請先登入', '登入後即可查看購物車內容');
        setIsOpen(false);
        if (result.isConfirmed) {
          router.push('/auth/login');
          localStorage.setItem('redirectAfterLogin', currentPath);
        }
        return;
      }

      if (!response.ok) {
        throw new Error('獲取購物車失敗');
      }
      
      const data = await response.json();
      setCartItems(data.cartItems || []);
    } catch (error) {
      if (error.message !== '請先登入') {
        await showCartAlert.error(error.message);
      }
    } finally {
      setLoading(false);
      setDataLoaded(true); // 標記數據已載入完成
    }
  }, 300);

  // 修改 useEffect
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setDataLoaded(false); // 重置數據載入狀態
      debouncedFetchCartItems();
    }
  }, [isOpen]);

  // 分開處理 cartUpdate 事件
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isOpen) {  // 只在側邊欄打開時更新數據
        debouncedFetchCartItems();
      }
    };

    window.addEventListener('cartUpdate', handleCartUpdate);
    return () => {
      window.removeEventListener('cartUpdate', handleCartUpdate);
    };
  }, [isOpen]); // 只依賴 isOpen

  // 保留 debounce 處理數量更新
  const debouncedUpdateQuantity = useDebounce(async (cartId, newQuantity, item) => {
    try {
      const response = await fetch(`/api/camping/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId,
          quantity: newQuantity,
          totalPrice: item.unit_price * newQuantity * calculateNights(item.start_date, item.end_date)
        })
      });

      if (!response.ok) {
        throw new Error('更新數量失敗');
      }

      // 更新本地狀態
      setCartItems(prevItems =>
        prevItems.map(cartItem =>
          cartItem.id === cartId
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        )
      );

      // 觸發購物車更新事件
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      console.error('更新數量錯誤:', error);
      await showCartAlert.error('更新數量失敗，請稍後再試');
    } finally {
      setUpdatingCartId(null); // 更新完成後清除狀態
    }
  }, 300); // 300ms 的延遲

  // 處理數量更新的函數
  const handleUpdateQuantity = async (cartId, newQuantity, item, e) => {
    e.stopPropagation();
    if (updatingCartId) return; // 如果正在更新中，則不執行
    
    setUpdatingCartId(cartId); // 設置正在更新的 cartId
    await debouncedUpdateQuantity(cartId, newQuantity, item);
  };

  const handleRemoveItem = async (cartId) => {
    if (!cartId) {
      await showCartAlert.error('無效的操作');
      return;
    }

    try {
      const result = await showCartAlert.confirm(
        '確定要移除此項目？',
        '移除後將無法復原'
      );

      if (!result.isConfirmed) {
        return;
      }

      const response = await fetch(`/api/camping/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '移除項目失敗');
      }

      setCartItems(prevItems => prevItems.filter(item => item.id !== cartId));
      await showCartAlert.success('商品已從購物車中移除');
      window.dispatchEvent(new Event('cartUpdate'));
    } catch (error) {
      await showCartAlert.error(error.message || '移除項目失敗，請稍後再試');
    }
  };

  const getImageUrl = (imageName) => {
    if (imageName?.startsWith('http')) {
      return imageName;
    }
    return imageName ? `/uploads/activities/${imageName}` : '/default-activity.jpg';
  };

  const handleViewCart = async () => {
    const hasIncompleteItems = cartItems.some(item => !canCalculatePrice(item));
    // hasIncompleteItems 是用來檢查購物車中是否有未完整填寫資訊的項目
    if (hasIncompleteItems) {
      const result = await showCartAlert.confirm(
        '尚有未完成的預訂資訊',
        '建議先完善所有預訂資訊再進行結帳'
      );

      if (result.isConfirmed) {
        router.push(`/camping/activities/${cartItems[0].activity_id}`);  // 如果確認，直接前往購物車頁面
        setIsOpen(false);
      }
      return;

    }

    router.push('/camping/cart');
    setIsOpen(false);
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      const price = item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const canCalculatePrice = (item) => {
    return item.start_date && item.end_date && item.spot_name;
  };

  const calculateValidTotal = () => {
    return cartItems.reduce((total, item) => {
      if (canCalculatePrice(item)) {
        return total + (item.total_price || 0);
      }
      return total;
    }, 0);
  };

  const calculateNights = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 移除 +1，直接計算晚數
    return nights;
  };

  return (
    <>
      {/* Loading 組件 */}
      <Loading isLoading={updatingCartId !== null} />

      {/* 購物車遮罩層 */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[2001] transition-opacity duration-300
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* 購物車側邊欄 */}
      <div
        className={`fixed right-0 top-0 h-full w-[375px] bg-[#F8F6F3] shadow-xl z-[2003] 
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* 標題區域 */}
        <div className="p-2.5 border-b border-[#E5DED5] bg-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaShoppingCart className="w-5 h-5 text-[#8B7355]" />
              <div>
                <h2 className="text-lg font-semibold text-[#4A3C31] m-0">購物車</h2>
                {cartItems.length > 0 && (
                  <p className="text-sm text-[#8B7355] m-0">
                    {cartItems.length} 個營位預訂
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 rounded-full hover:bg-[#EAE6E0] text-[#8B7355] 
                transition-colors duration-200"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 內容區域 */}
        <div className="h-full overflow-y-auto pb-32 
          scrollbar-thin scrollbar-thumb-[#6B8E7B]/20 
          scrollbar-track-gray-50">
          {!dataLoaded || loading ? (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#B4A89F]/20 border-t-[#B4A89F]" />
            </div>
          ) : cartItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center p-6 text-center"
            >
              {/* 帳篷圖標 */}
              <FaCampground className="w-12 h-12 text-[#8B7355] mb-4" />
              
              {/* 標題 */}
              <h3 className="text-[#4A3C31] text-lg font-medium mb-2">
                購物車是空的
              </h3>
              
              {/* 副標題 */}
              <p className="text-[#8B7355] mb-6">
                來看看我們精選的露營地點吧！
              </p>
              
              {/* 按鈕 */}
              <Link href="/camping/activities">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#8B7355] text-white px-8 py-2.5 rounded-lg
                           hover:bg-[#7A6548] transition-colors duration-300
                           flex items-center justify-center gap-2
                           shadow-sm"
                  onClick={() => setIsOpen(false)}
                >
                  <FaCampground className="w-4 h-4" />
                  <span>立即預訂營地</span>
                </motion.button>
              </Link>

              {/* 提示文字 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 p-4 bg-[#F8F6F3] rounded-lg"
              >
                <p className="text-sm text-[#8B7355] mb-0">
                  💡 提示：預訂營地後可以在這裡查看訂單詳情
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <div className="space-y-4 pt-0 p-4 relative">
              {/* 局部 loading 遮罩 */}
              {loading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#6B8E7B]/20 border-t-[#6B8E7B]" />
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto pt-3">
                {cartItems.map((item) => (
                  <div 
                    key={item.id}
                    className="relative group p-4 
                      border border-[#E5DED5] hover:border-[#B4A89F]
                      hover:shadow-[0_2px_8px_rgba(180,168,159,0.15)] 
                      transition-all duration-200 mb-3 
                      rounded-lg cursor-pointer
                      bg-[#F8F6F3]"
                    onClick={() => {
                      setIsOpen(false); // 關閉側邊欄
                      router.push(`/camping/activities/${item.activity_id}`);
                    }}
                  >
                    {/* 垃圾桶按鈕 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                      className="absolute right-2 top-2 transition-colors"
                      style={{ zIndex: 0 }}
                    >
                      <FaTrash className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
                    </button>

                    {/* 商品內容 */}
                    <div className="flex gap-3">
                      {/* 商品圖片 */}
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          src={getImageUrl(item.main_image)}
                          alt={item.title || '活動圖片'}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* 商品資訊 */}
                      <div className="flex-1">
                        {/* 標題 */}
                        <h3 className="font-semibold text-base">
                          {item.title}
                        </h3>
                        
                        {/* 日期和營位資訊 */}
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            {item.start_date && item.end_date ? (
                              <span className="text-gray-600">
                                {format(new Date(item.start_date), 'yyyy/MM/dd')} - 
                                {format(new Date(item.end_date), 'yyyy/MM/dd')}
                                <span className="ml-1 text-gray-500">
                                  (共 {calculateNights(item.start_date, item.end_date)} 晚)
                                </span>
                              </span>
                            ) : (
                              <span className="text-amber-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                尚未選擇日期
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <HomeIcon className="h-4 w-4 text-gray-400" />
                            {item.spot_name ? (
                              <span className="text-gray-600">{item.spot_name}</span>
                            ) : (
                              <span className="text-amber-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                尚未選擇營位
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 價格顯示區域 */}
                    <div className="mt-4 flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                      {/* 數量控制 */}
                      <div className="relative flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
                        <button 
                          className="w-7 h-7 flex items-center justify-center 
                            border border-[#E5DED5] hover:border-[#B4A89F] 
                            rounded-md hover:bg-[#F8F6F3] 
                            transition-colors duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={(e) => handleUpdateQuantity(item.id, item.quantity - 1, item, e)}
                          disabled={updatingCartId === item.id}
                        >
                          <FaMinus className="w-2.5 h-2.5 text-[#8B7355]" />
                        </button>

                        <span className="w-10 h-7 flex items-center justify-center 
                          border border-[#E5DED5] 
                          rounded-md bg-white/80
                          text-[#4A3C31] font-medium">
                          {item.quantity}
                        </span>

                        <button 
                          className="w-7 h-7 flex items-center justify-center 
                            border border-[#E5DED5] hover:border-[#B4A89F] 
                            rounded-md hover:bg-[#F8F6F3] 
                            transition-colors duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={(e) => handleUpdateQuantity(item.id, item.quantity + 1, item, e)}
                          disabled={updatingCartId === item.id}
                        >
                          <FaPlus className="w-2.5 h-2.5 text-[#8B7355]" />
                        </button>
                      </div>
                      
                      {/* 價格詳細資訊 */}
                      <div className="flex flex-col items-end">
                        {canCalculatePrice(item) ? (
                          <>
                            <div className="text-sm text-gray-500">
                              NT$ {Number(item.unit_price).toLocaleString()} × 
                              {calculateNights(item.start_date, item.end_date)} 晚 × 
                              {item.quantity} 營位
                            </div>
                            <div className="text-green-600 font-semibold mt-1">
                              NT$ {Number(item.total_price).toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <div className="text-amber-500 text-sm flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            請完善預訂資訊
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部總金額和按鈕 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E5DED5]">
          {cartItems.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">總金額</span>
                <div className="text-right">
                  {calculateValidTotal() > 0 ? (
                    <span className="text-xl font-bold text-green-600">
                      NT$ {calculateValidTotal().toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-amber-500">
                      請完善預訂資訊以顯示總額
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleViewCart}
                className="w-full py-2.5 hover:bg-[var(--primary-brown)] text-white rounded-lg bg-[var(--secondary-brown)] transition-colors"
              >
                查看購物車
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/camping/cart');
              }}
              className="w-full py-2 hover:bg-[var(--primary-brown)] text-white rounded-lg bg-[var(--secondary-brown)] transition-colors"
            >
            查看詳細資訊
            </button>
          )}
        </div>
      </div>
    </>
  );
} 