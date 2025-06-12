// src/app/(front)/member/reviews/[orderId]/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "../../components/sidebar";
import "../../styles/member.scss";
import OrderReviewForm from "../../components/OrderReviewForm";
export default function OrderReviewPage() {
  const { orderId } = useParams();

  return (
    <div className="member-content container">
      <Sidebar />
      <div className="main-content">
        <OrderReviewForm orderId={orderId} />
      </div>
    </div>
  );
}
