"use client";

import { useState, useEffect } from "react";

export default function Sidebar({ onFilter }) {
  const [categories, setCategories] = useState([]); // 存儲類別和子類別
  const [openItem, setOpenItem] = useState(null); // 控制打開的類別
  const [selectedSubcategory, setSelectedSubcategory] = useState(null); // 記錄選中的子類別

  useEffect(() => {
    // 從 API 獲取類別和子類別資料
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/products-lease/category"); // 請求 API
        const data = await response.json();
        setCategories(data); // 更新類別數據
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

  // 點擊子類別時觸發的函數
  const handleSubcategoryClick = (categoryId, subcategoryId) => {
    setSelectedSubcategory(subcategoryId); // 記錄選中的子類別
    onFilter(categoryId, subcategoryId); // 傳遞篩選條件給父組件
  };

  const handleAllClick = () => {
    setOpenItem(null); // 折疊所有類別
    setSelectedSubcategory(null); // 清除選中狀態
    onFilter(null, null); // 顯示全部商品
  };

  return (
    <div className="col-lg-3 mb-4">
      <div className="cate-aside">
        <div className="accordion " id="sidebarAccordion">
          {/* 全部商品 按鈕，樣式與 Accordion 保持一致 */}
          <div className="accordion-item">
            <button
              className="accordion-button all"
              type="button"
              onClick={() => handleAllClick()}
            >
              全部商品
            </button>
          </div>

          {categories.map((category) => (
            <div key={category.id} className="accordion-item">
              {/* 類別按鈕 */}
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

              {/* 顯示對應子類別 */}
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
                            handleSubcategoryClick(category.id, subcategory.id)
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
      </div>
    </div>
  );
}
