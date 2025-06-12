'use client';
import { Fragment, useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { FaHeart, FaRegHeart, FaCampground } from 'react-icons/fa';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export function FavoritesSidebar({ isOpen, setIsOpen }) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchFavorites = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
      const favResponse = await fetch('/api/camping/favorites');
      const favData = await favResponse.json();

      if (!favData.favorites?.length) {
        setFavorites([]);
        setLoading(false);
        setInitialized(true);
        return;
      }

      const activitiesResponse = await fetch('/api/camping/activities/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityIds: favData.favorites
        })
      });
      const activitiesData = await activitiesResponse.json();
      setFavorites(activitiesData.activities || []);
    } catch (error) {
      console.error('獲取收藏失敗:', error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFavorites();
    }
  }, [isOpen, session]);

  const handleRemoveFavorite = async (activityId) => {
    try {
      const response = await fetch('/api/camping/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId })
      });

      if (!response.ok) throw new Error('移除收藏失敗');

      setFavorites(prev => prev.filter(fav => fav.activity_id !== activityId));
      window.dispatchEvent(new CustomEvent('favoritesUpdate', { 
        detail: { type: 'remove' } 
      }));
    } catch (error) {
      console.error('移除收藏失敗:', error);
    }
  };

  return (
    <>
      {/* 收藏清單遮罩層 */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[2001] transition-opacity duration-300
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* 收藏清單側邊欄 */}
      <div
        className={`fixed right-0 top-0 h-full w-[375px] bg-white shadow-xl z-[2003] 
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* 標題區域 */}
        <motion.div 
          className="p-2.5 border-b bg-gradient-to-r from-[#6B8E7B]/10 to-transparent"
          initial={false}
          animate={isOpen ? { 
            y: [20, 0],
            opacity: [0, 1]
          } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ 
                  rotate: isOpen ? [0, -10, 10, 0] : 0
                }}
                transition={{ duration: 0.5 }}
              >
                <FaHeart className="w-5 h-5 text-[#6B8E7B]" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-[#2C3E3A] m-0">收藏清單</h2>
                {favorites.length > 0 && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-[#6B8E7B] m-0"
                  >
                    {favorites.length} 個收藏活動
                  </motion.p>
                )}
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(false)} 
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 
                transition-colors duration-200"
            >
              <XMarkIcon className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* 內容區域 */}
        <div className="h-full overflow-y-auto pb-32 
          scrollbar-thin scrollbar-thumb-[#6B8E7B]/20 
          scrollbar-track-gray-50">
          {(!initialized || loading) ? (
            <div className="flex justify-center items-center h-32">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-6 h-6 border-2 border-[#6B8E7B]/20 border-t-[#6B8E7B] rounded-full"
              />
            </div>
          ) : favorites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-[70vh] p-6"
            >
              <FaCampground className="w-16 h-16 text-[#6B8E7B] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                尚未收藏任何活動
              </h3>
              <p className="text-gray-500 mb-6">
                快去探索精彩的露營活動吧！
              </p>
              
              <Link href="/camping/activities">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#6B8E7B] text-white px-8 py-2.5 rounded-xl
                           hover:bg-[#5F7A68] transition-colors duration-300
                           flex items-center justify-center mx-auto gap-2
                           shadow-md hover:shadow-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <FaCampground className="w-5 h-5" />
                  <span>探索露營活動</span>
                </motion.button>
              </Link>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 p-4 bg-gray-50 rounded-lg"
              >
                <p className="text-sm text-gray-600 mb-0">
                  💡 提示：收藏活動後可以在這裡快速查看
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <div className="space-y-4 p-4">
              {favorites.map((activity) => (
                <motion.div
                  key={activity.activity_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="p-4">
                    {/* 標題和收藏按鈕 */}
                    <div className="flex justify-between items-start mb-3">
                      <Link
                        href={`/camping/activities/${activity.activity_id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex-1"
                      >
                        <h3 className="font-semibold text-base line-clamp-1 mr-2">
                          {activity.title}
                        </h3>
                      </Link>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(activity.activity_id);
                        }}
                        className="text-red-500 hover:text-red-600 transition-colors flex-shrink-0"
                      >
                        <FaHeart className="h-5 w-5" />
                      </motion.button>
                    </div>

                    {/* 圖片和資訊區 */}
                    <Link
                      href={`/camping/activities/${activity.activity_id}`}
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                          <Image
                            src={`/uploads/activities/${activity.main_image}`}
                            alt={activity.title}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/default-activity.jpg';
                            }}
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          {/* 日期 */}
                          <p className="text-sm text-gray-500">
                            {format(new Date(activity.start_date), 'yyyy/MM/dd', { locale: zhTW })}
                            {' - '}
                            {format(new Date(activity.end_date), 'yyyy/MM/dd', { locale: zhTW })}
                          </p>

                          {/* 價格 */}
                          <p className="text-[#6B8E7B] font-semibold mt-2">
                            NT$ {activity.min_price?.toLocaleString()}
                            {activity.min_price !== activity.max_price && 
                              ` ~ ${activity.max_price?.toLocaleString()}`
                            }
                          </p>

                          {/* 查看詳情 */}
                          <div className="flex justify-end mt-2">
                            <span className="text-[#6B8E7B] text-sm hover:text-[#5F7A68] flex items-center">
                              查看詳情 
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        {favorites.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
            <Link
              href="/member/wishlist"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center rounded-lg 
                       bg-[#6B8E7B] px-6 py-2.5 text-base font-medium text-white 
                       shadow-md hover:bg-[#5F7A68] transition-colors duration-300"
            >
              查看所有收藏
            </Link>
          </div>
        )}
      </div>
    </>
  );
} 