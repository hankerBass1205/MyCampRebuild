"use client";

import React from "react";
import Sidebar from "./../components/sidebar";
import ArticlesAndFavoritesDetails from "./../components/articles-favorites-details";
import "./../styles/member.scss";

export default function ArticlesAndFavoritesPage() {
  return (
    <div className="member-content container">
      <Sidebar />
      <div className="main-content">
        <ArticlesAndFavoritesDetails />
      </div>
    </div>
  );
}
