'use client';
// ===== React 相關引入 =====
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Disclosure, Transition } from '@headlessui/react'
import { HiChevronDown } from 'react-icons/hi'

// ===== UI 元件引入 =====
import { motion } from 'framer-motion';  // 動畫效果
import { HiOutlineMail, HiOutlineLockClosed, HiEye, HiEyeOff, HiOutlineUser } from 'react-icons/hi';  // Icon
import { Breadcrumb } from 'antd';  // 麵包屑導航
import { HomeOutlined } from '@ant-design/icons';  // 首頁 Icon
import React from 'react';
import { showRegisterAlert } from '@/utils/sweetalert'; // 自定義提醒工具，彈窗提示
import { FaUser, FaCampground } from 'react-icons/fa'; // 引入圖標
import { HiCheck } from 'react-icons/hi'; // 引入勾選圖標

export default function RegisterForm() {
  // ===== 狀態管理 =====
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);  // 密碼顯示狀態
  const [isLoading, setIsLoading] = useState(false);       // 載入狀態
  const [role, setRole] = useState('user');                // 用戶角色狀態

  // ===== 表單控制 =====
  const {
    register,           // 註冊表單欄位
    handleSubmit,       // 處理表單提交
    formState: { errors }, // 表單錯誤狀態
    clearErrors,        // 清除錯誤
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user'
    },
    mode: 'onChange'
  });

  // ===== 表單提交處理 =====
  const onSubmit = async (data) => {
    clearErrors();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: role
        }),
      });

      const responseData = await res.json();

      // 處理註冊失敗
      if (!res.ok) {
        // 處理 Email 已存在的情況
        if (responseData.error.includes('已被註冊')) {
          await showRegisterAlert.emailExists();
        } else {
          // 其他註冊失敗情況
          await showRegisterAlert.failure(responseData.error);
        }
        return;
      }

      // 註冊成功提示
      await showRegisterAlert.success();

      // 根據角色設定跳轉路徑
      const callbackUrl = role === 'owner' ? '/owner' : '/';
      
      // 自動登入
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      // 處理登入失敗
      if (result?.error) {
        await showLoginAlert.error();
        return;
      }

      // 跳轉到對應頁面
      router.push(callbackUrl);

    } catch (error) {
      await showRegisterAlert.error();
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 渲染表單 =====
  return (
    <div className="w-full">
      {/* 麵包屑導航 */}
      <motion.div className="mb-4 mx-auto md:ms-[110px] 
                            flex justify-center md:justify-start">
        <Breadcrumb
          items={[
            {
              title: (
                <Link href="/" className="text-gray-500 hover:text-[#6B8E7B] transition-colors no-underline">
                  <HomeOutlined className="mr-1" />
                  首頁
                </Link>
              ),
            },
            {
              title: (
                <Link href="/auth/login" className="text-gray-500 hover:text-[#6B8E7B] transition-colors no-underline">
                  會員登入
                </Link>
              ),
            },
            {
              title: '註冊帳號',
            },
          ]}
        />
      </motion.div>

      {/* 主要內容區塊 - 使用響應式布局 */}
      <div className="flex flex-col md:flex-row-reverse justify-center gap-6">
        {/* 註冊須知 - 桌面版顯示 */}
        <motion.div className="hidden md:block w-[260px] p-6 
                              bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
          {/* 標題和內容區塊 */}
          <div className="flex flex-col items-center md:items-start"> {/* 內容置中控制 */}
            <h3 className="font-medium text-[#6B8E7B] text-[24px] mb-4
                          text-center md:text-left w-full">
              {role === 'owner' ? '營地主註冊須知：' : '會員註冊須知：'}
            </h3>
            
            {/* 帳號相關提醒 */}
            <div className="space-y-3 w-full">
              <div className="flex items-start space-x-2 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2 flex-shrink-0"></span>
                <p className="text-sm text-gray-600">請使用有效的電子信箱作為帳號</p>
              </div>
              <div className="flex items-start space-x-2 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2 flex-shrink-0"></span>
                <p className="text-sm text-gray-600">此信箱將用於接收重要通知及密碼重設</p>
              </div>
            </div>

            <h4 className="font-medium text-[#6B8E7B] text-[24px] my-4
                          text-center md:text-left w-full">
              密碼要求：
            </h4>
            <div className="space-y-3 w-full">
              <div className="flex items-start space-x-2 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2 flex-shrink-0"></span>
                <p className="text-sm text-gray-600">至少8個字符</p>
              </div>
              <div className="flex items-start space-x-2 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2 flex-shrink-0"></span>
                <p className="text-sm text-gray-600">建議包含大小寫字母和數字</p>
              </div>
              <div className="flex items-start space-x-2 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2 flex-shrink-0"></span>
                <p className="text-sm text-gray-600">避免使用容易被猜到的密碼</p>
              </div>
            </div>

            <h4 className="font-medium text-[#6B8E7B] text-[24px] my-4
                          text-center md:text-left w-full">
              注意事項：
            </h4>
            <div className="space-y-3 w-full">
              <div className="flex items-start space-x-2 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2 flex-shrink-0"></span>
                <p className="text-sm text-gray-600">註冊完成後將自動登入</p>
              </div>
              <div className="flex items-start space-x-2 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2 flex-shrink-0"></span>
                <p className="text-sm text-gray-600">如果已有帳號，請直接登入</p>
              </div>
              <div className="flex items-start space-x-2 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B8E7B] mt-2 flex-shrink-0"></span>
                <p className="text-sm text-gray-600">請妥善保管您的帳號密碼</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 註冊表單區塊 */}
        <motion.div className="flex-1 max-w-[400px] mx-auto md:mx-0 w-full">
          {/* 手機版註冊須知 - 摺疊面板 */}
          <div className="md:hidden mb-4">
            <Disclosure>
              {({ open }) => (
                <div className="w-full">
                  <Disclosure.Button className="flex w-full justify-between rounded-lg 
                                            bg-white/80 px-4 py-3 text-left 
                                            shadow-sm hover:bg-white/90 
                                            transition-all duration-200">
                    <span className="text-[#6B8E7B] font-medium">註冊須知</span>
                    <HiChevronDown
                      className={`${
                        open ? 'rotate-180 transform' : ''
                      } h-5 w-5 text-[#6B8E7B] transition-transform duration-200`}
                    />
                  </Disclosure.Button>
                  <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                  >
                    <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-600">
                      <div className="space-y-4">
                        {/* 帳號要求 */}
                        <div>
                          <h5 className="font-medium text-[#6B8E7B] mb-2">帳號相關提醒</h5>
                          <ul className="space-y-2 list-disc list-inside">
                            <li>請使用有效的電子信箱作為帳號</li>
                            <li>此信箱將用於接收重要通知及密碼重設</li>
                          </ul>
                        </div>

                        {/* 密碼要求 */}
                        <div>
                          <h5 className="font-medium text-[#6B8E7B] mb-2">密碼要求</h5>
                          <ul className="space-y-2 list-disc list-inside">
                            <li>至少8個字符</li>
                            <li>建議包含大小寫字母和數字</li>
                            <li>避免使用容易被猜到的密碼</li>
                          </ul>
                        </div>

                        {/* 注意事項 */}
                        <div>
                          <h5 className="font-medium text-[#6B8E7B] mb-2">注意事項</h5>
                          <ul className="space-y-2 list-disc list-inside">
                            <li>註冊完成後將自動登入</li>
                            <li>如果已有帳號，請直接登入</li>
                            <li>請妥善保管您的帳號密碼</li>
                          </ul>
                        </div>
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </div>
              )}
            </Disclosure>
          </div>

          {/* 註冊表單 */}
          <motion.form 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-4 p-6 rounded-2xl
                      bg-white/80 backdrop-blur-sm
                      shadow-[0_0_15px_rgba(0,0,0,0.05)]"
          >
            {/* 標題區域 */}
            <motion.div 
              className="text-center space-y-1 mb-4"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h2 
                className="text-2xl font-medium text-[#6B8E7B]"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                創建帳號
              </motion.h2>
              <motion.p 
                className="text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                開始你的露營旅程
              </motion.p>
            </motion.div>

            {/* 輸入框區域 */}
            <div className="space-y-3">
              {/* 姓名輸入框 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <HiOutlineUser className="text-lg text-gray-400" />
                </div>
                <input
                  {...register("name", {
                    required: "請輸入姓名",
                    minLength: {
                      value: 2,
                      message: "姓名至少需要2個字符"
                    }
                  })}
                  className={`pl-10 pr-4 py-2.5 w-full rounded-xl
                           bg-gray-50/50 border text-sm transition-all duration-300
                           ${errors.name ? 'border-red-300' : 'border-gray-100'}
                           focus:outline-none focus:ring-1 
                           ${errors.name 
                             ? 'focus:ring-red-300/30 focus:border-red-300/30' 
                             : 'focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'}`}
                  placeholder="請輸入姓名"
                />
                {errors.name && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>
                )}
              </div>

              {/* 電子郵件輸入框 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <HiOutlineMail className="text-lg text-gray-400" />
                </div>
                <input
                  type="email"
                  {...register("email", {
                    required: "請輸入電子信箱",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "請輸入有效的電子信箱格式"
                    }
                  })}
                  className={`pl-10 pr-4 py-2.5 w-full rounded-xl
                           bg-gray-50/50 border text-sm transition-all duration-300
                           ${errors.email ? 'border-red-300' : 'border-gray-100'}
                           focus:outline-none focus:ring-1 
                           ${errors.email 
                             ? 'focus:ring-red-300/30 focus:border-red-300/30' 
                             : 'focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'}`}
                  placeholder="請輸入電子信箱"
                />
                {errors.email && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.email.message}</span>
                )}
              </div>

              {/* 密碼輸入框 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <HiOutlineLockClosed className="text-lg text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "請輸入密碼",
                    minLength: {
                      value: 8,
                      message: "密碼長度至少需要8個字元"
                    }
                  })}
                  className={`pl-10 pr-10 py-2.5 w-full rounded-xl
                           bg-gray-50/50 border text-sm transition-all duration-300
                           ${errors.password ? 'border-red-300' : 'border-gray-100'}
                           focus:outline-none focus:ring-1 
                           ${errors.password 
                             ? 'focus:ring-red-300/30 focus:border-red-300/30' 
                             : 'focus:ring-[#6B8E7B]/30 focus:border-[#6B8E7B]/30'}`}
                  placeholder="請輸入密碼"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? 
                    <HiEyeOff className="text-lg text-gray-400" /> : 
                    <HiEye className="text-lg text-gray-400" />
                  }
                </button>
                {errors.password && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
                )}
              </div>

              {/* 身分選擇 */}
              <div className="space-y-3">
                <label className="block text-[18px] font-medium text-[#6B8E7B]">
                  註冊身分
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* 一般會員選項 */}
                  <label 
                    className={`relative flex flex-col items-center p-4 rounded-xl cursor-pointer
                              border-2 transition-all duration-200 group
                              ${role === 'user' 
                                ? 'border-[#6B8E7B] bg-[#6B8E7B]/5' 
                                : 'border-gray-200 hover:border-[#6B8E7B]/50'}`}
                  >
                    <input
                      type="radio"
                      value="user"
                      checked={role === 'user'}
                      onChange={(e) => setRole(e.target.value)}
                      className="absolute opacity-0"
                    />
                    {/* 勾選標記 */}
                    <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full 
                                   flex items-center justify-center
                                   transition-all duration-200
                                   ${role === 'user' 
                                     ? 'bg-[#6B8E7B] scale-100' 
                                     : 'bg-gray-200 scale-0'}`}>
                      <HiCheck className="text-white text-sm" />
                    </div>
                    {/* 圖標 */}
                    <div className={`text-3xl mb-3 transition-colors duration-200
                                   ${role === 'user' 
                                     ? 'text-[#6B8E7B]' 
                                     : 'text-gray-300 group-hover:text-gray-400'}`}>
                      <FaUser />
                    </div>
                    <span className={`text-[16px] font-bold pb-1
                                    ${role === 'user'
                                      ? 'text-[#6B8E7B]'
                                      : 'text-gray-400'}`}>
                      一般會員
                    </span>
                    <span className={`text-[14px]
                                    ${role === 'user'
                                      ? 'text-[#6B8E7B]/90'
                                      : 'text-gray-300'}`}>
                      露營愛好者
                    </span>
                  </label>

                  {/* 營地主選項 */}
                  <label 
                    className={`relative flex flex-col items-center p-4 rounded-xl cursor-pointer
                              border-2 transition-all duration-200 group
                              ${role === 'owner' 
                                ? 'border-[#6B8E7B] bg-[#6B8E7B]/5' 
                                : 'border-gray-200 hover:border-[#6B8E7B]/50'}`}
                  >
                    <input
                      type="radio"
                      value="owner"
                      checked={role === 'owner'}
                      onChange={(e) => setRole(e.target.value)}
                      className="absolute opacity-0"
                    />
                    {/* 勾選標記 */}
                    <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full 
                                   flex items-center justify-center
                                   transition-all duration-200
                                   ${role === 'owner' 
                                     ? 'bg-[#6B8E7B] scale-100' 
                                     : 'bg-gray-200 scale-0'}`}>
                      <HiCheck className="text-white text-sm" />
                    </div>
                    {/* 圖標 */}
                    <div className={`text-3xl mb-3 transition-colors duration-200
                                   ${role === 'owner' 
                                     ? 'text-[#6B8E7B]' 
                                     : 'text-gray-300 group-hover:text-gray-400'}`}>
                      <FaCampground />
                    </div>
                    <span className={`text-[16px] font-bold pb-1
                                    ${role === 'owner'
                                      ? 'text-[#6B8E7B]'
                                      : 'text-gray-400'}`}>
                      營地主
                    </span>
                    <span className={`text-[14px]
                                    ${role === 'owner'
                                      ? 'text-[#6B8E7B]/90'
                                      : 'text-gray-300'}`}>
                      營地擁有者
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 註冊按鈕 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-white text-sm
                       bg-[#6B8E7B] hover:bg-[#5F7A68]
                       transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "註冊中..." : "註冊"}
            </button>

            {/* 已有帳號連結 */}
            <div className="text-center text-sm">
              <span className="text-gray-500">已經有帳號？</span>
              <Link href="/auth/login" className="text-[#6B8E7B] hover:text-[#5F7A68] ml-1 no-underline">
                立即登入
              </Link>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}