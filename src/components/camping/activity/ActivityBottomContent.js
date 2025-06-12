"use client";

import Image from 'next/image';
import Link from 'next/link';
import { FaCampground, FaBookOpen, FaShieldAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function ActivityBottomContent() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="mt-24 mb-24 space-y-20">
      {/* 1. 露營活動介紹 */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-[#FAF7F2] rounded-2xl p-8"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-2xl font-bold text-center text-[#4A3C31] py-2"
          >
            探索露營的魅力
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FaCampground className="w-8 h-8" />,
                title: '豐富的露營體驗',
                description: '從野奢露營到原始露營，各種類型的露營體驗任您選擇'
              },
              {
                icon: <FaBookOpen className="w-8 h-8" />,
                title: '專業的活動規劃',
                description: '經驗豐富的露營團隊，為您規劃最適合的露營行程'
              },
              {
                icon: <FaShieldAlt className="w-8 h-8" />,
                title: '安全的露營環境',
                description: '嚴格的安全標準把關，讓您安心享受露營樂趣'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="text-center p-6 bg-white rounded-xl"
              >
                <div className="inline-block p-3 bg-[#E5E1DB] rounded-full text-[#4A3C31] mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-[#4A3C31] mb-2">
                  {item.title}
                </h3>
                <p className="text-[#7C7267]">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 2. 露營小知識 */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-2xl font-bold text-[#4A3C31] mb-6 text-center py-2"
        >
          露營小知識
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              title: '初次露營必備清單',
              content: '帳篷、睡袋、照明設備、炊具等基本裝備清單介紹...'
            },
            {
              title: '露營地選擇要點',
              content: '地形考量、天氣因素、安全設施等選擇重點說明...'
            },
            {
              title: '露營安全須知',
              content: '天氣觀察、裝備使用、緊急應變等安全注意事項...'
            },
            {
              title: '環境友善露營',
              content: '無痕露營原則、垃圾分類、環境保護等永續觀念...'
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-lg font-bold text-[#4A3C31] mb-3">
                {item.title}
              </h3>
              <p className="text-[#7C7267]">
                {item.content}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 3. 常見問題 */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-2xl font-bold text-[#4A3C31] mb-6 text-center py-2"
        >
          常見問題
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              question: '如何選擇適合的露營活動？',
              answer: '1. 露營經驗：新手建議從設施完善的營地開始\n2. 活動天數：可從一天一夜開始嘗試\n3. 交通方式：評估是否需要自行開車或接駁服務\n4. 季節天氣：不同季節適合的營地和裝備都不同\n5. 預算考量：包含營地費、裝備租借、餐飲等支出'
            },
            {
              question: '活動費用包含哪些項目？',
              answer: '1. 營地費用：營位預訂費用\n2. 裝備租借：帳篷、睡袋、營燈等基本裝備\n3. 餐飲費用：視活動包含的餐點次數而定\n4. 保險費用：基本旅遊平安保險\n5. 導覽解說：專業嚮導或解說員費用\n6. 接駁服務：如果有提供接送服務'
            },
            {
              question: '如何準備露營裝備？',
              answer: '1. 必備裝備：帳篷、睡袋、睡墊、營燈\n2. 炊事用具：爐具、餐具、飲水設備\n3. 個人裝備：保暖衣物、雨具、防蚊用品\n4. 緊急用品：急救包、備用電源、手電筒\n5. 新手建議可先租借裝備，累積經驗後再購買'
            },
            {
              question: '露營地有什麼安全須知？',
              answer: '1. 行前檢查天氣狀況\n2. 確認營地安全設施\n3. 注意用火安全\n4. 保持營地整潔，避免野生動物靠近\n5. 認識周邊避難場所\n6. 準備基本急救用品\n7. 保持通訊設備暢通'
            },
            {
              question: '帶小孩露營要注意什麼？',
              answer: '1. 選擇適合家庭的營地：設施完善、安全性高\n2. 準備充足的禦寒衣物\n3. 攜帶適合兒童的娛樂用品\n4. 準備充足的防蚊防曬用品\n5. 注意飲食衛生與過敏原\n6. 避免危險地形與區域\n7. 建議先從一天一夜開始嘗試'
            },
            {
              question: '露營地的選擇要點有哪些？',
              answer: '1. 地形環境：避免易發生土石流或淹水區域\n2. 基礎設施：衛浴設備、飲用水、電力供應\n3. 周邊配套：醫療資源、補給站的距離\n4. 營地規模：適合的營位大小與數量\n5. 特色活動：是否提供特殊體驗或活動\n6. 交通便利性：道路狀況與可及性\n7. 使用者評價：參考其他露營者的經驗分享'
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex justify-between items-center p-2.5 cursor-pointer 
                          hover:bg-[#FAF7F2] rounded-xl select-none"
              >
                <motion.span 
                  className="font-medium text-lg text-[#4A3C31] group-hover:text-[#8C7B6D]"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {item.question}
                </motion.span>
                <motion.span 
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-[#B6AD9A] text-2xl transform"
                >
                  +
                </motion.span>
              </div>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: "auto", 
                      opacity: 1,
                      transition: {
                        height: { duration: 0.3, ease: "easeOut" },
                        opacity: { duration: 0.2, delay: 0.1 }
                      }
                    }}
                    exit={{ 
                      height: 0, 
                      opacity: 0,
                      transition: {
                        height: { duration: 0.3, ease: "easeIn" },
                        opacity: { duration: 0.2 }
                      }
                    }}
                    className="overflow-hidden"
                  >
                    <motion.div 
                      className="px-6 pb-6 text-[#7C7267]"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { duration: 0.3, delay: 0.1 }
                      }}
                    >
                      {item.answer.split('\n').map((line, i) => (
                        <motion.p 
                          key={i} 
                          className={`leading-relaxed ${i === 0 ? 'pt-4' : 'pt-2'}`}
                          initial={{ opacity: 0, x: -20, y: 20 }}
                          animate={{ 
                            opacity: 1, 
                            x: 0,
                            y: 0,
                            transition: { 
                              duration: 0.4, 
                              delay: 0.1 + i * 0.08,
                              type: "spring",
                              stiffness: 100,
                              damping: 12
                            }
                          }}
                        >
                          {line}
                        </motion.p>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
} 