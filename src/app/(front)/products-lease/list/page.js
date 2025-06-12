"use client";

import { useState, useEffect } from "react";
import Breadcrumbs from "@/components/products-lease/breadcrumbs";
// import Sidebar from "@/components/products-lease/sidebar";
import ProductList from "@/components/products-lease/ProductList";
import Pagination from "@/components/products-lease/Pagination";
import "../styles/list.css";

export default function Home() {
  // 1️⃣ 狀態管理
  const [products, setProducts] = useState([]); // 商品列表
  const [currentPage, setCurrentPage] = useState(1); // 當前頁數
  const [itemsPerPage] = useState(12); // 每頁顯示商品數量
  const [selectedCategory, setSelectedCategory] = useState(null); // 選擇的分類
  const [selectedSubcategory, setSelectedSubcategory] = useState(null); // 選擇的子分類

  // 2️⃣ `fetchProducts` 來獲取 API 回傳的 **全部商品**
  const fetchProducts = async (categoryId = null, subcategoryId = null) => {
    try {
      // 動態構造 API 查詢參數
      const query = new URLSearchParams();
      if (categoryId) query.append("categoryId", categoryId);
      if (subcategoryId) query.append("subcategoryId", subcategoryId);

      // 發送 API 請求
      const response = await fetch(`/api/products-lease?${query.toString()}`);
      if (!response.ok) throw new Error("無法獲取商品");

      const data = await response.json();

      // 更新狀態
      setProducts(data);
      setCurrentPage(1); // ✨ 切換分類時，重置到第 1 頁
    } catch (error) {
      console.error("商品讀取失敗:", error);
    }
  };

  // 3️⃣ 頁面載入時加載所有商品
  useEffect(() => {
    fetchProducts(); // 初始載入
  }, []);

  // 4️⃣ 處理分類篩選
  const handleFilter = (categoryId, subcategoryId) => {
    window.scrollTo({ top: 0, behavior: "smooth" }); // ✨ 平滑滾動到最上方
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
    fetchProducts(categoryId, subcategoryId);
  };

  // 5️⃣ 計算分頁數據
  const totalPages = Math.ceil(products.length / itemsPerPage); // 總頁數
  const currentProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ); // 取得當前頁面該顯示的商品

  // 6️⃣ 切換頁碼
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" }); // ✨ 平滑滾動到最上方
  };

  return (
    <div>
      <div className="container lease-product">
        {/* <Breadcrumbs /> */}
        <div className="row">
          {/* 7️⃣ 傳遞 `handleFilter` 方法給 Sidebar */}
          {/* <Sidebar onFilter={handleFilter} /> */}
          {/* 8️⃣ 傳遞 **當前頁面應該顯示的商品** 給 ProductList */}
          <ProductList products={currentProducts} />
        </div>
        {/* 9️⃣ 顯示分頁按鈕 */}
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
