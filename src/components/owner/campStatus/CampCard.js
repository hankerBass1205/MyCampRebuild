'use client';
import { motion } from 'framer-motion';
import CampStatusBadge from './CampStatusBadge';
import { HiOutlineClock, HiOutlineLocationMarker, HiOutlineHome, HiOutlineInformationCircle } from 'react-icons/hi';
import Image from 'next/image';

export default function CampCard({ application }) {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      {/* 營地圖片 */}
      <div className="relative h-48 w-full bg-gray-100">
        <Image
          src={getImageUrl(application.image_url)}
          alt={application.name || '營地圖片'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          onError={(e) => {
            e.currentTarget.src = '/images/camps/default/default.jpg';
          }}
        />
      </div>

      <div className="p-6">
        {/* 營地名稱和申請狀態 */}
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-800">{application.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{application.address}</p>
          </div>
          <CampStatusBadge status={application.status} />
        </div>

        {/* 申請資訊 */}
        <div className="space-y-4">
          <div className="flex items-center text-sm text-gray-600">
            <HiOutlineClock className="w-4 h-4 mr-2 text-[#6B8E7B]" />
            <span>申請時間：{formatDate(application.created_at)}</span>
          </div>

          {application.status_reason && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2 text-sm text-gray-700">
                <HiOutlineInformationCircle className="w-4 h-4 mr-2 text-[#6B8E7B]" />
                <span className="font-medium">狀態說明</span>
              </div>
              <p className="text-sm text-gray-600">{application.status_reason}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 