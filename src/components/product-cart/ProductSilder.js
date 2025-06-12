"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { useState, useEffect } from "react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Autoplay, Pagination } from "swiper/modules";

export default function ProductSlider() {
  const [hotProduct, setHotProduct] = useState([]);

  useEffect(() => {
    const fetchHotProduct = async () => {
      try {
        const response = await fetch("/api/home/hot-product");
        const data = await response.json();
        setHotProduct(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchHotProduct();
  }, []);

  return (
    <>
      <section className="d-flex product mt-5">
        <h2 className="title-style text-center">熱門商品</h2>
        <article className="product-main">
          <Swiper
            modules={[Autoplay, Pagination]} // 注册所需模块
            spaceBetween={73} // 每个滑块之间的距离
            slidesPerView={5} // 一次显示一个滑块
            breakpoints={{
              1024: { slidesPerView: 4, spaceBetween: 20 }, // 桌機
              768: { slidesPerView: 3, spaceBetween: 15 }, // 平板
              576: { slidesPerView: 2, spaceBetween: 10 }, // 手機 (576px ~ 768px)
              0: { slidesPerView: 1, spaceBetween: 20 }, // **⚠️ 這一行確保 576px 以下維持 1 個**
            }}
            centeredSlides={false} // 居中显示
            // loop={true} // 循环
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            pagination={{ clickable: true }} // 启用分页
            className="mySwiper about-swiper"
          >
            {hotProduct.length > 0 ? (
              hotProduct.map((product) => (
                <SwiperSlide key={product.id}>
                  <Link href={`/products/${product.id}`}>
                    <span className="item">
                      <div className="image">
                        <img
                          src={`/images/products/${product.main_image}`}
                          alt="img"
                        />
                      </div>
                      <h3 className="title">{product.name}</h3>
                      <p className="price">
                        $<span>{product.price}</span>
                      </p>
                    </span>
                  </Link>
                </SwiperSlide>
              ))
            ) : (
              <div>目前沒有熱門商品</div>
            )}
          </Swiper>
        </article>
      </section>
    </>
  );
}
