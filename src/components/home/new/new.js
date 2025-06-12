"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";

  // import "@/node_modules/bootstrap/dist/css/bootstrap.min.css";
  // import "@/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { Autoplay, Pagination } from "swiper/modules";

export default function New() {
  return(
  <>
    <section className="new">
          <h2
            className="title-style text-center !mb-6 md:!mb-14"
            data-aos="fade-down"
            data-aos-easing="ease-in-out"
            data-aos-duration="700"
          >
            最新活動資訊
          </h2>
          <article className="bg" />
          <article
            className="new-main"
            data-aos="fade-left"
            data-aos-easing="ease-in-out"
            data-aos-duration={700}
          >
            <Swiper
              modules={[Autoplay, Pagination]} // 注册所需模块
              spaceBetween={97} // 每个滑块之间的距离
              slidesPerView={1} // 一次显示一个滑块
              centeredSlides={false} // 居中显示
              loop={true} // 循环
              // autoplay={{
              //   delay: 2500,
              //   disableOnInteraction: false,
              // }}
              breakpoints={{
                450: { //
                  slidesPerView: 2,
                },
                768:{
                  slidesPerView: 3,
                },
                1300: {
                  slidesPerView: 3.5,
       
                },
              }}
              className="mySwiper new-swiper "
            >
              <SwiperSlide>
                <Link href="/camping/activities?location=all&sortBy=date_desc">
                  <div className="image">
                    <img src="/images/index/image8.jpg" alt="img" />
                  </div>
                  <p>雪地中的靜謐篝火</p>
                </Link>
              </SwiperSlide>
              <SwiperSlide>
                <Link href="/camping/activities?location=all&sortBy=date_desc">
                  <div className="image">
                    <img src="/images/index/image9.jpg" alt="img" />
                  </div>
                  <p>2025 全新露營活動登場！</p>
                </Link>
              </SwiperSlide>
              <SwiperSlide>
                <Link href="/camping/activities?location=all&sortBy=date_desc">
                  <div className="image">
                    <img src="/images/index/image10.jpg" alt="img" />
                  </div>
                  <p>圍爐之樂，享受戶外時光！</p>
                </Link>
              </SwiperSlide>
              <SwiperSlide>
                <Link href="/camping/activities?location=all&sortBy=date_desc">
                  <div className="image">
                    <img src="/images/index/image8.jpg" alt="img" />
                  </div>
                  <p>雪地中的靜謐篝火</p>
                </Link>
              </SwiperSlide>
              <SwiperSlide>
                <Link href="/camping/activities?location=all&sortBy=date_desc">
                  <div className="image">
                    <img src="/images/index/image9.jpg" alt="img" />
                  </div>
                  <p>2025 全新露營活動登場！</p>
                </Link>
              </SwiperSlide>
              <SwiperSlide>
                <Link href="/camping/activities?location=all&sortBy=date_desc">
                  <div className="image">
                    <img src="/images/index/image10.jpg" alt="img" />
                  </div>
                  <p>圍爐之樂，享受戶外時光！</p>
                </Link>
              </SwiperSlide>
              <SwiperSlide>
                <Link href="/camping/activities?location=all&sortBy=date_desc">
                  <div className="image">
                    <img src="/images/index/image9.jpg" alt="img" />
                  </div>
                  <p>2025 全新露營活動登場！</p>
                </Link>
              </SwiperSlide>
            </Swiper>
          </article>
        </section>
  </>
  )
}