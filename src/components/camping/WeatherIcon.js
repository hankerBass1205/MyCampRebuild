'use client';
import {
  WiDaySunny,
  WiDayCloudy,
  WiCloudy,
  WiRain,
  WiDayRain,
  WiThunderstorm,
  WiSnow,
  WiDust,
  WiDayFog,
  WiNightClear,
  WiNightCloudy,
  WiNightRain,
  WiNightFog,
  WiDayLightning,
  WiNightLightning,
  WiDayShowers,
  WiNightShowers,
  WiDayThunderstorm,
  WiNightThunderstorm
} from 'weather-icons-react';

export default function WeatherIcon({ weatherCode = '', size = 24, className = '' }) {
  // 天氣描述對應圖示的映射表
  const weatherMapping = {
    // 晴天系列
    '晴': WiDaySunny,
    '晴天': WiDaySunny,
    '晴時多雲': WiDayCloudy,
    '多雲時晴': WiDayCloudy,
    
    // 多雲系列
    '多雲': WiCloudy,
    '陰天': WiCloudy,
    '陰': WiCloudy,
    '多雲時陰': WiCloudy,
    '陰時多雲': WiCloudy,
    
    // 雨天系列
    '雨': WiRain,
    '陣雨': WiDayShowers,
    '短暫陣雨': WiDayShowers,
    '多雲短暫陣雨': WiDayShowers,
    '午後短暫陣雨': WiDayShowers,
    '多雲時陣雨': WiDayRain,
    '多雲時有雨': WiRain,
    '陰時有雨': WiRain,
    '陰有雨': WiRain,
    
    // 雷雨系列
    '雷雨': WiThunderstorm,
    '午後雷陣雨': WiDayThunderstorm,
    '雷陣雨': WiThunderstorm,
    '短暫陣雨或雷雨': WiDayThunderstorm,
    '多雲陣雨或雷雨': WiDayThunderstorm,
    '多雲短暫陣雨或雷雨': WiDayThunderstorm,
    
    // 特殊天氣
    '霧': WiDayFog,
    '起霧': WiDayFog,
    '有霧': WiDayFog,
    '煙霾': WiDust,
    '灰塵': WiDust,
    '揚塵': WiDust,
    '風沙': WiDust,
    '下雪': WiSnow,
    '雪': WiSnow,
    
    // 夜間天氣
    '晴天晚上': WiNightClear,
    '多雲晚上': WiNightCloudy,
    '陣雨晚上': WiNightShowers,
    '雷雨晚上': WiNightThunderstorm,
    '霧晚上': WiNightFog
  };

  // 取得對應的圖示組件
  const getWeatherIcon = (description = '') => {
    // 檢查是否為夜間時段 (18:00 - 06:00)
    const hour = new Date().getHours();
    const isNight = hour >= 18 || hour < 6;

    // 如果沒有描述，返回預設圖示
    if (!description) {
      return isNight ? WiNightClear : WiDaySunny;
    }

    // 先嘗試完全匹配
    let Icon = weatherMapping[description];
    
    // 如果沒有完全匹配，則進行部分匹配
    if (!Icon) {
      if (description.includes('雷')) {
        Icon = isNight ? WiNightLightning : WiDayLightning;
      } else if (description.includes('雨')) {
        Icon = isNight ? WiNightRain : WiDayRain;
      } else if (description.includes('雲')) {
        Icon = isNight ? WiNightCloudy : WiDayCloudy;
      } else if (description.includes('晴')) {
        Icon = isNight ? WiNightClear : WiDaySunny;
      } else if (description.includes('霧')) {
        Icon = isNight ? WiNightFog : WiDayFog;
      } else {
        Icon = isNight ? WiNightClear : WiDaySunny;
      }
    }

    return Icon;
  };

  const Icon = getWeatherIcon(weatherCode);
  return <Icon size={size} className={className} />;
} 