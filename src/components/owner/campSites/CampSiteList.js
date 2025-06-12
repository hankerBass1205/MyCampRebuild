'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CampSiteCard from './CampSiteCard';
import { HiChevronDown, HiChevronUp, HiOutlineSearch } from 'react-icons/hi';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

export default function CampSiteList() {
  const [isLoading, setIsLoading] = useState(true);
  const [camps, setCamps] = useState([]);
  const [expandedCamps, setExpandedCamps] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchCampSpots = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/owner/camp-spots');
      const data = await response.json();
      if (data.success) {
        // console.log('營位資料:', data.camps);
        setCamps(data.camps || []);
        const expanded = {};
        data.camps.forEach(camp => {
          expanded[camp.application_id] = true;
        });
        setExpandedCamps(expanded);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('獲取營位列表失敗:', error);
      Swal.fire({
        icon: 'error',
        title: '錯誤',
        text: '獲取營位列表失敗'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampSpots();
  }, []);

  const toggleCamp = (campId) => {
    setExpandedCamps(prev => ({
      ...prev,
      [campId]: !prev[campId]
    }));
  };

  const handleStatusChange = async (spotId, newStatus) => {
    try {
      const response = await fetch(`/api/owner/camp-spots/${spotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchCampSpots();
        Swal.fire({
          icon: 'success',
          title: '成功',
          text: '營位狀態已更新',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('更新營位狀態失敗:', error);
      Swal.fire({
        icon: 'error',
        title: '錯誤',
        text: '更新營位狀態失敗'
      });
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/images/camps/default/default.jpg';
    if (imageUrl.startsWith('/')) return imageUrl;
    if (imageUrl.startsWith('http')) return imageUrl;
    return '/images/camps/default/default.jpg';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const handleAddSpot = async (campId) => {
    const { value: formValues } = await Swal.fire({
      title: '新增營位',
      width: 600,
      padding: '2em',
      background: '#f8f9fa',
      html: `
        <div class="space-y-6 px-4">
          <div class="relative">
            <label class="block text-sm font-medium text-[#2C3E2D] text-left mb-2">
              營位名稱 * <span class="text-xs text-gray-500">(例如：A區小木屋、B區露營地)</span>
            </label>
            <input 
              id="name" 
              class="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#6B8E7B] focus:border-[#6B8E7B]"
              placeholder="請輸入營位名稱"
            >
          </div>
          
          <div class="relative">
            <label class="block text-sm font-medium text-[#2C3E2D] text-left mb-2">
              容納人數 * <span class="text-xs text-gray-500">(每個營位可容納的人數)</span>
            </label>
            <input 
              id="capacity" 
              type="number" 
              min="1"
              class="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#6B8E7B] focus:border-[#6B8E7B]"
              placeholder="請輸入營位可容納人數，例如：4"
            >
          </div>

          <div class="relative">
            <label class="block text-sm font-medium text-[#2C3E2D] text-left mb-2">
              可預訂數量 * <span class="text-xs text-gray-500">(此營位可開放預訂的帳數)</span>
            </label>
            <input 
              id="maxQuantity" 
              type="number" 
              min="1"
              class="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#6B8E7B] focus:border-[#6B8E7B]"
              placeholder="請輸入可預訂帳數，例如：2"
            >
          </div>

          <div class="relative">
            <label class="block text-sm font-medium text-[#2C3E2D] text-left mb-2">
              價格 * <span class="text-xs text-gray-500">(每晚/每帳價格)</span>
            </label>
            <input 
              id="price" 
              type="number"
              min="0" 
              class="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#6B8E7B] focus:border-[#6B8E7B]"
              placeholder="請輸入價格，例如：2000"
            >
          </div>

          <div class="relative">
            <label class="block text-sm font-medium text-[#2C3E2D] text-left mb-2">
              描述 <span class="text-xs text-gray-500">(選填，營位的詳細資訊)</span>
            </label>
            <textarea 
              id="description" 
              class="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#6B8E7B] focus:border-[#6B8E7B]"
              placeholder="請輸入營位描述，例如：附有獨立衛浴、提供電源..."
              rows="3"
            ></textarea>
          </div>

          <div class="text-xs text-gray-500 text-left">* 為必填欄位</div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '確認新增',
      cancelButtonText: '取消',
      confirmButtonColor: '#6B8E7B',
      cancelButtonColor: '#d33',
      preConfirm: (formValues) => {
        // 驗證並轉換資料格式
        return {
          application_id: campId,
          name: document.getElementById('name').value,
          capacity: parseInt(document.getElementById('capacity').value) || 0,
          price: parseInt(document.getElementById('price').value) || 0, // 確保是數字
          maxQuantity: parseInt(document.getElementById('maxQuantity').value) || 0, // 確保是數字
          description: document.getElementById('description').value
        };
      }
    });

    if (formValues) {
      try {
        const response = await fetch('/api/owner/camp-spots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formValues,
            price: Number(formValues.price), // 確保轉換為數字
            maxQuantity: Number(formValues.maxQuantity) // 確保轉換為數字
          })
        });

        const data = await response.json();
        if (data.success) {
          await fetchCampSpots();
          Swal.fire({
            icon: 'success',
            title: '新增成功',
            text: '營位已新增',
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error('新增營位失敗:', error);
        Swal.fire({
          icon: 'error',
          title: '新增失敗',
          text: error.message || '新增營位失敗'
        });
      }
    }
  };

  const handleDelete = async (spotId, spotName) => {
    try {
      const response = await fetch(`/api/owner/camp-spots/${spotId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        await fetchCampSpots();
        Swal.fire({
          icon: 'success',
          title: '刪除成功',
          text: `營位「${spotName}」已刪除`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('刪除營位失敗:', error);
      Swal.fire({
        icon: 'error',
        title: '刪除失敗',
        text: error.message || '刪除營位失敗，可能是因為已有訂單存在'
      });
    }
  };

  const handleEdit = () => {
    fetchCampSpots();
  };

  // 篩選營地
  const filteredCamps = camps.filter(camp => {
    const matchesSearch = 
      camp.camp_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      camp.status.toString() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 計算分頁
  const totalPages = Math.ceil(filteredCamps.length / itemsPerPage);
  const paginatedCamps = filteredCamps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 重置分頁
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded-lg ${
              currentPage === i + 1
                ? 'bg-[#6B8E7B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {i + 1}
          </button>
        ))}
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B8E7B]" />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 搜尋和篩選區域 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {/* 搜尋框 */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="搜尋營地..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[#6B8E7B]"
            />
            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>

          {/* 狀態篩選 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:border-[#6B8E7B]"
          >
            <option value="all">所有狀態</option>
            <option value="0">審核中</option>
            <option value="1">已通過</option>
            <option value="2">已退回</option>
          </select>
        </div>
      </div>

      {/* 營地列表 */}
      <AnimatePresence>
        {filteredCamps.length > 0 ? (
          <>
            <motion.div className="space-y-4" variants={containerVariants}>
              {paginatedCamps.map((camp) => (
                <motion.div
                  key={camp.application_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-lg shadow-md overflow-hidden mb-4 ${
                    camp.status !== 1 ? 'opacity-60' : ''
                  }`}
                >
                  <motion.div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#E8EDE8] transition-colors"
                    onClick={() => toggleCamp(camp.application_id)}
                    whileHover={{ backgroundColor: '#E8EDE8' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                        <Image
                          src={getImageUrl(camp.camp_image)}
                          alt={camp.camp_name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-medium text-[#2C3E2D]">
                            {camp.camp_name}
                          </h2>
                          <span className={`text-xs px-2 py-1 rounded ${
                            camp.status === 0 ? 'bg-yellow-100 text-yellow-800' :
                            camp.status === 1 ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {camp.status === 0 ? '審核中' :
                             camp.status === 1 ? '已通過' :
                             '已退回'}
                          </span>
                        </div>
                        <span className="text-sm text-[#6B8E7B]">
                          ({camp.spots.length} 個營位)
                        </span>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="text-[#6B8E7B]"
                    >
                      {expandedCamps[camp.application_id] ? 
                        <HiChevronUp className="w-6 h-6" /> : 
                        <HiChevronDown className="w-6 h-6" />
                      }
                    </motion.div>
                  </motion.div>

                  <AnimatePresence>
                    {expandedCamps[camp.application_id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-white">
                          {camp.status === 1 && (
                            <div className="flex justify-end mb-4">
                              {camp.spots.length < 4 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddSpot(camp.application_id);
                                  }}
                                  className="px-4 py-2 text-sm text-white bg-[#6B8E7B] rounded-lg hover:bg-[#5a7a68] transition-colors"
                                >
                                  新增營位
                                </button>
                              )}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {camp.spots.map((spot) => (
                              <CampSiteCard
                                key={spot.unique_key}
                                campSite={spot}
                                onStatusChange={handleStatusChange}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isApplicationApproved={camp.status === 1}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              {searchTerm ? '找不到符合的營地' : '目前沒有營地記錄'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 