"use client";
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// 引入 Swiper 基礎樣式
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function FeaturedCamps() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/camping/activities/featured');
        const data = await response.json();
        setActivities(data.activities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <section className="py-6 md:py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#F5F5F0] via-[#FFF8EA] to-[#FFFFFF] opacity-60" />
      
      <div className="container mx-auto px-4 relative">
        <h2 
          className="text-3xl font-bold text-center mb-8 md:mb-14 text-[#5B4034]"
          data-aos="fade-down"
          data-aos-offset="100"
          data-aos-duration="600"
          data-aos-easing="ease-out-cubic"
          data-aos-delay="0"
          data-aos-anchor-placement="top-bottom"
        >
          熱門營區活動
        </h2>

        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={24}
          slidesPerView={1}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          pagination={{
            clickable: true,
            el: '.swiper-pagination',
            type: 'bullets',
            renderBullet: function (index, className) {
              return index % 4 === 0 ? `<span class="${className}"></span>` : '';
            }
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 4,
            }
          }}
          className="!pb-12 [&_.swiper-pagination-bullet]:w-2.5 [&_.swiper-pagination-bullet]:h-2.5 [&_.swiper-pagination-bullet]:mx-2 [&_.swiper-pagination-bullet]:bg-[#D9D9D9] [&_.swiper-pagination-bullet]:opacity-100 [&_.swiper-pagination-bullet]:transition-all [&_.swiper-pagination-bullet]:duration-300 [&_.swiper-pagination-bullet-active]:bg-[#8B7355] [&_.swiper-pagination-bullet-active]:scale-125"
        >
          {activities.map((activity) => (
            <SwiperSlide key={activity.activity_id}>
              <Link 
                href={`/camping/activities/${activity.activity_id}`}
                className="block overflow-visible rounded-2xl transform transition-gpu relative isolate group"
              >
                <div
                  className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer transform-gpu relative transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-[280px]"
                  style={{
                    boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 5px 15px -3px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div className="relative h-40 overflow-hidden bg-gray-100 rounded-t-2xl">
                    <Image
                      src={`/uploads/activities/${activity.main_image}` || '/placeholder-camp.jpg'}
                      alt={activity.title}
                      width={400}
                      height={300}
                      priority
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-base line-clamp-1 flex-1 text-[#5B4034]">
                        {activity.title}
                      </h3>
                      <span className="text-xs text-[#8B7355] whitespace-nowrap ml-2 bg-[#F9F6F3] px-2.5 py-1 rounded-full">
                        剩 {activity.total_spots} 位
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[#9B8E83] text-xs line-clamp-1">
                        {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
                      </p>
                      <div className="text-[#8B7355] text-right">
                        <span className="text-sm font-bold">
                          NT$ {activity.min_price.toLocaleString()}
                        </span>
                        <span className="text-xs ml-1">
                          {activity.min_price !== activity.max_price && '起'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
} 