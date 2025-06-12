"use client";

import { useState, useEffect } from "react";

export default function Sidebar({ onFilter }) {
  const [categories, setCategories] = useState([]); // 存儲類別和子類別
  const [openItem, setOpenItem] = useState(null); // 控制打開的類別
  const [selectedSubcategory, setSelectedSubcategory] = useState(null); // 記錄選中的子類別
  const [minPrice, setMinPrice] = useState(0); // 最低價
  const [maxPrice, setMaxPrice] = useState(99999); // 最高價
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 新增：控制 Sidebar 顯示

  // 從 API 獲取類別和子類別資料
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/products/category");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // 切換類別打開狀態
  const toggleAccordion = (categoryId) => {
    setOpenItem(openItem === categoryId ? null : categoryId);
  };

  // 點擊子類別時觸發的函式
  const handleSubcategoryClick = (categoryId, subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    onFilter(categoryId, subcategoryId, minPrice, maxPrice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 點擊「全部商品」的處理
  const handleAllClick = () => {
    setOpenItem(null);
    setSelectedSubcategory(null);
    onFilter(null, null, minPrice, maxPrice);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 調整價格範圍
  const handlePriceChange = (e, type) => {
    const value = Number(e.target.value);
    if (type === "min") {
      if (value > maxPrice) setMaxPrice(value);
      setMinPrice(value);
    } else {
      if (value < minPrice) setMinPrice(value);
      setMaxPrice(value);
    }
  };

  const handlePriceBlur = () => {
    onFilter(openItem, selectedSubcategory, minPrice, maxPrice);
  };

  return (
    <>
      {/* 箭頭按鈕（手機版顯示） */}
      <button
        className="arrow-btn"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? "商品類別" : "商品類別"}
      </button>

      {/* Sidebar */}
      <div className={`col-lg-3 mb-4 sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="cate-aside">
          <div className="accordion" id="sidebarAccordion">
            {/* 全部商品 按鈕 */}
            <div className="accordion-item">
              <button
                className="accordion-button all"
                type="button"
                onClick={handleAllClick}
              >
                全部商品
              </button>
            </div>

            {/* 類別與子類別清單 */}
            {categories.map((category) => (
              <div key={category.id} className="accordion-item">
                <h2 className="accordion-header" id={`heading-${category.id}`}>
                  <button
                    className={`accordion-button ${
                      openItem === category.id ? "" : "collapsed"
                    }`}
                    type="button"
                    onClick={() => toggleAccordion(category.id)}
                  >
                    {category.name}
                  </button>
                </h2>
                <div
                  id={`collapse-${category.id}`}
                  className={`accordion-collapse collapse ${
                    openItem === category.id ? "show" : ""
                  }`}
                >
                  <div className="accordion-body">
                    <ul className="list-group list-group-flush">
                      {category.subcategories.map((subcategory) => (
                        <li key={subcategory.id} className="list-group-item">
                          <button
                            className={`list-group-item w-100 text-start ${
                              selectedSubcategory === subcategory.id
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              handleSubcategoryClick(
                                category.id,
                                subcategory.id
                              )
                            }
                          >
                            {subcategory.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 價格範圍 */}
          <div className="accordion-item">
            <div className="accordion-header">
              <h5 className="p-3 m-0">價格範圍</h5>
            </div>
            <div className="accordion-body d-flex flex-column px-3">
              {/* 最低價 */}
              <label htmlFor="minPrice" className="form-label">
                最低價：{minPrice}
              </label>
              <input
                id="minPrice"
                type="range"
                min="0"
                max="99999"
                className="my-price-range"
                step="50"
                value={minPrice}
                onChange={(e) => handlePriceChange(e, "min")}
                onMouseUp={handlePriceBlur}
              />

              {/* 最高價 */}
              <label htmlFor="maxPrice" className="form-label mt-3">
                最高價：{maxPrice}
              </label>
              <input
                id="maxPrice"
                type="range"
                min="0"
                max="99999"
                className="my-price-range"
                step="10"
                value={maxPrice}
                onChange={(e) => handlePriceChange(e, "max")}
                onMouseUp={handlePriceBlur}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
