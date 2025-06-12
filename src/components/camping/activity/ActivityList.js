"use client";

// ===== 核心套件引入 =====
import Image from "next/image";            // Next.js 的圖片優化組件
import Link from "next/link";              // Next.js 的路由連結組件
import { useState, useEffect, useMemo } from "react";          // React 狀態管理
import { useRouter, useSearchParams } from "next/navigation"; // Next.js 路由導航
import { useSession } from "next-auth/react"; // Next-Auth 會話管理
import useSWR from "swr";                    // SWR 數據請求管理
import { motion } from "framer-motion";
import { TbCampfire } from "react-icons/tb";
import Loading from "@/components/Loading";  // 添加 Loading 組件引入
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';
import { useMediaQuery } from 'react-responsive'; // 引入 useMediaQuery

// ===== UI 圖標引入 =====
import {
  FaCalendarAlt,     // 日曆圖標
  FaMapMarkerAlt,    // 地標圖標
  FaHeart,           // 實心愛心圖標
  FaRegHeart,        // 空心愛心圖標
  FaShoppingCart,    // 購物車圖標
  FaStar,            // 星星圖標
  FaCampground,      // 露營圖標
  FaClock,           // 時鐘圖標
} from "react-icons/fa";

// ===== 日期處理引入 =====
import { format, differenceInDays, isFuture } from "date-fns";   // 日期格式化工具

// ===== 自定義工具引入 =====
import {
  cartToast,           // 購物車相關提示
  favoriteToast,       // 收藏相關提示
  ToastContainerComponent, // Toast 容器組件
} from "@/utils/toast";

import { 
  showLoginAlert,      // 登入相關提示
  showSystemAlert      // 系統錯誤提示
} from "@/utils/sweetalert";

