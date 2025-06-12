'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import StarRating from './StarRating';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function DiscussionCarousel({ discussions }) {
  if (!discussions?.length) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 mb-8">
      <h3 className="text-xl font-semibold mb-4 text-[var(--primary)]">最新評論</h3>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={3}
        loop={true}
        navigation={{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }}
        pagination={{ 
          clickable: true,
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-[var(--primary)]',
        }}
        autoplay={{
          delay: 3000,
          pauseOnMouseEnter: true,
          disableOnInteraction: false,
        }}
        breakpoints={{
          320: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }}
        className="discussion-swiper [&_.swiper-button-next]:text-[var(--primary)] 
          [&_.swiper-button-prev]:text-[var(--primary)]
          [&_.swiper-pagination]:!bottom-[-2rem]"
      >
        {discussions.map((discussion) => (
          <SwiperSlide key={discussion.id}>
            <div className="bg-[var(--lightest-brown)] rounded-lg shadow-md p-4 h-[220px] 
              flex flex-col border border-[var(--tertiary-brown)] mx-0.5 mb-8">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium truncate text-[var(--primary)]">
                  {discussion.user_name}
                </h4>
                <time className="text-sm text-[var(--secondary-brown)]">
                  {new Date(discussion.created_at).toLocaleDateString()}
                </time>
              </div>
              <div className="mb-3">
                <StarRating value={discussion.rating} readOnly />
              </div>
              <p className="text-[var(--gray-2)] line-clamp-4 flex-1">
                {discussion.content}
              </p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
} 