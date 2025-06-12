import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
// 綠界支付
// 綠界測試環境設定
const ECPAY_MERCHANT_ID = process.env.ECPAY_MERCHANT_ID;
const ECPAY_HASH_KEY = process.env.ECPAY_HASH_KEY;
const ECPAY_HASH_IV = process.env.ECPAY_HASH_IV;
const ECPAY_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
  : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

// 產生檢查碼的函數
function generateCheckMacValue(params) {
  // 1. 將參數依照參數名稱的字母順序排序
  const sortedParams = Object.keys(params).sort().reduce((obj, key) => {
    obj[key] = params[key];
    return obj;
  }, {});

  // 2. 將參數串聯成 key=value 格式的字串
  const paramString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // 3. 在字串前後加上 HashKey 和 HashIV
  const rawString = `HashKey=${ECPAY_HASH_KEY}&${paramString}&HashIV=${ECPAY_HASH_IV}`;

  // 4. 進行 URL encode
  const encodedString = encodeURIComponent(rawString).toLowerCase();

  // 5. 轉換成符合規則的字串
  const encodedStringRule = encodedString
    .replace(/%20/g, '+')
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.')
    .replace(/%21/g, '!')
    .replace(/%2a/g, '*')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')');

  // 6. 使用 SHA256 產生 CheckMacValue
  const checkMacValue = crypto
    .createHash('sha256')
    .update(encodedStringRule)
    .digest('hex')
    .toUpperCase();

  return checkMacValue;
}

export async function POST(req) {
  const connection = await pool.getConnection();
  
  try {
    // 檢查用戶是否登入
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    // 取得請求資料
    const { items, amount, contactInfo } = await req.json();
    
    // 基本資料檢查
    if (!items?.[0] || !amount || !contactInfo) {
      return NextResponse.json({ error: '缺少必要資料' }, { status: 400 });
    }

    // 驗證所有必要欄位
    const required = {
      option_id: items[0].option_id,
      quantity: items[0].quantity,
      amount: amount,
      contactName: contactInfo.contactName,
      contactPhone: contactInfo.contactPhone,
      contactEmail: contactInfo.contactEmail
    };

    // 檢查是否有缺少的欄位
    const missingFields = Object.entries(required)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `缺少必要欄位: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // 生成訂單編號
    const timestampId = Date.now();
    const orderId = timestampId;

    // 檢查是否已存在相同的訂單
    const [existingOrder] = await connection.execute(
      `SELECT * FROM bookings 
       WHERE user_id = ? 
       AND total_price = ? 
       AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       AND payment_status = 'pending'
       ORDER BY created_at DESC 
       LIMIT 1`,
      [session.user.id, amount]
    );

    let orderNumber;
    
    if (existingOrder.length > 0) {
      // 如果找到最近 5 分鐘內的相同訂單，使用該訂單編號
      orderNumber = existingOrder[0].order_id;
      // console.log('使用既有訂單:', orderNumber);
    } else {
      // 寫入新訂單
      await connection.execute(
        `INSERT INTO bookings (
          booking_id, order_id, option_id, user_id, 
          booking_date, status, quantity, total_price,
          contact_name, contact_phone, contact_email,
          payment_method, payment_status,
          timestamp_id, nights,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Date.now(),                   // booking_id
          orderId,                      // order_id
          items[0].option_id,
          session.user.id,
          new Date(),                   // booking_date
          'pending',                    // status
          items[0].quantity,
          amount,
          contactInfo.contactName,
          contactInfo.contactPhone,
          contactInfo.contactEmail,
          'ecpay',                      // payment_method
          'pending',                    // payment_status
          timestampId,                  // timestamp_id
          items[0].nights || 1,         // nights
          new Date(),                   // created_at
          new Date()                    // updated_at
        ]
      );
      orderNumber = orderId;
      // console.log('建立新訂單:', orderNumber);
    }

    // 格式化交易時間
    const now = new Date();
    const merchantTradeDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // 準備綠界支付參數
    const ecpayParams = {
      MerchantID: ECPAY_MERCHANT_ID,
      MerchantTradeNo: `CAMP${orderNumber}`,  // 使用訂單編號
      MerchantTradeDate: merchantTradeDate,
      PaymentType: 'aio',
      TotalAmount: amount.toString(),
      TradeDesc: encodeURIComponent('露營商品預訂'),
      ItemName: encodeURIComponent(items.map(item => `${item.activity_name} x ${item.quantity}`).join('#')),
      
      // 確保加入 CustomField1-4 存放必要資訊
      CustomField1: session.user.id.toString(),        // 用戶ID
      CustomField2: contactInfo.contactName,           // 聯絡人姓名
      CustomField3: contactInfo.contactPhone,          // 聯絡電話
      CustomField4: contactInfo.contactEmail,          // 聯絡信箱
      
      ReturnURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/camping/payment/ecpay/notify`,
      ClientBackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/camping/checkout/ecpay/cancel`,
      OrderResultURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/camping/payment/ecpay/handle-result`,
      
      ChoosePayment: 'Credit',
      EncryptType: '1',
    };

    // 加入除錯日誌
    // console.log('ReturnURL:', ecpayParams.ReturnURL);

    // 加入檢查
    if (!process.env.ECPAY_MERCHANT_ID || !process.env.ECPAY_HASH_KEY || !process.env.ECPAY_HASH_IV) {
      console.error('綠界金流設定未完成');
      throw new Error('綠界金流設定未完成');
    }

    // 產生檢查碼
    ecpayParams.CheckMacValue = generateCheckMacValue(ecpayParams);

    // 將聯絡資訊存入 session 或暫存，供後續訂單使用
    const orderData = {
      orderId,
      timestampId,
      items: items,
      amount,
      contactInfo,
      userId: session.user.id
    };

    // 可以使用 Redis 存儲
    // await redis.set(`order:${timestampId}`, JSON.stringify(orderData), 'EX', 3600); // 1小時過期

    // 產生 HTML 表單
    const formHTML = `
      <form id="ecpayForm" method="post" action="${ECPAY_API_URL}">
        ${Object.entries(ecpayParams)
          .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
          .join('')}
      </form>
    `;

    return NextResponse.json({
      success: true,
      form: formHTML,
      orderData  // 可選：回傳訂單資訊供前端參考
    });

  } catch (error) {
    console.error('綠界支付處理失敗:', error);
    return NextResponse.json(
      { error: '綠界支付處理失敗' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 