"use client";

import React from "react";
import Sidebar from "../components/sidebar";
import RentalDetails from "../components/rental-details";
import "../styles/member.scss";

export default function RentalsPage() {
  return (
    <div className="member-content container">
      <Sidebar />
      <div className="main-content">
        <h1>我的租借商品</h1>

        <RentalDetails />
      </div>
    </div>
  );
}
