'use client';
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { HiX, HiPencil, HiInformationCircle, HiCalendar, HiDocumentText, HiPhotograph } from 'react-icons/hi';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";

export default function ActivityModal({ isOpen, onClose, activity, onSuccess }) {
  const initialFormData = {
    activity_name: '',
    title: '',
    subtitle: '',
    description: '',
    notice: '',
    start_date: '',
    end_date: '',
    main_image: '',
    is_active: true,
    city: '',
    is_featured: false,
    application_id: '',
    camp_id: '',
    booking_overview: '[]',
    min_price: 0,
    max_price: 0,
    options: []
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spots, setSpots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(activity?.image_url || '');

  // 判斷是否為編輯模式
  const isEditing = !!activity;

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/owner/spots');
        if (!response.ok) throw new Error('獲取營地失敗');
        const data = await response.json();
        
        console.log('獲取到的營地列表:', data.spots);
        setSpots(data.spots || []);
        
        if (activity) {
          console.log('當前活動:', activity);
          const selectedSpot = data.spots.find(spot => 
            spot.id === activity.camp_id || 
            spot.name === activity.camp_name
          );
          console.log('選中的營地:', selectedSpot);
          
          if (selectedSpot) {
            setFormData(prev => ({
              ...prev,
              camp_id: selectedSpot.id,
              application_id: selectedSpot.id
            }));
          }
        }
      } catch (error) {
        console.error('獲取營地列表失敗:', error);
        Swal.fire({
          icon: 'error',
          title: '錯誤',
          text: '無法載入營地列表'
        });
        setSpots([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchSpots();
    }
  }, [isOpen, activity]);

  useEffect(() => {
    if (activity) {
      // console.log('設置活動資料:', activity);
      setFormData(prev => ({
        ...initialFormData,
        ...activity,
        activity_name: activity.activity_name || '',
        title: activity.title || '',
        subtitle: activity.subtitle || '',
        start_date: activity.start_date?.split('T')[0] || '',
        end_date: activity.end_date?.split('T')[0] || '',
        camp_id: activity.camp_id || '',
        application_id: activity.application_id || '',
        city: activity.city || '',
        description: activity.description || '',
        notice: activity.notice || '',
        main_image: activity.main_image || '',
        is_active: activity.is_active ?? true,
        operation_status: activity.operation_status ?? 1,
        is_featured: activity.is_featured === 1,
        booking_overview: activity.booking_overview || '[]',
        min_price: activity.min_price || 0,
        max_price: activity.max_price || 0,
        options: activity.options || []
      }));
    } else {
      setFormData(initialFormData);
    }
  }, [activity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const activityData = {
        activity_name: formData.activity_name,
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        notice: formData.notice,
        start_date: formData.start_date,
        end_date: formData.end_date,
        main_image: formData.main_image,
        is_active: formData.is_active ? 1 : 0,
        application_id: formData.application_id,
        city: formData.city,
        is_featured: formData.is_featured ? 1 : 0,
        booking_overview: formData.booking_overview,
        min_price: formData.min_price,
        max_price: formData.max_price,
        options: formData.options
      };

      const response = await fetch(
        activity 
          ? `/api/owner/activities/${activity.activity_id}` 
          : '/api/owner/activities',
        {
          method: activity ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '操作失敗');
      }

      await Swal.fire({
        icon: 'success',
        title: '成功',
        text: activity ? '活動已更新' : '活動已新增'
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('提交失敗:', error);
      Swal.fire({
        icon: 'error',
        title: '錯誤',
        text: error.message || '操作失敗，請檢查所有欄位是否正確'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // 檢查檔案類型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: '錯誤',
          text: '只允許上傳 JPG、PNG、WebP 或 GIF 圖片',
        });
        return;
      }

      // 立即顯示本地預覽
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewImage(localPreviewUrl);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/owner/activities/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上傳失敗');
      }

      const data = await response.json();
      
      // 更新表單資料
      setFormData(prev => ({
        ...prev,
        main_image: data.filename,
        image_url: `/uploads/activities/${data.filename}`  // 使用完整路徑
      }));

    } catch (error) {
      console.error('圖片上傳失敗:', error);
      // 如果上傳失敗，清除預覽
      setPreviewImage('');
      Swal.fire({
        icon: 'error',
        title: '錯誤',
        text: '圖片上傳失敗，請稍後再試',
      });
    }
  };

  // 修改營地選擇的處理
  const handleSpotChange = (e) => {
    const selectedSpot = spots.find(spot => spot.id === e.target.value);
    if (selectedSpot) {
      setFormData(prev => ({
        ...prev,
        camp_id: selectedSpot.id,
        application_id: selectedSpot.id
      }));
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-[#E3D5CA] bg-[#F8F5F3] rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#2C4A3B] flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#6B8E7B] rounded-lg flex items-center justify-center">
                    <HiPencil className="w-5 h-5 text-white" />
                  </span>
                  {activity ? '編輯活動' : '新增活動'}
                </h2>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-[#E3D5CA] rounded-lg transition-colors"
                >
                  <HiX className="w-5 h-5 text-[#7D6D61]" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              {/* Content */}
              <div className="flex-1 overflow-auto px-6 py-4">
                <div className="flex gap-6">
                  {/* 左側欄位 */}
                  <div className="flex-1 space-y-6">
                    <div className="bg-[#F8F5F3] p-5 rounded-xl space-y-4">
                      <h3 className="text-lg font-medium text-[#2C4A3B] flex items-center gap-2">
                        <HiInformationCircle className="w-5 h-5 text-[#6B8E7B]" />
                        基本資訊
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#2C4A3B] mb-1.5">
                            活動名稱 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.activity_name}
                            onChange={(e) => setFormData(prev => ({...prev, activity_name: e.target.value}))}
                            className="w-full px-4 py-2.5 border border-[#E3D5CA] rounded-lg 
                                     focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/50 focus:border-[#6B8E7B]
                                     placeholder-gray-400 transition-colors"
                            placeholder="請輸入活動名稱"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2C4A3B] mb-1.5">
                            標題
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                            className="w-full px-4 py-2.5 border border-[#E3D5CA] rounded-lg 
                                     focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/50 focus:border-[#6B8E7B]
                                     placeholder-gray-400 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2C4A3B] mb-1.5">
                            副標題
                          </label>
                          <input
                            type="text"
                            value={formData.subtitle}
                            onChange={(e) => setFormData(prev => ({...prev, subtitle: e.target.value}))}
                            className="w-full px-4 py-2.5 border border-[#E3D5CA] rounded-lg 
                                     focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/50 focus:border-[#6B8E7B]
                                     placeholder-gray-400 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2C4A3B] mb-1.5">
                            選擇營地 <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.application_id || ''}
                            onChange={(e) => {
                              console.log('選擇的營地 ID:', e.target.value);
                              setFormData(prev => ({
                                ...prev,
                                application_id: e.target.value,
                                camp_name: spots.find(spot => spot.id.toString() === e.target.value)?.name || ''
                              }));
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          >
                            <option value="">請選擇營地</option>
                            {spots.map(spot => (
                              <option 
                                key={spot.id} 
                                value={spot.id.toString()}
                              >
                                {spot.name} - {spot.address}
                              </option>
                            ))}
                          </select>
                          {isLoading && (
                            <div className="mt-2 text-sm text-gray-500">
                              載入營地列表中...
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={formData.is_featured}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                is_featured: e.target.checked
                              }))}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                                          peer-focus:ring-[#6B8E7B]/50 rounded-full peer 
                                          peer-checked:after:translate-x-full peer-checked:after:border-white 
                                          after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                          after:bg-white after:border-gray-300 after:border after:rounded-full 
                                          after:h-5 after:w-5 after:transition-all 
                                          peer-checked:bg-[#6B8E7B]">
                            </div>
                            <span className="ml-3 text-sm font-medium text-[#2C4A3B]">設為精選活動</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#F8F5F3] p-5 rounded-xl space-y-4">
                      <h3 className="text-lg font-medium text-[#2C4A3B] flex items-center gap-2">
                        <HiCalendar className="w-5 h-5 text-[#6B8E7B]" />
                        時間與地點
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#2C4A3B] mb-1.5">
                            開始日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData(prev => ({...prev, start_date: e.target.value}))}
                            className="w-full px-4 py-2.5 border border-[#E3D5CA] rounded-lg 
                                     focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/50 focus:border-[#6B8E7B]
                                     placeholder-gray-400 transition-colors"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2C4A3B] mb-1.5">
                            結束日期 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData(prev => ({...prev, end_date: e.target.value}))}
                            className="w-full px-4 py-2.5 border border-[#E3D5CA] rounded-lg 
                                     focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/50 focus:border-[#6B8E7B]
                                     placeholder-gray-400 transition-colors"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2C4A3B] mb-1.5">
                          縣市
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                          className="w-full px-4 py-2.5 border border-[#E3D5CA] rounded-lg 
                                   focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/50 focus:border-[#6B8E7B]
                                   placeholder-gray-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 右側欄位 */}
                  <div className="flex-1 space-y-6">
                    <div className="bg-[#F8F5F3] p-5 rounded-xl space-y-4">
                      <h3 className="text-lg font-medium text-[#2C4A3B] flex items-center gap-2">
                        <HiDocumentText className="w-5 h-5 text-[#6B8E7B]" />
                        活動內容
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-[#2C4A3B] mb-1.5">
                          活動說明
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-[#E3D5CA] rounded-lg 
                                   focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/50 focus:border-[#6B8E7B]
                                   placeholder-gray-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2C4A3B] mb-1.5">
                          注意事項
                        </label>
                        <textarea
                          value={formData.notice}
                          onChange={(e) => setFormData(prev => ({...prev, notice: e.target.value}))}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-[#E3D5CA] rounded-lg 
                                   focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/50 focus:border-[#6B8E7B]
                                   placeholder-gray-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="bg-[#F8F5F3] p-5 rounded-xl space-y-4">
                      <h3 className="text-lg font-medium text-[#2C4A3B] flex items-center gap-2">
                        <HiPhotograph className="w-5 h-5 text-[#6B8E7B]" />
                        活動圖片
                      </h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          活動圖片
                        </label>
                        <div className="space-y-2">
                          {/* 預覽區域 */}
                          {previewImage && (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden">
                              <Image
                                src={previewImage}
                                alt="活動圖片預覽"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          {/* 上傳按鈕 */}
                          <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                            <div className="space-y-1 text-center">
                              <div className="flex text-sm text-gray-600">
                                <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#6B8E7B] hover:text-[#5F7A6A] focus-within:outline-none">
                                  <span>上傳圖片</span>
                                  <input
                                    id="image-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleImageUpload}
                                  />
                                </label>
                              </div>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, WebP, GIF up to 5MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 px-6 py-4 bg-[#F8F5F3] border-t border-[#E3D5CA] rounded-b-2xl">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-[#7D6D61] bg-[#E3D5CA] rounded-lg 
                             hover:bg-[#9C9187] hover:text-white transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-white bg-[#6B8E7B] rounded-lg 
                             hover:bg-[#2C4A3B] transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        處理中...
                      </>
                    ) : (
                      activity ? '更新活動' : '新增活動'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 