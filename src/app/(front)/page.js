"use client";
import { useEffect} from "react";
import AOS from "aos";
import "aos/dist/aos.css";


import '@/styles/pages/home/style.css';

// 修正組件引入路徑
import Banner from "@/components/home/banner/banner";
import New from "@/components/home/new/new";
import HotProduct from "@/components/home/hot-product/hot-product";
import AreaClass from "@/components/home/area-class/area-class";
// import HotArea from "@/components/home/hot-area/hot-area";
import FeaturedCamps from "@/components/FeaturedCamps";
import QnA from "@/components/home/qna/qna";
import CouponMobel from "@/components/home/coupon-mobel/coupon-mobel";

export default function Home() {
 
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: 'ease-in-out',
      once: false,
      mirror: true,
    });

    const handleScroll = () => {
      AOS.refresh();
    };

    window.addEventListener("scroll", handleScroll);


    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <main className="index">
      <Banner />
      <New />
      <HotProduct />
      <AreaClass />
      {/* <HotArea /> */}
      <FeaturedCamps />
      <QnA />
      {/* <CouponMobel /> */}
    </main>
  );
}
