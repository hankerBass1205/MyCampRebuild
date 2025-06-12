// 負責處理前端頁面導向，並且處理資料庫操作(寫入訂單、清空購物車)
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  const connection = await pool.getConnection();
  
  try {
    const data = await request.formData();
    const params = Object.fromEntries(data.entries());
    
    // console.log('收到付款結果:', params);
    
    if (params.RtnCode === '1') {
      await connection.beginTransaction();

      try {
        // 去除 CAMP 前綴再查詢訂單
        const orderId = params.MerchantTradeNo.replace('CAMP', '');
        // console.log('查詢訂單編號:', orderId);  // 加入除錯日誌
        
        const [orderRows] = await connection.execute(
          `SELECT * FROM bookings WHERE order_id = ?`,
          [orderId]
        );

        // console.log('查詢結果:', orderRows);  // 加入除錯日誌

        if (orderRows.length === 0) {
          throw new Error('找不到訂單資料');
        }

        const order = orderRows[0];

        // 更新訂單狀態
        await connection.execute(
          `UPDATE bookings 
           SET status = ?, payment_status = ?, updated_at = ?
           WHERE order_id = ?`,
          ['confirmed', 'paid', new Date(), orderId]  // 這裡也使用去除前綴的 orderId
        );

        // 清空購物車
        await connection.execute(
          'DELETE FROM activity_cart WHERE user_id = ?',
          [order.user_id]
        );

        await connection.commit();

        return NextResponse.redirect(
          new URL(`/camping/checkout/complete?orderId=${orderId}`, request.url),
          303
        );

      } catch (error) {
        console.error('處理訂單時發生錯誤:', error);
        await connection.rollback();
        throw error;
      }
    } else {
      // 付款失敗，更新訂單狀態 (同樣需要去除 CAMP 前綴)
      const orderId = params.MerchantTradeNo.replace('CAMP', '');
      await connection.execute(
        `UPDATE bookings 
         SET status = ?, payment_status = ?, updated_at = ?
         WHERE order_id = ?`,
        ['failed', 'failed', new Date(), orderId]
      );

      return NextResponse.redirect(
        new URL('/camping/checkout/ecpay/cancel', request.url),
        303
      );
    }
  } catch (error) {
    console.error('處理付款結果失敗:', error);
    return NextResponse.redirect(
      new URL('/camping/checkout/ecpay/cancel', request.url),
      303
    );
  } finally {
    connection.release();
  }
} 