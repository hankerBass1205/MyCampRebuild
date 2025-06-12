"use client";

import React from "react";
import Sidebar from "../components/sidebar";
import "../styles/member.scss";
import WishlistDetails from "../components/wishlist-details";

export default function WishlistPage() {
  return (
    <div className="member-content container">
      <Sidebar />
      <div className="main-content">
        <WishlistDetails />
      </div>
    </div>
  );
}
