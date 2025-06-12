"use client"; // 標記為客戶端組件
import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActivityList } from "@/components/camping/activity/ActivityList";
import { ActivitySearch } from "@/components/camping/activity/ActivitySearch";
import { ActivitySidebar } from "@/components/camping/activity/ActivitySidebar";
import Breadcrumb from "@/components/common/Breadcrumb";
import useSWR from 'swr';
import Loading from "@/components/Loading";
import { ActivityBottomContent } from "@/components/camping/activity/ActivityBottomContent";
import Image from "next/image";
import { MobileFilterDrawer } from "@/components/camping/activity/MobileFilterDrawer";
import { FaFilter } from "react-icons/fa";

// 定義 fetcher 函數，用於 SWR 發送請求
const fetcher = url => fetch(url).then(r => r.json());

// 定義默認篩選值
const DEFAULT_FILTERS = {
  location: 'all',
  sortBy: 'date_desc',
  keyword: '',
  dateRange: [null, null],
  minPrice: '',
  maxPrice: '',
};

export default function ActivitiesPage() {
  // 1. 所有的 hooks 放在最前面
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 2. 所有的 state hooks
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || 'all',
    sortBy: searchParams.get('sortBy') || 'date_desc',
    keyword: '',
    dateRange: [null, null],
    minPrice: '',
    maxPrice: '',
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 3. SWR hook
  const { data, error, isLoading } = useSWR(
    mounted ? '/api/camping/activities' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  // 4. useCallback hooks
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.replace(`/camping/activities?${params.toString()}`, {
      scroll: false,
      shallow: true
    });
  }, [searchParams, router]);

  // 5. useMemo hooks
  const filteredActivities = useMemo(() => {
    if (!data?.activities) return [];
    let filtered = [...data.activities];

    if (filters.keyword) {
      filtered = filtered.filter(activity => 
        activity.activity_name.toLowerCase().includes(filters.keyword.toLowerCase())
      );
    }

    if (filters.location && filters.location !== 'all') {
      filtered = filtered.filter(activity => activity.city === filters.location);
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'price_asc':
          return a.min_price - b.min_price;
        case 'price_desc':
          return b.min_price - a.min_price;
        default:
          return 0;
      }
    });

    return filtered;
  }, [data, filters]);

  // 6. useEffect hooks
  useEffect(() => {
    setMounted(true);
  }, []);

  // 定義 locationGroups
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

  // 定義排序選項
  const sortOptions = [
    { label: "最新上架", value: "date_desc" },
    { label: "價格低到高", value: "price_asc" },
    { label: "價格高到低", value: "price_desc" },
  ];

  // 定義價格範圍選項
  const priceRangeOptions = [
    { label: '全部價格', value: 'all' },
    { label: '2000元以下', value: '0-2000' },
    { label: '2000-3000元', value: '2000-3000' },
    { label: '3000-5000元', value: '3000-5000' },
    { label: '5000-8000元', value: '5000-8000' },
    { label: '8000元以上', value: '8000-up' }
  ];

  // 定義麵包屑項目
  const breadcrumbItems = [
    {
      label: "露營活動",
      href: "/camping/activities"
    }
  ];

  // 7. 條件渲染邏輯
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8 flex items-center justify-center">
        <div className="text-red-500">載入失敗，請重試</div>
      </div>
    );
  }

  // 8. 主要渲染
  return (
    <div className="max-w-[1440px] mx-auto pb-8 overflow-hidden">
      {/* 添加麵包屑導航 */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      {/* 搜尋區塊 */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <ActivitySearch
            initialFilters={filters}
            onFilterChange={handleFilterChange}
          />
          
          {/* 手機版頂部控制列 */}
          <div className="md:hidden mt-4">
            <div className="hidden md:flex items-center justify-between gap-2 bg-white px-3 py-0 rounded-lg shadow-sm ">
              {/* 左側篩選按鈕 */}
              <div className="flex-1">
                <ActivitySidebar
                  onFilterChange={handleFilterChange}
                  activities={data?.activities}
                  currentFilters={filters}
                />
              </div>

              {/* 右側視圖切換按鈕 - 只顯示網格視圖按鈕 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all shadow-sm ${
                    viewMode === 'grid'
                      ? 'bg-[#B6AD9A] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 桌面版視圖切換 */}
          <div className="hidden lg:flex justify-end gap-2 mt-4">
            {/* 網格視圖按鈕 */}
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#B6AD9A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            {/* 列表視圖按鈕 */}
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-[#B6AD9A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 主要內容區域 */}
        <div className="flex gap-6">
          {/* 桌面版側邊欄 */}
          <div className="hidden md:block">
            <ActivitySidebar
              onFilterChange={handleFilterChange}
              activities={data?.activities}
              currentFilters={filters}
            />
          </div>
          {/* 活動列表 */}
          <div className="flex-1">
            <Suspense fallback={<Loading />}>
              <ActivityList 
                activities={filteredActivities} 
                viewMode={viewMode}
                isLoading={isLoading}
              >
                {activity => (
                  <Image
                    src={`/uploads/activities/${activity.main_image}`}
                    alt={activity.activity_name}
                    fill
                    sizes="(max-width: 768px) 100vw, 
                           (max-width: 1200px) 50vw,
                           33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={false}
                    quality={75}
                    loading="lazy"
                  />
                )}
              </ActivityList>
            </Suspense>
          </div>
        </div>

        {/* 添加底部內容 */}
        <ActivityBottomContent />

        {/* 手機版篩選按鈕 - 固定在底部 */}
        <div className="md:hidden fixed bottom-4 right-4 z-30">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="w-12 h-12 bg-[#8C8275] text-white rounded-full
                     flex items-center justify-center shadow-lg
                     hover:bg-[#4A3C31] transition-colors duration-300"
          >
            <FaFilter className="w-5 h-5" />
          </button>
        </div>

        {/* 手機版篩選抽屜 */}
        <MobileFilterDrawer
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          locationGroups={locationGroups}
          sortOptions={sortOptions}
          priceRangeOptions={priceRangeOptions}
        />
      </div>
    </div>
  );
}
