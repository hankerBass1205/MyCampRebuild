"use client";

import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import "../styles/member.scss";

import Coupon from "../components/coupon-one";

export default function ProfilePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // const coupons = [
  //   {
  //     discount: '-75%',
  //     status: '未過期',
  //     startDate: '2025-01-10',
  //     endDate: '2025-06-20',
  //     footerText: '已領取點擊使用',
  //   },
  //   {
  //     discount: '-75%',
  //     status: '未過期',
  //     startDate: '2025-01-10',
  //     endDate: '2025-06-20',
  //     footerText: '未領取點擊領取',
  //   },

  //   // ...其他優惠券資料
  // ];

  // const filteredCoupons = coupons.filter(
  //   (coupon) =>
  //     coupon.status.includes(searchTerm) ||
  //     coupon.startDate.includes(searchTerm) ||
  //     coupon.endDate.includes(searchTerm) ||
  //     coupon.footerText.includes(searchTerm)
  // );

  return (
    <div className="member-content container">
      <Sidebar />
      <div className="main-content">
        <h1>優惠券</h1>

        <Coupon />
        {/* 其他個人資料的內容 */}
      </div>
    </div>
  );
}
