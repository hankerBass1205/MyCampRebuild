"use client";
import {useEffect, useState } from "react";
import Image from "next/image";

const Search = ({ onSearch, onFocus, selectedValue, setSelectedValue}) => {
 const [searchTerm, setSearchTerm] = useState("");
 const [isFocused, setIsFocused] = useState(false);// 搜尋BAR開啟狀態

 const handleFocus = (e) => {
  const selectedValue = e.target.value;  // 获取当前选中的值
  console.log(selectedValue);  // 打印选中的值
  onFocus(selectedValue);  // 调用传入的父组件方法
  console.log("onFocus 被调用");
  setIsFocused(true); // 设置焦点状态为 true
};

 const handleSelectChange = (e) => {
  // if (!setSelectedValue) {
  //   console.error("setSelectedValue 未定义，无法更新 selectedValue");
  //   return;
  // }
  setSelectedValue(e.target.value); // 更新选中的值
  console.log(e.target.value); // 打印选中的值
 }

 useEffect(() => {
  // 页面加载时，判断输入框是否为空
  if (searchTerm === "") {
    onSearch(""); // 如果空，则清除搜索结果
  }
}, []); // 空数组意味着只在组件加载时执行一次
  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);  // 避免传递 undefined 或 null
  }
  
  return (
    
    <form className="d-flex" role="search">
      <select value={selectedValue} onFocus={handleFocus} onChange={handleSelectChange}>
        <option value="1">產品</option>
        <option value="2">文章</option>
        <option value="3">營區</option>
      </select>
      <input
        className={`form-control search-input ${isFocused ? "active" : ""}`}
        type="search"
        placeholder="請先選擇類別"
        aria-label="Search"
        value={searchTerm}
        onChange={handleChange}
        // onFocus={handleFocus} // 这里确保传递 onFocus 事件
      />
      <button className="btn search-bg" type="submit">
        <Image
          src="/images/header/search.png"
          width={20}
          height={20}
          alt="search"
        />
      </button>
    </form>
  );
};
export default Search;
