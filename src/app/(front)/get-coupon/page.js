"use client";
import React from 'react';
import "@/styles/pages/get-coupon/style.css";

//compenents
import GetGood from "@/components/get-coupon/coupon-good";
import GetCoupons from "@/components/get-coupon/get-coupons";

export default function GetCoupon() {
  return (
    <>
      <main className="get-coupon">
        <GetGood />
        <GetCoupons />
      </main>
    </>
  );
}