"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiX } from "react-icons/hi";
import { 
  showSettingsAlert,
} from "@/utils/sweetalert";
import {
  settingsToast,
  ToastContainerComponent
} from "@/utils/toast";

export default function SettingsModal({ isOpen, onClose, type, ownerData, onUpdate }) {
  // 個人資料表單
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    name: '',
    company_name: '',
    phone: '',
    address: '',
    status: 1
  });

  // 密碼表單
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 錯誤狀態
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // 當 ownerData 變更時更新表單
  useEffect(() => {
    if (ownerData && typeof ownerData === 'object') {
      setFormData({
        id: ownerData.id?.toString() || '',
        email: ownerData.email || '',
        name: ownerData.name || '',
        company_name: ownerData.company_name || '',
        phone: ownerData.phone || '',
        address: ownerData.address || '',
        status: ownerData.status || 1
      });
    }
  }, [ownerData]);

  // 處理個人資料變更
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 處理密碼變更
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 驗證表單
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = '請填寫營主姓名';
    if (!formData.company_name.trim()) newErrors.company_name = '請填寫公司名稱';
    if (!formData.phone?.trim()) newErrors.phone = '請填寫聯絡電話';
    if (!formData.address?.trim()) newErrors.address = '請填寫地址';
    
    if (Object.keys(newErrors).length > 0) {
      // 使用 SweetAlert 顯示表單驗證錯誤
      showSettingsAlert.validationError('請填寫所有必填欄位');
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  // 驗證密碼表單
  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = '請輸入目前密碼';
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = '請輸入新密碼';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = '密碼長度至少需要8個字元';
    }
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = '請確認新密碼';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = '兩次輸入的密碼不相符';
    }
    
    if (Object.keys(newErrors).length > 0) {
      // 使用 SweetAlert 顯示密碼驗證錯誤
      showSettingsAlert.validationError('請檢查密碼輸入');
      setPasswordErrors(newErrors);
      return false;
    }
    return true;
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch('/api/owner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('更新失敗');

      onUpdate && onUpdate();
      onClose();
      // 使用 Toast 顯示成功提示
      settingsToast.success('個人資料更新成功！');
    } catch (error) {
      // 使用 SweetAlert 顯示系統錯誤
      await showSettingsAlert.error('更新失敗，請稍後再試');
    }
  };

  // 處理密碼更新
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    try {
      const response = await fetch('/api/owner/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        await showSettingsAlert.passwordError('目前密碼錯誤');
        return;
      }

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      onClose();
      settingsToast.success('密碼更新成功！');
    } catch (error) {
      await showSettingsAlert.error('密碼更新失敗，請稍後再試');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-white rounded-xl shadow-xl flex flex-col"
            style={{ width: "520px", maxHeight: '90vh' }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            {/* 標題區塊 */}
            <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-[#A8C2B5]/20 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2C4A3B]">
                {type === 'profile' ? '個人資料' : '修改密碼'}
              </h2>
              <button onClick={onClose}>
                <HiX className="w-5 h-5 text-[#2C4A3B]" />
              </button>
            </div>

            {/* 內容區塊 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {type === 'profile' ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">電子信箱</label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        disabled
                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm text-gray-500
                          focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B] transition-colors duration-200"
                      />
                      <p className="mt-1 text-xs text-gray-500">此欄位無法修改</p>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        營主姓名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm
                          ${errors.name 
                            ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                            : 'border-gray-300 hover:border-[#B8A99A] focus:ring-2 focus:ring-[#6B8E7B]/20 focus:border-[#6B8E7B]'
                          } transition-colors duration-200`}
                        placeholder="請輸入營主姓名"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <span className="mr-1">⚠</span> {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                        公司名稱 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        id="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                          errors.company_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.company_name && (
                        <p className="mt-1 text-sm text-red-500">{errors.company_name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        聯絡電話 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        地址 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        id="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                          errors.address ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                        目前密碼 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        id="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                          passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-500">{passwordErrors.currentPassword}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        新密碼 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        id="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                          passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-500">{passwordErrors.newPassword}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">密碼長度至少需要8個字元</p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        確認新密碼 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                          passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 按鈕區塊 */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-[#A8C2B5]/20">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg text-[#2C4A3B] hover:bg-[#A8C2B5]/10
                           transition-colors duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={type === 'profile' ? handleSubmit : handlePasswordSubmit}
                  className="px-6 py-2.5 rounded-lg bg-[#6B8E7B] text-white
                           hover:bg-[#5A7A68] transition-colors duration-200
                           focus:ring-2 focus:ring-[#6B8E7B]/20 focus:ring-offset-2
                           font-medium"
                >
                  確認
                </button>
              </div>
            </div>
          </motion.div>
          <ToastContainerComponent />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
