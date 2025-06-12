// 主要流程：
// 使用者選擇 LINE Pay 付款
// 呼叫 createLinePayRequest 取得付款網址
// 使用者在 LINE Pay 完成付款
// LINE Pay 回調我們的 confirm URL
// 呼叫 confirmLinePayPayment 確認付款

import crypto from 'crypto';

const LINEPAY_API_URL = 'https://sandbox-api-pay.line.me';  // Sandbox 測試環境 URL

/**
 * 建立 LINE Pay API 請求所需的標頭
 * @param {string} url - API 端點路徑
 * @param {object} body - 請求內容
 * @returns {object} 包含所需標頭的物件
 */
function createLinePayHeaders(url, body) {
  // 產生隨機 nonce 值，用於防止重放攻擊
  const nonce = crypto.randomBytes(8).toString('hex');
  const channelSecret = process.env.LINEPAY_CHANNEL_SECRET;
  const channelId = process.env.LINEPAY_CHANNEL_ID;
  
  // 產生 LINE Pay 要求的簽章
  // 簽章格式：channelSecret + url + requestBody + nonce
  const signature = crypto
    .createHmac('SHA256', channelSecret)
    .update(channelSecret + url + JSON.stringify(body) + nonce)
    .digest('base64');

  // 回傳所需的標頭
  return {
    'Content-Type': 'application/json',
    'X-LINE-ChannelId': channelId,
    'X-LINE-Authorization-Nonce': nonce,
    'X-LINE-Authorization': signature,
  };
}

/**
 * 建立 LINE Pay 付款請求
 * @param {object} orderData - 訂單資料
 * @param {string} orderData.orderId - 訂單編號
 * @param {number} orderData.amount - 付款金額
 * @param {array} orderData.packages - 商品資訊
 * @returns {object} 付款相關 URL 和交易編號
 */
export async function createLinePayRequest(orderData) {
  const { orderId, amount, packages } = orderData;
  
  const url = '/v3/payments/request';
  const requestUrl = `${LINEPAY_API_URL}${url}`;

  // 準備請求內容
  const body = {
    amount: parseInt(amount),
    currency: 'TWD',
    orderId: orderId,
    packages: [{
      id: '1',
      amount: parseInt(amount),
      products: packages[0].products.map(product => ({
        id: '1',
        name: product.name,
        quantity: parseInt(product.quantity),
        price: Math.round(parseInt(product.price) / parseInt(product.quantity))  // 修正：計算單價
      }))
    }],
    // 設定付款完成後的回調 URL
    redirectUrls: {
      confirmUrl: `${process.env.LINEPAY_RETURN_HOST}${process.env.LINEPAY_RETURN_CONFIRM_URL}`,
      cancelUrl: `${process.env.LINEPAY_RETURN_HOST}${process.env.LINEPAY_RETURN_CANCEL_URL}`
    }
  };

  // console.log('LINE Pay 請求內容:', JSON.stringify(body, null, 2));

  try {
    // 取得請求標頭
    const headers = createLinePayHeaders(url, body);
    
    // 發送請求到 LINE Pay
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();
    // console.log('LINE Pay API 回應:', data);
    
    // 檢查回應狀態
    if (data.returnCode !== '0000') {
      throw new Error(`LINE Pay API 錯誤: ${data.returnMessage}`);
    }

    // 回傳付款資訊
    return {
      success: true,
      paymentUrl: data.info.paymentUrl.web,    // 網頁版付款連結
      appPaymentUrl: data.info.paymentUrl.app,  // APP 版付款連結
      transactionId: data.info.transactionId,   // 交易編號
      qrCodeUrl: data.info.paymentUrl.app      // QR Code 用的 URL
    };

  } catch (error) {
    console.error('LINE Pay 請求失敗:', error);
    throw error;
  }
}

/**
 * 確認 LINE Pay 付款
 * @param {object} params - 確認付款所需參數
 * @param {string} params.transactionId - LINE Pay 交易編號
 * @param {number} params.amount - 付款金額
 * @returns {object} LINE Pay API 回應結果
 */
export async function confirmLinePayPayment({ transactionId, amount }) {
  try {
    const url = `/v3/payments/${transactionId}/confirm`;
    const requestUrl = `${LINEPAY_API_URL}${url}`;

    // 準備確認請求內容
    const body = {
      amount: parseInt(amount),
      currency: 'TWD'
    };

    // 取得請求標頭
    const headers = createLinePayHeaders(url, body);
    
    // 發送確認請求
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();
    // console.log('LINE Pay 確認回應:', data);

    // 檢查確認結果
    if (data.returnCode !== '0000') {
      throw new Error(`LINE Pay 確認失敗: ${data.returnMessage}`);
    }

    return data;

  } catch (error) {
    console.error('LINE Pay 確認請求失敗:', error);
    throw error;
  }
} 