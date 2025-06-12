import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

const NewFooter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const fadeInUp = {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5 }
  };

  // 動畫變體
  const inputVariants = {
    focus: { scale: 1.01, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } }
  };

  const buttonVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.2 } },
    success: { 
      backgroundColor: '#16a34a',
      transition: { duration: 0.3 }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <footer className="relative shadow-[0_-1px_2px_-0.25px_rgba(0,0,0,0.15)]">
      {/* 主要內容區 - 淡米色背景 */}
      <div className="bg-[#eee9e5
      ] bg-opacity-95 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* 左側介紹 */}
            <motion.div 
              {...fadeInUp} 
              className="md:col-span-5 flex flex-col"
            >
              <div className="w-full d-flex flex-col">
                <h2 className="text-[#4A3728] font-bold text-xl mb-3 self-center md:self-start">露營探險家 CampExplore</h2>
                <p className="text-[#5A4738] text-sm leading-relaxed mb-3 self-center md:self-start">
                  致力於提供最佳露營體驗，讓每位露營愛好者都能享受大自然的美好。我們精選全台各地優質營地，提供完整的預訂服務。
                </p>
                <div className="space-y-2 self-center md:self-start">
                  <div className="flex items-center gap-2 text-[#5A4738]">
                    <i className="fas fa-phone-alt text-sm"></i>
                    <span className="text-sm">服務專線：0800-000-000</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#5A4738]">
                    <i className="fas fa-envelope text-sm"></i>
                    <span className="text-sm">Email：service@campexplore.com</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 中間快速連結 */}
            <motion.div 
              {...fadeInUp}
              className="md:col-span-3"
            >
              <h3 className="text-[#4A3728] font-bold text-lg mb-3 text-center md:text-left">快速連結</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2">
                {[
                  '關於我們',
                  '營地分類',
                  '最新消息',
                  '常見問題',
                  '聯絡我們'
                ].map((item) => (
                  <div 
                    key={item}
                    className="cursor-pointer hover:text-[#8B7355] transition-colors duration-200 text-[#5A4738] text-center md:text-left"
                  >
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 右側訂閱區 */}
            <motion.div 
              {...fadeInUp}
              className="md:col-span-4"
            >
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={formVariants}
                className="bg-white bg-opacity-90 rounded-lg p-4 w-full shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <form className="flex flex-col space-y-2">
                  <motion.h3 
                    variants={itemVariants}
                    className="text-[#4A3728] font-bold text-base"
                  >
                    訂閱電子報
                  </motion.h3>
                  
                  <motion.p 
                    variants={itemVariants}
                    className="text-[#5A4738] text-sm"
                  >
                    訂閱我們的電子報，獲得最新營地資訊！
                  </motion.p>

                  <motion.div 
                    variants={itemVariants}
                    className="flex gap-2 flex-wrap"
                  >
                    <motion.input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="請輸入您的 Email"
                      variants={inputVariants}
                      whileFocus="focus"
                      initial="blur"
                      className={`flex-1 px-3 py-1.5 text-sm bg-white bg-opacity-90 text-[#4A3728] placeholder-[#8B7355] border ${
                        status === 'error' ? 'border-red-500' : 'border-[#8B7355]'
                      } rounded-md focus:outline-none focus:border-[#4A3728] transition-all duration-200`}
                    />
                    
                    <motion.button
                      type="submit"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      animate={status === 'success' ? 'success' : ''}
                      className={`px-3 md:px-4 py-1.5 text-sm text-white rounded-md whitespace-nowrap ${
                        status === 'loading' 
                          ? 'bg-gray-400 cursor-not-allowed'
                          : status === 'success'
                          ? 'bg-green-600'
                          : 'bg-[#8B7355]'
                      }`}
                    >
                      {status === 'loading' ? '處理中...' 
                        : status === 'success' ? '訂閱成功！'
                        : '立即訂閱'}
                    </motion.button>
                  </motion.div>

                  <AnimatePresence>
                    {status === 'error' && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-xs text-red-500"
                      >
                        {errorMessage}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.p 
                    variants={itemVariants}
                    className="text-xs text-[#8B7355]"
                  >
                    我們尊重您的隱私，您的資料將受到安全保護
                  </motion.p>
                </form>
              </motion.div>

              {/* 社群媒體圖標 */}
              <div className="flex justify-center md:justify-end mt-4 space-x-4">
                {['facebook', 'instagram', 'linkedin', 'youtube'].map((platform) => (
                  <motion.a
                    key={platform}
                    whileHover={{ y: -2 }}
                    href="#"
                    className="text-[#5A4738] hover:text-[#8B7355] transition-colors duration-200"
                  >
                    <i className={`fab fa-${platform} text-lg`}></i>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 版權區塊 - 只保留版權文字 */}
      <div className="bg-[#776249cf] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            <p className="text-[#E8DFD8] text-sm mb-0 text-center">
              Copyright © 2024 CampExplore. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default NewFooter;