// ===== 組件定義 =====
export function ActivityList({ activities, viewMode, isLoading }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState({});        // 收藏按鈕載入狀態
  const [cartLoading, setCartLoading] = useState({}); // 購物車按鈕載入狀態
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1024px)' }); // 判斷是否為平板或手機

  // 使用 SWR 只獲取收藏狀態
  const { data: favoritesData, mutate: mutateFavorites } = useSWR(
    session ? "/api/camping/favorites" : null,
    (url) => fetch(url).then((res) => res.json())
  );

  // 將收藏資料轉換為物件格式
  const favorites = favoritesData?.favorites?.reduce((acc, id) => {
    acc[id] = true;
    return acc;
  }, {}) || {};

  // 使用 useEffect 監聽價格篩選和活動數據的變化
  useEffect(() => {
    const priceRange = searchParams.get('priceRange');
    // console.log('=== 價格篩選結果更新 ===');
    // console.log('當前價格範圍:', priceRange);
    // console.log('當前活動數量:', activities?.length);
    // console.log('活動價格範圍:', activities?.map(a => ({
    //   id: a.activity_id,
    //   name: a.activity_name,
    //   min_price: a.min_price,
    //   max_price: a.max_price
    // })));
  }, [searchParams, activities]);

  // 確保活動數據正確排序和過濾
  const displayActivities = useMemo(() => {
    if (!activities) return [];
    
    // console.log('=== 活動篩選 ===');
    let filteredActivities = [...activities];
    
    // 1. 日期範圍篩選
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (startDate && endDate) {
      // console.log('日期篩選範圍:', { startDate, endDate });
      filteredActivities = filteredActivities.filter(activity => {
        const activityStart = activity.start_date;
        const activityEnd = activity.end_date;
        
        // console.log('檢查活動:', {
        //   名稱: activity.activity_name,
        //   活動期間: `${activityStart} ~ ${activityEnd}`,
        //   是否符合: (
        //     activityStart <= endDate && 
        //     activityEnd >= startDate
        //   )
        // });

        // 檢查日期是否重疊
        return activityStart <= endDate && activityEnd >= startDate;
      });
    }
    
    // 2. 價格範圍篩選
    const priceRange = searchParams.get('priceRange');
    if (priceRange && priceRange !== 'all') {
      const [min, max] = priceRange.split('-');
      
      filteredActivities = filteredActivities.filter(activity => {
        const activityMinPrice = parseFloat(activity.min_price);
        const activityMaxPrice = parseFloat(activity.max_price);
        
        if (min === '0') {
          return activityMaxPrice <= parseFloat(max);
        } else if (max === 'up') {
          return activityMinPrice >= parseFloat(min);
        } else {
          return (
            (activityMinPrice <= parseFloat(max) && activityMaxPrice >= parseFloat(min)) ||
            (parseFloat(min) <= activityMaxPrice && parseInt(max) >= activityMinPrice)
          );
        }
      });
    }
    
    // console.log('篩選後活動數量:', filteredActivities.length);
    return filteredActivities;
  }, [activities, searchParams]);

  // 處理載入狀態
  if (isLoading) {
    return <Loading />;
  }

  // ===== 收藏相關處理 =====
  const handleLike = async (e, activityId) => {
    e.preventDefault();

    // 檢查登入狀態
    if (!session) {
      // 未登入 -> 使用 SweetAlert 提示登入
      const result = await showLoginAlert.warning();
      if (result.isConfirmed) {
        router.push("/auth/login");
      }
      return;
    }

    // 避免重複點擊
    if (loading[activityId]) return;
    setLoading((prev) => ({ ...prev, [activityId]: true }));

    try {
      const response = await fetch("/api/camping/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });

      if (!response.ok) {
        throw new Error("收藏操作失敗");
      }

      // 更新收藏狀態
      await mutateFavorites();

      // 根據操作結果顯示對應提示
      favorites[activityId]
        ? favoriteToast.removeSuccess()  // 取消收藏成功
        : favoriteToast.addSuccess();    // 加入收藏成功

      // 觸發收藏更新事件
      window.dispatchEvent(
        new CustomEvent("favoritesUpdate", {
          detail: { type: favorites[activityId] ? "remove" : "add" },
        })
      );
    } catch (error) {
      console.error("收藏操作:", error);
      favoriteToast.error("收藏操作失敗");
    } finally {
      setLoading((prev) => ({ ...prev, [activityId]: false }));
    }
  };

  // ===== 購物車相關處理 =====
  const handleAddToCart = async (e, activity) => {
    e.preventDefault();

    // 檢查登入狀態
    if (!session) {
      // 未登入 -> 使用 SweetAlert 提示登入
      const result = await showLoginAlert.warning();
      if (result.isConfirmed) {
        router.push("/auth/login");
      }
      return;
    }

    // 避免重複點擊
    if (cartLoading[activity.activity_id]) return;
    setCartLoading((prev) => ({ ...prev, [activity.activity_id]: true }));

    try {
      const response = await fetch("/api/camping/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activity.activity_id,
          quantity: 1,
          totalPrice: 0,
          isQuickAdd: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 根據錯誤類型選擇提示方式
        if (
          data.error.includes("庫存不足") ||
          data.error.includes("已在購物車") ||
          data.error.includes("數量限制")
        ) {
          // 一般操作錯誤 -> 使用 Toast
          cartToast.error(data.error);
          return;
        }

        // 系統錯誤 -> 使用 SweetAlert
        await showSystemAlert.error(data.error || "加入購物車失敗");
        return;
      }

      // 加入成功 -> 使用 Toast
      cartToast.addSuccess();
      
      // 觸發購物車更新事件
      window.dispatchEvent(
        new CustomEvent("cartUpdate", {
          detail: { type: "add" },
        })
      );
    } catch (error) {
      console.error("加入購物車失敗:", error);
      // 未預期的錯誤 -> 使用 SweetAlert
      await showSystemAlert.unexpectedError();
    } finally {
      setCartLoading((prev) => ({ ...prev, [activity.activity_id]: false }));
    }
  };

  // ===== 圖片處理相關 =====
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/default-activity.jpg'; // 預設圖片
    
    // 如果是完整的 URL，直接返回
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // 如果是相對路徑，加上基礎路徑
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    
    // 其他情況，假設是在 uploads 目錄下
    return `/uploads/activities/${imagePath}`;
  };

  // ===== 地址處理相關 =====
  const AddressDisplay = ({ address, city }) => {
    // 如果有城市資訊但地址未提供
    if (city && (!address || address === '地址未提供')) {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <FaMapMarkerAlt className="w-4 h-4" />
          <span>{city}</span>
        </div>
      );
    }

    // 如果地址完全未提供
    if (!address || address === '地址未提供') {
      return (
        <div className="flex items-center gap-1 text-gray-400 italic">
          <FaMapMarkerAlt className="w-4 h-4" />
          <span>地址未提供</span>
        </div>
      );
    }

    // 正常顯示地址
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <FaMapMarkerAlt className="w-4 h-4" />
        <span>{address}</span>
      </div>
    );
  };

  // 容器動畫：控制整體淡入和子元素的依序出現
  const containerVariants = {
    hidden: { 
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",  // 先執行容器動畫
        staggerChildren: 0.15,   // 子元素間隔
        delayChildren: 0.1,      // 容器動畫完成後的延遲
        duration: 0.3,           // 容器動畫時間
        ease: "easeOut"         // 平滑的緩動函數
      }
    }
  };

  // 項目動畫：從左側滑入並淡入
  const itemVariants = {
    hidden: { 
      x: -15,
      opacity: 0,
      filter: "blur(5px)"
    },
    visible: (index) => ({ 
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        delay: index * 0.1, // 根據索引位置計算延遲
        ease: [0.25, 0.1, 0.25, 1.0], // 自定義貝塞爾曲線
      }
    })
  };

  // 移除 useMemo，直接判斷和渲染
  if (!displayActivities?.length) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center py-12 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <TbCampfire className="w-24 h-24 text-[#B6AD9A] mb-4" />
        <div className="text-center space-y-3">
          <h3 className="text-xl font-medium text-[#5D564D]">
            目前沒有符合條件的活動
          </h3>
          <p className="text-[#8C8275]">
            試試調整篩選條件，或探索其他地區的精彩活動
          </p>
        </div>
      </motion.div>
    );
  }

  const formatPrice = (min, max) => {
    if (min === max) return [min];  // 返回單一價格
    return [min, max];  // 返回價格範圍
  };

  // 添加評分顯示組件
  const RatingDisplay = ({ rating, reviewCount }) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center">
          <FaStar className="w-3.5 h-3.5 text-[#FFB800]" />
        </div>
        <span className="text-sm font-medium text-[#8C8275]">
          {parseFloat(rating).toFixed(1)}
        </span>
        <span className="text-xs text-[#B6AD9A]">
          ({reviewCount || 0})
        </span>
      </div>
    );
  };

  // 在 ActivityList 組件中添加價格範圍處理邏輯
  const isInPriceRange = (activity, priceRange) => {
    if (!priceRange || priceRange === 'all') return true;

    const [min, max] = priceRange.split('-');
    const activityMinPrice = parseInt(activity.min_price);
    const activityMaxPrice = parseInt(activity.max_price);

    // console.log('價格篩選檢查:', {
    //   活動名稱: activity.activity_name,
    //   活動價格範圍: `${activityMinPrice}-${activityMaxPrice}`,
    //   篩選價格範圍: `${min}-${max}`,
    //   原始篩選值: priceRange
    // });

    if (min === '0') {
      const result = activityMaxPrice <= parseInt(max);
      // console.log('低於上限檢查結果:', result);
      return result;
    }
    
    if (max === 'up') {
      const result = activityMinPrice >= parseInt(min);
      // console.log('高於下限檢查結果:', result);
      return result;
    }

    const result = (
      (activityMinPrice <= parseInt(max) && activityMaxPrice >= parseInt(min)) ||
      (parseInt(min) <= activityMaxPrice && parseInt(max) >= activityMinPrice)
    );
    
    // console.log('價格範圍重疊檢查結果:', result);
    return result;
  };

  // 計算剩餘天數的函數
  const getRemainingDays = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    
    if (!isFuture(end)) {
      return '已結束';
    }
    
    const days = differenceInDays(end, today);
    return days === 0 ? '最後一天' : `剩餘 ${days} 天`;
  };

  // 定義圖片大小的設定
  const imageSizes = {
    grid: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    list: "96px" // 列表視圖的圖片固定大小
  };

  return (
    <div className="relative min-h-[200px]">
      <Loading isLoading={isLoading} />
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {viewMode === 'grid' ? (
          // 移除 Swiper，改用 grid 佈局
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayActivities.filter(activity => isInPriceRange(activity, searchParams.get('priceRange'))).map((activity) => (
              <motion.div
                key={activity.activity_id}
                variants={itemVariants}
                className="bg-white/90 backdrop-blur-sm rounded-xl 
                         hover:bg-[#FAF7F2] transition-all duration-300 
                         border border-[#E5E1DB]/30 shadow-sm hover:shadow-md"
              >
                <Link
                  href={`/camping/activities/${activity.activity_id}`}
                  className="block no-underline hover:no-underline"
                >
                  <div className="absolute top-3 right-3 z-10 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(e, activity);
                      }}
                      disabled={cartLoading[activity.activity_id]}
                      className="p-2 rounded-full 
                               bg-white/90 backdrop-blur-sm
                               shadow-lg
                               transition-all duration-300
                               hover:scale-110 active:scale-90
                               hover:bg-white
                               hover:shadow-[0_0_10px_rgba(182,173,154,0.3)]
                               disabled:opacity-50 disabled:cursor-not-allowed
                               group/cart"
                    >
                      <FaShoppingCart 
                        className={`w-4 h-4 
                                 ${cartLoading[activity.activity_id]
                                   ? 'text-gray-400'
                                   : 'text-[#8C8275] group-hover/cart:text-[#B6AD9A]'
                                 }`}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleLike(e, activity.activity_id);
                      }}
                      disabled={loading[activity.activity_id]}
                      className="p-2 rounded-full 
                               bg-white/90 backdrop-blur-sm
                               shadow-lg
                               transition-all duration-300
                               hover:scale-110 active:scale-90
                               hover:bg-white
                               hover:shadow-[0_0_10px_rgba(182,173,154,0.3)]
                               disabled:opacity-50 disabled:cursor-not-allowed
                               group/heart"
                    >
                      {favorites[activity.activity_id] ? (
                        <FaHeart className="w-4 h-4 text-[#FF6B6B]" />
                      ) : (
                        <FaRegHeart className="w-4 h-4 text-[#8C8275] 
                                            group-hover/heart:text-[#FF6B6B]" />
                      )}
                    </button>
                  </div>

                  <div className="relative h-40 overflow-hidden rounded-t-xl">
                    <Image
                      src={getImageUrl(activity.main_image)}
                      alt={activity.activity_name}
                      fill
                      sizes={imageSizes[viewMode]}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      quality={75}
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`
                        px-2 py-1 text-xs rounded-full shadow-lg
                        ${activity.is_featured 
                          ? 'bg-[#FFB800]/90 backdrop-blur-sm text-white' 
                          : 'bg-white/90 backdrop-blur-sm text-[#8C8275]'}
                      `}>
                        {activity.is_featured ? '精選活動' : '一般活動'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 text-xs bg-[#4A3C31]/80 backdrop-blur-sm
                                    rounded-full text-white shadow-lg">
                        尚餘 {activity.available_spots || 0} 個營位
                      </span>
                    </div>
                  </div>

                  <div className="p-3 space-y-2.5">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-lg font-medium text-[#4A3C31] line-clamp-1 mb-0
                                      group-hover:text-[#8C8275] transition-colors duration-300">
                          {activity.activity_name}
                        </h3>
                        <RatingDisplay 
                          rating={activity.avg_rating} 
                          reviewCount={activity.review_count}
                        />
                      </div>
                      <p className="text-sm text-[#B6AD9A] line-clamp-1">
                        {activity.subtitle || "秋日的第一場露營"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-sm text-[#7C7267]">
                          <FaMapMarkerAlt className="w-4 h-4 text-[#B6AD9A] flex-shrink-0" />
                          <span className="truncate">{activity.city}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-[#7C7267]">
                        <FaClock className="w-4 h-4 text-[#B6AD9A] flex-shrink-0" />
                        <span>{getRemainingDays(activity.end_date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-[#7C7267]">
                      <FaCalendarAlt className="w-4 h-4 text-[#B6AD9A] flex-shrink-0" />
                      <div className="flex items-center gap-1">
                        <span>{format(new Date(activity.start_date), "yyyy/MM/dd")}</span>
                        <span className="text-[#B6AD9A]">~</span>
                        <span>{format(new Date(activity.end_date), "yyyy/MM/dd")}</span>
                      </div>
                    </div>

                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                      {activity.options?.map((option) => (
                        <span 
                          key={option.option_id}
                          className="flex-shrink-0 inline-flex items-center gap-1
                                 px-1.5 py-0.5 rounded
                                 bg-[#F5F3F0] text-xs text-[#8C8275]"
                        >
                          <FaCampground className="w-3 h-3" />
                          <span>{option.spot_name}</span>
                          <span className="text-[#B6AD9A]">•</span>
                          <span>{option.people_per_spot}人</span>
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center  border-t border-[#E5E1DB] pt-2">
                      <div className="space-y-0.5">
                        <p className="text-lg font-bold text-[#8C8275] flex items-center m-0">
                          <span className="text-xs mr-1 mt-1">NT$</span>
                          <span>{formatPrice(activity.min_price, activity.max_price).join('~')}</span>
                        </p>
                        <p className="text-xs text-[#B6AD9A]">每組活動</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(e, activity);
                        }}
                        className="px-3 py-1.5 rounded-lg
                                 bg-[#8C8275] text-white text-sm
                                 hover:bg-[#4A3C31]
                                 transition-colors duration-300"
                      >
                        立即預訂
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {displayActivities.filter(activity => isInPriceRange(activity, searchParams.get('priceRange'))).map((activity) => (
              <Link
                key={activity.activity_id}
                href={`/camping/activities/${activity.activity_id}`}
                className="flex gap-4 p-3 no-underline hover:no-underline bg-white/90 backdrop-blur-sm 
                          rounded-xl hover:bg-[#FAF7F2] transition-all duration-300 
                          border border-[#E5E1DB]/30 shadow-sm hover:shadow-md"
              >
                <div className="relative w-24 h-24 flex-shrink-0 self-center rounded-lg overflow-hidden">
                  <Image
                    src={getImageUrl(activity.main_image)}
                    alt={activity.activity_name}
                    fill
                    sizes={imageSizes.list}
                    className="object-cover"
                    loading="lazy"
                    quality={75}
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-medium text-[#4A3C31] m-0 line-clamp-1">
                        {activity.activity_name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[#B6AD9A]">|</span>
                        <span className="text-sm text-[#B6AD9A] line-clamp-1">
                          {activity.subtitle || "秋日的第一場露營"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 text-sm text-[#7C7267]">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt className="w-3.5 h-3.5 text-[#B6AD9A]" />
                          <span>{activity.city}</span>
                        </div>
                        {activity.avg_rating && (
                          <>
                            <span className="text-[#B6AD9A]">|</span>
                            <RatingDisplay 
                              rating={activity.avg_rating} 
                              reviewCount={activity.review_count}
                            />
                          </>
                        )}
                        <div className="flex items-center gap-1">
                          <FaClock className="w-3.5 h-3.5 text-[#B6AD9A]" />
                          <span>{getRemainingDays(activity.end_date)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <FaCalendarAlt className="w-3.5 h-3.5 text-[#B6AD9A]" />
                        <span>
                          {format(new Date(activity.start_date), "yyyy/MM/dd")}
                          <span className="text-[#B6AD9A] mx-1">~</span>
                          {format(new Date(activity.end_date), "yyyy/MM/dd")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2 border-t border-[#E5E1DB] pt-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-[#8C8275] flex items-center m-0">
                        <span className="text-xs mr-1 mt-1">NT$</span>
                        <span>{formatPrice(activity.min_price, activity.max_price).join('~')}</span>
                      </p>
                      <span className="text-xs text-[#B6AD9A]">
                        · 尚餘 {activity.available_spots || 0} 個營位
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(e, activity);
                        }}
                        className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm
                                 hover:shadow-md transition-all duration-300"
                      >
                        <FaShoppingCart className="w-4 h-4 text-[#8C8275]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleLike(e, activity.activity_id);
                        }}
                        className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm
                                 hover:shadow-md transition-all duration-300"
                      >
                        {favorites[activity.activity_id] ? (
                          <FaHeart className="w-4 h-4 text-[#FF6B6B]" />
                        ) : (
                          <FaRegHeart className="w-4 h-4 text-[#8C8275]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
      <ToastContainerComponent />
    </div>
  );
}
