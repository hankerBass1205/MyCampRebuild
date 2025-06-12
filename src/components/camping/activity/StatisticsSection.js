'use client';
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

export default function StatisticsSection() {
  const [counts, setCounts] = useState({
    activities: 0,
    campers: 0,
    camps: 0,
    rating: 0
  });

  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  // 數字動畫效果
  useEffect(() => {
    if (inView) {
      const duration = 2500; // 延長動畫時間
      const steps = 60;
      const interval = duration / steps;

      const targets = {
        activities: 500,
        campers: 2000,
        camps: 30,
        rating: 4.8
      };

      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        
        setCounts({
          activities: Math.floor((targets.activities * currentStep) / steps),
          campers: Math.floor((targets.campers * currentStep) / steps),
          camps: Math.floor((targets.camps * currentStep) / steps),
          rating: Number((targets.rating * currentStep / steps).toFixed(1))
        });

        if (currentStep === steps) {
          clearInterval(timer);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [inView]);

  // 莫蘭迪色系統計卡片
  const statCards = [
    {
      value: counts.activities,
      label: '成功舉辦活動',
      suffix: '+',
      bgGradient: 'from-[#E5D1BA] to-[#D4C4B0]', // 溫暧的米褐色
      textColor: 'text-[#8B7355]',
      borderColor: 'border-[#C4B5A2]',
      shadowColor: 'shadow-[#E5D1BA]',
      icon: '🏕️'
    },
    {
      value: counts.campers,
      label: '快樂露營者',
      suffix: '+',
      bgGradient: 'from-[#B8C4B8] to-[#A3B1A3]', // 森林綠
      textColor: 'text-[#465446]',
      borderColor: 'border-[#97A697]',
      shadowColor: 'shadow-[#B8C4B8]',
      icon: '⛺'
    },
    {
      value: counts.camps,
      label: '合作營地',
      suffix: '+',
      bgGradient: 'from-[#D6C2AD] to-[#C5B19C]', // 木質棕
      textColor: 'text-[#786452]',
      borderColor: 'border-[#B8A48F]',
      shadowColor: 'shadow-[#D6C2AD]',
      icon: '🌲'
    },
    {
      value: counts.rating,
      label: '平均評分',
      suffix: '',
      bgGradient: 'from-[#C2CECD] to-[#B1BFBE]', // 霧灰藍
      textColor: 'text-[#4F5E5D]',
      borderColor: 'border-[#A4B3B2]',
      shadowColor: 'shadow-[#C2CECD]',
      icon: '⭐'
    }
  ];

  return (
    <div className="relative w-screen left-[50%] right-[50%] mx-[-50vw] 
                    bg-gradient-to-b from-[#F4F1EC] to-[#E9E5DE] overflow-hidden
                    py-12 sm:py-16 md:py-20 lg:py-24 
                    mt-12 sm:mt-16 md:mt-20 lg:mt-24
                    mb-12 sm:mb-16 md:mb-20 lg:mb-24">
      
      {/* 標題區域 */}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-[#4A3C31] mb-2">
          露營成就
        </h2>
        <p className="text-[#786D64] text-sm md:text-base">
          與您共創的美好露營時光
        </p>
      </div>

      {/* 裝飾元素 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 左上裝飾 */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full 
                      bg-gradient-to-br from-[#E5D1BA]/30 to-[#D4C4B0]/30 
                      animate-float-slow blur-lg" />
        {/* 右下裝飾 */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full 
                      bg-gradient-to-tl from-[#B8C4B8]/40 to-[#A3B1A3]/40 
                      animate-float-slower blur-lg" />
        {/* 中間裝飾 */}
        <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full 
                      bg-gradient-to-r from-[#D6C2AD]/20 to-[#C5B19C]/20 
                      animate-float blur-md" />
      </div>

      {/* 主要內容 */}
      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {statCards.map((stat, index) => (
            <div key={index} className="group">
              <div className={`
                relative overflow-hidden
                bg-gradient-to-br ${stat.bgGradient}
                rounded-2xl p-6 md:p-8
                border ${stat.borderColor}/40
                shadow-lg hover:shadow-xl
                transform transition-all duration-500
                hover:scale-105 hover:-translate-y-1
                backdrop-blur-sm
              `}>
                {/* 背景圖案 */}
                <div className="absolute -right-6 -bottom-6 w-32 h-32 
                              opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-6xl">{stat.icon}</span>
                </div>
                
                <div className="relative space-y-3">
                  <div className="flex items-baseline justify-center">
                    <span className={`text-4xl md:text-5xl font-bold ${stat.textColor}
                                   transition-all duration-300 group-hover:scale-110`}>
                      {stat.value}
                    </span>
                    <span className={`text-2xl font-bold ${stat.textColor} ml-1 opacity-80`}>
                      {stat.suffix}
                    </span>
                  </div>
                  <span className={`block text-sm md:text-base text-center ${stat.textColor}
                                 font-medium opacity-90`}>
                    {stat.label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 