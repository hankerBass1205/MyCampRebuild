'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { FaUser, FaPhone, FaEnvelope, FaCreditCard, FaMoneyBill, FaChevronDown, FaChevronUp, FaShoppingCart, FaUserEdit, FaExclamationCircle, FaCalendarCheck, FaCalendarTimes, FaLine, FaCheckCircle, FaCheck } from 'react-icons/fa';
import { FaCampground, FaUsers } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Loading from '@/components/Loading'; // 引入 Loading 組件

// ===== 自定義工具引入 =====
import { 
  showSystemAlert,     // 系統錯誤提示
} from "@/utils/sweetalert";

import {
  checkoutToast,      // 結帳相關提示
  ToastContainerComponent // Toast 容器組件
} from "@/utils/toast";

// 在檔案開頭加入步驟定義
const STEPS = [
  { 
    id: 1, 
    label: '確認購物車',
    subLabel: '已完成',
    icon: FaShoppingCart,
    description: '檢視並確認您的營位選擇'
  },
  { 
    id: 2, 
    label: '填寫資料',
    subLabel: '當前',
    icon: FaUser,
    description: '填寫聯絡人與預訂資訊'
  },
  { 
    id: 3, 
    label: '完成預訂',
    subLabel: '下一步',
    icon: FaCheckCircle,
    description: '確認訂單並完成預訂'
  }
];

