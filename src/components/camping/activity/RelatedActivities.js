"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { EnvironmentOutlined, TeamOutlined } from "@ant-design/icons";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { motion } from "framer-motion";

export default function RelatedActivities({ currentActivityId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/camping/activities/featured");
        const data = await response.json();

        // 過濾掉當前活動
        const filteredActivities = data.activities.filter(
          (activity) => activity.activity_id !== parseInt(currentActivityId)
        );
        setActivities(filteredActivities);
      } catch (error) {
        console.error("獲取精選活動失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedActivities();
  }, [currentActivityId]);

  if (loading) {
    return (
      <div className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">精選活動</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="bg-gray-200 rounded-lg shadow-md h-[300px] animate-pulse"
              >
                <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">精選活動</h2>
          <div className="text-center text-gray-500">目前沒有其他精選活動</div>
        </div>
      </div>
    );
  }

  const swiperParams = {
    modules: [Autoplay],
    spaceBetween: 24,
    slidesPerView: 1,
    pagination: false,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
      pauseOnMouseEnter: false,
    },
    loop: true,
    speed: 800,
    breakpoints: {
      480: { slidesPerView: 1 },
      640: { slidesPerView: 1 },
      768: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
    }
  };

  return (
    <div className="pt-16 pb-4 bg-gradient-to-b from-white to-[#F5F2EA]/70">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#4A3C31] mb-2 text-center">精選活動</h2>
        <p className="text-sm text-gray-500 text-center">探索更多精彩的露營體驗</p>
        <div className="relative">
          <Swiper {...swiperParams} className="w-full pb-10">
            {activities.map((activity) => (
              <SwiperSlide key={activity.activity_id} className="pb-5 pt-4 px-1">
                <div className="h-full overflow-visible">
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="h-full"
                  >
                    <Link
                      href={`/camping/activities/${activity.activity_id}`}
                      className="block no-underline h-full"
                    >
                      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 h-full">
                        <div className="relative h-40">
                          <Image
                            src={`/uploads/activities/${activity.main_image}`}
                            alt={activity.activity_name}
                            fill
                            sizes="(max-width: 480px) 100vw, (max-width: 640px) 50vw, 33vw"
                            style={{ objectFit: "cover" }}
                            className="rounded-t-xl transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute bottom-2 left-2 bg-white/95 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                            <span className="text-[#4A3C31] text-sm font-bold">
                              NT$ {activity.min_price?.toLocaleString()} 起
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-white to-[#F5F2EA]/30 flex-1">
                          <div className="space-y-2">
                            <h3 className="text-base font-bold text-[#4A3C31] line-clamp-1 group-hover:text-[#6B5335] transition-colors">
                              {activity.activity_name}
                            </h3>
                            <div className="flex items-center justify-between text-sm text-[#7C6C55]">
                              <div className="flex items-center gap-1">
                                <EnvironmentOutlined className="text-[#6B5335]" />
                                <span className="line-clamp-1">
                                  {activity.camp_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TeamOutlined className="text-[#6B5335]" />
                                <span>
                                  剩 {activity.total_spots || "確認中"} 營位
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}
