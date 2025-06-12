'use client';
import { useState, useEffect } from 'react';
import { HiPlus, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import ActivityCard from './ActivityCard';
import ActivityModal from './ActivityModal';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from "framer-motion";

export default function ActivityList() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [expandedStates, setExpandedStates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);  // 每頁顯示 6 個活動
  const [sortBy, setSortBy] = useState('newest');  // 排序方式
  const [searchTerm, setSearchTerm] = useState(''); // 搜尋關鍵字

  useEffect(() => {
    // console.log('ActivityList 組件已掛載');
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    // console.log('開始獲取活動列表');
    try {
      setLoading(true);
      const response = await fetch('/api/owner/activities');
      // console.log('API 回應狀態:', response.status);
      
      if (!response.ok) {
        // console.error('API 回應不成功:', {
        //   status: response.status,
        //   statusText: response.statusText
        // });
        throw new Error('獲取活動失敗');
      }

      const data = await response.json();
      // 檢查 booking_overview 中的營位狀態
      // console.log('API 回傳的活動資料:', data.activities.map(activity => ({
      //   activity_id: activity.activity_id,
      //   activity_name: activity.activity_name,
      //   booking_overview: typeof activity.booking_overview === 'string' 
      //     ? JSON.parse(activity.booking_overview)
      //     : activity.booking_overview
      // })));

      setActivities(data.activities);
    } catch (error) {
      console.error('獲取活動列表失敗:', error);
      Swal.fire({
        title: '錯誤',
        text: '獲取活動列表失敗',
        icon: 'error'
      });
    } finally {
      setLoading(false);
      // console.log('活動列表載入狀態更新完成');
    }
  };

  const handleEdit = (activity) => {
    // console.log('編輯活動:', activity);
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const handleDelete = async (activityId) => {
    // console.log('準備刪除活動:', activityId);
    try {
      const result = await Swal.fire({
        title: '確定要刪除嗎？',
        text: '此操作無法復原',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '確定刪除',
        cancelButtonText: '取消'
      });

      if (result.isConfirmed) {
        // console.log('使用者確認刪除活動:', activityId);
        const response = await fetch(`/api/owner/activities/${activityId}`, {
          method: 'DELETE'
        });

        // console.log('刪除請求回應狀態:', response.status);

        if (!response.ok) {
          console.error('刪除請求失敗:', {
            status: response.status,
            statusText: response.statusText
          });
          throw new Error('刪除失敗');
        }

        await Swal.fire('成功', '活動已刪除', 'success');
        // console.log('活動刪除成功，重新獲取活動列表');
        fetchActivities();
      } else {
        console.log('使用者取消刪除操作');
      }
    } catch (error) {
      console.error('刪除活動失敗:', {
        message: error.message,
        stack: error.stack
      });
      Swal.fire('錯誤', '刪除失敗', 'error');
    }
  };

  const handleSpotToggle = (activityId) => {
    // console.log('切換活動展開狀態:', activityId);
    setExpandedStates(prevStates => {
      const newState = !prevStates[activityId];
      return {
        ...prevStates,
        [activityId]: newState
      };
    });
  };

  // 排序和過濾活動
  const getSortedAndFilteredActivities = () => {
    let filteredActivities = [...activities];
    
    // 搜尋過濾
    if (searchTerm) {
      filteredActivities = filteredActivities.filter(activity => 
        activity.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.camp_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 排序
    return filteredActivities.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'startDate':
          return new Date(b.start_date) - new Date(a.start_date);
        case 'name':
          return a.activity_name.localeCompare(b.activity_name);
        default:
          return 0;
      }
    });
  };

  // 取得當前頁面的活動
  const getCurrentPageActivities = () => {
    const sortedActivities = getSortedAndFilteredActivities();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedActivities.slice(startIndex, startIndex + itemsPerPage);
  };

  // 控制元件
  const Controls = () => (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="搜尋活動名稱或營地..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent"
        />
      </div>
      <div className="flex gap-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent bg-white"
        >
          <option value="newest">最新建立</option>
          <option value="startDate">活動日期</option>
          <option value="name">名稱排序</option>
        </select>
      </div>
    </div>
  );

  // 分頁控制
  const Pagination = () => {
    const totalActivities = getSortedAndFilteredActivities().length;
    const totalPages = Math.ceil(totalActivities / itemsPerPage);
    
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex gap-1">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg ${
                currentPage === i + 1
                  ? 'bg-[#6B8E7B] text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8E7B]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 pt-16 bg-[#F5F5F5]"
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="text-2xl font-bold text-[#2C4A3B]"
          >
            活動管理
          </motion.h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedActivity(null);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-[#6B8E7B] text-white rounded-lg
                     hover:bg-[#5F7A6A] transition-colors duration-200
                     shadow-sm hover:shadow-md"
          >
            <HiPlus className="w-5 h-5 mr-2" />
            新增活動
          </motion.button>
        </div>

        <Controls />

        <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {getCurrentPageActivities().map((activity) => (
              <ActivityCard
                key={activity.activity_id}
                activity={activity}
                onEdit={() => handleEdit(activity)}
                onDelete={() => handleDelete(activity.activity_id)}
                isExpanded={!!expandedStates[activity.activity_id]}
                onToggleSpot={(e) => {
                  e?.stopPropagation();
                  handleSpotToggle(activity.activity_id);
                }}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        <Pagination />

        <ActivityModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          activity={selectedActivity}
          onSuccess={fetchActivities}
        />
      </div>
    </motion.div>
  );
} 