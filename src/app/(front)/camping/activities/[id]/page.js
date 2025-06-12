"use client";
import { useState, useEffect, useCallback, Fragment } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { format, addDays, isBefore } from "date-fns";
import { zhTW } from "date-fns/locale";
import dynamic from "next/dynamic";
import WeatherIcon from "@/components/camping/WeatherIcon";
import DiscussionSection from "@/components/camping/discussions/DiscussionSection";
import { showCartAlert, showLoginAlert } from "@/utils/sweetalert";
import { CampLocationMap } from "@/components/camping/maps/CampLocationMap";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DatePicker, ConfigProvider, Tabs, Tooltip } from "antd";
import dayjs from "dayjs";
import { SwapOutlined, SearchOutlined, DownOutlined } from "@ant-design/icons";
import RelatedActivities from "@/components/camping/activity/RelatedActivities";
import ParallaxSection from "@/components/camping/activity/ParallaxSection";
import StatisticsSection from "@/components/camping/activity/StatisticsSection";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Loading from "@/components/Loading";
import AIHelper from "@/components/camping/activity/AIHelper";
import BookingCalendar from "@/components/camping/activity/BookingCalendar";
import BookingOverview from "@/components/camping/activity/BookingOverview";
import Breadcrumb from "@/components/common/Breadcrumb";
import { activityToast } from "@/utils/toast";
import { useMediaQuery } from "react-responsive";

const { RangePicker } = DatePicker;

