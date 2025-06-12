const { GoogleGenerativeAI } = require('@google/generative-ai');
import { NextResponse } from "next/server";

// 初始化 Gemini，使用新的配置
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
  apiEndpoint: 'https://generativelanguage.googleapis.com/v1'  // 使用 v1 而不是 v1beta
});

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash"
});

// 根據不同類別定義回應模板（確保使用繁體中文）
const categoryTemplates = {
  location: `
回答重點：
1. 【交通方式】開車路線或大眾運輸方式
2. 【停車資訊】停車場位置與收費方式
3. 【路況提醒】特殊路段與注意事項
4. 【地標指引】重要路標與轉彎提示
5. 【備用方案】替代交通路線建議`,

  activity: `
回答重點：
1. 【推薦行程】適合的戶外活動建議
2. 【周邊景點】鄰近觀光景點介紹
3. 【適合對象】適合的年齡與團體規模
4. 【活動時間】建議遊玩時段安排
5. 【注意事項】活動安全注意要點`,

  equipment: `
回答重點：
1. 【必備裝備】基本露營必需用品
2. 【選配裝備】依天氣季節增減
3. 【營地設施】現場可使用設備
4. 【租借資訊】可租借露營用品
5. 【使用提醒】裝備使用安全須知`,

  food: `
回答重點：
1. 【飲食建議】營地餐點規劃建議
2. 【烤肉規定】營地烤肉相關規範
3. 【食材準備】建議攜帶食材清單
4. 【餐飲設施】營地餐飲相關設備
5. 【注意事項】食品保存安全提醒`,

  weather: `
回答重點：
1. 【天氣概況】當季氣候特性說明
2. 【裝備建議】因應天氣準備事項
3. 【注意事項】氣候相關安全提醒
4. 【應變方案】惡劣天氣處理方式
5. 【最佳季節】最適合露營時節`,

  safety: `
回答重點：
1. 【安全須知】露營安全注意要點
2. 【醫療資源】鄰近醫療院所位置
3. 【緊急措施】意外事件處理方法
4. 【聯絡方式】緊急聯絡電話資訊
5. 【裝備建議】安全防護裝備準備`
};

export async function POST(req) {
  try {
    const { message, category, activityData } = await req.json();

    const systemPrompt = `您是專業的露營顧問，請使用繁體中文回答以下提問：
    
    營地資訊：
    營地名稱：${activityData?.name || '一般營地'}
    營地位置：${activityData?.location || ''}
    營地描述：${activityData?.description || ''}
    天氣狀況：${activityData?.weather || ''}
    
    ${categoryTemplates[category?.id] || ''}
    
    回答要求：
    1. 必須使用繁體中文
    2. 條列式回答，最多 5 點
    3. 每點字數限制 20 字以內
    4. 重要提醒使用【】標記
    5. 優先使用實際營地資訊
    6. 若資訊不足，請建議洽詢客服`;

    const result = await model.generateContent([
      systemPrompt,
      `問題：${message}\n請務必使用繁體中文回答。`
    ]);

    const response = await result.response;
    let text = response.text();

    // 改進後處理回應文字的格式
    text = text
      .replace(/\*/g, "") // 移除星號
      .replace(/(\d+\.)/g, "\n$1") // 數字編號前換行
      .replace(/【/g, "\n【") // 【前換行
      .replace(/】/g, "】\n") // 】後換行
      .replace(/。/g, "。\n") // 句號後換行
      .replace(/\n{3,}/g, "\n\n") // 移除過多空行
      .replace(/^\s+/gm, "") // 移除行首空白
      .trim();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('AI 處理錯誤:', error);
    return NextResponse.json(
      { error: '很抱歉，系統暫時無法處理您的請求，請稍後再試。' },
      { status: 500 }
    );
  }
}
