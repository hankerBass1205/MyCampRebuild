"use client";
import React from "react";
import Sidebar from "../components/sidebar";
import PurchaseHistoryDetails from "../components/purchase-history-details";
import "../styles/member.scss";
export default function PurchaseHistoryPage() {
  return (
    <div className="member-content container">
      <Sidebar />
      <div className="main-content">
        <PurchaseHistoryDetails />
      </div>
    </div>
  );
}
