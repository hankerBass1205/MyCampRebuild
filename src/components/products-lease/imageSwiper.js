"use client";

import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs } from "swiper/modules";
import Image from "next/image";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";

export default function ComponentsImageSwiper({ product }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  return (
    <>
      <Swiper
        loop={true}
        navigation={true}
        thumbs={{ swiper: thumbsSwiper }}
        modules={[Navigation, Thumbs]}
        className="main-swiper"
      >
        {product.images.map((img, index) => (
          <SwiperSlide key={index}>
            <div className="image-wrapper">
              <Image
                src={`/images/products/${img.image_path}`}
                layout="fill" /* 填滿父容器 */
                objectFit="contain" /* 完整顯示圖片 */
                alt={product.name}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 縮圖 */}
      <Swiper
        onSwiper={setThumbsSwiper}
        spaceBetween={10}
        slidesPerView={4}
        watchSlidesProgress={true}
        modules={[Thumbs]}
        className="thumb-swiper"
      >
        {product.images.map((img, index) => (
          <SwiperSlide key={index}>
            <div className="thumbnail-wrapper">
              <Image
                src={`/images/products/${img.image_path}`}
                layout="fill"
                objectFit="contain"
                alt={`Thumbnail ${index + 1}`}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}
