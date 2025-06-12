"use client";
// ===== React 相關引入 =====
import { useState, useEffect, useCallback } from "react";                 // 引入 React 狀態管理和生命週期鉤子
import { useSearchParams, useRouter } from 'next/navigation';  // 添加這行
import debounce from 'lodash/debounce';  // 需要安裝 lodash
import useSWR from 'swr';
import { useMediaQuery } from 'react-responsive'; // 引入 useMediaQuery

// ===== UI 組件和圖標引入 =====
import { FaSearch } from "react-icons/fa";                  // 引入搜尋圖標
import { DatePicker, ConfigProvider, InputNumber, Select } from "antd";          // 引入 Ant Design 日期選擇器和全局配置
import locale from "antd/locale/zh_TW";                     // 引入 Ant Design 繁體中文語言包

// ===== 日期處理工具引入 =====
import dayjs from "dayjs";                                  // 引入日期處理工具
import "dayjs/locale/zh-tw";                               // 引入 dayjs 繁體中文語言包

// ===== 自定義組件引入 =====
import { FilterTags } from "./FilterTags";                  // 引入過濾標籤組件

// ===== 自定義工具引入 =====
import {
  ToastContainerComponent   // 引入 Toast 容器組件（用於顯示輕量提示）
} from "@/utils/toast";

import Loading from "@/components/Loading";  // 添加 Loading 組件引入

// ===== 組件常量定義 =====
const { RangePicker } = DatePicker;                        // 解構日期範圍選擇器組件

