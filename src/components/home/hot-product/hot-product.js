"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
// Import Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
// Import Swiper styles
import "swiper/css";

export default function HotProduct() {
  const [hotProducts, setHotProducts] = useState([]);

  useEffect(() => {
    const fetchHotProducts = async () => {
      try {
        const response = await fetch("/api/home/hot-product");
        const data = await response.json();
        setHotProducts(data);
      } catch (error) {
        console.error("Error fetching hot products:", error);
      }
    };
    fetchHotProducts();
  }, []);

  return (
    <>
      <section className="d-flex product">
        <h2
          className="title-style text-center !mb-6 md:!mb-14"
          data-aos="fade-down"
          data-aos-easing="linear"
          data-aos-duration={700}
        >
          熱門商品
        </h2>
        <article className="product-main">
          {hotProducts.length > 0 ? (
            <Swiper
              modules={[Autoplay]}
              spaceBetween={30}
              slidesPerView={4}
              autoplay={{
                delay: 2500,
                disableOnInteraction: false,
              }}
              breakpoints={{
                320: {
                  slidesPerView: 1,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 30,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 30,
                }
              }}
            >
              {hotProducts.map((product) => (
                <SwiperSlide key={product.id}>
                  <Link
                    href={`/products/${product.id}`}
                    data-aos="fade-up"
                    data-aos-easing="linear"
                    data-aos-duration={700}
                  >
                    <span className="item">
                      <div className="image">
                        <Image width={375} height={375} src={`/images/products/${product.main_image}`} alt="img" />
                        {/* <img src={`/images/products/${product.main_image}`} alt="img" /> */}
                      </div>
                      <h3 className="title mb-0">{product.name}</h3>
                      <p className="price mt-0">
                        $<span>{product.price}</span>
                      </p>
                    </span>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <p>目前沒有熱門商品</p>
          )}
        </article>
      </section>
    </>
  );
}
