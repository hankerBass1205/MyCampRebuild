'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CampCard from './CampCard';
import CampStatusBadge from './CampStatusBadge';
import Image from 'next/image';
import { HiOutlineSearch, HiViewGrid, HiViewList, HiOutlineClock } from 'react-icons/hi';

export default function CampList() {
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [statusFilter, setStatusFilter] = useState('all'); // 新增狀態篩選
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 每頁顯示數量

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/owner/camp-reviews');
        const { data } = await response.json();
        setApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = applications.filter(app => {
    // 先檢查搜尋條件
    const matchesSearch = 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 再檢查狀態篩選
    const matchesStatus = 
      statusFilter === 'all' || 
      app.status.toString() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 計算分頁
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 重置分頁
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B8E7B]" />
      </div>
    );
  }

  // 分頁按鈕組件
  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-lg ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          上一頁
        </button>
        
        <div className="flex gap-1">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-8 h-8 rounded-lg ${
                currentPage === index + 1
                  ? 'bg-[#6B8E7B] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-lg ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          下一頁
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 搜尋、篩選和視圖切換 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {/* 搜尋框 */}
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="搜尋營地名稱或地址..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent"
            />
            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          {/* 狀態篩選 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent text-gray-600"
          >
            <option value="all">全部狀態</option>
            <option value="0">審核中</option>
            <option value="1">已通過</option>
            <option value="2">已退回</option>
          </select>
        </div>

        {/* 視圖切換按鈕 */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-[#6B8E7B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <HiViewGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-[#6B8E7B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <HiViewList className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 營地列表 */}
      <AnimatePresence mode="wait">
        {filteredApplications.length > 0 ? (
          <>
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                  : "flex flex-col gap-4"
              }
            >
              {paginatedApplications.map((application) => (
                <motion.div
                  key={application.application_id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {viewMode === 'grid' ? (
                    <CampCard application={application} />
                  ) : (
                    <ListItem application={application} />
                  )}
                </motion.div>
              ))}
            </motion.div>
            <Pagination />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-lg shadow-sm"
          >
            <p className="text-gray-500">
              {searchTerm ? '找不到符合的營地' : '目前沒有申請記錄'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 列表項目組件
function ListItem({ application }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 處理圖片 URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/images/camps/default/default.jpg';
    
    // 如果已經是正確的路徑格式
    if (imageUrl.startsWith('/images/camps/') || imageUrl.startsWith('/uploads/')) {
      return imageUrl;
    }
    
    // 如果是完整的 URL
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // 預設返回預設圖片
    return '/images/camps/default/default.jpg';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-center gap-6">
        {/* 圖片 */}
        <div className="relative h-24 w-24 flex-shrink-0">
          <Image
            src={getImageUrl(application.image_url)}
            alt={application.name}
            fill
            className="object-cover rounded-lg"
            sizes="96px"
          />
        </div>

        {/* 內容 */}
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{application.name}</h3>
            <CampStatusBadge status={application.status} />
          </div>
          <p className="text-sm text-gray-500 mb-2">{application.address}</p>
          <div className="flex items-center text-sm text-gray-600">
            <HiOutlineClock className="w-4 h-4 mr-2 text-[#6B8E7B]" />
            <span>申請時間：{formatDate(application.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 