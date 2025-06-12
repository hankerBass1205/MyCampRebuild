import { NextResponse } from 'next/server';
import { confirmLinePayPayment } from '@/utils/payment/linepay';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request) {
  const connection = await pool.getConnection();
  
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const orderId = searchParams.get('orderId');

    // console.log('收到的訂單ID:', orderId);
    // console.log('交易ID:', transactionId);

    const cookieStore = await cookies();
    const orderDataCookie = await cookieStore.get(`order_${orderId}`);
    const orderData = JSON.parse(orderDataCookie.value);

    // console.log('訂單資料:', orderData);

    const confirmResult = await confirmLinePayPayment({
      transactionId,
      amount: orderData.amount
    });

    // console.log('LINE Pay 確認回應:', confirmResult);

    if (confirmResult.returnCode === '0000') {
      await connection.beginTransaction();
      
      try {
        // 為每個購物車項目建立預訂記錄
        for (const item of orderData.cartItems) {
          const insertParams = [
            orderId,                           // order_id
            item.optionId,                    // option_id
            orderData.userId,                 // user_id
            'confirmed',                      // status
            item.quantity || 1,               // quantity
            item.total_price,                 // total_price
            orderData.formData.contact_name,  // contact_name
            orderData.formData.contact_phone, // contact_phone
            orderData.formData.contact_email, // contact_email
            'paid',                          // payment_status
            'line_pay',                      // payment_method
            Date.now(),                      // timestamp_id
            item.nights || 1                 // nights
          ];

          // console.log('插入參數:', insertParams); // 檢查參數

          await connection.execute(
            `INSERT INTO bookings (
              order_id,
              option_id,
              user_id,
              status,
              quantity,
              total_price,
              contact_name,
              contact_phone,
              contact_email,
              payment_status,
              payment_method,
              timestamp_id,
              nights
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            insertParams
          );
        }

        // 清空購物車
        await connection.execute(
          'DELETE FROM activity_cart WHERE user_id = ?',
          [orderData.userId]
        );

        await connection.commit();
        await cookieStore.delete(`order_${orderId}`);

        // 返回成功頁面
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>付款完成</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  background-color: #f7f7f7;
                }
                .success-container {
                  text-align: center;
                  padding: 2rem;
                  background: white;
                  border-radius: 1rem;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .success-icon {
                  color: #4CAF50;
                  font-size: 3rem;
                  margin-bottom: 1rem;
                }
                .countdown {
                  color: #4CAF50;
                  font-weight: bold;
                }
              </style>
            </head>
            <body>
              <div class="success-container">
                <div class="success-icon">✓</div>
                <h2>付款完成</h2>
                <p>訂單已成功建立</p>
                <p>視窗將在 <span class="countdown">3</span> 秒後關閉</p>
              </div>
              <script>
                let count = 3;
                const countdown = document.querySelector('.countdown');
                
                const timer = setInterval(() => {
                  count--;
                  countdown.textContent = count;
                  
                  if (count <= 0) {
                    clearInterval(timer);
                    window.opener.postMessage({
                      type: 'LINE_PAY_SUCCESS',
                      orderId: '${orderId}'
                    }, '*');
                    window.close();
                  }
                }, 1000);
              </script>
            </body>
          </html>
        `, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        });

      } catch (error) {
        console.error('寫入訂單失敗:', error);
        await connection.rollback();
        throw error;
      }
    } else {
      throw new Error('LINE Pay 付款確認失敗');
    }

  } catch (error) {
    console.error('確認付款失敗:', error);
    return new Response(`
      <script>
        window.opener.postMessage('LINE_PAY_FAILED', '*');
        window.close();
      </script>
    `, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } finally {
    connection.release();
  }
}

// 計算天數的輔助函數
function calculateNights(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}