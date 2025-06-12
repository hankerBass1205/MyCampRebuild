"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const GetCouponIcon = () => {
  return (
    <div className="fixed right-4 bottom-[120px] z-2 hidden md:block">
      {/* 跳動提示文字 - 獨立於Link之外 */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [-4, 0, -4] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-4 right-0 -translate-x-1/3 whitespace-nowrap bg-[#8B7355]/90 text-white px-3 py-1.5 rounded-full text-sm font-medium"
      >
        點我抽優惠券！
        {/* 小三角形 */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 
                      border-l-[6px] border-l-transparent
                      border-t-[6px] border-t-[#8B7355]/90
                      border-r-[6px] border-r-transparent">
        </div>
      </motion.div>

      <Link 
        href="/get-coupon"
        className="block w-[120px]"
      >
        <Image 
          src="/images/index/Group 407.png" 
          width={120} 
          height={120} 
          alt="get-coupon-icon" 
        />
      </Link>
    </div>
  );
};

export default GetCouponIcon;