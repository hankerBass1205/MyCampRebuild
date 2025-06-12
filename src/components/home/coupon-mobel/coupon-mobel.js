"use client";
import { useState } from "react";
import { IoMdClose } from "react-icons/io";
import Link from "next/link";

const CouponMobel = () => {
  const [isVisible, setIsVisible] = useState(true); // 初始狀態為 true
  const handleClose = () => setIsVisible(false); // 關閉視窗的函數
  if(!isVisible) return null; // 如果 isVisible 為 false，則不渲染任何東西
  
  return(
    <>
    <div className="coupon-mask" onClick={handleClose}></div>
    <div className="coupon-mobel">
      <div className="coupon-mobel-header">
        <p>活動視窗</p>
        <IoMdClose onClick={handleClose} style={{cursor: 'pointer'}} />
      </div>
      <div className="coupon-mobel-content">
        <Link href="/get-coupon">
          <img src="images/index/Group 405.png" />
        </Link>
      </div>
    </div>
    </>
  )
}
export default CouponMobel;