// 在 import 區塊下方添加這個輔助函數
const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// 結帳頁面
export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // 改為預設 true
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 新增初始載入狀態
  const [cartItems, setCartItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState({}); // 追蹤每個項目的展開狀態
  const [formData, setFormData] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    paymentMethod: 'cash' // 改為預設使用現金付款
  });

  // 錯誤訊息 state
  const [errors, setErrors] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    paymentMethod: ''
  });

  // 在 state 中加入 QR Code URL
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // 付款方式狀態
  // const [paymentMethod, setPaymentMethod] = useState('');

  // 驗證規則
  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'contactName':
        if (!value.trim()) {
          error = '請輸入姓名';
        } else if (value.length < 2) {
          error = '姓或名至少需要2個字';
        }
        break;
      
      case 'contactPhone':
        const phoneRegex = /^09\d{8}$/;
        if (!value) {
          error = '請輸入電話號碼';
        } else if (!phoneRegex.test(value)) {
          error = '請輸入有效的手機號碼 (09xxxxxxxx)';
        }
        break;
      
      case 'contactEmail':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          error = '請輸入電子信箱';
        } else if (!emailRegex.test(value)) {
          error = '請輸入有效的電子信箱格式';
        }
        break;
      
      case 'paymentMethod':
        if (!value) {
          error = '請選擇付款方式';
        }
        break;
    }
    return error;
  };

  // 處理輸入變更
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 即時驗證
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // 表單提交前驗證所有欄位
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      newErrors[key] = error;
      if (error) isValid = false;
    });

    setErrors(newErrors);
    return isValid;
  };

  // 切換展開狀態
  const toggleItem = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 直接從購物車 API 獲取資料
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const response = await fetch('/api/camping/cart');
        if (!response.ok) throw new Error('無法獲取購物車資料');
        const data = await response.json();
        
        // 移除自動跳轉，只設置購物車資料
        setCartItems(data.cartItems || []);
      } catch (error) {
        // console.error('獲取購物車資料失敗:', error);
        await showSystemAlert.error('獲取購物車資料失敗，您可能需要先登入');
        setCartItems([]); // 發生錯誤時設置空陣列
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartData();
  }, []);

  // 監聽 LINE Pay 回調訊息
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'LINE_PAY_SUCCESS') {
        // 導向完成頁面
        router.push(`/camping/checkout/complete?orderId=${event.data.orderId}`);
      } else if (event.data === 'LINE_PAY_FAILED') {
        showSystemAlert({
          title: '付款失敗',
          text: '請重新嘗試或選擇其他付款方式',
          icon: 'error'
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const totalAmount = cartItems.reduce((total, item) => total + item.total_price, 0);
      
      // 基本的 payload
      const basePayload = {
        items: cartItems.map(item => ({
          optionId: item.option_id,
          quantity: item.quantity,
          total_price: item.total_price,
          startDate: item.start_date,
          nights: calculateDays(item.start_date, item.end_date)
        })),
        amount: totalAmount,
        contactInfo: {
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail
        },
        paymentMethod: formData.paymentMethod
      };

      /********************* 現金付款 *********************/
      if (formData.paymentMethod === 'cash') {
        const response = await fetch('/api/camping/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(basePayload)
        });

        const result = await response.json();
        if (result.success) {
          router.push(`/camping/checkout/complete?orderId=${result.orderId}`);
        } else {
          throw new Error(result.error || '訂單建立失敗');
        }
      } 
      
      /********************* LINE Pay 支付 *********************/
      else if (formData.paymentMethod === 'line_pay') {
        // 準備訂單資料
        const orderData = {
          items: cartItems.map(item => ({
            optionId: item.option_id,
            quantity: item.quantity,
            total_price: item.total_price,
            nights: calculateDays(item.start_date, item.end_date),
            start_date: item.start_date,
            end_date: item.end_date
          })),
          contactInfo: {
            contactName: formData.contactName,
            contactPhone: formData.contactPhone,
            contactEmail: formData.contactEmail
          },
          amount: totalAmount
        };

        const response = await fetch('/api/camping/payment/line-pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            currency: 'TWD',
            orderId: `CAMP${Date.now()}`,
            orderData: orderData  // 傳送訂單資料到後端
          })
        });

        const data = await response.json();
        if (data.success) {
          // 直接在新視窗開啟 LINE Pay
          window.open(
            data.web,
            'LINE Pay',
            'width=800,height=600,top=100,left=100,menubar=no,toolbar=no,location=no'
          );
        } else {
          throw new Error(data.error || 'LINE Pay 請求失敗');
        }
      }

      /********************* 綠界金流 *********************/
      else if (formData.paymentMethod === 'ecpay') {
        // 檢查購物車項目
        if (!cartItems?.[0]?.option_id) {
          // console.error('購物車資料:', cartItems);
          checkoutToast.error('缺少營位資料');
          return;
        }

        // 準備要送出的資料
        const requestData = {
          items: [{
            option_id: cartItems[0].option_id,
            quantity: cartItems[0].quantity || 1,
            nights: cartItems[0].nights || 1,
            activity_name: cartItems[0].activity_name,
            total_price: cartItems[0].total_price
          }],
          amount: totalAmount,
          contactInfo: {
            contactName: formData.contactName,
            contactPhone: formData.contactPhone,
            contactEmail: formData.contactEmail
          }
        };

        // console.log('綠界支付資料:', requestData);  // 除錯用

        const response = await fetch('/api/camping/payment/ecpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        const result = await response.json();
        if (result.success) {
          // 創建臨時表單並提交
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = result.form;
          document.body.appendChild(tempDiv);
          const form = tempDiv.querySelector('form');
          if (form) form.submit();
        } else {
          throw new Error(result.error || '綠界支付請求失敗');
        }
      }

    } catch (error) {
      // console.error('處理失敗:', error);
      checkoutToast.error(error.message || '處理失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化日期的輔助函數
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'yyyy/MM/dd');
    } catch (error) {
      // console.error('日期格式錯誤:', dateString);
      checkoutToast.error('日期格式錯誤，請稍後再試');
      return '日期格式錯誤';
    }
  };

  // 計算總金額
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.total_price, 0);
  };

  return (
    <>
      <Loading isLoading={isLoading} />
      {!isLoading && cartItems.length === 0 ? (
        // 空購物車的 RWD 設計
        <div className="min-h-screen bg-[var(--lightest-brown)] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 max-w-md w-full text-center">
            <div className="mb-4 md:mb-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <FaShoppingCart className="w-16 h-16 md:w-24 md:h-24 mx-auto text-gray-400" />
              </motion.div>
            </div>
            
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 md:mb-3">
              購物車是空的
            </h2>
            <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
              請先選擇想要預訂的營位再進行結帳。
            </p>
            
            <div className="space-y-2 md:space-y-3">
              <Link 
                href="/camping/activities"
                className="no-underline block w-full bg-[var(--primary-brown)] text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg hover:bg-[var(--secondary-brown)] transition-colors duration-300 text-sm md:text-base"
              >
                瀏覽營地活動
              </Link>
              <Link 
                href="/"
                className="no-underline block w-full bg-gray-100 text-gray-700 py-2.5 md:py-3 px-4 md:px-6 rounded-lg hover:bg-gray-200 transition-colors duration-300 text-sm md:text-base"
              >
                返回首頁
              </Link>
            </div>
          </div>
        </div>
      ) : !isLoading && (
        <div className="min-h-screen bg-[var(--lightest-brown)]">
          {/* 步驟進度條 RWD */}
          <div className="mb-4 md:mb-8 relative z-0 px-4 md:px-8 pt-4 md:pt-8">
            <div className="relative flex justify-between max-w-4xl mx-auto">
              {STEPS.map((step, index) => (
                <motion.div 
                  key={step.id} 
                  className="flex flex-col items-center relative z-0 group w-full"
                >
                  {/* 連接線 RWD */}
                  {index < STEPS.length - 1 && (
                    <div className="absolute h-[3px] md:h-[5px] top-[15px] md:top-[18px] left-[calc(50%+15px)] md:left-[calc(50%+20px)] right-[calc(-50%+15px)] md:right-[calc(-50%+20px)] bg-[var(--tertiary-brown)] -z-10">
                      {step.id <= 2 && (
                        <>
                          {/* 基礎流動效果 */}
                          <motion.div
                            className="absolute top-0 left-0 h-full w-full -z-10"
                            style={{
                              background: "linear-gradient(90deg, var(--primary-brown) 0%, var(--secondary-brown) 50%, var(--primary-brown) 100%)",
                              backgroundSize: "200% 100%",
                              opacity: 0.8
                            }}
                            animate={{
                              backgroundPosition: ["0% 0%", "100% 0%"],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                          {/* 光點流動效果 */}
                          <motion.div
                            className="absolute top-0 left-0 h-full w-[30px] -z-10"
                            style={{
                              background: "linear-gradient(90deg, transparent 0%, var(--primary-brown) 50%, transparent 100%)",
                              opacity: 0.9
                            }}
                            animate={{
                              x: ["-100%", "400%"],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* 步驟圓圈 RWD */}
                  <div className="relative z-10">
                    <motion.div 
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-[3px] md:border-[4px] flex items-center justify-center
                        ${step.id <= 2 
                          ? 'bg-[var(--primary-brown)] border-[var(--primary-brown)]' 
                          : 'bg-[var(--tertiary-brown)] border-[var(--tertiary-brown)]'}
                        transition-colors duration-300`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      {/* 步驟圖示 RWD */}
                      {step.id === 1 ? (
                        <FaCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      ) : step.id === 2 ? (
                        <step.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      ) : (
                        <span className="text-xs md:text-sm font-medium text-white">
                          {step.id}
                        </span>
                      )}
                    </motion.div>
                  </div>

                  {/* 步驟文字 RWD */}
                  <motion.div 
                    className="mt-2 md:mt-4 text-center relative z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <span className={`block text-sm md:text-base font-medium
                      ${step.id <= 2 
                        ? 'text-[var(--primary-brown)]' 
                        : 'text-[var(--gray-3)]'}`}
                    >
                      {step.label}
                    </span>
                    {step.subLabel && (
                      <span className="text-xs md:text-sm text-[var(--gray-4)]">
                        {step.subLabel}
                      </span>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 主要內容區塊 */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 pb-8">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-xl overflow-hidden border border-[var(--tertiary-brown)]">
              <div className="p-4 md:p-8">
                {/* 內容網格 */}
                <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8">
                  
                  {/* 訂單摘要 */}
                  <div className="w-full md:col-span-2 lg:col-span-1 space-y-4 md:space-y-6">
                    <h2 className="text-lg md:text-2xl font-bold text-[var(--primary-brown)] flex items-center gap-2">
                      <FaShoppingCart className="text-[var(--secondary-brown)] text-base md:text-xl" />
                      訂單資訊
                    </h2>
                    
                    {/* 商品小計列表 */}
                    <div className="space-y-3">
                      {cartItems.map((item, index) => (
                        <div key={index}>
                          <Link
                            href={`/camping/activities/${item.activity_id}`}
                            className="block no-underline hover:no-underline"
                          >
                            {/* 主要訂單資訊 */}
                            <div className="grid grid-cols-12 items-center p-3 rounded-lg hover:bg-[var(--gray-7)] transition-colors duration-300">
                              {/* 左側：商品名稱和價格 */}
                              <div className="col-span-8 flex flex-col">
                                <span className="font-bold text-[var(--gray-1)] mb-1">
                                  {item.activity_name}
                                </span>
                                <span className="text-sm text-[var(--gray-3)]">
                                  NT$ {Number(item.unit_price).toLocaleString()} × 
                                  {calculateDays(item.start_date, item.end_date)} 晚 × 
                                  {item.quantity} 營位
                                </span>
                              </div>
                              {/* 右側：總價 */}
                              <div className="col-span-4 text-right text-[var(--primary-brown)] font-medium">
                                NT$ {Number(item.total_price).toLocaleString()}
                              </div>
                            </div>
                          </Link>

                          {/* 摺疊內容 - 改為左右排列 */}
                          <div 
                            className={`mt-2 overflow-hidden transition-all duration-300 ${
                              expandedItems[index] ? 'max-h-[500px]' : 'max-h-0'
                            }`}
                          >
                            <div className="bg-[var(--gray-7)] p-4 rounded-lg">
                              <div className="grid grid-cols-2 gap-3">
                                {/* 左側資訊 */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-[var(--gray-2)]">
                                    <FaCalendarCheck className="text-[var(--secondary-brown)] w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm">入營日期：{formatDate(item.start_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[var(--gray-2)]">
                                    <FaCalendarTimes className="text-[var(--secondary-brown)] w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm">拔營日期：{formatDate(item.end_date)}</span>
                                  </div>
                                </div>
                                {/* 右側資訊 */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-[var(--gray-2)]">
                                    <FaCampground className="text-[var(--secondary-brown)] w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm">營位類型：{item.spot_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[var(--gray-2)]">
                                    <FaUsers className="text-[var(--secondary-brown)] w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm">預訂數量：{item.quantity} 營位</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 展開/收合按鈕 */}
                          <button
                            onClick={() => toggleItem(index)}
                            className="w-full mt-2 flex items-center justify-center gap-1 text-[var(--gray-3)] hover:text-[var(--primary-brown)] transition-colors duration-300"
                          >
                            <span className="text-sm">{expandedItems[index] ? '收合' : '查看詳情'}</span>
                            {expandedItems[index] ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 總金額 */}
                    <div className="bg-gradient-to-r from-[var(--primary-brown)] to-[var(--secondary-brown)]
                      p-6 py-2.5 rounded-xl text-white shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-base md:text-xl">總金額</span>
                        <span className="text-base md:text-xl font-bold">
                          NT$ {cartItems.reduce((total, item) => total + item.total_price, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 付款方式和聯絡資訊容器 */}
                  <div className="w-full lg:col-span-1 space-y-6">
                    {/* 付款方式 */}
                    <div className="space-y-4">
                      <h2 className="text-lg md:text-2xl font-bold text-[var(--primary-brown)] flex items-center gap-2">
                        <FaCreditCard className="text-[var(--secondary-brown)] text-base md:text-xl" />
                        付款方式
                      </h2>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                        {/* 現金付款選項 */}
                        <div 
                          className={`relative rounded-xl md:rounded-2xl border-2 p-2 md:p-4 cursor-pointer transition-all duration-300
                            ${formData.paymentMethod === 'cash' 
                              ? 'border-[var(--primary-brown)] bg-gradient-to-br from-white to-[var(--lightest-brown)] shadow-md transform scale-[1.02]' 
                              : 'border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:shadow-sm'
                            }`}
                          onClick={() => handleInputChange({ target: { name: 'paymentMethod', value: 'cash' } })}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={formData.paymentMethod === 'cash'}
                            onChange={handleInputChange}
                            className="absolute opacity-0"
                          />
                          {formData.paymentMethod === 'cash' && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-[var(--primary-brown)] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <div className={`flex flex-row md:flex-col items-center justify-center gap-2 
                            ${formData.paymentMethod === 'cash' ? 'transform scale-105' : ''}`}>
                            <FaMoneyBill className={`text-2xl md:text-3xl transition-colors duration-300
                              ${formData.paymentMethod === 'cash' ? 'text-[var(--primary-brown)]' : 'text-[var(--secondary-brown)]'}`} />
                            <span className={`text-base md:text-md font-medium transition-colors duration-300
                              ${formData.paymentMethod === 'cash' ? 'text-[var(--primary-brown)]' : 'text-[var(--gray-3)]'}`}>
                              現場付款
                            </span>
                          </div>
                        </div>

                        {/* LINE Pay - 使用相同的手機版樣式 */}
                        <div 
                          className={`relative rounded-xl md:rounded-2xl border-2 p-2 md:p-4 cursor-pointer transition-all duration-300
                            ${formData.paymentMethod === 'line_pay' 
                              ? 'border-[var(--primary-brown)] bg-gradient-to-br from-white to-[var(--lightest-brown)] shadow-md transform scale-[1.02]' 
                              : 'border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:shadow-sm'
                            }`}
                          onClick={() => handleInputChange({ target: { name: 'paymentMethod', value: 'line_pay' } })}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="line_pay"
                            checked={formData.paymentMethod === 'line_pay'}
                            onChange={handleInputChange}
                            className="absolute opacity-0"
                          />
                          {formData.paymentMethod === 'line_pay' && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-[var(--primary-brown)] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <div className={`flex flex-row md:flex-col items-center justify-center gap-2
                            ${formData.paymentMethod === 'line_pay' ? 'transform scale-105' : ''}`}>
                            <FaLine className={`text-2xl md:text-3xl transition-colors duration-300
                              ${formData.paymentMethod === 'line_pay' ? 'text-[#06C755]' : 'text-[#06C755] opacity-70'}`} />
                            <span className={`text-base md:text-md font-medium transition-colors duration-300
                              ${formData.paymentMethod === 'line_pay' ? 'text-[var(--primary-brown)]' : 'text-[var(--gray-3)]'}`}>
                              LINE Pay
                            </span>
                          </div>
                        </div>

                        {/* 綠界支付 - 使用相同的手機版樣式 */}
                        <div 
                          className={`relative rounded-xl md:rounded-2xl border-2 p-2 md:p-4 cursor-pointer transition-all duration-300
                            ${formData.paymentMethod === 'ecpay' 
                              ? 'border-[var(--primary-brown)] bg-gradient-to-br from-white to-[var(--lightest-brown)] shadow-md transform scale-[1.02]' 
                              : 'border-[var(--tertiary-brown)] hover:border-[var(--secondary-brown)] hover:shadow-sm'
                            }`}
                          onClick={() => handleInputChange({ target: { name: 'paymentMethod', value: 'ecpay' } })}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="ecpay"
                            checked={formData.paymentMethod === 'ecpay'}
                            onChange={handleInputChange}
                            className="absolute opacity-0"
                          />
                          {formData.paymentMethod === 'ecpay' && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-[var(--primary-brown)] rounded-full flex items-center justify-center">
                              <svg className="w-2 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <div className={`flex flex-row md:flex-col items-center items-center justify-center gap-2
                            ${formData.paymentMethod === 'ecpay' ? 'transform scale-105' : ''}`}>
                            <FaCreditCard className={`text-2xl md:text-3xl transition-colors duration-300
                              ${formData.paymentMethod === 'ecpay' ? 'text-[var(--primary-brown)]' : 'text-[var(--secondary-brown)]'}`} />
                            <span className={`text-base md:text-md font-medium transition-colors duration-300
                              ${formData.paymentMethod === 'ecpay' ? 'text-[var(--primary-brown)]' : 'text-[var(--gray-3)]'}`}>
                              綠界支付
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 聯絡資訊表單 */}
                    <div className="space-y-4">
                      <h2 className="text-lg md:text-2xl font-bold text-[var(--primary-brown)] flex items-center gap-2">
                        <FaUserEdit className="text-[var(--secondary-brown)] text-base md:text-xl" />
                        聯絡資訊
                      </h2>
                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                          {/* 聯絡資訊表單區塊 */}
                          <div className="space-y-4">
                            {/* 姓名輸入 */}
                            <div className="space-y-1">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <FaUser className="text-[var(--secondary-brown)] text-lg md:text-xl" />
                                </div>
                                <input
                                  type="text"
                                  name="contactName"
                                  value={formData.contactName}
                                  onChange={handleInputChange}
                                  placeholder="聯絡人姓名"
                                  className={`pl-12 w-full rounded-xl border text-base md:text-lg py-2.5
                                    transition-all duration-300
                                    ${errors.contactName 
                                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                      : 'border-[var(--tertiary-brown)] focus:ring-[var(--secondary-brown)] focus:border-[var(--secondary-brown)]'
                                    }`}
                                />
                              </div>
                              {errors.contactName && (
                                <p className="text-red-500 text-xs md:text-sm ml-1 flex items-center gap-1">
                                  <FaExclamationCircle className="text-sm md:text-base" />
                                  {errors.contactName}
                                </p>
                              )}
                            </div>

                            {/* 電話輸入 */}
                            <div className="space-y-1">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <FaPhone className="text-[var(--secondary-brown)] text-lg md:text-xl" />
                                </div>
                                <input
                                  type="tel"
                                  name="contactPhone"
                                  value={formData.contactPhone}
                                  onChange={handleInputChange}
                                  placeholder="聯絡電話"
                                  className={`pl-12 w-full rounded-xl border text-base md:text-lg py-2.5
                                    transition-all duration-300
                                    ${errors.contactPhone 
                                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                      : 'border-[var(--tertiary-brown)] focus:ring-[var(--secondary-brown)] focus:border-[var(--secondary-brown)]'
                                    }`}
                                />
                              </div>
                              {errors.contactPhone && (
                                <p className="text-red-500 text-xs md:text-sm ml-1 flex items-center gap-1">
                                  <FaExclamationCircle className="text-sm md:text-base" />
                                  {errors.contactPhone}
                                </p>
                              )}
                            </div>

                            {/* 信箱輸入 */}
                            <div className="space-y-1">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <FaEnvelope className="text-[var(--secondary-brown)] text-lg md:text-xl" />
                                </div>
                                <input
                                  type="email"
                                  name="contactEmail"
                                  value={formData.contactEmail}
                                  onChange={handleInputChange}
                                  placeholder="電子信箱"
                                  className={`pl-12 w-full rounded-xl border text-base md:text-lg py-2.5
                                    transition-all duration-300
                                    ${errors.contactEmail 
                                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                      : 'border-[var(--tertiary-brown)] focus:ring-[var(--secondary-brown)] focus:border-[var(--secondary-brown)]'
                                    }`}
                                />
                              </div>
                              {errors.contactEmail && (
                                <p className="text-red-500 text-xs md:text-sm ml-1 flex items-center gap-1">
                                  <FaExclamationCircle className="text-sm md:text-base" />
                                  {errors.contactEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 送出按鈕 */}
                        <button
                          type="submit"
                          disabled={isLoading || Object.values(errors).some(error => error)}
                          className="w-full bg-gradient-to-r from-[var(--primary-brown)] to-[var(--secondary-brown)]
                            text-white py-2.5 px-6 rounded-xl
                            hover:from-[var(--secondary-brown)] hover:to-[var(--primary-brown)]
                            disabled:opacity-50 disabled:cursor-not-allowed 
                            transition-all duration-300 text-lg font-medium mt-8
                            transform hover:scale-[1.02] active:scale-[0.98]  text-sm md:text-base"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3 "></div>
                              處理中...
                            </span>
                          ) : '確認付款'}
                        </button>
                      </form>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainerComponent />
    </>
  );
} 