"use client";

import React, { useState, useEffect } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";

export default function SortAndFilter({
  sortOptions,
  filterOptions,
  onSortChange,
  onFilterChange,
  currentSort = "",
  currentFilter = "",
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // 檢測是否為移動設備
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 找到當前選項的標籤
  const getCurrentSortLabel = () => {
    const option = sortOptions.find((opt) => opt.value === currentSort);
    return option ? option.label : "請選擇";
  };

  const getCurrentFilterLabel = () => {
    const option = filterOptions?.find((opt) => opt.value === currentFilter);
    return option ? option.label : "請選擇";
  };

  // 桌面版本渲染函數
  const renderDesktopView = () => (
    <div className="control-group">
      <div className="select-wrapper">
        <label htmlFor="sort">排序方式</label>
        <div className="custom-select">
          <select
            id="sort"
            onChange={(e) => onSortChange(e.target.value)}
            value={currentSort}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FiChevronDown className="select-icon" />
        </div>
      </div>

      {filterOptions && (
        <div className="select-wrapper">
          <label htmlFor="filter">篩選類型</label>
          <div className="custom-select">
            <select
              id="filter"
              onChange={(e) => onFilterChange(e.target.value)}
              value={currentFilter}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="select-icon" />
          </div>
        </div>
      )}
    </div>
  );

  // 移動版本渲染函數
  const renderMobileView = () => (
    <div className="control-group mobile">
      <div className="mobile-select-wrapper">
        <label>排序方式</label>
        <button
          className="mobile-select-btn"
          onClick={() => setShowSortModal(true)}
        >
          {getCurrentSortLabel()}
          <FiChevronDown className="select-icon" />
        </button>
      </div>

      {filterOptions && (
        <div className="mobile-select-wrapper">
          <label>篩選類型</label>
          <button
            className="mobile-select-btn"
            onClick={() => setShowFilterModal(true)}
          >
            {getCurrentFilterLabel()}
            <FiChevronDown className="select-icon" />
          </button>
        </div>
      )}

      {/* 排序模態窗口 */}
      {showSortModal && (
        <div className="mobile-modal">
          <div className="mobile-modal-content">
            <div className="modal-header">
              <h4>選擇排序方式</h4>
              <button
                className="close-btn"
                onClick={() => setShowSortModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-options">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  className={`option-btn ${
                    currentSort === option.value ? "active" : ""
                  }`}
                  onClick={() => {
                    onSortChange(option.value);
                    setShowSortModal(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 篩選模態窗口 */}
      {showFilterModal && filterOptions && (
        <div className="mobile-modal">
          <div className="mobile-modal-content">
            <div className="modal-header">
              <h4>選擇篩選類型</h4>
              <button
                className="close-btn"
                onClick={() => setShowFilterModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-options">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  className={`option-btn ${
                    currentFilter === option.value ? "active" : ""
                  }`}
                  onClick={() => {
                    onFilterChange(option.value);
                    setShowFilterModal(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="sort-and-filter">
      {isMobile ? renderMobileView() : renderDesktopView()}
    </div>
  );
}
