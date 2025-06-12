import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const BookingOverview = ({ activityId }) => {
  const [bookingOverview, setBookingOverview] = useState({
    loading: true,
    error: null,
    data: null
  });

  // 獲取預訂狀況總覽
  const fetchBookingOverview = useCallback(async () => {
    try {
      const response = await fetch(`/api/camping/activities/${activityId}/booking-overview`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBookingOverview({
        loading: false,
        error: null,
        data: data.data
      });
    } catch (error) {
      console.error("獲取預訂狀況錯誤:", error);
      setBookingOverview({
        loading: false,
        error: error.message,
        data: null
      });
    }
  }, [activityId]);

  useEffect(() => {
    if (activityId) {
      fetchBookingOverview();
    }
  }, [activityId, fetchBookingOverview]);


  if (bookingOverview.loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            className="h-8 w-8"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <svg
              className="text-[#8B7355]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4.75V6.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              />
              <path
                d="M17.1266 6.87347L16.0659 7.93413"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
              <path
                d="M19.25 12L17.75 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
              <path
                d="M17.1266 17.1265L16.0659 16.0659"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
              <path
                d="M12 17.75V19.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
              <path
                d="M7.9342 16.0659L6.87354 17.1265"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.25 12L4.75 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.9342 7.93413L6.87354 6.87347"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
          <span className="text-[#8B7355] font-medium">資料載入中...</span>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className="h-12 bg-[#F0EBE8] rounded-lg"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 0.7 }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: "reverse",
                delay: index * 0.2
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (bookingOverview.error) {
    return <div>錯誤: {bookingOverview.error}</div>;
  }

  if (!bookingOverview.data || bookingOverview.data.length === 0) {
    return <div>無預訂資料</div>;
  }

  return (
    <div className="space-y-6 ">
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        {/* 標題區域 */}
        <div className="flex flex-col sm:flex-row items-center sm:justify-between sm:items-center gap-4 mb-2 md:mb-4 border-b border-gray-100 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <motion.svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-[#8B7355]"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                animate={{
                  scale: [1, 1.1, 1],
                  y: [-1, 1, -1],
                  rotate: [-3, 3, -3]
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </motion.svg>
              <h2 className="text-[16px] sm:text-xl font-bold text-[#8B7355] m-0">
                預訂狀況總覽
              </h2>
            </div>
            <div className="text-[#9F9189] text-xs sm:text-sm text-center">
              {bookingOverview.data && (
                <span>共 {bookingOverview.data.length} 種營位類型</span>
              )}
            </div>
          </div>
        </div>

        {/* 表格區域 */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-[#E8E4DE]">
                <thead>
                  <tr className="text-[#8B7355]">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center md:text-left text-[11px] sm:text-sm font-medium whitespace-nowrap">
                      營位
                      <span className="hidden sm:inline">類型</span>
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[11px] sm:text-sm font-medium whitespace-nowrap">
                      總共
                      <span className="hidden sm:inline">數量</span>
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[11px] sm:text-sm font-medium whitespace-nowrap">
                      已訂
                      <span className="hidden sm:inline">預訂</span>
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[11px] sm:text-sm font-medium whitespace-nowrap">
                      剩餘
                      <span className="hidden sm:inline">數量</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DE]">
                  {bookingOverview.data.map((spot, index) => (
                    <tr key={index}>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-[#4A3C31]">
                          {spot.spotType}
                          <span className="text-xs text-[#9F9189] ml-2">
                            {spot.capacity}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm text-[#9F9189]">
                        {spot.totalQuantity}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm text-[#9F9189]">
                        {spot.bookedQuantity}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                        <span
                          className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm
                            ${
                              spot.availableQuantity > 0
                                ? "bg-[#F0EBE8] text-[#8B7355]"
                                : "bg-[#FFE5E5] text-[#FF4D4F]"
                            }`}
                        >
                          {spot.availableQuantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingOverview; 