// 負責處理綠界後端通知
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

// 產生檢查碼的函數
function generateCheckMacValue(params) {
  // 移除 CheckMacValue
  const { CheckMacValue, ...restParams } = params;
  
  // 1. 將參數依照參數名稱的字母順序排序
  const sortedParams = Object.keys(restParams).sort().reduce((obj, key) => {
    obj[key] = restParams[key];
    return obj;
  }, {});

  // 2. 將參數串聯成 key=value 格式的字串
  const paramString = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // 3. 在字串前後加上 HashKey 和 HashIV
  const rawString = `HashKey=${process.env.ECPAY_HASH_KEY}&${paramString}&HashIV=${process.env.ECPAY_HASH_IV}`;

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
  return crypto
    .createHash('sha256')
    .update(encodedStringRule)
    .digest('hex')
    .toUpperCase();
}

// 處理後端通知
export async function POST(request) {
  const connection = await pool.getConnection();
  
  try {
    const data = await request.formData();
    const params = Object.fromEntries(data.entries());
    
    // console.log('收到綠界後端通知:', params);

    // 驗證檢查碼
    const calculatedCheckMacValue = generateCheckMacValue(params);
    if (calculatedCheckMacValue !== params.CheckMacValue) {
      // console.log('檢查碼驗證失敗');
      throw new Error('CheckMacValue 驗證失敗');
    }

    if (params.RtnCode === '1') {
      // 付款成功，更新訂單狀態
      await connection.execute(
        `UPDATE bookings 
         SET status = ?, payment_status = ?, updated_at = ?
         WHERE order_id = ?`,
        ['confirmed', 'paid', new Date(), params.MerchantTradeNo]
      );
      
      return NextResponse.json({ status: 'success' });
    } else {
      // 付款失敗，更新訂單狀態
      await connection.execute(
        `UPDATE bookings 
         SET status = ?, payment_status = ?, updated_at = ?
         WHERE order_id = ?`,
        ['failed', 'failed', new Date(), params.MerchantTradeNo]
      );
      
      return NextResponse.json({ status: 'failed' });
    }
  } catch (error) {
    console.error('綠界後端通知處理失敗:', error);
    return NextResponse.json({ status: 'error', message: error.message });
  } finally {
    connection.release();
  }
} 