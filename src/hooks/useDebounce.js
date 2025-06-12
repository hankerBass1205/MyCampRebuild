import { useCallback, useRef } from 'react';

/**
 * 防抖 Hook
 * @param {Function} callback - 需要進行防抖處理的回調函數
 * @param {number} delay - 防抖延遲時間（毫秒）
 * @returns {Function} - 經過防抖處理的新函數
 * 
 * 使用場景：
 * 1. 搜尋框輸入時防止過於頻繁的 API 請求
 * 2. 視窗調整大小時延遲處理
 * 3. 表單輸入即時驗證
 */
export function useDebounce(callback, delay) {
  // 使用 useRef 來存儲 timeout ID
  // 好處：在組件重新渲染時保持值不變
  const timeoutRef = useRef(null);

  // 使用 useCallback 記憶化防抖函數
  // 避免每次重新渲染時都創建新的函數實例
  const debouncedCallback = useCallback(
    (...args) => {
      // 如果已經有待執行的函數，先清除它
      // 確保在延遲時間內重複調用時，只執行最後一次
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 設置新的延遲執行
      // 使用 setTimeout 來延遲執行回調函數
      timeoutRef.current = setTimeout(() => {
        callback(...args);  // 使用展開運算符傳遞所有參數
      }, delay);
    },
    [callback, delay]  // 依賴項：當 callback 或 delay 改變時重新創建函數
  );

  return debouncedCallback;
} 