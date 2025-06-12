"use client";

import { useState, useEffect } from "react";

import Sidebar from "@/components/products/sidebar";
import ProductList from "@/components/products/ProductList";
import Pagination from "@/components/products/Pagination";
import "@/styles/pages/products/list.css";

export default function Home() {
  // 1️⃣ 狀態管理
  const [products, setProducts] = useState([]); // 商品列表
  const [currentPage, setCurrentPage] = useState(1); // 當前頁數
  const [itemsPerPage] = useState(12); // 每頁顯示商品數量

  // 2️⃣ 獲取全部商品，或帶條件查詢
  //    categoryId/subcategoryId/minPrice/maxPrice 都是可選
  const fetchProducts = async (
    categoryId = null,
    subcategoryId = null,
    minPrice = 0,
    maxPrice = 99999
  ) => {
    try {
      // 動態構造 API 查詢參數
      const query = new URLSearchParams();
      if (categoryId) query.append("categoryId", categoryId);
      if (subcategoryId) query.append("subcategoryId", subcategoryId);
      if (minPrice !== null && minPrice !== undefined) {
        query.append("minPrice", minPrice);
      }
      if (maxPrice !== null && maxPrice !== undefined) {
        query.append("maxPrice", maxPrice);
      }

      // 發送 API 請求
      const response = await fetch(`/api/products?${query.toString()}`);
      if (!response.ok) throw new Error("無法獲取商品");

      const data = await response.json();

      // 更新狀態
      setProducts(data);
      setCurrentPage(1); // ✨ 切換篩選時，重置到第 1 頁
    } catch (error) {
      console.error("商品讀取失敗:", error);
    }
  };

  // 3️⃣ 初次載入: 不帶任何條件 => 顯示全部商品
  useEffect(() => {
    fetchProducts();
  }, []);

  // 4️⃣ 接收 Sidebar 傳來的篩選條件
  const handleFilter = (categoryId, subcategoryId, minPrice, maxPrice) => {
    // 發送請求
    fetchProducts(categoryId, subcategoryId, minPrice, maxPrice);
  };

  // 5️⃣ 計算分頁
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const currentProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 6️⃣ 切換頁碼
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className="container">
        <div className="row">
          {/* 7️⃣ 傳遞 handleFilter 給 Sidebar */}
          <Sidebar onFilter={handleFilter} />
          {/* 8️⃣ ProductList 只渲染當前頁的商品 */}
          <ProductList products={currentProducts} />
        </div>
        {/* 9️⃣ 分頁 */}
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
