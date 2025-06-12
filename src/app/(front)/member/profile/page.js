"use client";

import React, { useEffect, useState } from "react";

import Sidebar from "../components/sidebar";
import ProfileDetails from "../components/profile-details";
import "../styles/member.scss";

export default function ProfilePage() {
  return (
    <div className="member-content container">
      <Sidebar />
      <div className="main-content">
        <h1>個人資料</h1>

        <ProfileDetails />
      </div>
    </div>
  );
}
