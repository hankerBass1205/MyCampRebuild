"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { useState, useEffect } from "react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import Link from "next/link";
const searchList = ({ searchQuery, selectedValue }, ref) => {
  // 确保 searchQuery 是一个数组，避免报错

  useEffect(() => {
    const handleScroll = () => {
      const header_search = document.querySelector(".search-list");
      console.log(header_search);
      if (window.scrollY > 0) {
        header_search?.classList.add("active");
      } else {
        header_search?.classList.remove("active");
      }
    };
    // 監聽滾動事件
    window.addEventListener("scroll", handleScroll);
    // 初始化時執行一次，確保頁面刷新時狀態正確
    handleScroll();

    // 清理監聽器
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  // **當 searchQuery 為空時，不顯示搜尋結果**
  if (!searchQuery.length) return null;
  return (
    <>
      
        <div className="absolute right-0 w-full search-list" ref={ref}>
          <div className="container">
            <Swiper
              modules={[Autoplay, Navigation]} // 注册所需模块
              data-navigation="true" // 添加导航
              spaceBetween={73} // 每个滑块之间的距离
              slidesPerView={4} // 一次显示一个滑块
              centeredSlides={false} // 居中显示
              loop={true} // 循环
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              navigation={true}
              className="mySwiper search-swiper"
            >
              {searchQuery.map((product,i) => (
                <SwiperSlide key={i}>
                {selectedValue === "1" && (
                  <Link href={`/products/${product.id}`}>
                    <div className="images">
                      <img
                        src={`/images/products/${product.main_image}`}
                        alt="img"
                      />
                    </div>
                    <div className="title">
                      <h5>{product.name}</h5>
                    </div>
                  </Link>
                )}
                {selectedValue === "2" && (
                  <Link href={`/forum/thread/${product.id}`}>
                    <div className="images forumstyle">
                      <img
                        src={`${product.thread_image}`}
                        alt="img"
                      />
                    </div>
                    <div className="title">
                      <h5>{product.thread_title}</h5>
                    </div>
                  </Link>
                )}
                {selectedValue === "3" && (
                  <Link href={`/camping/activities/${product.activity_id}`}>
                    <div className="images">
                      <img
                        src={`/uploads/activities/${product.main_image}`}
                        alt="img"
                      />
                    </div>
                    <div className="title">
                      <h5>{product.title}</h5>
                    </div>
                  </Link>
                )}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      {/* {selectedValue === "2" && (
        <div className="absolute right-0 w-full search-list" ref={ref}>
          <div className="container">
            <Swiper
              modules={[Autoplay, Navigation]} // 注册所需模块
              data-navigation="true" // 添加导航
              spaceBetween={73} // 每个滑块之间的距离
              slidesPerView={4} // 一次显示一个滑块
              centeredSlides={false} // 居中显示
              loop={true} // 循环
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              navigation={true}
              className="mySwiper search-swiper"
            >
              {searchQuery.map((product) => (
                <SwiperSlide key={`forum-${product.id}`}>
                  <Link href={`/forum/thread/${product.id}`}>
                    <div className="images">
                      <img
                        src={`${product.thread_image}`}
                        alt="img"
                      />
                    </div>
                    <div className="title">
                      <h5>{product.thread_title}</h5>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
      {selectedValue === "3" && (
        <div className="absolute right-0 w-full search-list" ref={ref}>
          <div className="container">
            <Swiper
              modules={[Autoplay, Navigation]} // 注册所需模块
              data-navigation="true" // 添加导航
              spaceBetween={73} // 每个滑块之间的距离
              slidesPerView={4} // 一次显示一个滑块
              centeredSlides={false} // 居中显示
              loop={true} // 循环
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              navigation={true}
              className="mySwiper search-swiper"
            >
              {searchQuery.map((product) => (
                <SwiperSlide key={`activity-${product.activity_id}`}>
                  <Link href={`/camping/activities/${product.activity_id}`}>
                    <div className="images">
                      <img
                        src={`/uploads/activities/${product.main_image}`}
                        alt="img"
                      />
                    </div>
                    <div className="title">
                      <h5>{product.title}</h5>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )} */}
    </>
  );
};

export default searchList;
