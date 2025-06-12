/**
 * 地址轉換經緯度 API
 * 使用 OpenStreetMap 的 Nominatim 服務將地址轉換為經緯度座標
 * 
 * 使用方式：
 * GET /api/camping/geocoding?address=台北市信義區信義路五段7號
 * 
 * 回傳格式：
 * {
 *   success: true,
 *   latitude: 25.033976,
 *   longitude: 121.564126,
 *   displayName: "台北 101, 信義路五段7號, 西村里, 信義區, 台北市, 11049, 台灣"
 * }
 */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return Response.json({ 
      success: false, 
      error: '地址不能為空' 
    });
  }

  try {
    // 地址前處理
    let processedAddress = address
      // 移除括號內容
      .replace(/\(.*?\)/g, '')
      // 移除特殊符號
      .replace(/[「」《》【】]/g, '')
      // 確保地址包含 "台灣"
      .trim();
    
    if (!processedAddress.includes('台灣')) {
      processedAddress = processedAddress + ' 台灣';
    }

    // 嘗試不同的地址格式
    const addressFormats = [
      processedAddress,
      // 移除路名後的數字
      processedAddress.replace(/\d+號?$/g, ''),
      // 只保留縣市區
      processedAddress.match(/^(.{2,3}[縣市].{2,3}[鄉鎮市區])/)?.[0] + ' 台灣'
    ].filter(Boolean);

    // 依序嘗試不同的地址格式
    for (const addr of addressFormats) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(addr)}` +
        `&countrycodes=tw` +
        `&limit=1`
      );

      const data = await response.json();

      if (data && data[0]) {
        // 找到結果，回傳座標
        return Response.json({
          success: true,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name,
          originalAddress: address,
          processedAddress: addr
        });
      }

      // 在請求之間添加延遲，以符合 API 限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 如果所有嘗試都失敗，使用縣市中心點作為備用
    const countyMatch = address.match(/^(.{2,3}[縣市])/);
    if (countyMatch) {
      const countyCenter = getCountyCenter(countyMatch[0]);
      if (countyCenter) {
        return Response.json({
          success: true,
          latitude: countyCenter.latitude,
          longitude: countyCenter.longitude,
          displayName: address,
          isApproximate: true,
          originalAddress: address
        });
      }
    }

    return Response.json({
      success: false,
      error: '無法找到該地址的座標',
      originalAddress: address,
      triedAddresses: addressFormats
    });

  } catch (error) {
    console.error('地理編碼錯誤:', error);
    return Response.json({
      success: false,
      error: '地理編碼服務錯誤',
      details: error.message
    });
  }
}

// 台灣各縣市的大約中心點
function getCountyCenter(county) {
  const centers = {
    '台北市': { latitude: 25.0330, longitude: 121.5654 },
    '新北市': { latitude: 25.0169, longitude: 121.4627 },
    '桃園市': { latitude: 24.9936, longitude: 121.3010 },
    '台中市': { latitude: 24.1477, longitude: 120.6736 },
    '台南市': { latitude: 22.9999, longitude: 120.2269 },
    '高雄市': { latitude: 22.6273, longitude: 120.3014 },
    '基隆市': { latitude: 25.1276, longitude: 121.7392 },
    '新竹市': { latitude: 24.8138, longitude: 120.9675 },
    '新竹縣': { latitude: 24.8390, longitude: 121.0024 },
    '苗栗縣': { latitude: 24.5602, longitude: 120.8214 },
    '彰化縣': { latitude: 24.0517, longitude: 120.5161 },
    '南投縣': { latitude: 23.9609, longitude: 120.9718 },
    '雲林縣': { latitude: 23.7092, longitude: 120.4313 },
    '嘉義市': { latitude: 23.4800, longitude: 120.4491 },
    '嘉義縣': { latitude: 23.4518, longitude: 120.2555 },
    '屏東縣': { latitude: 22.5519, longitude: 120.5487 },
    '宜蘭縣': { latitude: 24.7021, longitude: 121.7377 },
    '花蓮縣': { latitude: 23.9871, longitude: 121.6011 },
    '台東縣': { latitude: 22.7583, longitude: 121.1444 },
    '澎湖縣': { latitude: 23.5711, longitude: 119.5793 },
    '金門縣': { latitude: 24.4488, longitude: 118.3767 },
    '連江縣': { latitude: 26.1505, longitude: 119.9499 },
    // 新增台灣替代寫法
    '臺北市': { latitude: 25.0330, longitude: 121.5654 },
    '臺中市': { latitude: 24.1477, longitude: 120.6736 },
    '臺南市': { latitude: 22.9999, longitude: 120.2269 },
    '臺東縣': { latitude: 22.7583, longitude: 121.1444 }
  };

  return centers[county];
}

/**
 * 使用注意事項：
 * 1. OpenStreetMap 使用限制：
 *    - 每秒最多 1 次請求
 *    - 建議加入快取機制
 *    - 需要遵守 OpenStreetMap 的使用條款
 * 
 * 2. 建議改進項目：
 *    - 實作請求頻率限制
 *    - 加入地址結果快取
 *    - 新增重試機制
 *    - 考慮使用備用地理編碼服務
 * 
 * 3. 錯誤處理：
 *    - 地址格式錯誤
 *    - API 服務無回應
 *    - 找不到對應座標
 *    - 網路連線問題
 */ 