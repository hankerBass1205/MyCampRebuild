"use client";
import { Swiper, SwiperSlide } from "swiper/react";

// import "@/node_modules/bootstrap/dist/css/bootstrap.min.css";
// import "@/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Autoplay, Pagination } from "swiper/modules";

export default function Banner() {
  return (
    <>
      <section className="banner">
        <article className="banner-main container">
          <article className="left-item d-flex">
            <p
              data-aos="fade-down"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              一起走進大自然 把煩惱留在帳篷外
            </p>
            <p
              data-aos="fade-down"
              data-aos-easing="linear"
              data-aos-duration={800}
            >
              露營讓每一刻都值得珍藏
            </p>
          </article>
          <article
            className="right-item"
            data-aos="fade-left"
            data-aos-easing="linear"
            data-aos-duration={700}
          >
            <Swiper
              modules={[Autoplay, Pagination]} // 注册所需模块
              spaceBetween={10} // 每个滑块之间的距离
              slidesPerView={1} // 一次显示一个滑块
              centeredSlides={true} // 居中显示
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
              }}
              pagination={{ clickable: true }} // 启用分页
              className="mySwiper banner-swiper "
            >
              <SwiperSlide>
                <img src="/images/index/banner.jpg" alt="sliderImg" />
              </SwiperSlide>
              <SwiperSlide>
                <img src="/images/index/banner2.jpg" alt="sliderImg" />
              </SwiperSlide>
              <SwiperSlide>
                <img src="/images/index/banner3.jpg" alt="sliderImg" />
              </SwiperSlide>
              <SwiperSlide>
                <img src="/images/index/banner4.jpg" alt="sliderImg" />
              </SwiperSlide>
            </Swiper>
          </article>
        </article>
      </section>
    </>
  );
}
