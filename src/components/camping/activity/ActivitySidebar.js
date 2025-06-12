"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaMapMarkerAlt,
  FaDollarSign,
  FaSortAmountDown,
  FaCompass,
  FaChevronLeft,
  FaHistory,
} from "react-icons/fa";
import { MdOutlineLocalOffer } from "react-icons/md";
import {
  TbMountain,
  TbBeach,
  TbTrees,
  TbSunset,
  TbCampfire,
} from "react-icons/tb";
import { Tooltip, Popover } from "antd";

export function ActivitySidebar({ currentFilters, onFilterChange }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [locationCounts, setLocationCounts] = useState({});
  const [filterHistory, setFilterHistory] = useState([]);

  // 移除本地狀態管理，改用 props 傳入的值
  const selectedLocation = currentFilters.location;
  const selectedSort = currentFilters.sortBy;

  // 添加區域圖標定義
  const regionIcons = {
    北部: <FaCompass className="text-blue-500 w-3 h-3" />,
    中部: <TbMountain className="text-emerald-500 w-3 h-3" />,
    南部: <TbBeach className="text-amber-500 w-3 h-3" />,
    東部: <TbSunset className="text-rose-500 w-3 h-3" />,
  };

  // 修改獲取地區數量的方法
  useEffect(() => {
    const fetchLocationCounts = async () => {
      try {
        const response = await fetch('/api/camping/activities');  // 改用主要 API
        if (!response.ok) throw new Error('獲取地區統計失敗');
        const data = await response.json();
        setLocationCounts(data.locationCounts);  // 使用回傳的 locationCounts
      } catch (error) {
        console.error('獲取地區統計失敗:', error);
      }
    };

    fetchLocationCounts();
  }, []);

  // 地區分組定義
  const locationGroups = [
    {
      title: "北部地區",
      items: [
        { label: "新北市", value: "新北" },
        { label: "桃園市", value: "桃園" },
        { label: "新竹縣", value: "新竹" },
        { label: "宜蘭縣", value: "宜蘭" },
      ],
    },
    {
      title: "中部地區",
      items: [
        { label: "苗栗縣", value: "苗栗" },
        { label: "台中市", value: "台中" },
        { label: "南投縣", value: "南投" },
        { label: "雲林縣", value: "雲林" },
      ],
    },
    {
      title: "南部地區",
      items: [
        { label: "嘉義縣", value: "嘉義" },
        { label: "台南市", value: "台南" },
        { label: "高雄市", value: "高雄" },
      ],
    },
    {
      title: "東部地區",
      items: [
        { label: "花蓮縣", value: "花蓮" },
        { label: "台東縣", value: "台東" },
      ],
    },
  ];

  // 排序選項
  const sortOptions = [
    { label: "最新上架", value: "date_desc" },
    { label: "價格低到高", value: "price_asc" },
    { label: "價格高到低", value: "price_desc" },
  ];

  // 初始化篩選記錄
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('campingFilterHistory') || '[]');
    setFilterHistory(savedHistory);
  }, []);

  // 更新篩選記錄
  const updateFilterHistory = (filter) => {
    const newHistory = [
      {
        location: filter.location,
        sortBy: filter.sortBy,
        timestamp: new Date().toISOString()
      },
      ...filterHistory.filter(item => 
        item.location !== filter.location || 
        item.sortBy !== filter.sortBy
      )
    ].slice(0, 5); // 只保留最近 5 筆記錄

    setFilterHistory(newHistory);
    localStorage.setItem('campingFilterHistory', JSON.stringify(newHistory));
  };

  // 修改處理地區變更，加入記錄功能
  const handleLocationChange = (location) => {
    const newFilters = {
      ...currentFilters,
      location
    };
    onFilterChange(newFilters);
    updateFilterHistory(newFilters);
  };

  // 修改處理排序變更，加入記錄功能
  const handleSortChange = (sortBy) => {
    const newFilters = {
      ...currentFilters,
      sortBy
    };
    onFilterChange(newFilters);
    updateFilterHistory(newFilters);
  };

  // 修改標籤顯示邏輯
  const getLocationLabel = (value) => {
    if (value === "all") return "全部地區";
    const location = locationGroups
      .flatMap((g) => g.items)
      .find((i) => i.value === value);
    return location ? location.label : value;
  };

  // 修改初始化時設置 URL 參數的邏輯
  useEffect(() => {
    // 檢查 URL 是否已有參數
    if (!searchParams.has('location') && !searchParams.has('sortBy')) {
      // 如果沒有參數，設置默認值並更新 URL
      const defaultParams = new URLSearchParams({
        location: 'all',
        sortBy: 'date_desc'
      });
      
      // 使用 replace 而不是 push，避免在歷史記錄中新增一筆
      router.replace(`/camping/activities?${defaultParams.toString()}`);
    }
  }, []);

  // 監聽螢幕寬度變化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初始化
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* 桌面版側邊欄 - 只在桌面版顯示 */}
      <div
        className={`
        fixed md:relative
        top-0 left-0 h-full
        transition-all duration-300 ease-in-out
        bg-white rounded-lg shadow-sm border border-gray-100
        hidden md:block
        ${isCollapsed ? "w-16 translate-x-0" : "w-60 translate-x-0"}
      `}
      >
        {/* 收合按鈕 */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            absolute -right-3 top-4
            w-6 h-6
            flex items-center justify-center
            bg-white rounded-full
            border border-gray-200
            shadow-sm
            text-gray-500
            hover:text-gray-700
            hover:shadow-md
            z-[101]
            transition-all duration-300
            ${isCollapsed ? "rotate-180" : ""}
          `}
        >
          <FaChevronLeft size={12} />
        </button>

        {/* 展開時的內容 */}
        <div
          className={`
          p-4 space-y-6
          ${isCollapsed ? "hidden" : "block"}
          transition-opacity duration-200
        `}
        >
          {/* 地區選擇 */}
          <div className="location-section">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-base font-medium text-gray-900 mb-0">
                <FaMapMarkerAlt className="text-blue-500 w-4 h-4" />
                地區選擇
              </h3>
              <button
                onClick={() => handleLocationChange("all")}
                className={`
                  px-2 py-0.5 text-sm
                  rounded-md transition-all duration-200
                  ${
                    selectedLocation === "all"
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                全部地區
              </button>
            </div>

            <div className="space-y-4">
              {locationGroups.map((group) => (
                <div key={group.title}>
                  {/* 地區標題 */}
                  <h4 className="flex items-center gap-1.5 px-2 py-1 mb-1.5 bg-gray-50 rounded-md">
                    {regionIcons[group.title]}
                    <span className="text-sm font-semibold text-gray-700">{group.title}</span>
                  </h4>
                  {/* 縣市列表 */}
                  <div className="grid grid-cols-2 gap-1 pl-2">
                    {group.items.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleLocationChange(option.value)}
                        className={`
                          px-2 py-1 rounded-md text-sm
                          transition-all duration-200
                          flex items-center justify-between
                          ${
                            selectedLocation === option.value
                              ? "bg-blue-50 text-blue-600 font-medium"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          }
                        `}
                      >
                        <span>{option.label}</span>
                        <span className={`text-xs ${
                          selectedLocation === option.value 
                            ? "text-blue-500"
                            : "text-gray-400"
                        }`}>
                          ({locationCounts[option.value] || 0})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div className="sort-section">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-900 mb-3">
              <FaSortAmountDown className="text-purple-500 w-3.5 h-3.5" />
              排序方式
            </h3>
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <Tooltip key={option.value} title={`依${option.label}排序`}>
                  <button
                    onClick={() => handleSortChange(option.value)}
                    className={`
                      w-full px-3 py-2 rounded-lg text-sm transition-all duration-200
                      flex items-center justify-between
                      border border-transparent
                      hover:border-gray-200 hover:bg-gray-50
                      hover:shadow-sm hover:scale-102
                      active:scale-98
                      ${
                        selectedSort === option.value
                          ? "bg-purple-50 text-purple-600 font-medium border-purple-200 shadow-sm"
                          : "text-gray-600"
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    <TbTrees
                      className={
                        selectedSort === option.value
                          ? "text-purple-500"
                          : "text-gray-400"
                      }
                    />
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* 篩選記錄區塊 */}
          {!isCollapsed && filterHistory.length > 0 && (
            <div className="filter-history border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                  <FaHistory className="text-gray-400 w-3.5 h-3.5" />
                  篩選記錄
                </h3>
                <button
                  onClick={() => {
                    setFilterHistory([]);
                    localStorage.removeItem('campingFilterHistory');
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  清除
                </button>
              </div>

              <div className="space-y-2">
                {filterHistory.map((record, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onFilterChange({
                        ...currentFilters,
                        location: record.location,
                        sortBy: record.sortBy
                      });
                    }}
                    className="w-full px-3 py-2 text-sm
                             bg-gray-50 hover:bg-gray-100
                             rounded-lg transition-all duration-200
                             text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FaMapMarkerAlt className="text-blue-500 w-3 h-3" />
                      <span className="text-gray-700">
                        {getLocationLabel(record.location)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FaSortAmountDown className="w-3 h-3" />
                      <span>
                        {sortOptions.find(opt => opt.value === record.sortBy)?.label}
                      </span>
                      <span className="text-gray-400 text-[10px] ml-auto">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 收合時的圖標列表 */}
        {isCollapsed && (
          <div className="py-4 flex flex-col items-center space-y-4">
            {/* 地區選擇 */}
            <Popover
              placement="rightTop"
              trigger="click"
              content={
                <div className="w-64 max-h-[400px] overflow-y-auto">
                  {locationGroups.map((group) => (
                    <div key={group.title} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-2">
                        {regionIcons[group.title]}
                        {group.title}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.items.map((option) => (
                          <button
                            key={option.value}
                            onClick={() =>
                              handleLocationChange(option.value)
                            }
                            className={`
                              px-2.5 py-1.5 rounded-md text-sm
                              transition-all duration-200
                              hover:bg-gray-50
                              ${
                                selectedLocation === option.value
                                  ? "bg-blue-50 text-blue-600 font-medium"
                                  : "text-gray-600"
                              }
                            `}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <FaMapMarkerAlt className="text-blue-500 w-5 h-5" />
              </div>
            </Popover>

            {/* 排序方式 */}
            <Popover
              placement="rightTop"
              trigger="click"
              content={
                <div className="w-48">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        handleSortChange(option.value);
                      }}
                      className={`
                        w-full px-3 py-2 text-sm
                        flex items-center justify-between
                        rounded-lg transition-all duration-200
                        hover:bg-gray-50
                        ${
                          selectedSort === option.value
                            ? "bg-purple-50 text-purple-600 font-medium"
                            : "text-gray-600"
                        }
                      `}
                    >
                      <span>{option.label}</span>
                      {selectedSort === option.value && (
                        <TbTrees className="text-purple-500 w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <FaSortAmountDown className="text-purple-500 w-5 h-5" />
              </div>
            </Popover>

            {/* 收合時的篩選記錄圖標 */}
            {filterHistory.length > 0 && (
              <Popover
                placement="rightTop"
                trigger="click"
                content={
                  <div className="w-64 p-3 max-h-[300px] overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">篩選記錄</span>
                      <button
                        onClick={() => {
                          setFilterHistory([]);
                          localStorage.removeItem('campingFilterHistory');
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        清除
                      </button>
                    </div>
                    <div className="space-y-2">
                      {filterHistory.map((record, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            onFilterChange({
                              ...currentFilters,
                              location: record.location,
                              sortBy: record.sortBy
                            });
                          }}
                          className="w-full p-2 text-sm
                                   hover:bg-gray-50 rounded-lg
                                   transition-all duration-200"
                        >
                          <div className="flex items-center gap-2 text-gray-700">
                            <FaMapMarkerAlt className="text-blue-500 w-3 h-3" />
                            {getLocationLabel(record.location)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                }
              >
                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <FaHistory className="text-gray-400 w-5 h-5" />
                </div>
              </Popover>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// 添加全局樣式到 globals.css
/*
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
*/
