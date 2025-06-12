import { useState, useRef, useEffect } from "react";
import { popupCenter } from "./popup-window";
// 自定義 Hook：用來處理 7-11 門市選擇邏輯
export function useShip711StoreOpener(serverCallbackUrl = "") {
  // newWindow 用來儲存彈出視窗物件
  const newWindow = useRef(null);

  // 儲存所選門市資訊：storeid, storename, storeaddress
  const [store711, setStore711] = useState({
    storeid: "",
    storename: "",
    storeaddress: "",
  });

  /*
   * ----------------------------------
   * 1) useEffect 監聽「message」事件
   * ----------------------------------
   * - 當彈窗關閉後 (或操作完成後) 回傳門市資料給主視窗
   *   主視窗收到資料後，存到 store711 狀態。
   */
  useEffect(() => {
    // 事件處理函式：從 event.data 中拿到門市資料
    const handleMessage = (event) => {
      // console.log("📩 7-11 門市回傳資料:", event);

      // 確保來源安全：這裡以 http://localhost:3000 為例
      if (event.origin !== "http://localhost:3000") return;

      try {
        // 取出 event.data (即子視窗傳回的門市資料)
        const storeData = event.data;
        // 檢查 storeData 是否含有 storeid
        if (storeData && storeData.storeid) {
          // console.log("✅ 更新選擇的門市:", storeData);
          // 寫進 React state，以便在 UI 上呈現
          setStore711(storeData);
        }
      } catch (error) {
        console.error("❌ 解析 7-11 門市回傳資料錯誤:", error);
      }
    };

    // 監聽全域的 message 事件
    window.addEventListener("message", handleMessage);

    // 在元件 unmount 或重新渲染時移除監聽，避免重複綁定
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  /*
   * ----------------------------------
   * 2) 開啟 7-11 門市選擇視窗
   * ----------------------------------
   * - 點擊「選擇門市」時，開啟一個彈窗到 7-11 的頁面
   * - 7-11 完成選擇後會對主視窗 postMessage
   */
  const openWindow = () => {
    if (!serverCallbackUrl) {
      console.error("錯誤: 需要設定 Callback API URL");
      return;
    }

    // 使用 popupCenter 工具函式：在螢幕中央開啟指定大小的視窗
    newWindow.current = popupCenter(
      // 7-11 的官方網址 (emap.presco...)，其中帶有 callback 參數
      `https://emap.presco.com.tw/c2cemap.ashx?eshopid=870&&servicetype=1&url=${serverCallbackUrl}`,
      "7-11 門市選擇", // 視窗標題
      950, // 視窗寬
      680 // 視窗高
    );
  };

  /*
   * 回傳 Hook 提供的方法與狀態
   * store711: 當前選擇的 7-11 門市資料
   * openWindow: 呼叫後會彈出 7-11 選擇視窗
   */
  return {
    store711,
    openWindow,
  };
}
