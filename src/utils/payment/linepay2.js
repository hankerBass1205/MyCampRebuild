import crypto from "crypto";
import axios from "axios";

const LINEPAY_CHANNEL_ID = process.env.LINEPAY_CHANNEL_ID;
const LINEPAY_CHANNEL_SECRET = process.env.LINEPAY_CHANNEL_SECRET;
const LINEPAY_API_URL = process.env.LINEPAY_API_URL;
const PRODUCT_LINEPAY_RETURN_HOST = process.env.PRODUCT_LINEPAY_RETURN_HOST;
const PRODUCT_LINEPAY_RETURN_CONFIRM_URL =
  process.env.PRODUCT_LINEPAY_RETURN_CONFIRM_URL;
const PRODUCT_LINEPAY_RETURN_CANCEL_URL =
  process.env.PRODUCT_LINEPAY_RETURN_CANCEL_URL;

function createLinePayHeaders(url, body) {
  const nonce = Date.now().toString();
  const signature = crypto
    .createHmac("SHA256", LINEPAY_CHANNEL_SECRET)
    .update(LINEPAY_CHANNEL_SECRET + url + JSON.stringify(body) + nonce)
    .digest("base64");

  return {
    "Content-Type": "application/json",
    "X-LINE-ChannelId": LINEPAY_CHANNEL_ID,
    "X-LINE-Authorization-Nonce": nonce,
    "X-LINE-Authorization": signature,
  };
}

export async function createLinePayRequest(orderData) {
  const url = "/v3/payments/request";
  const requestUrl = `${LINEPAY_API_URL}${url}`;

  // ✅ 直接使用傳入的orderData，不重新計算或重組
  const body = {
    amount: orderData.amount,
    currency: orderData.currency,
    orderId: orderData.orderId,
    packages: orderData.packages, // 保留完整的packages結構
    redirectUrls: orderData.redirectUrls,
  };

  try {
    // console.log("📦 LINE Pay 請求內容:", JSON.stringify(body, null, 2));

    const headers = createLinePayHeaders(url, body);

    const response = await axios.post(requestUrl, body, { headers });

    // console.log("✅ LINE Pay API 回應:", response.data);

    if (response.data.returnCode !== "0000") {
      throw new Error(`❌ LINE Pay API 錯誤: ${response.data.returnMessage}`);
    }

    return {
      success: true,
      paymentUrl: response.data.info.paymentUrl.web,
      transactionId: response.data.info.transactionId,
    };
  } catch (error) {
    console.error("❌ LINE Pay 付款請求失敗:", error);
    throw error;
  }
}

export async function confirmLinePayPayment(transactionId, amount) {
  const url = `/v3/payments/${transactionId}/confirm`;
  const requestUrl = `${LINEPAY_API_URL}${url}`;

  const body = {
    amount: parseInt(amount),
    currency: "TWD",
  };

  try {
    // console.log("📦 LINE Pay 付款確認內容:", JSON.stringify(body, null, 2));

    const headers = createLinePayHeaders(url, body);

    const response = await axios.post(requestUrl, body, { headers });

    // console.log("✅ LINE Pay 確認回應:", response.data);

    if (response.data.returnCode !== "0000") {
      throw new Error(`❌ LINE Pay 確認失敗: ${response.data.returnMessage}`);
    }

    return response.data;
  } catch (error) {
    console.error("❌ LINE Pay 確認請求失敗:", error);
    throw error;
  }
}
