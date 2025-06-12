"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import Image from "next/image";

  // import "@/node_modules/bootstrap/dist/css/bootstrap.min.css";
  // import "@/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

import { Autoplay, Navigation } from "swiper/modules";

export default function AreaClass() {
  return(
  <>
    <section className="d-grid area">
          {/*  */}
          <svg
            className="waves top"
            viewBox="0 24 150 28"
            preserveAspectRatio="none"
            shapeRendering="auto"
          >
            <defs>
              <path
                id="gentle-wave"
                d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
              />
            </defs>
            <g className="parallax">
              <use xlinkHref="#gentle-wave" x={48} y={7} fill="#EFEEE5" />
            </g>
          </svg>
          {/*  */}
          <h2
            className="title-style text-center !mb-6 md:!mb-14"
            data-aos="fade-up"
            data-aos-easing="linear"
            data-aos-duration={700}
          >
            地區分類
          </h2>
          <article className="area-mobile container">
          <Swiper
            modules={[Autoplay, Navigation]} // 注册所需模块
            data-navigation="true"
            spaceBetween={30} // 每个滑块之间的距离
            slidesPerView={1} // 一次显示一个滑块
            centeredSlides={false} // 居中显示
            // loop={true} // 循环
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            breakpoints={{
                500: {
                  slidesPerView: 2,
                },
                768: {
                  slidesPerView: 4,
                },
            }}    
            navigation={true} // 启用前进后退按钮
            className="mySwiper area-swiper"
          >
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=宜蘭&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/宜蘭.jpg"
                alt="宜蘭縣"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                宜蘭縣
              </h4>
            </Link>
          </SwiperSlide>  
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=花蓮&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/花蓮.jpg"
                alt="花蓮縣"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                花蓮縣
              </h4>
            </Link>
          </SwiperSlide> 
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=台東&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/Frame 368.jpg"
                alt="台東縣"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                台東縣
              </h4>
            </Link>
          </SwiperSlide>
          {/* <SwiperSlide>
              <Link className="image" href='#'>
                <img src="/images/index/Mask group.jpg" alt="img" />
                <h4>澎湖縣</h4>
              </Link>
          </SwiperSlide> */}
          {/* <SwiperSlide>
              <Link className="image" href='#'>
                <img src="/images/index/Mask group.jpg" alt="img" />
                <h4>金門縣</h4>
              </Link>
          </SwiperSlide> */}
          {/* <SwiperSlide>
              <Link className="image" href='#'>
                <img src="/images/index/Mask group.jpg" alt="img" />
                <h4>連江縣</h4>
              </Link>
          </SwiperSlide> */}
          {/* <SwiperSlide>
              <Link className="image" href='#'>
                <img src="/images/index/Mask group.jpg" alt="img" />
                <h4>臺北市</h4>
              </Link>
          </SwiperSlide> */}
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=新北&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/新北.jpg"
                alt="新北市"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                新北市
              </h4>
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=桃園&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/桃園.jpg"
                alt="桃園市"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                桃園市
              </h4>
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=台中&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/台中.jpg"
                alt="台中市"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                台中市
              </h4>
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=台南&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/台南.jpg"
                alt="台南市"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                台南市
              </h4>
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=高雄&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/高雄.jpg"
                alt="高雄市"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                高雄市
              </h4>
            </Link>
          </SwiperSlide>
          {/* <SwiperSlide>
              <Link className="image" href='#'>
                <img src="/images/index/Mask group.jpg" alt="img" />
                <h4>基隆市</h4>
              </Link>
          </SwiperSlide> */}
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=新竹&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/新竹縣.jpg"
                alt="新竹縣"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                新竹縣
              </h4>
            </Link>
          </SwiperSlide>
          {/* <SwiperSlide>
              <Link className="image" href='/camping/activities?location=新竹&sortBy=date_desc&dateRange=%2C'>
                <img src="/images/index/Mask group.jpg" alt="img" />
                <h4>新竹市</h4>
              </Link>
          </SwiperSlide> */}
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=苗栗&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/苗栗.jpg"
                alt="苗栗縣"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                苗栗縣
              </h4>
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='#'
            >
              <Image
                src="/images/index/Mask group.jpg"
                alt="彰化縣"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                彰化縣
              </h4>
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=南投&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/南投.jpg"
                alt="南投縣"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                南投縣
              </h4>
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=雲林&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/雲林.jpg"
                alt="雲林縣"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                雲林縣
              </h4>
            </Link>
          </SwiperSlide>
          <SwiperSlide>
            <Link 
              className="block aspect-[4/3] relative group overflow-hidden rounded-lg"
              href='/camping/activities?location=嘉義&sortBy=date_desc&dateRange=%2C'
            >
              <Image
                src="/images/index/Mask group.jpg"
                alt="嘉義市"
                fill
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              <h4 className="absolute bottom-3 left-3 text-white font-medium drop-shadow-md">
                嘉義市
              </h4>
            </Link>
          </SwiperSlide>
          {/* <SwiperSlide>
              <Link className="image" href='/camping/activities?location=嘉義&sortBy=date_desc&dateRange=%2C'>
                <img src="/images/index/Mask group.jpg" alt="img" />
                <h4>嘉義市</h4>
              </Link>
          </SwiperSlide> */}
          {/* <SwiperSlide>
              <Link className="image" href='#'>
                <img src="/images/index/Mask group.jpg" alt="img" />
                <h4>屏東縣</h4>
              </Link>
          </SwiperSlide> */}
          </Swiper>
          </article>
          <article className="area-main container">
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item medium"
            >
              <div className="image ">
                <div className="mask" />
                <h4>宜蘭縣</h4>
                <Link href="/camping/activities?location=宜蘭&sortBy=date_desc&dateRange=%2C">
                  <Image width={390} height={390} src="/images/index/宜蘭.jpg" alt="img" />
                </Link>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item large"
            >
              <div className="image ">
                <div className="mask" />
                <h4>花蓮縣</h4>
                <Link href="/camping/activities?location=花蓮&sortBy=date_desc&dateRange=%2C">
                  <Image width={390} height={390} src="/images/index/花蓮.jpg" alt="img" />
                </Link>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>台東縣</h4>
                <Link href="/camping/activities?location=台東&sortBy=date_desc&dateRange=%2C">
                  <Image width={181} height={181} src="/images/index/台東.jpg" alt="img" />
                </Link>
              </div>
            </div>
            {/* <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item large"
            >
              <div className="image ">
                <div className="mask" />
                <h4>澎湖縣</h4>
                <Link href="/camping/activities?location=澎湖縣&sortBy=date_desc">
                  <Image width={390} height={390} src="/images/index/澎湖.jpg" alt="img" />
                </Link>
              </div>
            </div> */}
            {/*  */}
            {/* <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item medium"
            >
              <div className="image ">
                <div className="mask" />
                <h4>金門縣</h4>
                <Link href="/camping/activities?location=金門縣&sortBy=date_desc">
                  <Image width={390} height={390} src="/images/index/金門.jpg" alt="img" />
                </Link>
              </div>
            </div> */}
            {/* <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item large"
            >
              <div className="image ">
                <div className="mask" />
                <h4>連江縣</h4>
                <Link href="/camping/activities?location=連江縣&sortBy=date_desc">
                  <Image width={390} height={390} src="/images/index/連江.jpg" alt="img" />
                </Link>
              </div>
            </div> */}
            {/* <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>臺北市</h4>
                <Link href="/camping/activities?location=臺北市&sortBy=date_desc">
                  <Image width={181} height={181} src="/images/index/台北.jpg" alt="img" />
                </Link>
              </div>
            </div> */}
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>新北市</h4>
                <Link href="/camping/activities?location=新北&sortBy=date_desc&dateRange=%2C">
                  <Image width={181} height={181} src="/images/index/新北.jpg" alt="img" />
                </Link>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item medium"
            >
              <div className="image ">
                <div className="mask" />
                <h4>桃園市</h4>
                <Link href="/camping/activities?location=桃園&sortBy=date_desc&dateRange=%2C">
                  <Image width={390} height={390} src="/images/index/桃園.jpg" alt="img" />
                </Link>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item large"
            >
              <div className="image ">
                <div className="mask" />
                <h4>台中市</h4>
                <Link href="/camping/activities?location=台中&sortBy=date_desc&dateRange=%2C">
                  <Image width={390} height={390} src="/images/index/台中.jpg" alt="img" />
                </Link>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>台南市</h4>
                <Link href="/camping/activities?location=台南&sortBy=date_desc&dateRange=%2C">
                  <Image width={181} height={181} src="/images/index/台南.jpg" alt="img" />
                </Link>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>高雄市</h4>
                <Link href="/camping/activities?location=高雄&sortBy=date_desc&dateRange=%2C">
                  <Image width={181} height={181} src="/images/index/高雄.jpg" alt="img" />
                </Link>
              </div>
            </div>
            {/* <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item medium"
            >
              <div className="image ">
                <div className="mask" />
                <h4>基隆市</h4>
                <Link href="/camping/activities?location=基隆市&sortBy=date_desc">
                  <Image width={390} height={390} src="/images/index/基隆.jpg" alt="img" />
                </Link>
              </div>
            </div> */}
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item large"
            >
              <div className="image ">
                <div className="mask" />
                <h4>新竹縣</h4>
                <Link href="/camping/activities?location=新竹&sortBy=date_desc&dateRange=%2C">
                  <Image width={390} height={390} src="/images/index/新竹縣.jpg" alt="img" />
                </Link>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>新竹市</h4>
                <Link href="/camping/activities?location=新竹&sortBy=date_desc&dateRange=%2C">
                  <Image width={181} height={181} src="/images/index/新竹市.jpg" alt="img" />
                </Link>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>苗栗縣</h4>
                <Link href="/camping/activities?location=苗栗&sortBy=date_desc&dateRange=%2C">
                  <Image width={181} height={181} src="/images/index/苗栗.jpg" alt="img" />
                </Link>
              </div>
            </div>
            {/* <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>彰化縣</h4>
                <Link href="/camping/activities?location=彰化縣&sortBy=date_desc">
                  <Image width={181} height={181} src="/images/index/彰化.jpg" alt="img" />
                </Link>
              </div>
            </div> */}
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>南投縣</h4>
                <Link href="/camping/activities?location=南投&sortBy=date_desc&dateRange=%2C">
                  <Image width={181} height={181} src="/images/index/南投.jpg" alt="img" />
                </Link>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>雲林縣</h4>
                <Link href="/camping/activities?location=雲林&sortBy=date_desc&dateRange=%2C">
                  <Image width={181} height={181} src="/images/index/雲林.jpg" alt="img" />
                </Link>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>嘉義市</h4>
                <Link href="/camping/activities?location=嘉義&sortBy=date_desc&dateRange=%2C">
                  <Image width={181} height={181} src="/images/index/嘉義.jpg" alt="img" />
                </Link>
              </div>
            </div>
            {/* 多複製一個重複的新北讓版面對齊 */}
            <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item small"
            >
              <div className="image ">
                <div className="mask" />
                <h4>新北市</h4>
                <Link href="/camping/activities?location=新北&sortBy=date_desc&dateRange=%2C">
                  <Image width={181} height={181} src="/images/index/新北.jpg" alt="img" />
                </Link>
              </div>
            </div>
            {/* <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item large"
            >
              <div className="image ">
                <div className="mask" />
                <h4>嘉義市</h4>
                <Link href="/camping/activities?location=嘉義&sortBy=date_desc&dateRange=%2C">
                  <Image width={390} height={390} src="/images/index/嘉義市.jpg" alt="img" />
                </Link>
              </div>
            </div> */}
            {/* <div
              data-aos="fade-up"
              data-aos-offset={300}
              data-aos-easing="ease-in-sine"
              className="item large"
            >
              <div className="image ">
                <div className="mask" />
                <h4>屏東縣</h4>
                <Link href="/camping/activities?location=屏東縣&sortBy=date_desc">
                  <Image width={390} height={390} src="/images/index/屏東.jpg" alt="img" />
                </Link>
              </div>
            </div> */}
          </article>
          {/*  */}
          <svg
            className="waves bottom"
            viewBox="0 24 150 28"
            preserveAspectRatio="none"
            shapeRendering="auto"
          >
            <defs>
              <path
                id="gentle-wave"
                d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
              />
            </defs>
            <g className="parallax">
              <use xlinkHref="#gentle-wave" x={48} y={7} fill="#EFEEE5" />
            </g>
          </svg>
          {/*  */}
    </section>
  </>
  )
}