export function ActivitySearch({ onFilterChange, initialFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSearching, setIsSearching] = useState(false);  // 添加搜尋狀態

  // 設定日期限制
  const today = dayjs().startOf("day");
  const maxDate = dayjs().add(1, "year"); // 最多可以搜尋一年內的活動

  // 修改初始狀態，移除 dateRange
  const [filters, setFilters] = useState({
    keyword: "",
    startDate: searchParams.get('startDate') || null,
    endDate: searchParams.get('endDate') || null,
    priceRange: searchParams.get('priceRange') || 'all',
    sortBy: searchParams.get('sortBy') || 'date_desc',
    location: searchParams.get('location') || 'all'
  });

  // 使用 useCallback 包裝 debounce 函數
  const debouncedSearch = useCallback(
    debounce((value) => {
      const updatedFilters = { ...filters, keyword: value };
      onFilterChange(updatedFilters);
      
      // 更新 URL
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('keyword', value);
      } else {
        params.delete('keyword');
      }
      
      router.replace(`/camping/activities?${params.toString()}`, {
        scroll: false
      });
    }, 300),
    [filters, router, searchParams]
  );

  // 處理日期變更
  const handleDateChange = useCallback((dates) => {
    // console.log('=== 日期變更 ===');
    // console.log('收到的日期物件:', {
    //   dates,
    //   isArray: Array.isArray(dates),
    //   startDate: dates?.[0]?.format?.('YYYY-MM-DD'),
    //   endDate: dates?.[1]?.format?.('YYYY-MM-DD')
    // });

    // 如果清除日期
    if (!dates) {
      // console.log('清除日期');
      const params = new URLSearchParams(searchParams.toString());
      params.delete('startDate');
      params.delete('endDate');
      
      router.replace(`/camping/activities?${params.toString()}`, {
        scroll: false
      });
      return;
    }

    const [start, end] = dates;
    const startDate = start.format('YYYY-MM-DD');
    const endDate = end.format('YYYY-MM-DD');

    // console.log('格式化後的日期:', { startDate, endDate });

    // 更新 URL 參數
    const params = new URLSearchParams(searchParams.toString());
    // 確保日期格式正確且順序正確（開始日期必須早於或等於結束日期）
    if (startDate <= endDate) {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    } else {
      // 如果日期順序相反，則交換
      params.set('startDate', endDate);
      params.set('endDate', startDate);
    }
    
    // console.log('更新 URL:', `camping/activities?${params.toString()}`);
    
    // 更新 filters 並觸發篩選
    const updatedFilters = {
      ...filters,
      startDate,
      endDate
    };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);  // 確保觸發父組件的篩選

    router.replace(`/camping/activities?${params.toString()}`, {
      scroll: false
    });
  }, [router, searchParams, filters, onFilterChange]);

  // 處理關鍵字變更
  const handleKeywordChange = (e) => {
    const value = e.target.value;
    
    // 1. 限制輸入長度
    if (value.length > 50) {
      return;
    }

    // 2. 過濾特殊字元
    const sanitizedValue = value.replace(/[<>{}[\]\\\/]/g, '');
    
    // 3. 避免純空白搜尋
    if (sanitizedValue.trim() === '') {
      setFilters(prev => ({ ...prev, keyword: '' }));
      return;
    }

    setFilters(prev => ({ ...prev, keyword: sanitizedValue }));
    
    // 4. 至少輸入 2 個字才觸發搜尋
    if (sanitizedValue.trim().length >= 2) {
      debouncedSearch(sanitizedValue);
    }
  };

  // 處理排序變更
  const handleSortChange = (sortBy) => {
    const updatedFilters = { ...filters, sortBy };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  // 處理地區變更
  const handleLocationChange = (location) => {
    const updatedFilters = { ...filters, location };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  // 處理移除標籤
  const handleRemoveTag = (tag) => {
    if (tag.type === 'all') {
      // 清除所有篩選條件，但保持排序
      const newFilters = {
        ...filters,
        keyword: '',
        startDate: null,
        endDate: null,
        priceRange: 'all',
        location: 'all',
        sortBy: filters.sortBy // 保持原有排序
      };
      setFilters(newFilters);
      
      // 更新 URL - 清除所有參數只保留排序
      const params = new URLSearchParams();
      if (filters.sortBy !== 'date_desc') {  // 只有在非預設排序時才加入參數
        params.set('sortBy', filters.sortBy);
      }
      router.replace(`/camping/activities?${params.toString()}`, {
        scroll: false
      });

      onFilterChange(newFilters);
      return;
    }

    // 處理個別標籤移除
    const updatedFilters = { ...filters };
    const params = new URLSearchParams(searchParams.toString());

    switch (tag.type) {
      case 'keyword':
        updatedFilters.keyword = '';
        params.delete('keyword');
        break;
        
      case 'date':
        updatedFilters.startDate = null;
        updatedFilters.endDate = null;
        params.delete('startDate');
        params.delete('endDate');
        // 清除日期選擇器的值
        const dateRangePicker = document.querySelector('.ant-picker-range');
        if (dateRangePicker) {
          const clearBtn = dateRangePicker.querySelector('.ant-picker-clear');
          if (clearBtn) {
            clearBtn.click();
          }
        }
        break;
        
      case 'price':
        updatedFilters.priceRange = 'all';
        params.delete('priceRange');
        break;
        
      case 'location':
        updatedFilters.location = 'all';
        params.delete('location');
        break;

      case 'sort':
        updatedFilters.sortBy = 'date_desc'; // 重置為預設排序
        params.delete('sortBy');
        break;
    }

    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
    
    router.replace(`/camping/activities?${params.toString()}`, {
      scroll: false
    });
  };

  // 清理 debounce
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  // 價格範圍選項
  const priceRangeOptions = [
    { label: '全部價格', value: 'all' },
    { label: '2000元以下', value: '0-2000' },
    { label: '2000-3000元', value: '2000-3000' },
    { label: '3000-5000元', value: '3000-5000' },
    { label: '5000-8000元', value: '5000-8000' },
    { label: '8000元以上', value: '8000-up' }
  ];

  // 修改價格範圍變更處理函數
  const handlePriceRangeChange = (value) => {
    // console.log('選擇的價格範圍:', value);
    
    const params = new URLSearchParams(searchParams.toString());
    
    const newFilters = {
      ...filters,
      priceRange: value
    };

    // 清除之前的價格相關參數
    params.delete('priceRange');

    // 設置新的價格範圍參數
    if (value && value !== 'all') {
      params.set('priceRange', value);
    }

    // console.log('更新後的過濾條件:', newFilters);
    
    setFilters(newFilters);
    onFilterChange(newFilters);

    // 更新 URL
    router.push(`/camping/activities?${params.toString()}`);
  };

  // 修改清除處理函數
  const handleClear = (options = {}) => {
    const clearedFilters = {
      keyword: "",
      startDate: null,
      endDate: null,
      priceRange: 'all',
      sortBy: options.keepSort ? filters.sortBy : 'date_desc',
      location: 'all'
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // 日期選擇器的預設選項
  const presets = [
    {
      label: '今天',
      value: [dayjs(), dayjs()]
    },
    {
      label: '明天',
      value: [dayjs().add(1, 'd'), dayjs().add(1, 'd')]
    },
    {
      label: '本週',
      value: [dayjs(), dayjs().endOf('week')]
    },
    {
      label: '下週',
      value: [
        dayjs().add(1, 'week').startOf('week'),
        dayjs().add(1, 'week').endOf('week')
      ]
    },
    {
      label: '本月',
      value: [dayjs(), dayjs().endOf('month')]
    }
  ];

  const parseDateString = (dateString) => {
    return dateString ? dayjs(dateString) : null;
  };

  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  const handleMobileDateChange = useCallback((date, type) => {
    const formattedDate = date ? date.format('YYYY-MM-DD') : null;
    const params = new URLSearchParams(searchParams.toString());

    if (type === 'start') {
      if (formattedDate) {
        params.set('startDate', formattedDate);
      } else {
        params.delete('startDate');
      }
    } else {
      if (formattedDate) {
        params.set('endDate', formattedDate);
      } else {
        params.delete('endDate');
      }
    }

    const updatedFilters = {
      ...filters,
      [type === 'start' ? 'startDate' : 'endDate']: formattedDate
    };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);

    router.replace(`/camping/activities?${params.toString()}`, {
      scroll: false
    });
  }, [router, searchParams, filters, onFilterChange]);

  const handleDesktopDateChange = useCallback((dates) => {
    const [start, end] = dates || [];
    const startDate = start ? start.format('YYYY-MM-DD') : null;
    const endDate = end ? end.format('YYYY-MM-DD') : null;

    const params = new URLSearchParams(searchParams.toString());
    if (startDate) {
      params.set('startDate', startDate);
    } else {
      params.delete('startDate');
    }

    if (endDate) {
      params.set('endDate', endDate);
    } else {
      params.delete('endDate');
    }

    const updatedFilters = {
      ...filters,
      startDate,
      endDate
    };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);

    router.replace(`/camping/activities?${params.toString()}`, {
      scroll: false
    });
  }, [router, searchParams, filters, onFilterChange]);

  return (
    <>
      {isSearching && <Loading isLoading={isSearching} />}
      <ConfigProvider
        theme={{
          token: {
            fontFamily: "var(--font-zh)", // 使用 globals.css 中定義的中文字體
          },
          components: {
            DatePicker: {
              // 基礎顏色
              colorBgContainer: "#F8F8F8", // 背景色（淺灰白）
              colorPrimary: "#B6AD9A", // 主色調（淡褐色）
              colorBorder: "#E8E4DE", // 邊框（淺米色）
              colorText: "#7C7267", // 文字（淺褐灰）
              colorTextDisabled: "#D3CDC6", // 禁用文字（淺灰）
              colorBgContainerDisabled: "#F8F8F8", // 禁用背景

              // 輸入框外觀
              borderRadius: 8, // 圓角
              controlHeight: 40, // 高度

              // 輸入框 hover 和 focus 狀態
              hoverBorderColor: "#8C8275", // hover 邊框（深褐）
              hoverBg: "#F5F3F0", // hover 背景
              activeBorderColor: "#B6AD9A", // focus 邊框（淡褐色）
              controlOutline: "#8C827520", // focus 光圈
              controlOutlineWidth: 4, // 光圈寬度

              // 日期格子的狀態
              cellHoverBg: "#F5F3F0", // 日期 hover（淺褐）
              cellActiveWithRangeBg: "#E8E4DE", // 選中範圍（淺米色）
              cellHoverWithRangeBg: "#F5F3F0", // 範圍 hover（淺褐）
              cellRangeBorderColor: "#B6AD9A", // 範圍邊框
              
              // 選中狀態
              cellActiveBg: "#B6AD9A", // 選中背景（淡褐色）
              cellActiveTextColor: "#FFFFFF", // 選中文字（白色）

              // 今天標記
              cellActiveWithRangeBg: "#F5F3F0", // 範圍內的今天
              cellToday: "#B6AD9A", // 今天的標記顏色

              // 控制按鈕（月份切換等）
              controlItemBgActive: "#E8E4DE", // 控制項選中（淺米色）
              controlItemBgHover: "#F5F3F0", // 控制項 hover（淺褐）
            },
            InputNumber: {
              // 基礎顏色
              colorBgContainer: "#F8F8F8",
              colorPrimary: "#B6AD9A",  // 大地色主色
              colorBorder: "#E8E4DE",
              colorText: "#7C7267",
              colorTextDisabled: "#D3CDC6",
              colorBgContainerDisabled: "#F8F8F8",

              // 輸入框外觀
              borderRadius: 8,
              controlHeight: 40,

              // hover 和 focus 狀態
              hoverBorderColor: "#8C8275",  // 更深的大地色
              hoverBg: "#F5F3F0",          // hover 時的背景色
              activeBorderColor: "#B6AD9A", // focus 時的邊框顏色
              
              // focus 時的光圈效果
              controlOutline: "#8C827520",  // 使用更深的大地色，20% 透明度
              controlOutlineWidth: 4,
            },
            Select: {
              // Select 組件保持一致的樣式
              colorPrimary: "#B6AD9A",
              colorBorder: "#E8E4DE",
              hoverBorderColor: "#8C8275",
              hoverBg: "#F5F3F0",
              controlOutline: "#8C827520",
              controlOutlineWidth: 4,
            }
          },
        }}
        locale={locale}
      >
        <div className="space-y-4">
          {/* 搜尋區塊 - 只在桌面版顯示 */}
          <div className="hidden md:block bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-md border border-gray-100/20">
            {/* 搜尋欄和日期選擇器 */}
            <div className="flex flex-wrap items-start gap-6">
              {/* 關鍵字搜尋 - 加大點擊區域 */}
              <div className="relative group w-full md:w-[300px]">
                <input
                  type="text"
                  placeholder="請輸入活動標題（至少 2 個字）..."
                  maxLength={50}  // 限制最大輸入長度
                  className="w-full px-4 py-3 rounded-lg 
                           border border-[#E8E4DE] 
                           text-[#7C7267] placeholder-gray-400 
                           bg-white
                           transition-all duration-300 
                           focus:outline-none focus:ring-4 
                           focus:ring-[#8C827520] 
                           focus:border-[#B6AD9A] 
                           hover:border-[#8C8275] 
                           hover:bg-[#F5F3F0] 
                           shadow-sm text-sm
                           h-[46px]"
                  value={filters.keyword}
                  onChange={handleKeywordChange}
                />
                <FaSearch className="absolute right-4 top-[14px] text-gray-400 
                                   group-hover:text-[#8C8275] 
                                   transition-colors duration-300" />
              </div>

              {/* 日期範圍選擇器 */}
              <div className="w-full md:w-[280px] flex gap-2">
                {isMobile ? (
                  <>
                    <DatePicker
                      value={parseDateString(searchParams.get('startDate'))}
                      onChange={(date) => handleMobileDateChange(date, 'start')}
                      format="YYYY/MM/DD"
                      placeholder="開始日期"
                      className="w-full hover:shadow-sm transition-shadow duration-300"
                      allowClear
                      disabledDate={(current) => {
                        if (current && current < today) return true;
                        if (current && current > maxDate) return true;
                        return false;
                      }}
                      style={{ height: "46px" }}
                      popupClassName="mobile-datepicker"
                    />
                    <DatePicker
                      value={parseDateString(searchParams.get('endDate'))}
                      onChange={(date) => handleMobileDateChange(date, 'end')}
                      format="YYYY/MM/DD"
                      placeholder="結束日期"
                      className="w-full hover:shadow-sm transition-shadow duration-300"
                      allowClear
                      disabledDate={(current) => {
                        if (current && current < today) return true;
                        if (current && current > maxDate) return true;
                        return false;
                      }}
                      style={{ height: "46px" }}
                      popupClassName="mobile-datepicker"
                    />
                  </>
                ) : (
                  <RangePicker
                    value={[
                      parseDateString(searchParams.get('startDate')),
                      parseDateString(searchParams.get('endDate'))
                    ]}
                    onChange={handleDesktopDateChange}
                    format="YYYY/MM/DD"
                    placeholder={["開始日期", "結束日期"]}
                    className="w-full hover:shadow-sm transition-shadow duration-300"
                    allowClear
                    showToday
                    separator={<span className="text-[#8C8275] px-2">→</span>}
                    disabledDate={(current) => {
                      if (current && current < today) return true;
                      if (current && current > maxDate) return true;
                      return false;
                    }}
                    style={{ height: "46px" }}
                    presets={presets}
                  />
                )}
              </div>

              {/* 價格範圍選擇器 */}
              <div className="w-full md:w-[220px]">
                <Select
                  className="w-full"
                  placeholder="選擇價格範圍"
                  value={filters.priceRange}
                  onChange={handlePriceRangeChange}
                  options={priceRangeOptions}
                  style={{ height: '46px' }}
                />
              </div>
            </div>

            {/* 篩選標籤 */}
            <div className="mt-4">
              <FilterTags 
                filters={filters}
                onRemoveTag={handleRemoveTag}
              />
            </div>
          </div>
        </div>
        <ToastContainerComponent />
      </ConfigProvider>
    </>
  );
}
