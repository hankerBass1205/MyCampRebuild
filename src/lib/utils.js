// 日期和時間格式化函數
// 參數 date: 日期物件或日期字串
// 回傳: 格式化後的日期時間字串 (例如: 2024-01-07 14:30:00)
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('zh-TW', {
    year: 'numeric',    // 年份，完整數字
    month: '2-digit',   // 月份，兩位數
    day: '2-digit',     // 日期，兩位數
    hour: '2-digit',    // 小時，兩位數
    minute: '2-digit',  // 分鐘，兩位數
    second: '2-digit',  // 秒數，兩位數
    hour12: false       // 使用24小時制
  });
};

// OTP (一次性密碼) 相關函數
// 產生指定長度的數字驗證碼
// 參數 length: 驗證碼長度，預設為 6 位
// 回傳: 隨機生成的數字驗證碼
export const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);  // 隨機生成 0-9 的數字
  }
  return otp;
};

// 檢查 OTP 是否過期
// 參數 expiryDate: 過期時間
// 回傳: 布林值，true 表示已過期，false 表示未過期
export const isOTPExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

// 其他通用工具函數
// 延遲執行函數
// 參數 ms: 延遲毫秒數
// 回傳: Promise，等待指定時間後解析
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 錯誤訊息格式化
// 參數 error: 錯誤物件或錯誤字串
// 回傳: 格式化後的錯誤訊息
export const formatError = (error) => {
  if (typeof error === 'string') return error;
  return error.message || '發生未知錯誤';
}; 