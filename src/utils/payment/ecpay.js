import crypto from "crypto";
import qs from "querystring";

/**
 * 生成 ECPay 付款請求的檢查碼
 * @param {Object} params - 付款請求參數
 * @returns {string} 檢查碼
 */
function generateCheckMacValue(params) {
  const hashKey = process.env.ECPAY_HASH_KEY;
  const hashIV = process.env.ECPAY_HASH_IV;

  // 1. 參數依字母順序排序
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  // 2. 轉換成 key=value 串聯格式
  const paramString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  // 3. 在前後加上 HashKey 和 HashIV
  const rawString = `HashKey=${hashKey}&${paramString}&HashIV=${hashIV}`;

  // 4. 進行 URL encode
  const encodedString = encodeURIComponent(rawString).toLowerCase();

  // 4. 確保符合 ECPay 規範的 URL Encoding
  const encodedStringRule = encodedString
    .replace(/%20/g, "+")
    .replace(/%2D/g, "-")
    .replace(/%5F/g, "_")
    .replace(/%2E/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2A/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")");

  // 5. 使用 SHA256 進行加密
  return crypto
    .createHash("sha256")
    .update(Buffer.from(encodedStringRule, "utf-8")) // **確保 UTF-8**
    .digest("hex")
    .toUpperCase();
}

/**
 * 建立 ECPay 付款請求 URL
 * @param {Object} order - 訂單資訊
 * @returns {string} 付款 URL
 */
export function createECPayPayment(order) {
  const baseUrl = process.env.PRODUCT_ECPAY_PAYMENT_URL;
  const merchantId = process.env.ECPAY_MERCHANT_ID;

  // 產生 `MerchantTradeDate`
  const now = new Date();
  const MerchantTradeDate = `${now.getFullYear()}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(
    now.getHours()
  ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
    now.getSeconds()
  ).padStart(2, "0")}`;

  // ✅ 確保 `TotalAmount` 及 `ItemName` 格式正確
  const params = {
    MerchantID: merchantId,
    MerchantTradeNo: `EC${order.orderId}${Date.now()
      .toString()
      .slice(-6)}`.slice(0, 20), // 確保唯一，最多 20 字
    MerchantTradeDate: MerchantTradeDate,
    PaymentType: "aio",
    TotalAmount: Math.max(
      0,
      Math.round(order.totalAmount - (order.coupon_discount || 0))
    ).toString(),
    TradeDesc: encodeURIComponent(`訂單 ${order.orderId} - 露營商品預訂`),
    ItemName: encodeURIComponent(
      [
        ...order.items.map((item) => `${item.name} x ${item.quantity}`),
        order.coupon_discount ? `優惠折扣 -${order.coupon_discount}元` : null,
      ]
        .filter(Boolean) // 過濾 `null` 值
        .join("#")
        .slice(0, 400)
    ),
    ReturnURL: process.env.PRODUCT_ECPAY_RETURN_URL,
    ClientBackURL: process.env.PRODUCT_ECPAY_CLIENT_BACK_URL,
    OrderResultURL: process.env.PRODUCT_ECPAY_RETURN_URL, // **補上 OrderResultURL**
    ChoosePayment: "Credit",
    EncryptType: "1",
    CustomField1: order.orderId ? order.orderId.toString() : "0",
  };

  // ✅ 產生 CheckMacValue
  params.CheckMacValue = generateCheckMacValue(params);

  // ✅ 產生完整的 ECPay 付款網址
  const queryString = qs.stringify(params);
  return `
  <form id="ecpayForm" method="post" action="${baseUrl}">
    ${Object.entries(params)
      .map(
        ([key, value]) => `<input type="hidden" name="${key}" value="${value}">`
      )
      .join("")}
  </form>
  <script>document.getElementById("ecpayForm").submit();</script>
`;
}
