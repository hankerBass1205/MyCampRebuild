"use client";

import React, { useState, useEffect } from "react";
import { FiSearch, FiX } from "react-icons/fi"; // 使用更现代的图标库

export default function SearchBar({ placeholder, onSearch, value }) {
  const [searchValue, setSearchValue] = useState("");

  // 當外部 value 變化時同步內部狀態
  useEffect(() => {
    if (value !== undefined) {
      setSearchValue(value);
    }
  }, [value]);

  const handleClear = () => {
    setSearchValue("");
    onSearch("");
  };

  return (
    <div className="member-search-bar">
      <div className="search-container">
        <input
          type="text"
          className="member-search-input"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            onSearch(e.target.value);
          }}
        />
        <div className="icon-container">
          {searchValue ? (
            <button className="clear-button" onClick={handleClear}>
              <FiX />
            </button>
          ) : (
            <FiSearch className="search-icon" />
          )}
        </div>
      </div>
    </div>
  );
}
