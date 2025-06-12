"use client";

import React from "react";
import Sidebar from "../components/sidebar";
import "../styles/member.scss";
import ReviewsDetails from "../components/reviews-details";

export default function ReviewsPage() {
  return (
    <div className="member-content container">
      <Sidebar />
      <div className="main-content">
        <ReviewsDetails />
      </div>
    </div>
  );
}
