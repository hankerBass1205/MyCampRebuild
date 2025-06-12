'use client';

// ===== React 相關引入 =====
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ===== UI 元件引入 =====
import { motion } from 'framer-motion';  // 動畫效果
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';  // Icon
import { Breadcrumb } from 'antd';  // 麵包屑導航
import { HomeOutlined } from '@ant-design/icons';  // 首頁 Icon
import { showForgotPasswordAlert } from '@/utils/sweetalert';

export default function ForgotPasswordForm() {
  // ===== 狀態管理 =====
  const router = useRouter();
  const [step, setStep] = useState(1);  // 重設密碼步驟：1.輸入信箱 2.輸入驗證碼 3.重設密碼
  const [isLoading, setIsLoading] = useState(false);  // 載入狀態
  const [error] = useState('');  // 錯誤訊息

  // ===== 表單控制 =====
  const {
    register,           // 註冊表單欄位
    handleSubmit,       // 處理表單提交
    formState: { errors, isValid }, // 表單錯誤狀態
    clearErrors,        // 清除錯誤
    getValues           // 獲取表單值
  } = useForm({
    defaultValues: {    // 表單預設值
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: ''
    },
    mode: 'onChange'
  });

  // ===== 步驟說明文字 =====
  const stepMessages = {
    1: '請輸入您的註冊信箱，我們將發送驗證碼',
    2: '請輸入您收到的 6 位數驗證碼',
    3: '請設定您的新密碼'
  };

  // ===== 發送驗證碼處理 =====
  const handleSendOTP = async (data) => {
    clearErrors();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });

      const responseData = await res.json();
      
      if (res.status === 404) {
        await showForgotPasswordAlert.emailNotFound();
        return;
      }

      if (!res.ok) {
        throw new Error(responseData.error || '發送失敗');
      }

      await showForgotPasswordAlert.sendOTPSuccess();
      setStep(2);
    } catch (error) {
      await showForgotPasswordAlert.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 驗證 OTP 處理 =====
  const handleVerifyOTP = async (data) => {
    clearErrors();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: data.email,
          otp: data.otp 
        })
      });

      const responseData = await res.json();

      if (res.status === 400) {
        await showForgotPasswordAlert.invalidOTP();
        return;
      }

      if (!res.ok) {
        throw new Error(responseData.error || '驗證失敗');
      }

      await showForgotPasswordAlert.verifyOTPSuccess();
      setStep(3);
    } catch (error) {
      await showForgotPasswordAlert.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 重設密碼處理 =====
  const handleResetPassword = async (data) => {
    clearErrors();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          otp: data.otp,
          newPassword: data.newPassword
        })
      });

      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.error || '重設密碼失敗');
      }

      await showForgotPasswordAlert.resetSuccess();
      router.push('/auth/login');
    } catch (error) {
      await showForgotPasswordAlert.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 表單提交處理 =====
  const onSubmit = async (data) => {
    // 根據當前步驟執行對應處理函數
    switch (step) {
      case 1:
        await handleSendOTP(data);
        break;
      case 2:
        await handleVerifyOTP(data);
        break;
      case 3:
        await handleResetPassword(data);
        break;
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* 麵包屑導航 */}
      <motion.div
        className="mb-4 mx-auto md:ms-[10px] 
                            flex justify-center md:justify-start"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
              title: '忘記密碼',
            },
          ]}
        />
      </motion.div>

      <motion.div 
        className="relative space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.form 
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 p-8 rounded-3xl
                    bg-white/80 backdrop-blur-sm
                    shadow-[0_0_15px_rgba(0,0,0,0.05)]"
        >
          {/* 標題區域 */}
          <motion.div 
            className="text-center space-y-2 mb-8"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="text-2xl font-medium text-[#6B8E7B]"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              忘記密碼
            </motion.h2>
            <motion.p 
              className="text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* 請輸入您的電子信箱，我們將發送重設密碼連結給您 */}
            </motion.p>
          </motion.div>

          {/* 分隔線 */}
          <motion.div 
            className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* 步驟提示 */}
          <motion.div 
            className="text-center space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-sm font-medium text-[#6B8E7B]">
              步驟 {step}/3
            </div>
            <div className="text-sm text-gray-600">
              {stepMessages[step]}
            </div>
          </motion.div>

          {/* 使用者提醒 - 根據不同步驟顯示不同提示 */}
          <motion.div 
            className="text-sm text-gray-500 mt-4 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {step === 1 && (
              <>
                <div className="flex items-center space-x-2 justify-center">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <p>請輸入您註冊時使用的電子信箱</p>
                </div>
                <div className="flex items-center space-x-2 justify-center">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <p>驗證碼將發送至您的信箱，請注意查收</p>
                </div>
                <div className="flex items-center space-x-2 justify-center">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <p>如果沒有收到驗證碼，請檢查垃圾郵件資料夾</p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex items-center space-x-2 justify-center">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <p>驗證碼為6位數字</p>
                </div>
                <div className="flex items-center space-x-2 justify-center">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <p>驗證碼有效期為10分鐘</p>
                </div>
                <div className="flex items-center space-x-2 justify-center">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <p>如果驗證碼過期，可以點擊「重新發送」</p>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex items-center space-x-2 justify-center">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <p>新密碼必須至少包含8個字符</p>
                </div>
                <div className="flex items-center space-x-2 justify-center">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <p>請勿使用空格或特殊字符</p>
                </div>
                <div className="flex items-center space-x-2 justify-center">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <p>請確保兩次輸入的密碼相同</p>
                </div>
                {/* <div className="flex items-center space-x-2">
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  <p>密碼重設成功後，將自動跳轉至登入頁面</p>
                </div> */}
              </>
            )}
          </motion.div>

          {/* 步驟 1：輸入信箱 */}
          {step === 1 && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiOutlineMail className="text-xl text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="請輸入您的註冊信箱"
                  {...register("email", {
                    required: "請輸入電子信箱",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "請輸入有效的電子信箱"
                    }
                  })}
                  className="pl-12 pr-4 py-2.5 w-full rounded-xl 
                           bg-gray-50/50 border border-gray-100
                           focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]/30
                           focus:border-[#6B8E7B]/30 transition-all duration-300"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}

              <motion.button
                type="submit"
                disabled={isLoading || !isValid}
                className="w-full py-2.5 px-4 rounded-xl text-white
                         bg-[#6B8E7B] hover:bg-[#5F7A68]
                         transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? '發送中...' : '發送驗證碼'}
              </motion.button>
            </motion.div>
          )}

          {/* 步驟 2：輸入驗證碼 */}
          {step === 2 && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="請輸入6位數驗證碼"
                  {...register("otp", {
                    required: "請輸入驗證碼",
                    pattern: {
                      value: /^\d{6}$/,
                      message: "驗證碼必須是6位數字"
                    }
                  })}
                  className="pl-4 pr-4 py-2.5 w-full rounded-xl 
                           bg-gray-50/50 border border-gray-100
                           focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]/30
                           focus:border-[#6B8E7B]/30 transition-all duration-300
                           text-center text-lg tracking-widest"
                />
              </div>
              {errors.otp && (
                <p className="text-red-500 text-sm">{errors.otp.message}</p>
              )}

              <div className="flex justify-between items-center space-x-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    clearErrors();
                  }}
                  className="py-2.5 px-4 rounded-xl text-[#6B8E7B] 
                           border border-[#6B8E7B]/30 hover:bg-[#6B8E7B]/5
                           transition-all duration-300 flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  重新發送
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={isLoading || !isValid}
                  className="py-2.5 px-4 rounded-xl text-white
                           bg-[#6B8E7B] hover:bg-[#5F7A68]
                           transition-all duration-300 flex-1
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? '驗證中...' : '驗證'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* 步驟 3：重設密碼 */}
          {step === 3 && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="text-xl text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="請輸入新密碼"
                  {...register("newPassword", {
                    required: "請輸入新密碼",
                    minLength: {
                      value: 8,
                      message: "密碼長度至少需要8個字元"
                    },
                    validate: value => 
                      !value.includes(' ') || "密碼不能包含空格"
                  })}
                  className="pl-12 pr-4 py-2.5 w-full rounded-xl 
                           bg-gray-50/50 border border-gray-100
                           focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]/30
                           focus:border-[#6B8E7B]/30 transition-all duration-300"
                />
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-sm">{errors.newPassword.message}</p>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="text-xl text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="請再次輸入新密碼"
                  {...register("confirmPassword", {
                    required: "請再次輸入新密碼",
                    validate: value => 
                      value === getValues('newPassword') || "兩次輸入的密碼不相符"
                  })}
                  className="pl-12 pr-4 py-2.5 w-full rounded-xl 
                           bg-gray-50/50 border border-gray-100
                           focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]/30
                           focus:border-[#6B8E7B]/30 transition-all duration-300"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
              )}

              <motion.button
                type="submit"
                disabled={isLoading || !isValid}
                className="w-full py-2.5 px-4 rounded-xl text-white
                         bg-[#6B8E7B] hover:bg-[#5F7A68]
                         transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? '處理中...' : '確認重設密碼'}
              </motion.button>
            </motion.div>
          )}

          {/* 錯誤提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 flex items-center justify-center"
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </span>
            </motion.div>
          )}

          {/* 返回登入連結 */}
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-sm text-gray-500">
              想起密碼了？{' '}
              <Link 
                href="/auth/login" 
                className="text-[#6B8E7B] hover:text-[#5F7A68]
                         transition-colors duration-200 no-underline"
              >
                返回登入
              </Link>
            </span>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
}