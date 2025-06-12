import Image from "next/image";
import {
  HiPencil,
  HiTrash,
  HiClock,
  HiCurrencyDollar,
  HiUsers,
  HiLocationMarker,
  HiCalendar,
  HiOfficeBuilding,
  HiStatusOnline,
  HiChevronDown,
} from "react-icons/hi";
import { motion } from "framer-motion";
import { useState } from "react";

export default function ActivityCard({ 
  activity, 
  onEdit, 
  onDelete,
  isExpanded,
  onToggleSpot
}) {
  // console.log('ActivityCard 接收到的活動資料:', {
  //   activity_id: activity.activity_id,
  //   activity_name: activity.activity_name,
  //   booking_overview: activity.booking_overview,
  //   spot_options: activity.spot_options
  // });

  // 日期格式化
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("zh-TW", {
      month: "numeric",
      day: "numeric"
    });
  };

  // 時間範圍格式化
  const formatDateRange = () => {
    const startDate = formatDate(activity.start_date);
    const endDate = formatDate(activity.end_date);
    return `${startDate} ~ ${endDate}`;
  };

  // 計算活動天數
  const getDaysDifference = () => {
    const start = new Date(activity.start_date);
    const end = new Date(activity.end_date);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 處理營位資訊
  const parseBookingOverview = () => {
    try {
      if (!activity.booking_overview) {
        // console.log('無 booking_overview 資料');
        return [];
      }

      if (typeof activity.booking_overview === 'string') {
        // console.log('嘗試解析 booking_overview 字串:', activity.booking_overview);
        return JSON.parse(activity.booking_overview);
      }

      if (Array.isArray(activity.booking_overview)) {
        // console.log('booking_overview 已是陣列');
        return activity.booking_overview;
      }

      // console.log('booking_overview 格式未知:', typeof activity.booking_overview);
      return [];
    } catch (error) {
      console.error('解析 booking_overview 失敗:', error);
      return [];
    }
  };

  const bookingData = parseBookingOverview();
  // console.log('解析後的營位資料:', bookingData);

  // 計算參加資訊
  const getRegistrationInfo = () => {
    try {
      // 解析 booking_overview 字串
      if (!bookingData || bookingData.length === 0) {
        return {
          availableText: "未設置營位",
          available: false,
          totalSpots: 0,
          bookedSpots: 0
        };
      }

      // 只計算啟用的營位
      const activeSpots = bookingData.filter(spot => spot.status === 1);
      
      // 計算總帳數和已訂帳數
      const totalTents = activeSpots.reduce((sum, spot) => 
        sum + parseInt(spot.totalQuantity || 0), 0);
      
      const bookedTents = activeSpots.reduce((sum, spot) => 
        sum + parseInt(spot.bookedQuantity || 0), 0);

      const availableTents = totalTents - bookedTents;

      return {
        availableText: availableTents > 0 
          ? `剩餘 ${availableTents} 個營位` 
          : totalTents === 0 
            ? "未設置營位" 
            : "已額滿",
        available: availableTents > 0,
        totalTents,
        bookedTents
      };
    } catch (error) {
      console.error('解析預訂資訊失敗:', error);
      return {
        availableText: "未設置營位",
        available: false,
        totalTents: 0,
        bookedTents: 0
      };
    }
  };

  // 判斷活動啟用狀態
  const getActiveStatus = () => {
    const isActive = activity.is_active === 1;
    const isOperating = activity.operation_status === 1;

    return {
      text: isActive && isOperating ? "啟用" : "停用",
      tooltip: isActive && isOperating 
        ? "活動目前為啟用狀態，可供報名參加" 
        : "活動目前為停用狀態，無法報名參加",
      class: isActive && isOperating
        ? "bg-[#6B8E7B] text-white"
        : "bg-gray-400 text-white"
    };
  };

  // 判斷活動時間狀態
  const getTimeStatus = () => {
    const today = new Date();
    const startDate = new Date(activity.start_date);
    const endDate = new Date(activity.end_date);

    if (today < startDate) {
      return {
        text: "未開始",
        class: "bg-[#E3D5CA] text-[#7D6D61]"
      };
    }
    if (today > endDate) {
      return {
        text: "已結束",
        class: "bg-gray-100 text-gray-600"
      };
    }
    return {
      text: "進行中",
      class: "bg-[#E8F0EB] text-[#2C4A3B]"
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 
                overflow-hidden group relative border border-[#E3D5CA]"
    >
      {/* 活動圖片區域 */}
      <div className="relative h-48">
        <Image
          src={
            activity.main_image
              ? activity.main_image.startsWith('http') 
                ? activity.main_image
                : `/uploads/activities/${activity.main_image}`
              : activity.camp_image
              ? activity.camp_image.startsWith('http')
                ? activity.camp_image
                : `/uploads/activities/${activity.camp_image}`
              : "/default-activity.jpg"
          }
          alt={activity.activity_name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
        {/* 漸層陰影遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* 價格標籤 */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-[#F8F5F3]/90 text-[#7D6D61] px-3 py-1.5 rounded-full text-xs">
            NT$ {activity.min_price?.toLocaleString()}
            {activity.max_price && activity.max_price !== activity.min_price &&
              ` - ${activity.max_price?.toLocaleString()}`}
          </span>
        </div>
        
        {/* 精選標籤 */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`bg-[#E3D5CA]/90 text-[#7D6D61] px-3 py-1.5 rounded-full text-xs`}>
            {activity.is_featured ? "精選" : "一般"}
          </span>
        </div>

        {/* 活動標題和時間 */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <h3 className="text-xl font-bold mb-2 text-white drop-shadow-sm">
            {activity.activity_name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-white">
            <div className="flex items-center gap-2">
              <HiCalendar className="w-4 h-4" />
              <span className="drop-shadow-sm">{formatDateRange()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HiClock className="w-4 h-4" />
              <span className="drop-shadow-sm">{getDaysDifference()}天</span>
            </div>
          </div>
        </div>
      </div>

      {/* 下方資訊區 */}
      <div className="p-4">
        {/* 營地資訊 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiOfficeBuilding className="w-4 h-4 text-[#6B8E7B]" />
            <div>
              <span className="text-[#2C4A3B] text-sm font-medium">
                {activity.camp_name}
              </span>
              <span className="text-[#7D6D61] text-xs ml-2">
                {activity.camp_address}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium
              ${activity.is_active && activity.operation_status === 1
                ? "bg-[#6B8E7B]/90 text-white"
                : "bg-[#9C9187]/90 text-white"}`}
            >
              {activity.is_active && activity.operation_status === 1 ? "啟用" : "停用"}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTimeStatus().class}`}>
              {getTimeStatus().text}
            </span>
          </div>
        </div>

        {/* 營位資訊區 */}
        {activity.booking_overview && JSON.parse(activity.booking_overview).length > 0 && (
          <div className="bg-[#F8F5F3] rounded-xl p-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleSpot(e);
              }}
              className="w-full"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiUsers className="w-4 h-4 text-[#6B8E7B]" />
                  <h5 className="text-sm font-medium text-[#2C4A3B]">
                    營位資訊 ({JSON.parse(activity.booking_overview).filter(spot => spot.status === 1).length})
                  </h5>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium
                    ${getRegistrationInfo().available
                      ? "bg-[#E8F0EB] text-[#2C4A3B]"
                      : "bg-[#E3D5CA] text-[#7D6D61]"}`}
                  >
                    {getRegistrationInfo().availableText}
                  </div>
                  <HiChevronDown 
                    className={`w-4 h-4 text-[#6B8E7B] transition-transform
                      ${isExpanded ? 'transform rotate-180' : ''}`}
                  />
                </div>
              </div>
            </button>

            <motion.div
              initial={false}
              animate={{ 
                height: isExpanded ? 'auto' : 0,
                opacity: isExpanded ? 1 : 0
              }}
              transition={{ 
                height: { duration: 0.3, ease: "easeInOut" },
                opacity: { duration: 0.2, ease: "easeInOut" }
              }}
              style={{ 
                overflow: 'hidden',
                transformOrigin: 'top'
              }}
            >
              <div className="grid gap-2 mt-3">
                {JSON.parse(activity.booking_overview).map((spot, index) => (
                  <div 
                    key={`${activity.activity_id}-${index}`}
                    className={`flex items-center justify-between rounded-lg p-3
                              ${spot.status === 1 
                                ? "bg-white" 
                                : "bg-gray-100 opacity-60"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md
                                    ${spot.status === 1 
                                      ? "bg-[#E8F0EB]" 
                                      : "bg-gray-200"}`}>
                        <HiUsers className={`w-3.5 h-3.5 
                                         ${spot.status === 1 
                                           ? "text-[#6B8E7B]" 
                                           : "text-gray-500"}`} />
                      </div>
                      <div>
                        <span className={`font-medium text-sm
                                      ${spot.status === 1 
                                        ? "text-[#2C4A3B]" 
                                        : "text-gray-500"}`}>
                          {spot.spotType}
                          {spot.status !== 1 && " (未啟用)"}
                        </span>
                        <span className={`text-xs ml-2
                                      ${spot.status === 1 
                                        ? "text-[#7D6D61]" 
                                        : "text-gray-400"}`}>
                          {spot.people_per_spot}人/帳
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={spot.status === 1 
                                      ? "text-[#7D6D61]" 
                                      : "text-gray-400"}>
                        已訂 {spot.bookedQuantity}/{spot.totalQuantity}
                      </span>
                      <span className={`px-2 py-1 rounded-md
                                     ${spot.status === 1 
                                       ? "bg-[#E8F0EB] text-[#2C4A3B]" 
                                       : "bg-gray-200 text-gray-500"}`}>
                        剩餘 {spot.totalQuantity - spot.bookedQuantity} 帳
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => onEdit(activity)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#6B8E7B] 
                      bg-[#E8F0EB] rounded-lg hover:bg-[#6B8E7B] hover:text-white transition-colors"
          >
            <HiPencil className="w-4 h-4" />
            編輯
          </button>
          <button
            onClick={() => onDelete(activity)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#9C9187] 
                      bg-[#E3D5CA] rounded-lg hover:bg-[#9C9187] hover:text-white transition-colors"
          >
            <HiTrash className="w-4 h-4" />
            刪除
          </button>
        </div>
      </div>
    </motion.div>
  );
}