// 天氣卡片
const WeatherCard = ({ day }) => {
  const [tooltipPlacement, setTooltipPlacement] = useState("right");

  useEffect(() => {
    const handleResize = () => {
      setTooltipPlacement(window.innerWidth <= 768 ? "top" : "right");
    };

    // 初始化
    handleResize();

    // 監聽視窗大小變化
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getWeatherClass = (description = "") => {
    if (!description || typeof description !== "string") {
      return "sunny animate-sun-rotate";
    }

    if (description.includes("雷")) return "thunder animate-thunder-flash";
    if (description.includes("雨")) return "rainy animate-rain-fall";
    if (description.includes("陰")) return "cloudy animate-cloud-float";
    if (description.includes("多雲")) return "cloudy animate-cloud-float";
    if (description.includes("霧")) return "foggy animate-fog-drift";
    if (description.includes("晴")) return "sunny animate-sun-rotate";

    return "sunny animate-sun-rotate";
  };

  const startTime = new Date(day.startTime);
  const endTime = new Date(startTime.getTime() + 6 * 60 * 60 * 1000);

  // 新增天氣提醒函數
  const getWeatherTips = (weather = "", temperature = {}) => {
    const tips = [];

    // 根據天氣狀況給予提醒
    if (weather.includes("雷")) {
      tips.push("⚡ 請避免在開闊地區活動");
      tips.push("⛺ 確保帳篷防水性能");
    }
    if (weather.includes("雨")) {
      tips.push("☔ 請攜帶雨具");
      tips.push("🏕️ 選擇地勢較高的營地");
    }
    if (weather.includes("陰") || weather.includes("多雲")) {
      tips.push("🌥️ 天氣變化較大，請準備防雨裝備");
    }
    if (weather.includes("晴")) {
      tips.push("🌞 請做好防曬措施");
      tips.push("💧 請攜帶足夠飲用水");
    }
    if (weather.includes("霧")) {
      tips.push("🌫️ 請注意視線安全");
      tips.push("🔦 建議攜帶照明設備");
    }

    // 根據溫度給予提醒
    if (temperature.max > 28) {
      tips.push("🌡️ 高溫提醒：請預防中暑");
    }
    if (temperature.min < 15) {
      tips.push("🌡️ 低溫提醒：請攜帶保暖衣物");
    }

    return tips;
  };

  return (
    <Tooltip
      title={
        <div className="weather-detail-tooltip p-3">
          <div className="flex items-center justify-between mb-3 border-b border-gray-600 pb-2">
            <h4 className="text-white text-[16px]">
              {format(startTime, "MM/dd")} {format(startTime, "HH:mm")}-
              {format(endTime, "HH:mm")}
            </h4>
            <span className="text-white text-[14px] ps-2">{day.weather}</span>
          </div>

          <div className="space-y-3">
            {/* 溫度資訊 */}
            <div className="flex justify-between items-center text-white">
              <span>溫度範圍</span>
              <span>
                {day.temperature.min}° - {day.temperature.max}°
              </span>
            </div>

            {/* 降雨機率 */}
            {day.rainProb && (
              <div className="flex justify-between items-center text-white">
                <span>降雨機率</span>
                <span>{day.rainProb}%</span>
              </div>
            )}

            {/* 體感溫度 */}
            {day.description?.comfort && (
              <div className="flex justify-between items-center text-white">
                <span>體感溫度</span>
                <span>{day.description.comfort}</span>
              </div>
            )}

            {/* 風向風速 */}
            {day.description?.wind && (
              <div className="flex justify-between items-center text-white">
                <span>風向風速</span>
                <span>
                  {day.description.wind.direction} {day.description.wind.level}
                  級
                  {day.description.wind.speed &&
                    ` (${day.description.wind.speed})`}
                </span>
              </div>
            )}

            {/* 濕度 */}
            {day.description?.humidity && (
              <div className="flex justify-between items-center text-white">
                <span>相對濕度</span>
                <span>{day.description.humidity}%</span>
              </div>
            )}

            {/* 紫外線 */}
            {day.description?.uv && (
              <div className="flex justify-between items-center text-white">
                <span>紫外線指數</span>
                <span>{day.description.uv}</span>
              </div>
            )}

            {/* 能見度 */}
            {day.description?.visibility && (
              <div className="flex justify-between items-center text-white">
                <span>能見度</span>
                <span>{day.description.visibility}</span>
              </div>
            )}

            {/* 天氣提醒 */}
            {day.description?.warning && (
              <div className="mt-3 pt-2 border-t border-gray-600">
                <div className="text-yellow-300 text-sm">
                  ⚠️ {day.description.warning}
                </div>
              </div>
            )}

            {/* 新增：天氣提醒 */}
            <div className="mt-4 pt-3 border-t border-gray-600">
              <div className="text-yellow-300 text-sm font-medium mb-2">
                📝 戶外活動建議：
              </div>
              <div className="space-y-2">
                {getWeatherTips(day.weather, day.temperature).map(
                  (tip, index) => (
                    <div key={index} className="text-white text-sm">
                      {tip}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      }
      color="#4A5568"
      placement={tooltipPlacement}
      className="weather-tooltip"
      styles={{
        root: {
          maxWidth: "320px",
        },
      }}
      mouseEnterDelay={0.3}
      mouseLeaveDelay={0.1}
      destroyTooltipOnHide={true}
    >
      <div
        className="weather-card bg-white rounded-lg p-4 hover:shadow-lg transition-all duration-300
           relative md:static md:transform-none"
      >
        {/* 時間和天氣圖示 */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-600">
            <div className="font-medium">
              {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
            </div>
            <div className="text-sm">{format(startTime, "MM/dd")}</div>
          </div>
          <div className={`weather-icon ${getWeatherClass(day.weather)}`}>
            <WeatherIcon weatherCode={day.weather} size={24} />
          </div>
        </div>

        {/* 溫度區塊 - 修改這裡 */}
        <div className="flex justify-center gap-8 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">最低</div>
            <div className="text-2xl font-medium">{day.temperature.min}°</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">最高</div>
            <div className="text-2xl font-medium">{day.temperature.max}°</div>
          </div>
        </div>

        {/* 詳細資訊網格 */}
        <div className="grid grid-cols-2 gap-2">
          {day.rainProb && (
            <div className="flex items-center gap-2 bg-gray-50/80 rounded-md p-2">
              <span className="text-blue-500">💧</span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">降雨機率</span>
                <span className="font-medium">{day.rainProb}%</span>
              </div>
            </div>
          )}
          {day.description?.wind && (
            <div className="flex items-center gap-2 bg-gray-50/80 rounded-md p-2">
              <span className="text-gray-500">💨</span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">風速</span>
                <span className="font-medium">
                  {day.description.wind.level}級
                </span>
              </div>
            </div>
          )}
          {day.description?.humidity && (
            <div className="flex items-center gap-2 bg-gray-50/80 rounded-md p-2">
              <span className="text-blue-300">💦</span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">濕度</span>
                <span className="font-medium">{day.description.humidity}%</span>
              </div>
            </div>
          )}
          {day.description?.comfort && (
            <div className="flex items-center gap-2 bg-gray-50/80 rounded-md p-2">
              <span className="text-yellow-500">🌡️</span>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">體感</span>
                <span className="font-medium">{day.description.comfort}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Tooltip>
  );
};

// 修改 CartConflictModal 的導入方式
const ConflictModal = dynamic(
  () => import("@/components/camping/activity/CartConflictModal"),
  {
    ssr: false,
  }
);

// 活動詳情頁面
export default function ActivityDetail() {
  const params = useParams();
  const activityId = params?.id;
  const router = useRouter();
  const { data: session, status } = useSession();

  const isLoggedIn = status === "authenticated";
  const userId = session?.user?.id;

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [weather, setWeather] = useState(null);
  const [selectedWeatherDate, setSelectedWeatherDate] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [dayCount, setDayCount] = useState(0);
  const [activeTab, setActiveTab] = useState("info");
  const cartIconControls = useAnimation();
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictItem, setConflictItem] = useState(null);
  const [modalResolve, setModalResolve] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedBookingDate, setSelectedBookingDate] = useState(null);

  // 添加預訂日曆的狀態，booking-calendar api
  const [bookingStats, setBookingStats] = useState({
    loading: true,
    error: null,
    data: null,
  });

  // 獲取預訂日曆數據
  const fetchBookingStats = useCallback(async () => {
    try {
      // 檢查必要條件
      if (!activityId) {
        // console.log('活動ID不存在，跳過獲取預訂數據');
        return;
      }

      // 設置載入狀態
      setBookingStats((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      // 延遲一下確保其他資料都載入完成
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await fetch(
        `/api/camping/activities/${activityId}/booking-calendar`
      );

      if (response.status === 404) {
        // console.log('預訂數據尚未準備好');
        setBookingStats((prev) => ({
          ...prev,
          loading: false,
          data: null,
          error: null,
        }));
        return;
      }

      if (!response.ok) {
        throw new Error(`獲取預訂數據失敗: ${response.status}`);
      }

      const data = await response.json();
      setBookingStats({
        loading: false,
        error: null,
        data: data,
      });
    } catch (error) {
      // console.error('獲取預訂數據錯誤:', error);
      activityToast.error(error.message || "獲取預訂數據錯誤，請稍後再試");
      setBookingStats((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, [activityId]);

  // 修改 useEffect
  useEffect(() => {
    // 確保活動基本資料已載入
    if (activityId && !loading) {
      fetchBookingStats();
    }
  }, [activityId, loading, fetchBookingStats]);

  useEffect(() => {
    if (activityId) {
      fetchActivityDetails();
    }
  }, [activityId]);

  useEffect(() => {
    if (weather?.weatherData && weather.weatherData.length > 0) {
      const firstDate = format(
        new Date(weather.weatherData[0].startTime),
        "MM/dd",
        { locale: zhTW }
      );
      setSelectedWeatherDate(firstDate);
    }
  }, [weather?.weatherData]);

  const formatPrice = (price, showCurrency = true) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return "NT$ 0";

    const formattedPrice = new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(numPrice)
      .replace("TWD", "NT$");

    return showCurrency ? formattedPrice : formattedPrice.replace("NT$", "");
  };

  const fetchActivityDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/camping/activities/${activityId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "活動不存在或已下架");
      }

      setActivity(data);
    } catch (error) {
      // console.error("Error:", error);
      showCartAlert.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 確保日期是 Date 物件的輔助函數
  const ensureDate = (date) => {
    if (!date) return null;
    return date instanceof Date ? date : new Date(date);
  };

  // 監聽右側日期選擇器的變化
  useEffect(() => {
    if (selectedStartDate && selectedEndDate) {
      const startDate = ensureDate(selectedStartDate);
      const endDate = ensureDate(selectedEndDate);

      if (startDate && endDate) {
        const nights = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        setDayCount(nights);
        setSelectedBookingDate(startDate);
      }
    }
  }, [selectedStartDate, selectedEndDate]);

  // 處理日期選擇
  const handleDateSelect = useCallback(
    (date, action, type) => {
      const newDate = ensureDate(date);
      if (!newDate) return;

      if (type === "start") {
        setSelectedStartDate(newDate);
        setSelectedBookingDate(newDate);
        // 如果已有結束日期且在新的開始日期之前，清除結束日期
        if (selectedEndDate && isBefore(ensureDate(selectedEndDate), newDate)) {
          setSelectedEndDate(null);
        }
      } else if (type === "end") {
        setSelectedEndDate(newDate);
      }
    },
    [selectedEndDate]
  );

  // 處理右側日期選擇器的變化
  const handleDateRangeChange = useCallback((dates) => {
    if (dates && dates.length === 2) {
      const [start, end] = dates;
      // 將 dayjs 物件轉換為 Date 物件
      const startDate = start ? start.toDate() : null;
      const endDate = end ? end.toDate() : null;

      if (startDate && endDate) {
        setSelectedStartDate(startDate);
        setSelectedEndDate(endDate);
        setSelectedBookingDate(startDate);

        const nights = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        setDayCount(nights);
      }
    } else {
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setSelectedBookingDate(null);
      setDayCount(0);
    }
  }, []);

  // 監聽日期和營位選擇的變化
  useEffect(() => {
    if (selectedStartDate && selectedEndDate && selectedOption) {
      // 自動計算價格
      const dayCount = Math.ceil(
        (selectedEndDate.getTime() - selectedStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // 更新天數
      setDayCount(dayCount);

      // 更新總價
      const totalPrice = dayCount * selectedOption.price * quantity;
      setTotalAmount(totalPrice);
    }
  }, [selectedStartDate, selectedEndDate, selectedOption, quantity]);

  // 加入購物車動畫效果
  const animateCartIcon = async () => {
    // 先縮小
    await cartIconControls.start({
      scale: 0.8,
      transition: { duration: 0.1 },
    });
    // 放大並彈跳
    await cartIconControls.start({
      scale: 1.2,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    });
    // 恢復原狀
    await cartIconControls.start({
      scale: 1,
      transition: { duration: 0.2 },
    });
  };

  // 檢查購物車中是否已存在相同活動
  const checkExistingCartItem = async () => {
    try {
      const response = await fetch("/api/camping/cart", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("獲取購物車失敗");
      }

      const data = await response.json();

      // 檢查購物車中是否有相同活動
      const existingItem = data.cartItems.find(
        (item) => item.activity_id === parseInt(activityId)
      );

      return existingItem;
    } catch (error) {
      // console.error("檢查購物車失敗:", error);
      activityToast.error(error.message || "檢查購物車失敗，請稍後再試");
      return null;
    }
  };

  // 更新購物車項目的函數
  const updateCartItem = async (updateData) => {
    try {
      const response = await fetch(`/api/camping/cart`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartId: updateData.cartId,
          quantity: updateData.quantity,
          startDate: updateData.startDate,
          endDate: updateData.endDate,
          optionId: updateData.optionId,
          totalPrice: updateData.totalPrice,
          activityId: updateData.activityId,
          spotName: updateData.spotName,
          price: updateData.price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "更新購物車失敗");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      // console.error("更新購物車失敗:", error);
      activityToast.error(error.message || "更新購物車失敗，請稍後再試");
      throw error;
    }
  };

  // 使用 useCallback 來優化模態框的處理函數
  const handleCartConflict = useCallback(async (existingItem) => {
    return new Promise((resolve) => {
      setConflictItem(existingItem);
      setModalResolve(() => resolve);
      setShowConflictModal(true);
    });
  }, []);

  // 使用 useEffect 來處理 body scroll
  useEffect(() => {
    if (showConflictModal) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showConflictModal]);

  // 修改確認和取消處理函數
  const handleModalClose = (confirmed) => {
    if (modalResolve) {
      modalResolve(confirmed);
    }
    setShowConflictModal(false);
    setConflictItem(null);
    setModalResolve(null);
  };

  // 處理模態框確認的函數
  const handleModalConfirm = async (updateData) => {
    try {
      setIsSubmitting(true);
      const result = await updateCartItem(updateData);

      if (result) {
        await animateCartIcon();
        showCartAlert.success("成功更新購物車！", "點擊右上角購物車圖標查看");
        window.dispatchEvent(
          new CustomEvent("cartUpdate", {
            detail: { type: "update", animation: true },
          })
        );
      }
    } catch (error) {
      // console.error("更新購物車失敗:", error);
      showCartAlert.error(error.message || "更新失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
      handleModalClose(true);
    }
  };

  // 新增取消處理函數
  const handleModalCancel = () => {
    handleModalClose(false);
  };

  // ✅ 加入購物車
  const handleAddToCart = async () => {
    try {
      if (!isLoggedIn) {
        const result = await showLoginAlert.warning();
        if (result.isConfirmed) {
          router.push("/auth/login");
        }
        return;
      }

      setIsSubmitting(true);

      if (!selectedStartDate || !selectedEndDate) {
        showCartAlert.error("請選擇日期");
        return;
      }

      if (!selectedOption) {
        showCartAlert.error("請選擇營位");
        return;
      }

      if (quantity < 1) {
        showCartAlert.error("請選擇正確數量");
        return;
      }

      // 檢查購物車是否已有相同活動
      const existingItem = await checkExistingCartItem();

      if (existingItem) {
        const shouldUpdate = await handleCartConflict(existingItem);

        if (shouldUpdate) {
          return;
        } else {
          return;
        }
      }

      // 新增到購物車
      const totalPrice = calculateTotalPrice();
      const cartData = {
        activityId,
        quantity,
        totalPrice,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        optionId: selectedOption.option_id,
      };

      const response = await fetch("/api/camping/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cartData),
      });

      if (!response.ok) {
        throw new Error("加入購物車失敗");
      }

      await animateCartIcon();
      showCartAlert.success("成功加入購物車！", "點擊右上角購物車圖標查看");
      window.dispatchEvent(
        new CustomEvent("cartUpdate", {
          detail: { type: "add", animation: true },
        })
      );
    } catch (error) {
      // console.error("購物車操作失敗:", error);
      showCartAlert.error(error.message || "操作失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 獲取營地座標
  const getCoordinates = async (address) => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=tw`
      );
      const data = await response.json();

      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      // console.error("Error getting coordinates:", error);
      activityToast.error(error.message || "獲取座標失敗，請稍後再試");
      return null;
    }
  };

  useEffect(() => {
    if (activity?.camp_address) {
      getCoordinates(activity.camp_address).then((position) => {
        if (position) {
          setMapPosition(position);
        }
      });
    }
  }, [activity?.camp_address]);

  // 處理營位選擇
  const handleOptionSelect = (option) => {
    if (selectedOption?.option_id === option.option_id) {
      setSelectedOption(null);
      setQuantity(1);
    } else {
      setSelectedOption(option);
      setQuantity(1);
    }
  };

  // 天氣卡片
  const fetchWeather = async (address) => {
    try {
      setWeatherLoading(true);
      // console.log('Fetching weather for address:', address);

      // 確保地址存在
      if (!address) {
        throw new Error("地址不能為空");
      }

      // 提取縣市名稱
      const cityMatch = address.match(/^(.{2,3}(縣|市))/);
      const location = cityMatch ? cityMatch[0] : address.substring(0, 3);
      // console.log('Extracted location:', location);

      // 確保有取得地區名稱
      if (!location) {
        throw new Error("無法從地址中提取縣市名稱");
      }

      const response = await fetch(
        `/api/camping/weather?location=${encodeURIComponent(location)}`
      );

      if (!response.ok) {
        throw new Error("天氣資料獲取失敗");
      }

      const data = await response.json();
      // console.log('Weather data:', data);

      if (!data.success) {
        throw new Error(data.message || "無法獲取天氣資料");
      }

      // 確保有天氣資料
      if (!data.weatherData || data.weatherData.length === 0) {
        throw new Error("無天氣資料");
      }

      setWeather(data);
    } catch (error) {
      // console.error("獲取天氣資訊失敗:", error);
      activityToast.error(error.message || "獲取天氣資訊失敗，請稍後再試");
      setWeather({
        success: false,
        location: "",
        weatherData: [],
        error: error.message,
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (activity?.camp_address) {
      fetchWeather(activity.camp_address);
    }
  }, [activity?.camp_address]);

  const getWeatherSuggestions = (weatherData) => {
    if (!weatherData) return null;

    // 取得當前時段的天氣數據
    const currentWeather = weatherData[0];

    // 露營適合度建議
    const getCampingSuitability = () => {
      if (currentWeather.description?.comfort === "寒冷") {
        return "天氣較冷，請做好保暖準備";
      } else if (currentWeather.description?.comfort === "舒適") {
        return "天氣舒適，非常適合露營活動";
      } else if (currentWeather.description?.comfort?.includes("悶熱")) {
        return "天氣較熱，建議選擇通風處紮營";
      }
      return "天氣適中，適合露營活動";
    };

    // 降雨建議
    const getRainSuggestion = () => {
      const rainProb = currentWeather.description?.rainfall || 0;
      if (rainProb > 70) {
        return "降雨機率高，建議攜帶雨具及防水用品";
      } else if (rainProb > 30) {
        return "可能有短暫降雨，建議準備雨具";
      }
      return "降雨機率低，不需攜帶雨具";
    };

    // 溫度建議
    const getTemperatureSuggestion = () => {
      const tempMin = currentWeather.description?.minTemp;
      const tempMax = currentWeather.description?.maxTemp;
      const tempDiff = tempMax - tempMin;

      if (tempDiff > 8) {
        return "早晚溫差大，建議多帶一件外套";
      } else if (tempMax > 28) {
        return "氣溫較高，建議攜帶防曬用品";
      } else if (tempMin < 15) {
        return "氣溫偏低，請注意保暖";
      }
      return "溫度適中，請備薄外套";
    };

    return {
      campingSuitability: getCampingSuitability(),
      rainSuggestion: getRainSuggestion(),
      temperatureSuggestion: getTemperatureSuggestion(),
    };
  };

  // 天氣卡片滾動容器
  const renderWeatherInfo = () => {
    if (!weather?.weatherData || weather?.weatherData.length === 0) {
      return <div className="text-[#A3907B]">暫無天氣資訊</div>;
    }

    // 將天氣資料按日期分組
    const groupedWeather = weather.weatherData.reduce((acc, day) => {
      const date = format(new Date(day.startTime), "MM/dd", { locale: zhTW });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(day);
      return acc;
    }, {});

    // 獲取第一個日期
    const firstDate = Object.keys(groupedWeather)[0];

    // 天氣卡片滾動容器
    const items = Object.entries(groupedWeather).map(([date, dayWeathers]) => ({
      key: date,
      label: date,
      children: (
        <div className="weather-container">
          {/* 互動提示 */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-blue-600">
              <SwapOutlined />
              <span className="text-sm text-gray-600">左右滑動切換時段</span>
            </div>
            {/* <div className="hidden sm:block w-px h-4 bg-gray-200" /> */}
            <div className="flex items-center gap-2 text-green-600">
              <SearchOutlined />
              <span className="text-sm text-gray-600">點擊查看詳情</span>
            </div>
          </div>

          {/* 天氣卡片滾動容器 */}
          <div className="relative">
            <div className="overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex gap-2 min-w-min">
                {dayWeathers.map((day) => (
                  <div
                    key={day.startTime}
                    className="w-[280px] sm:w-[220px] md:w-[240px] lg:w-[260px] shrink-0"
                  >
                    <WeatherCard day={day} />
                  </div>
                ))}
              </div>
            </div>

            {/* 滾動提示陰影 */}
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
          </div>
        </div>
      ),
    }));

    return (
      <Tabs
        items={items}
        type="card"
        animated={true}
        className="weather-tabs"
        activeKey={selectedWeatherDate || firstDate}
        onChange={(key) => setSelectedWeatherDate(key)}
        defaultActiveKey={firstDate}
        styles={{
          tab: {
            // 默認標籤樣式
            color: "#A3907B", // 改為較淺的棕色
            backgroundColor: "#F8F6F3",
            border: "1px solid #E5DED5",
            borderBottom: "none",
            marginRight: "4px",
            borderRadius: "8px 8px 0 0",
            "&:hover": {
              color: "#8B7355", // hover 時的顏色
            },
          },
          tabActive: {
            // 選中標籤樣式
            color: "#F8F6F3 !important",
            backgroundColor: "#8B7355 !important",
          },
          tabPane: {
            padding: "16px",
            backgroundColor: "#fff",
            borderRadius: "0 0 8px 8px",
          },
          nav: {
            marginBottom: "0",
          },
        }}
      />
    );
  };

  // 計算總價的函數
  const calculateTotalPrice = () => {
    if (!selectedStartDate || !selectedEndDate || !selectedOption) {
      return 0;
    }

    const dayCount = Math.ceil(
      (selectedEndDate.getTime() - selectedStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return dayCount * selectedOption.price * quantity;
  };

  useEffect(() => {}, [
    selectedStartDate,
    selectedEndDate,
    dayCount,
    selectedOption,
    quantity,
  ]);

  // 優化：更流暢的標籤切換動畫
  const tabContentVariants = {
    enter: {
      opacity: 0,
      x: 100,
      scale: 0.95,
      filter: "blur(16px)",
      rotateY: 15,
      transformPerspective: 1000,
    },
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      rotateY: 0,
      transition: {
        type: "spring",
        stiffness: 200, // 增加彈簧強度
        damping: 20,
        mass: 0.4,
        filter: {
          duration: 0.15, // 更快的模糊消失
          ease: "easeOut",
        },
      },
    },
    exit: {
      opacity: 0,
      x: -100,
      scale: 0.95,
      filter: "blur(16px)",
      rotateY: -15,
      transition: {
        duration: 0.2, // 更快的退場
        ease: "easeIn",
      },
    },
  };

  // 新增：標籤按鈕點擊波紋效果
  const tabButtonVariants = {
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 },
    },
  };

  // 營地各項資訊標籤列表
  const tabs = [
    { id: "info", name: "營地資訊" }, // 1. 基本介紹
    { id: "location", name: "位置資訊" }, // 2. 如何抵達
    { id: "weather", name: "天氣資訊" }, // 3. 規劃露營時間
    { id: "calendar", name: "預定日曆" }, // 4. 查看可預訂日期
    { id: "booking", name: "預定狀況" }, // 5. 確認營位狀態
    { id: "discussions", name: "評論區" }, // 6. 參考其他人評價
  ];

  // 營地資訊卡片
  const renderTabContent = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="min-h-[400px]"
        >
          {/* 營地資訊 */}
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* 營地資訊卡片 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#F8F6F3] rounded-lg p-4 shadow-sm border border-[#E5DED5] hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  {/* 左側標題 */}
                  <div className="flex items-center gap-2 text-[#8B7355]">
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      animate={{
                        y: [-1, 1, -1],
                        scale: [1, 1.05, 1],
                        rotate: [-2, 2, -2],
                      }}
                      transition={{
                        duration: 3,
                        ease: "easeInOut",
                        repeat: Infinity,
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </motion.svg>
                    <h2 className="text-xl font-bold m-0">營地資訊</h2>
                  </div>

                  {/* 右側進出場時間提醒 */}
                  <div className="text-sm text-[#A3907B] flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>進出營時間：</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-2 text-right">
                      <span>入營 13:00</span>
                      <span className="hidden sm:inline">|</span>
                      <span>拔營 隔日12:00</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white px-4 py-2 rounded-md border border-[#E5DED5] hover:border-[#8B7355]/30 transition-colors">
                      <h3 className="text-base font-semibold text-[#8B7355] mb-1.5">
                        營地名稱
                      </h3>
                      <p className="text-[#A3907B] text-sm mb-0">
                        {activity?.campInfo?.name}
                      </p>
                    </div>
                    <div className="bg-white p-2.5 px-4 rounded-md border border-[#E5DED5] hover:border-[#8B7355]/30 transition-colors">
                      <h3 className="text-base font-semibold text-[#8B7355] mb-1.5">
                        地址
                      </h3>
                      <p className="text-[#A3907B] text-sm mb-0">
                        {activity?.campInfo?.address}
                      </p>
                    </div>
                  </div>

                  {activity?.campInfo?.description && (
                    <div className="bg-white p-2.5 px-4 rounded-md border border-[#E5DED5] hover:border-[#8B7355]/30 transition-colors">
                      <h3 className="text-base font-semibold text-[#8B7355] mb-1.5">
                        營地介紹
                      </h3>
                      <p className="text-[#A3907B] leading-relaxed whitespace-pre-line text-sm">
                        {activity.campInfo.description}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* 注意事項卡片 */}
              {activity?.campInfo?.notice && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-[#F8F6F3] rounded-lg p-4 shadow-sm border border-[#E5DED5] hover:shadow-md transition-all duration-300"
                >
                  <h2 className="text-xl font-bold text-[#8B7355] mb-4 flex items-center gap-2 px-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    注意事項
                  </h2>
                  <div className="bg-white p-2.5 px-4 rounded-md border border-[#E5DED5] hover:border-[#8B7355]/30 transition-colors">
                    <div className="prose max-w-none text-[#A3907B] leading-relaxed whitespace-pre-line text-sm">
                      {activity.campInfo.notice}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* 天氣資訊 */}
          {activeTab === "weather" && (
            <div className="bg-[#F8F6F3] rounded-lg p-4 shadow-sm border border-[#E5DED5]">
              <div className="flex items-center justify-between mb-4">
                {/* 左側標題 */}
                <div className="flex items-center gap-2 text-[#8B7355]">
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    animate={{
                      y: [-2, 2, -2],
                      rotate: [-5, 5, -5],
                    }}
                    transition={{
                      duration: 4,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </motion.svg>
                  <h3 className="text-lg font-medium m-0">天氣資訊</h3>
                </div>

                {/* 右側提示 */}
                <div className="flex items-center gap-2">
                  <Tooltip
                    title={
                      <div className="p-2">
                        <p className="text-sm mb-2">
                          天氣預報僅提供未來7天的資訊：
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-xs mb-0">
                          <li>氣象局API限制僅提供7天預報</li>
                          <li>預報時間越長，準確度越低</li>
                          <li>建議接近露營日再次確認天氣</li>
                        </ul>
                      </div>
                    }
                    placement="top"
                  >
                    <div className="flex items-center gap-1.5 text-sm text-[#8B7355]/80 bg-[#8B7355]/10  md:mt-0 px-3 py-1 rounded-full cursor-help">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>僅提供7天內預報</span>
                    </div>
                  </Tooltip>
                </div>
              </div>
              {renderWeatherInfo()}
            </div>
          )}

          {/* 位置資訊 */}
          {activeTab === "location" && (
            <div className="space-y-8">
              <div className="mb-8">
                {activity && (
                  <CampLocationMap
                    campData={{
                      name: activity.camp_name,
                      county:
                        activity.camp_address?.match(/^(.{2,3}(縣|市))/)?.[0] ||
                        "未知",
                      countySN: activity.county_sn || "10000000",
                      address: activity.camp_address, // 確保這裡傳入完整地址
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* 評論區 */}
          {activeTab === "discussions" && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              {/* <h2 className="text-xl font-semibold mb-4">評論區</h2> */}
              <DiscussionSection activityId={activityId} />
            </div>
          )}

          {/* 營位狀況 */}
          {activeTab === "booking" && (
            <BookingOverview activityId={activityId} />
          )}

          {/* 預定日曆 */}
          {activeTab === "calendar" && (
            <BookingCalendar
              activity={activity}
              bookingStats={bookingStats.data}
              onDateSelect={handleDateSelect}
              selectedBookingDate={selectedBookingDate}
              selectedEndDate={selectedEndDate}
            />
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  // 新增：圖片區塊動畫效果
  const imageContainerVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 30,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  // 新增：圖片懸浮時的光暈效果
  const imageOverlayVariants = {
    initial: {
      opacity: 0,
      background:
        "linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)",
      left: "-100%",
    },
    hover: {
      opacity: 1,
      left: "100%",
      transition: {
        duration: 1,
        ease: "easeInOut",
      },
    },
  };

  // 新增更新購物車的函數
  const handleCartUpdate = async () => {
    try {
      // 重新獲取活動數據
      const response = await fetch(`/api/camping/activities/${activityId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "獲取活動資料失敗");
      }

      // 更新活動狀態
      setActivity(data);

      // 重置選擇狀態
      setSelectedOption(null);
      setQuantity(1);
    } catch (error) {
      // console.error("更新活動狀態失敗:", error);
      activityToast.error(error.message || "更新活動狀態失敗，請稍後再試");
    }
  };

  // 處理日曆日期選擇
  const handleCalendarDateSelect = (date, action, mode) => {
    if (action === "select") {
      if (mode === "start") {
        // 選擇開始日期時，清除之前的結束日期
        setSelectedStartDate(new Date(date));
        setSelectedEndDate(null);

        // 切換到日期選擇器區域
        const datePickerSection = document.querySelector(
          "#date-picker-section"
        );
        if (datePickerSection) {
          datePickerSection.scrollIntoView({ behavior: "smooth" });
        }
      } else if (mode === "end") {
        setSelectedEndDate(new Date(date));

        // 自動滾動到預訂區域
        const bookingSection = document.querySelector("#booking-section");
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  // 添加響應式判斷
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // 處理手機版單一日期選擇
  const handleMobileDateSelect = (date, type) => {
    if (!date) {
      if (type === "start") {
        setSelectedStartDate(null);
        setSelectedEndDate(null);
      } else {
        setSelectedEndDate(null);
      }
      setDayCount(0);
      return;
    }

    // 將 dayjs 對象轉換為 JavaScript Date 對象，並設置時間為當天的 00:00:00
    const selectedDate = date.startOf("day").toDate();

    if (type === "start") {
      setSelectedStartDate(selectedDate);
      setSelectedEndDate(null);
      setDayCount(0);
    } else {
      setSelectedEndDate(selectedDate);

      // 計算天數
      if (selectedStartDate) {
        const diffTime = Math.abs(selectedDate - selectedStartDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDayCount(diffDays);

        // 更新總價
        if (selectedOption) {
          const totalPrice = diffDays * selectedOption.price * quantity;
          setTotalAmount(totalPrice);
        }
      }
    }
  };

  // console.log('Activity Data:', activity);
  // console.log('Booking Stats:', bookingStats);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#8B7355",
          borderRadius: 8,
          fontFamily: "var(--font-zh)",
        },
        components: {
          DatePicker: {
            colorBgContainer: "#F8F8F8",
            colorPrimary: "#B6AD9A",
            colorBorder: "#E8E4DE",
            colorText: "#7C7267",
            colorTextDisabled: "#D3CDC6",
            colorBgContainerDisabled: "#F8F8F8",
            borderRadius: 8,
            controlHeight: 40,
            fontSize: 14,
            hoverBorderColor: "#8C8275",
            hoverBg: "#F5F3F0",
            activeBorderColor: "#B6AD9A",
            controlOutline: "#B6AD9A20",
            controlOutlineWidth: 4,
            cellHoverBg: "#F5F3F0",
            cellActiveWithRangeBg: "#F5F3F0",
            cellHoverWithRangeBg: "#F5F3F0",
            cellRangeBorderColor: "#B6AD9A",
            cellActiveBg: "#B6AD9A",
            cellActiveTextColor: "#FFFFFF",
            cellActiveWithRangeBg: "#F5F3F0",
            cellToday: "#B6AD9A",
            controlItemBgActive: "#E8E4DE",
            controlItemBgHover: "#F5F3F0",
          },
        },
      }}
      locale={zhTW}
    >
      <Loading isLoading={loading} />
      {!loading && (
        <div className="max-w-[1440px] mx-auto">
          {/* 加入麵包屑 */}
          <Breadcrumb
            items={[
              {
                label: "營區列表",
                href: "/camping/activities",
              },
              {
                label: activity?.activity_name || "營區詳細",
                href: null,
              },
            ]}
          />

          <div className="px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-8">
                {activity?.main_image && (
                  <motion.div
                    className="relative h-[200px] sm:h-[300px] md:h-[400px] rounded-lg overflow-hidden mb-5 lg:mb-0 "
                    variants={imageContainerVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                  >
                    {/* 主圖片 */}
                    <Image
                      src={`/uploads/activities/${activity.main_image}`}
                      alt={activity.activity_name}
                      fill
                      className="object-cover transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 66vw"
                      priority
                    />
                    {/* 懸浮光暈效果 */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      variants={imageOverlayVariants}
                      initial="initial"
                      whileHover="hover"
                      style={{
                        background:
                          "linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                    {/* 圖片陰影效果 */}
                    <div className="absolute inset-0 shadow-inner pointer-events-none" />
                  </motion.div>
                )}

                {/* 優化的內容提示 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: [0, -5, 0],
                  }}
                  transition={{
                    y: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                  className="mb-1 text-center"
                  onClick={() => {
                    const contentSection =
                      document.getElementById("content-section");
                    if (contentSection) {
                      const offset = contentSection.offsetTop - 140;
                      window.scrollTo({
                        top: offset,
                        behavior: "smooth",
                      });
                    }
                  }}
                >
                  <div
                    className="
                    inline-flex items-center gap-2 md:gap-3 
                    px-3 md:px-4 py-2 md:py-3 
                    bg-gradient-to-r from-[#F8F6F3] to-white
                    rounded-full 
                    shadow-sm 
                    border border-[#E5DED5]
                    hover:border-[#5C8D5C]/30
                    hover:shadow-md 
                    hover:bg-gradient-to-r 
                    hover:from-[#F3F7F3] 
                    hover:to-white
                    cursor-pointer
                    group
                    transition-all duration-300 ease-out
                    w-full md:w-auto
                    justify-between md:justify-start
                  "
                  >
                    {/* 左側圖示 - 手機版隱藏 */}
                    <div className="hidden md:flex items-center text-[#5C8D5C] group-hover:text-[#4A7A4A]">
                      <motion.div
                        animate={{ y: [0, 3, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <DownOutlined className="text-sm" />
                      </motion.div>
                    </div>

                    {/* 提示文字 */}
                    <div className="flex flex-col items-start">
                      <span className="text-xs md:text-sm font-medium text-[#4A3C31] group-hover:text-[#2D241E]">
                        向下滑動查看更多資訊
                      </span>
                      <span className="hidden md:block text-xs text-[#8B7355] group-hover:text-[#5C8D5C]">
                        包含營地介紹、位置、天氣、預訂等詳細內容
                      </span>
                    </div>

                    {/* 右側提示 */}
                    <div
                      className="
                      px-2 md:px-2.5 
                      py-0.5 md:py-1 
                      text-xs 
                      font-medium 
                      text-[#5C8D5C] 
                      bg-[#F3F7F3] 
                      rounded-full
                      group-hover:bg-[#5C8D5C] 
                      group-hover:text-white
                      transition-colors duration-300
                      whitespace-nowrap
                    "
                    >
                      點擊查看
                    </div>
                  </div>

                  {/* 底部指示點 */}
                  <motion.div
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="mt-2 space-y-1"
                  >
                    <div className="w-1 h-1 bg-[#5C8D5C]/30 rounded-full mx-auto" />
                    <div className="w-1 h-1 bg-[#5C8D5C]/20 rounded-full mx-auto" />
                  </motion.div>
                </motion.div>

                {/* 主要內容區域 */}
                <div
                  id="content-section"
                  className="border-b border-gray-200 mb-6"
                >
                  <nav className="flex justify-center w-full" aria-label="Tabs">
                    <div
                      className="flex space-x-2 md:space-x-8 overflow-x-auto scrollbar-hide 
                                    w-full md:w-auto px-2 md:px-0"
                    >
                      {tabs.map((tab) => (
                        <motion.button
                          key={tab.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                            relative py-2 md:py-3 px-3 md:px-4
                            text-xs md:text-sm
                            font-medium
                            flex-shrink-0
                            whitespace-nowrap
                            transition-colors duration-200 ease-out
                            ${
                              activeTab === tab.id
                                ? "text-[#5C8D5C]" // 移除 border-b-2，只保留文字顏色
                                : "text-gray-500 hover:text-gray-700"
                            }
                          `}
                        >
                          {tab.name}

                          {/* 動態底線指示器 */}
                          {activeTab === tab.id && (
                            <motion.div
                              layoutId="activeTabIndicator"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5C8D5C]"
                              initial={false}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </nav>
                </div>

                <div className="mt-6">{renderTabContent()}</div>
              </div>

              {/* 右邊區塊 */}
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-4 transition-all duration-300">
                  {/* 主容器 - 調整手機版寬度和內邊距 */}
                  <div
                    className="w-full mx-auto bg-white rounded-xl shadow-sm p-4 md:p-6
                    max-w-[100%]  lg:max-w-none lg:w-auto"
                  >
                    {/* 標題和價格區塊 */}
                    <h1 className="text-xl md:text-2xl font-bold text-[#4A3C31] mb-3 mt-0">
                      {activity?.activity_name}
                    </h1>

                    {/* 活動期間卡片 - 調整內邊距 */}
                    <div className="mb-4 md:mb-6">
                      <div className="p-3 md:p-4 bg-[#FDF6E3] rounded-lg border border-[#EAE0C9] hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 text-[#8B7355] mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="font-medium">活動期間</span>
                        </div>
                        <div className="text-[#A3907B] pl-7">
                          {format(new Date(activity?.start_date), "yyyy/MM/dd")}{" "}
                          ~ {format(new Date(activity?.end_date), "yyyy/MM/dd")}
                        </div>
                      </div>
                    </div>

                    {/* 日期選擇器區塊 */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h2 className="font-semibold text-lg md:text-[20px] text-[#4A3C31] mb-0">
                          選擇日期
                        </h2>
                        {!selectedStartDate && (
                          <div className="text-sm text-[var(--status-error)] animate-pulse">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center font-medium">
                                1.{" "}
                              </span>
                              請先選擇日期 ←
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 日期選擇器 - 根據螢幕尺寸切換顯示方式 */}
                      <div id="date-picker-section" className="w-full">
                        {isMobile ? (
                          // 手機版：顯示兩個獨立的 DatePicker
                          <div className="flex flex-col gap-2">
                            <DatePicker
                              value={
                                selectedStartDate
                                  ? dayjs(selectedStartDate)
                                  : null
                              }
                              onChange={(date) =>
                                handleMobileDateSelect(date, "start")
                              }
                              format="YYYY/MM/DD"
                              placeholder="入營日期"
                              className="w-full"
                              disabledDate={(current) => {
                                const today = dayjs().startOf("day");
                                return (
                                  current && current.isBefore(today, "day")
                                );
                              }}
                              showTime={false}
                              picker="date"
                            />

                            {selectedStartDate && (
                              <DatePicker
                                value={
                                  selectedEndDate
                                    ? dayjs(selectedEndDate)
                                    : null
                                }
                                onChange={(date) =>
                                  handleMobileDateSelect(date, "end")
                                }
                                format="YYYY/MM/DD"
                                placeholder="拔營日期"
                                className="w-full"
                                disabledDate={(current) => {
                                  const start = dayjs(selectedStartDate);
                                  return (
                                    current &&
                                    (current.isBefore(start, "day") ||
                                      current.isSame(start, "day"))
                                  );
                                }}
                                showTime={false}
                                picker="date"
                              />
                            )}
                          </div>
                        ) : (
                          // 桌面版：使用 RangePicker
                          <RangePicker
                            value={[
                              selectedStartDate
                                ? dayjs(selectedStartDate)
                                : null,
                              selectedEndDate ? dayjs(selectedEndDate) : null,
                            ]}
                            onChange={handleDateRangeChange}
                            format="YYYY/MM/DD"
                            placeholder={["入營日期", "拔營日期"]}
                            className="w-full cursor-pointer"
                            disabledDate={(current) => {
                              const today = dayjs().startOf("day");

                              if (selectedStartDate) {
                                const start = dayjs(selectedStartDate);
                                return (
                                  current &&
                                  (current.isBefore(today, "day") ||
                                    current.isSame(start, "day"))
                                );
                              }

                              return current && current.isBefore(today, "day");
                            }}
                            minSpan={1}
                            allowSameDay={false}
                            disabledTime={() => ({
                              disabledHours: () =>
                                Array.from({ length: 24 }, (_, i) => i),
                            })}
                            showTime={false}
                            picker="date"
                            onCalendarChange={(dates, dateStrings, info) => {
                              if (
                                dates &&
                                dates[0] &&
                                dates[1] &&
                                dates[0].isSame(dates[1], "day")
                              ) {
                                const [start] = dates;
                                handleDateRangeChange([start, null]);
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* 預訂天數顯示 */}
                    {selectedStartDate && (
                      <div className="text-sm text-[#4A3C31] bg-[#F5F5F4] p-2 rounded-lg mt-2">
                        {selectedEndDate ? (
                          <span>
                            <span className="font-medium">預訂時間：</span>共{" "}
                            {dayCount} 晚
                          </span>
                        ) : (
                          <span>請選擇退營日期</span>
                        )}
                      </div>
                    )}

                    {/* 營位選擇區塊 */}
                    {selectedStartDate &&
                      selectedEndDate &&
                      activity?.options && (
                        <div className="mt-4 md:mt-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h2 className="font-semibold text-lg md:text-[20px] text-[#4A3C31] mb-0">
                              選擇營位
                            </h2>
                            {!selectedOption && (
                              <div className="text-sm text-[var(--status-error)] animate-pulse">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-5 h-5 rounded-full flex items-center justify-center font-medium">
                                    2.{" "}
                                  </span>
                                  請選擇營位 ←
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 營位列表 */}
                          <div className="space-y-2 mt-2">
                            {activity?.options?.map((option) => {
                              const availableQty =
                                parseInt(option.available_quantity) || 0;
                              const isSelected =
                                selectedOption?.option_id === option.option_id;

                              return (
                                <div
                                  key={option.option_id}
                                  className="relative group/option"
                                >
                                  <motion.div
                                    onClick={() =>
                                      availableQty > 0 &&
                                      handleOptionSelect(option)
                                    }
                                    initial={{ scale: 1 }}
                                    whileHover={{
                                      scale: availableQty > 0 ? 1.01 : 1,
                                    }}
                                    whileTap={{
                                      scale: availableQty > 0 ? 0.99 : 1,
                                    }}
                                    className={`
                                  relative px-3 py-2.5 rounded-lg border transition-all
                                  ${
                                    availableQty <= 0
                                      ? "border-gray-200 bg-gray-50 cursor-not-allowed hover:bg-gray-100"
                                      : isSelected
                                      ? "border-[#4A5D23] bg-[#F5F7F2] cursor-pointer"
                                      : "border-gray-200 hover:border-[#4A5D23]/50 cursor-pointer"
                                  }
                                `}
                                  >
                                    {/* 勾選標記 */}
                                    {isSelected && availableQty > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute -right-2 -top-2 w-6 h-6 bg-[#5C8D5C] rounded-full flex items-center justify-center shadow-md"
                                      >
                                        <svg
                                          className="w-4 h-4 text-white"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <motion.path
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.3 }}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      </motion.div>
                                    )}

                                    {/* 營位介紹提示 - 根據螢幕尺寸調整顯示位置 */}
                                    {option.description && availableQty > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={
                                          isSelected
                                            ? { opacity: 1, x: 0 }
                                            : { opacity: 0, x: 10 }
                                        }
                                        className={`
                                          absolute z-[1]
                                          md:top-0 md:right-full md:left-auto md:bottom-auto
                                          bottom-full right-0 left-0 top-auto
                                          md:mr-2 mb-2 md:mb-0
                                          p-2.5 
                                          bg-[#4A5568] text-white rounded-lg shadow-lg z-10 
                                          md:w-[40%] w-full
                                          text-center
                                          ${
                                            isSelected
                                              ? "block"
                                              : "hidden group-hover/option:block"
                                          }
                                        `}
                                      >
                                        <div className="relative">
                                          {/* 箭頭指示器 - 根據螢幕尺寸調整方向 */}
                                          <div
                                            className={`
                                              absolute 
                                              md:top-4 md:right-[-6px] md:left-auto md:bottom-auto
                                              bottom-[-6px] left-1/2 top-auto right-auto
                                              w-0 h-0 
                                              transform md:translate-x-0 -translate-x-1/2
                                              md:border-t-[6px] md:border-t-transparent 
                                              md:border-l-[6px] md:border-l-[#4A5568]
                                              md:border-b-[6px] md:border-b-transparent
                                              border-t-[6px] border-t-[#4A5568]
                                              border-l-[6px] border-l-transparent
                                              border-r-[6px] border-r-transparent
                                            `}
                                          />
                                          <div className="text-xs font-medium mb-1">
                                            營位介紹
                                          </div>
                                          <div className="text-xs text-white/90 whitespace-pre-line leading-relaxed">
                                            {option.description}
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}

                                    <div className="flex flex-col">
                                      {/* 上半部：標題和容納人數 */}
                                      <div className="flex justify-between items-start mb-1">
                                        {/* 左上：標題 */}
                                        <h3
                                          className={`text-base font-medium m-0 ${
                                            availableQty <= 0
                                              ? "text-gray-400"
                                              : "text-gray-900"
                                          }`}
                                        >
                                          {option.spot_name}
                                        </h3>

                                        {/* 右上：容納人數 */}
                                        <span
                                          className={`text-sm whitespace-nowrap ${
                                            availableQty <= 0
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          (可容納 {option.people_per_spot} 人)
                                        </span>
                                      </div>

                                      {/* 下半部：剩餘營位和價格 */}
                                      <div className="flex justify-between items-center">
                                        {/* 左下：剩餘營位 */}
                                        <span
                                          className={`text-sm whitespace-nowrap ${
                                            availableQty <= 0
                                              ? "text-gray-400"
                                              : "text-gray-600"
                                          }`}
                                        >
                                          剩餘 {availableQty} 個營位
                                        </span>

                                        {/* 右下：價格 */}
                                        <span
                                          className={`font-medium whitespace-nowrap flex items-baseline ${
                                            availableQty <= 0
                                              ? "text-gray-400"
                                              : "text-[#2B5F3A]"
                                          }`}
                                        >
                                          <span className="text-sm mr-1">
                                            NT$
                                          </span>
                                          <span className="text-base">
                                            {option.price.toLocaleString()}
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                  </motion.div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {selectedOption && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between">
                          <h2 className="font-semibold text-lg md:text-[20px] text-[#4A3C31] mb-2">
                            選擇數量
                          </h2>
                          {quantity === 1 &&
                            selectedOption.available_quantity > 0 && (
                              <div className="text-sm text-[var(--status-error)] animate-pulse flex items-center gap-1">
                                <span className="w-5 h-5 rounded-full text-[var(--status-error)] flex items-center justify-center font-medium">
                                  3.{" "}
                                </span>
                                請選擇數量 ←
                              </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                          <span className="text-gray-600 font-medium">
                            數量
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                quantity > 1 && setQuantity(quantity - 1)
                              }
                              disabled={selectedOption.available_quantity <= 0}
                              className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200
                              ${
                                quantity > 1 &&
                                selectedOption.available_quantity > 0
                                  ? "border-[#5C8D5C] text-[#5C8D5C] hover:bg-[#5C8D5C] hover:text-white active:bg-[#4F7B4F]"
                                  : "border-gray-200 text-gray-300 cursor-not-allowed"
                              }`}
                            >
                              -
                            </button>
                            <span className="w-12 text-center text-lg font-medium">
                              {quantity}
                            </span>
                            <button
                              onClick={() =>
                                quantity <
                                  Math.min(
                                    selectedOption.available_quantity,
                                    selectedOption.max_quantity
                                  ) && setQuantity(quantity + 1)
                              }
                              disabled={selectedOption.available_quantity <= 0}
                              className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-200
                              ${
                                quantity <
                                  Math.min(
                                    selectedOption.available_quantity,
                                    selectedOption.max_quantity
                                  ) && selectedOption.available_quantity > 0
                                  ? "border-[#5C8D5C] text-[#5C8D5C] hover:bg-[#5C8D5C] hover:text-white active:bg-[#4F7B4F]"
                                  : "border-gray-200 text-gray-300 cursor-not-allowed"
                              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-lg md:text-[20px] text-[#4A3C31] mb-0">
                          總金額
                        </span>
                        <span className="text-2xl font-bold text-[#2B5F3A]">
                          <span className="text-sm font-medium">NT$ </span>
                          {calculateTotalPrice().toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={handleAddToCart}
                        disabled={
                          !selectedStartDate ||
                          !selectedEndDate ||
                          !selectedOption ||
                          selectedOption.available_quantity <= 0 ||
                          isSubmitting
                        }
                        className={`
                          w-full py-2 px-6 rounded-lg text-white transition-all duration-300
                          ${
                            !selectedStartDate ||
                            !selectedEndDate ||
                            !selectedOption ||
                            selectedOption.available_quantity <= 0 ||
                            isSubmitting
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-[#5C8D5C] hover:bg-[#4F7B4F] shadow-md hover:shadow-lg"
                          }
                        `}
                      >
                        {isSubmitting
                          ? "處理中..."
                          : selectedOption?.available_quantity <= 0
                          ? "已售完"
                          : "加入購物車"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 視差滾動區塊 */}
          <ParallaxSection />

          {/* 精選活動區塊 */}
          <div className="relative bg-gray-50 mt-16 md:mt-24">
            <div className="relative">
              <RelatedActivities currentActivityId={activityId} />
            </div>
          </div>

          {/* 統計數據區塊 */}
          <StatisticsSection />
        </div>
      )}

      {/* 購物車衝突模態框 */}
      {showConflictModal && (
        <div className="modal-container">
          <ConflictModal
            open={showConflictModal}
            existingItem={conflictItem}
            newOption={selectedOption}
            newQuantity={quantity}
            newStartDate={selectedStartDate}
            newEndDate={selectedEndDate}
            calculateTotalPrice={calculateTotalPrice}
            onConfirm={handleModalConfirm}
            onCancel={handleModalCancel}
            onUpdate={handleCartUpdate}
            destroyOnClose
          />
        </div>
      )}

      <AIHelper activityData={activity} />
    </ConfigProvider>
  );
}
