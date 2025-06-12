'use client';
import { useState } from 'react';
import { HiOutlineUpload, HiX, HiCheckCircle, HiMinusCircle, HiTrash, HiExclamationCircle } from 'react-icons/hi';
import { 
  HiOutlineLocationMarker, 
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineCash
} from 'react-icons/hi';
import Image from 'next/image';
import Swal from 'sweetalert2';
import imageCompression from 'browser-image-compression';

export default function CampApplyForm() {
  // 當前步驟
  const [currentStep, setCurrentStep] = useState(1);
  
  // 表單資料狀態
  const [formData, setFormData] = useState({
    // 步驟一：基本資料
    name: '',                    // 營地名稱
    owner_name: '',             // 營主名稱
    address: '',                // 營地地址
    description: '',            // 營地描述
    image_url: '',             // 營地主圖
    
    // 步驟二：規則與須知
    rules: '',                  // 營地規則
    notice: '',                // 注意事項
    operation_status: 1,        // 營運狀態
    
    // 步驟三：營位資料
    spots: [{
      name: '',                // 營位名稱
      capacity: '',            // 容納人數
      price: '',               // 價格
      description: '',         // 營位描述
      images: [],              // 營位圖片
      status: 1                // 營位狀態
    }]
  });

  const [errors, setErrors] = useState({});  // 添加錯誤狀態

  // 添加預覽圖片的狀態
  const [previewImage, setPreviewImage] = useState('');
  const [previewSpotImages, setPreviewSpotImages] = useState({});

  // 步驟設定
  const steps = [
    {
      title: '基本資料',
      icon: HiOutlineLocationMarker,
      fields: ['name', 'owner_name', 'address', 'description', 'image_url']
    },
    {
      title: '規則與須知',
      icon: HiOutlineDocumentText,
      fields: ['rules', 'notice', 'operation_status']
    },
    {
      title: '營位設定',
      icon: HiOutlineCash,
      fields: ['spots']
    }
  ];

  // 營運狀態選項
  const operationStatusOptions = [
    { value: 1, label: '營業中' },
    { value: 2, label: '維護中' },
    { value: 3, label: '暫停營業' }
  ];

  // 渲染步驟指示器
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`
              flex items-center justify-center w-10 h-10 rounded-full
              ${currentStep > index + 1 
                ? 'bg-green-500 text-white' 
                : currentStep === index + 1
                  ? 'bg-[#6B8E7B] text-white'
                  : 'bg-gray-200 text-gray-500'}
            `}
          >
            <step.icon className="w-5 h-5" />
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-20 h-1 mx-2 
                ${currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'}`
            }
            />
          )}
        </div>
      ))}
    </div>
  );

  // 渲染當前步驟內容
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營地名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請輸入營地名稱"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營主名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請輸入營主名稱"
              />
              {errors.owner_name && <p className="mt-1 text-sm text-red-500">{errors.owner_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營地地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請輸入營地地址"
              />
              {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營地描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請描述您的營地特色"
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>

            {renderImageUpload()}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                營地規則 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請輸入營地使用規則"
              />
              {errors.rules && <p className="mt-1 text-sm text-red-500">{errors.rules}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                注意事項 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="notice"
                value={formData.notice}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                placeholder="請輸入營地注意事項"
              />
              {errors.notice && <p className="mt-1 text-sm text-red-500">{errors.notice}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700">
                營運狀態
              </label>
              <select
                value={formData.status || ''}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]"
              >
                <option value="">請選擇營運狀態</option>
                <option value="operating">營業中</option>
                <option value="closed">休息中</option>
                <option value="preparing">籌備中</option>
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            {formData.spots.map((spot, index) => (
              <div key={index} className="mb-8 p-6 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">營位 {index + 1}</h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSpot(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      刪除營位
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      營位名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={spot.name}
                      onChange={(e) => handleSpotChange(index, 'name', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                      placeholder="請輸入營位名稱"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      容納人數 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={spot.capacity}
                      onChange={(e) => handleSpotChange(index, 'capacity', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                      placeholder="請輸入容納人數"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      價格 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={spot.price}
                      onChange={(e) => handleSpotChange(index, 'price', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                      placeholder="請輸入價格"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      營位描述
                    </label>
                    <textarea
                      value={spot.description}
                      onChange={(e) => handleSpotChange(index, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                      placeholder="請描述營位特色"
                    />
                  </div>

                  {renderSpotImageUpload(index)}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddSpot}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg
                       text-gray-500 hover:border-[#6B8E7B] hover:text-[#6B8E7B]"
            >
              + 新增營位
            </button>
          </div>
        );
    }
  };

  // 處理步驟切換
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 驗證當前步驟
  const validateCurrentStep = () => {
    const currentFields = steps[currentStep - 1].fields;
    const newErrors = {};
    
    currentFields.forEach(field => {
      if (field === 'spots') {
        // 驗證營位資料...
      } else if (!formData[field]) {
        newErrors[field] = `請填寫${field}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單欄位變更
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除對應的錯誤訊息
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 處理營位資料變更
  const handleSpotChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      spots: prev.spots.map((spot, i) => 
        i === index ? { ...spot, [field]: value } : spot
      )
    }));
  };

  // 新增營位
  const handleAddSpot = () => {
    setFormData(prev => ({
      ...prev,
      spots: [...prev.spots, {
        name: '',
        capacity: '',
        price: '',
        description: '',
        images: [],
        status: 1
      }]
    }));
  };

  // 處理表單提交
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      const formDataToSend = new FormData();
      
      // 添加基本資料
      formDataToSend.append('name', formData.name);
      formDataToSend.append('owner_name', formData.owner_name);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('rules', formData.rules);
      formDataToSend.append('notice', formData.notice);
      formDataToSend.append('operation_status', formData.operation_status);

      // 處理主圖 - 修改這裡：確保檔案被正確添加
      if (formData.image_url instanceof File) {
        formDataToSend.append('mainImage', formData.image_url);
      }

      // 處理營位資料
      formDataToSend.append('spots', JSON.stringify(formData.spots.map(spot => ({
        name: spot.name,
        capacity: spot.capacity,
        price: spot.price,
        description: spot.description,
        status: spot.status
      }))));

      // 處理營位圖片 - 修改這裡
      formData.spots.forEach((spot, spotIndex) => {
        if (spot.images && spot.images.length > 0) {
          spot.images.forEach((image, imageIndex) => {
            if (image instanceof File) {
              formDataToSend.append(
                `spotImages-${spotIndex}`,  // 修改 key 名稱
                image
              );
            }
          });
        }
      });

      // 發送請求
      const response = await fetch('/api/owner/camps/apply', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('提交失敗');
      }

      await Swal.fire({
        icon: 'success',
        title: '提交成功',
        text: '您的營地申請已送出，請等待審核',
        confirmButtonColor: '#6B8E7B',
      });

    } catch (error) {
      console.error('提交失敗:', error);
      Swal.fire({
        icon: 'error',
        title: '錯誤',
        text: '提交失敗，請稍後再試',
        confirmButtonColor: '#6B8E7B',
      });
    }
  };

  // 圖片處理共用函數
  const processImage = async (file) => {
    try {
      // 圖片壓縮選項
      const options = {
        maxSizeMB: 1,              // 最大文件大小
        maxWidthOrHeight: 1920,    // 最大寬度或高度
        useWebWorker: true,        // 使用 Web Worker
        fileType: 'image/webp',    // 轉換為 WebP 格式
      };

      // 檢查是否為圖片
      if (!file.type.startsWith('image/')) {
        throw new Error('請上傳圖片檔案');
      }

      // 壓縮圖片
      const compressedFile = await imageCompression(file, options);
      
      // 創建新的 File 對象，確保檔名為 .webp
      const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
      return new File([compressedFile], newFileName, {
        type: 'image/webp'
      });

    } catch (error) {
      console.error('圖片處理失敗:', error);
      throw error;
    }
  };

  // 營地主圖上傳處理
  const handleImageUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // 處理圖片
      const processedImage = await processImage(file);
      
      // 顯示預覽
      const previewUrl = URL.createObjectURL(processedImage);
      setPreviewImage(previewUrl);
      
      // 更新表單數據 - 儲存檔案物件而不是路徑
      setFormData(prev => ({
        ...prev,
        image_url: processedImage  // 修改這裡：儲存檔案物件
      }));

    } catch (error) {
      console.error('圖片上傳失敗:', error);
      Swal.fire({
        icon: 'error',
        title: '錯誤',
        text: error.message || '圖片上傳失敗，請稍後再試',
        confirmButtonColor: '#6B8E7B',
      });
    }
  };

  // 營位圖片上傳處理
  const handleSpotImageUpload = async (event, spotIndex) => {
    try {
      const files = Array.from(event.target.files);
      
      // 處理每個圖片
      const processedFiles = await Promise.all(
        files.map(processImage)
      );

      // 更新預覽
      const previewUrls = processedFiles.map(file => URL.createObjectURL(file));
      setPreviewSpotImages(prev => ({
        ...prev,
        [spotIndex]: [...(prev[spotIndex] || []), ...previewUrls]
      }));

      // 更新表單數據
      setFormData(prev => {
        const newSpots = [...prev.spots];
        newSpots[spotIndex] = {
          ...newSpots[spotIndex],
          images: [...(newSpots[spotIndex].images || []), ...processedFiles]
        };
        return { ...prev, spots: newSpots };
      });

    } catch (error) {
      console.error('營位圖片上傳失敗:', error);
      Swal.fire({
        icon: 'error',
        title: '錯誤',
        text: error.message || '圖片上傳失敗，請稍後再試',
        confirmButtonColor: '#6B8E7B',
      });
    }
  };

  // 移除營位圖片
  const handleRemoveSpotImage = (spotIndex, imageIndex) => {
    // 更新表單資料
    setFormData(prev => ({
      ...prev,
      spots: prev.spots.map((spot, i) => 
        i === spotIndex 
          ? {
              ...spot,
              images: spot.images.filter((_, imgI) => imgI !== imageIndex)
            }
          : spot
      )
    }));

    // 更新預覽圖片
    setPreviewSpotImages(prev => ({
      ...prev,
      [spotIndex]: (prev[spotIndex] || []).filter((_, i) => i !== imageIndex)
    }));
  };

  // 在渲染圖片上傳區域時顯示預覽圖片
  const renderImageUpload = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        營地主圖 <span className="text-red-500">*</span>
      </label>
      <div 
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#6B8E7B] cursor-pointer"
        onClick={() => document.getElementById('campMainImage').click()}
      >
        {previewImage ? (
          <div className="relative">
            <img
              src={previewImage}
              alt="預覽圖片"
              className="max-h-48 rounded-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // 防止觸發父元素的點擊事件
                setPreviewImage('');
                setFormData(prev => ({ ...prev, image_url: '' }));
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <HiX className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1 text-center">
            <HiOutlinePhotograph className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <span className="relative rounded-md font-medium text-[#6B8E7B] hover:text-[#5F7A68]">
                上傳圖片
                <input
                  id="campMainImage"
                  type="file"
                  name="image"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </span>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF 最大 10MB</p>
          </div>
        )}
      </div>
      {errors.image_url && <p className="mt-1 text-sm text-red-500">{errors.image_url}</p>}
    </div>
  );

  // 營位圖片上傳區塊
  const renderSpotImageUpload = (index) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        營位圖片 <span className="text-red-500">*</span>
      </label>
      <div 
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#6B8E7B] cursor-pointer"
        onClick={() => document.getElementById(`spotImage-${index}`).click()}
      >
        <div className="space-y-1 text-center">
          <HiOutlinePhotograph className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <span className="relative rounded-md font-medium text-[#6B8E7B] hover:text-[#5F7A68]">
              上傳圖片
              <input
                id={`spotImage-${index}`}
                type="file"
                className="sr-only"
                accept="image/*"
                multiple
                onChange={(e) => handleSpotImageUpload(e, index)}
              />
            </span>
          </div>
          <p className="text-xs text-gray-500">可多選，PNG, JPG, GIF 最大 10MB</p>
        </div>
      </div>
      {/* 預覽圖片區域 */}
      {renderSpotImages(index)}
    </div>
  );

  // 在營位設定中顯示預覽圖片
  const renderSpotImages = (index) => (
    <div className="grid grid-cols-3 gap-4 mt-2">
      {previewSpotImages[index]?.map((url, imgIndex) => (
        <div key={imgIndex} className="relative">
          <img
            src={url}
            alt={`營位圖片 ${imgIndex + 1}`}
            className="w-full h-32 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() => handleRemoveSpotImage(index, imgIndex)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );

  // 移除營位
  const handleRemoveSpot = (index) => {
    setFormData(prev => ({
      ...prev,
      spots: prev.spots.filter((_, i) => i !== index)
    }));
  };

  // 添加計算進度的函數
  const calculateProgress = () => {
    const requiredFields = ['name', 'owner_name', 'address', 'description', 'image_url'];
    const completedFields = requiredFields.filter(field => formData[field]);
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  // 添加計算規則與須知進度的函數
  const calculateRulesProgress = () => {
    const requiredFields = ['rules', 'notice', 'status'];
    const completedFields = requiredFields.filter(field => formData[field]);
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  // 添加或確保有這個處理函數
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
      {/* 步驟指示器 */}
      <div className="flex-none border-b border-gray-200">
        <div className="flex justify-between px-6 py-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center ${
                index !== steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full
                  ${currentStep > index
                    ? 'bg-[#6B8E7B] text-white'
                    : currentStep === index + 1
                    ? 'bg-[#6B8E7B] text-white'
                    : 'bg-gray-200'
                  }`}
              >
                {currentStep > index ? '✓' : index + 1}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600">
                {step.title}
              </span>
              {index !== steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 主要內容區域 */}
      <div className="flex-1 flex min-h-0"> {/* 添加 min-h-0 確保 flex-1 正常工作 */}
        {/* 左側表單 */}
        <div className="w-3/5 overflow-y-auto border-r border-gray-200">
          <div className="p-6">
            {/* 表單內容 */}
            {renderStepContent()}
          </div>
        </div>

        {/* 右側區域 */}
        <div className="w-2/5 bg-gray-50 overflow-y-auto">
          <div className="p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* 填寫進度 */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#2C4A3B] mb-4">
                    填寫進度
                  </h3>
                  <div className="space-y-3">
                    {[
                      { field: '營地名稱', value: formData.name },
                      { field: '營主名稱', value: formData.owner_name },
                      { field: '營地地址', value: formData.address },
                      { field: '營地描述', value: formData.description },
                      { field: '營地主圖', value: formData.image_url }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-600">{item.field}</span>
                        <span className={`flex items-center ${item.value ? 'text-green-500' : 'text-gray-400'}`}>
                          {item.value ? (
                            <>
                              <span className="mr-1">已填寫</span>
                              <HiCheckCircle className="w-5 h-5" />
                            </>
                          ) : (
                            <>
                              <span className="mr-1">未填寫</span>
                              <HiMinusCircle className="w-5 h-5" />
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 表單完整度 */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#2C4A3B] mb-4">
                    表單完整度
                  </h3>
                  <div className="space-y-4">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-[#6B8E7B] bg-[#E8F0EB]">
                            進度
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-[#6B8E7B]">
                            {calculateProgress()}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[#E8F0EB]">
                        <div
                          style={{ width: `${calculateProgress()}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#6B8E7B] transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 必填項目提醒 */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#2C4A3B] mb-4">
                    待完成項目
                  </h3>
                  <div className="space-y-2">
                    {[
                      { field: '營地名稱', value: formData.name },
                      { field: '營主名稱', value: formData.owner_name },
                      { field: '營地地址', value: formData.address },
                      { field: '營地描述', value: formData.description },
                      { field: '營地主圖', value: formData.image_url }
                    ].filter(item => !item.value).map((item, index) => (
                      <div key={index} className="flex items-center text-gray-600">
                        <HiExclamationCircle className="w-5 h-5 text-amber-500 mr-2" />
                        <span>{item.field} 尚未填寫</span>
                      </div>
                    ))}
                    {calculateProgress() === 100 && (
                      <div className="flex items-center text-green-500">
                        <HiCheckCircle className="w-5 h-5 mr-2" />
                        <span>所有必填項目已完成！</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                {/* 填寫進度 */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#2C4A3B] mb-4">
                    規則與須知填寫進度
                  </h3>
                  <div className="space-y-3">
                    {[
                      { field: '營地規則', value: formData.rules, status: formData.rules ? '已填寫' : '未填寫' },
                      { field: '注意事項', value: formData.notice, status: formData.notice ? '已填寫' : '未填寫' },
                      { 
                        field: '營運狀態', 
                        value: formData.status,
                        status: formData.status === 'operating' ? '營業中' :
                               formData.status === 'closed' ? '休息中' :
                               formData.status === 'preparing' ? '籌備中' : '未設定'
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-600">{item.field}</span>
                        <span className={`flex items-center ${
                          item.value ? 
                            (item.field === '營運狀態' ? 'text-[#6B8E7B]' : 'text-green-500') 
                            : 'text-gray-400'
                        }`}>
                          {item.value ? (
                            <>
                              <span className="mr-1">{item.status}</span>
                              <HiCheckCircle className="w-5 h-5" />
                            </>
                          ) : (
                            <>
                              <span className="mr-1">未設定</span>
                              <HiMinusCircle className="w-5 h-5" />
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 表單完整度 */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#2C4A3B] mb-4">
                    完整度
                  </h3>
                  <div className="space-y-4">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-[#6B8E7B] bg-[#E8F0EB]">
                            進度
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-[#6B8E7B]">
                            {calculateRulesProgress()}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[#E8F0EB]">
                        <div
                          style={{ width: `${calculateRulesProgress()}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#6B8E7B] transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 待完成項目 */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#2C4A3B] mb-4">
                    待完成項目
                  </h3>
                  <div className="space-y-2">
                    {[
                      { field: '營地規則', value: formData.rules },
                      { field: '注意事項', value: formData.notice },
                      { field: '營運狀態', value: formData.status }
                    ].filter(item => !item.value).map((item, index) => (
                      <div key={index} className="flex items-center text-gray-600">
                        <HiExclamationCircle className="w-5 h-5 text-amber-500 mr-2" />
                        <span>{item.field} 尚未填寫</span>
                      </div>
                    ))}
                    {calculateRulesProgress() === 100 && (
                      <div className="flex items-center text-green-500">
                        <HiCheckCircle className="w-5 h-5 mr-2" />
                        <span>所有必填項目已完成！</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* 營位填寫進度 */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#2C4A3B] mb-4">
                    營位填寫進度
                  </h3>
                  <div className="space-y-3">
                    {formData.spots.map((spot, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">營位 {index + 1}</span>
                          <span className="text-[#6B8E7B]">{spot.name || '未命名'}</span>
                        </div>
                        <div className="space-y-1">
                          {[
                            { field: '營位名稱', value: spot.name },
                            { field: '容納人數', value: spot.capacity },
                            { field: '價格', value: spot.price },
                            { field: '營位圖片', value: previewSpotImages[index]?.length > 0 }
                          ].map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">{item.field}</span>
                              <span className={`flex items-center ${item.value ? 'text-green-500' : 'text-gray-400'}`}>
                                {item.value ? (
                                  <>
                                    <span className="mr-1">已填寫</span>
                                    <HiCheckCircle className="w-4 h-4" />
                                  </>
                                ) : (
                                  <>
                                    <span className="mr-1">未填寫</span>
                                    <HiMinusCircle className="w-4 h-4" />
                                  </>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 營位完整度 */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#2C4A3B] mb-4">
                    營位完整度
                  </h3>
                  {formData.spots.map((spot, index) => {
                    const requiredFields = ['name', 'capacity', 'price'];
                    const completedFields = requiredFields.filter(field => spot[field]);
                    const progress = Math.round((completedFields.length / requiredFields.length) * 100);
                    
                    return (
                      <div key={index} className="mb-4 last:mb-0">
                        <div className="flex mb-2 items-center justify-between">
                          <span className="text-sm text-gray-600">營位 {index + 1}</span>
                          <span className="text-xs font-semibold text-[#6B8E7B]">{progress}%</span>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-[#E8F0EB]">
                          <div
                            style={{ width: `${progress}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#6B8E7B] transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 待完成項目 */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-[#2C4A3B] mb-4">
                    待完成項目
                  </h3>
                  <div className="space-y-4">
                    {formData.spots.map((spot, index) => {
                      const missingFields = [];
                      if (!spot.name) missingFields.push('營位名稱');
                      if (!spot.capacity) missingFields.push('容納人數');
                      if (!spot.price) missingFields.push('價格');
                      if (!previewSpotImages[index]?.length) missingFields.push('營位圖片');

                      return missingFields.length > 0 ? (
                        <div key={index} className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-600">營位 {index + 1}</h4>
                          {missingFields.map((field, fieldIndex) => (
                            <div key={fieldIndex} className="flex items-center text-gray-600 text-sm">
                              <HiExclamationCircle className="w-4 h-4 text-amber-500 mr-2" />
                              <span>{field} 尚未填寫</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div key={index} className="flex items-center text-green-500 text-sm">
                          <HiCheckCircle className="w-4 h-4 mr-2" />
                          <span>營位 {index + 1} 所有必填項目已完成！</span>
                        </div>
                      );
                    })}
                    {formData.spots.length === 0 && (
                      <div className="text-gray-500 text-center">
                        尚未新增任何營位
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部按鈕 */}
      <div className="flex-none border-t border-gray-200 px-6 py-4">
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevStep}
            className={`px-6 py-2.5 border rounded-lg transition-colors
              ${currentStep === 1 ? 'invisible' : 'visible hover:bg-gray-50'}`}
          >
            上一步
          </button>
          <button
            type="button"
            onClick={currentStep === steps.length ? handleSubmit : handleNextStep}
            className="px-6 py-2.5 bg-[#6B8E7B] text-white rounded-lg hover:bg-[#5F7A68] transition-colors"
          >
            {currentStep === steps.length ? '提交申請' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 預覽卡片組件
const PreviewCard = ({ title, content }) => {
  if (!content) return null;
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h4 className="font-medium text-[#2C4A3B]">{title}</h4>
      <p className="mt-1 text-gray-600">{content}</p>
    </div>
  );
}; 