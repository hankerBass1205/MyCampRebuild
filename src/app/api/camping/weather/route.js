import { NextResponse } from 'next/server';

// 天氣現象代碼對照表
const weatherCodeMap = {
  '晴天': '01',
  '晴時多雲': '02',
  '多雲時晴': '02',
  '多雲': '03',
  '陰天': '04',
  '陰時多雲': '04',
  '多雲時陰': '04',
  '陰時有雨': '06',
  '多雲時陣雨': '05',
  '午後短暫雷陣雨': '07',
  '雷陣雨': '07',
  '陣雨': '06',
  '短暫陣雨': '06',
  '下雨': '06',
  '豪雨': '08',
  '大雨': '08',
  '霧': '09',
  '陰有雨': '06',
  '多雲有雨': '06'
};

/**
 * 天氣 API 路由處理函數
 * 用於獲取指定地區的天氣預報資訊
 * 使用中央氣象署開放資料平台 API
 * @param {Request} request - Next.js 請求物件
 * @returns {Promise<NextResponse>} 回應天氣資料的 JSON
 */
export async function GET(request) {
  try {
    // 從 URL 中解析查詢參數
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    if (!location) {
      return NextResponse.json({ 
        success: false,
        message: '需要位置參數',
        weatherData: []
      });
    }

    // 改善地址解析邏輯
    const cleanLocation = location.trim()
      .replace(/^台/g, '臺')  // 統一使用「臺」
      .replace(/[縣市].*$/, match => match.charAt(0)); // 只保留縣市兩字

    // 新增除錯資訊
    // console.log('清理後的地址:', cleanLocation);
    // console.log('可用的地區列表:', /* 印出 API 支援的地區列表 */);

    // 使用正確的 API 路徑
    const apiUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091?Authorization=${process.env.CWB_API_KEY}&locationName=${encodeURIComponent(cleanLocation)}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    // console.log('API 回應結構:', {
    //   success: data.success,
    //   hasRecords: !!data.records,
    //   hasLocations: !!data.records?.Locations,
    //   locationCount: data.records?.Locations?.length || 0
    // });

    if (!data.success) {
      throw new Error(`API 回應不成功: ${data.message || '未知錯誤'}`);
    }

    // 修正資料提取路徑
    const locationData = data.records?.Locations?.[0]?.Location?.find(
      loc => loc.LocationName === cleanLocation
    );

    if (!locationData) {
      console.error('無法找到地區資料:', {
        original: location,
        cleaned: cleanLocation,
        availableLocations: data.records?.Locations?.[0]?.Location?.map(loc => loc.LocationName) || []
      });
      throw new Error(`找不到 ${cleanLocation} 的天氣資料`);
    }

    // 從氣象資料中提取各項天氣要素
    const weatherElements = locationData.WeatherElement;

    // 尋找特定的天氣要素資料
    const wxElement = weatherElements.find(e => e.ElementName === '天氣現象');        // 天氣現象
    const minTElement = weatherElements.find(e => e.ElementName === '最低溫度');      // 最低溫度
    const maxTElement = weatherElements.find(e => e.ElementName === '最高溫度');      // 最高溫度
    const popElement = weatherElements.find(e => e.ElementName === '12小時降雨機率'); // 降雨機率
    const descElement = weatherElements.find(e => e.ElementName === '天氣預報綜合描述'); // 綜合描述
    const uvElement = weatherElements.find(e => e.ElementName === '紫外線指數');      // 紫外線指數

    if (!wxElement?.Time) {
      throw new Error('無天氣現象資料');
    }

    // 處理並整理天氣資料
    const processedData = wxElement.Time.map((wx, index) => {
      // 取得降雨機率，如果無資料則預設為 0
      const rainProb = popElement?.Time[index]?.ElementValue[0]?.ProbabilityOfPrecipitation;
      const description = descElement?.Time[index]?.ElementValue[0]?.WeatherDescription || '';
      const uvInfo = uvElement?.Time[index]?.ElementValue[0];

      // 使用正則表達式從描述文字中提取特定資訊
      const windMatch = description.match(/([東南西北].*風)\s+風速(\d+)級\(每秒\d+公尺\)/);    // 提取風向和風速
      const humidityMatch = description.match(/相對濕度(\d+)%/);                               // 提取相對濕度
      const comfortMatch = description.match(/(寒冷|舒適|稍有寒意)(?:至(寒冷|舒適|稍有寒意))?/); // 提取舒適度描述

      // 回傳結構化的天氣資料
      return {
        startTime: wx.StartTime,          // 預報開始時間
        endTime: wx.EndTime,              // 預報結束時間
        weather: wx.ElementValue[0].Weather,           // 天氣現象描述
        weatherCode: wx.ElementValue[0].WeatherCode,   // 天氣現象代碼
        temperature: {
          min: minTElement?.Time[index]?.ElementValue[0]?.MinTemperature || 'N/A',  // 最低溫度
          max: maxTElement?.Time[index]?.ElementValue[0]?.MaxTemperature || 'N/A'   // 最高溫度
        },
        rainProb: (rainProb && rainProb !== '-') ? rainProb : '0',  // 降雨機率
        description: {
          full: description,              // 完整天氣描述
          wind: windMatch ? {             // 風向資訊
            direction: windMatch[1],      // 風向
            level: windMatch[2]           // 風級
          } : null,
          humidity: humidityMatch ? humidityMatch[1] : null,  // 相對濕度
          comfort: comfortMatch ? comfortMatch[0] : null      // 體感舒適度
        },
        uv: uvInfo ? {                    // 紫外線資訊
          index: uvInfo.UVIndex,         // 紫外線指數
          level: uvInfo.UVExposureLevel  // 紫外線等級
        } : null
      };
    });

    // console.log('處理後的天氣資料:', processedData);

    return NextResponse.json({
      success: true,
      location: cleanLocation,
      weatherData: processedData,
      updateTime: new Date().toISOString()
    });

  } catch (error) {
    // 錯誤處理
    console.error('Weather API Error:', error);
    return NextResponse.json({
      success: false,
      location: '',
      message: error.message || '天氣資料獲取失敗',
      weatherData: []
    });
  }
} 