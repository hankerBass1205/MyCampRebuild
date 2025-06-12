import { NextResponse } from "next/server";
import { confirmLinePayPayment } from "@/utils/payment/linepay2";
import db from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(req) {
  const connection = await db.getConnection();

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");
    const orderId = searchParams.get("orderId");

    if (!transactionId || !orderId) {
      throw new Error("❌ 缺少必要參數");
    }

    // console.log(
    //   `📦 交易確認中: transactionId=${transactionId}, orderId=${orderId}`
    // );

    // 從Cookie獲取訂單資料
    const cookieStore = await cookies();
    const orderDataCookie = await cookieStore.get(`order_${orderId}`);

    if (!orderDataCookie) {
      throw new Error(`❌ 找不到訂單資訊，cookie key: order_${orderId}`);
    }

    const orderData = JSON.parse(orderDataCookie.value);
    // console.log("📦 解析的Cookie訂單資料:", orderData);

    // 確保amount有效
    const totalAmount = parseInt(orderData.amount);
    if (isNaN(totalAmount)) {
      throw new Error("❌ 付款確認失敗: amount無效");
    }

    // 確認LinePay付款
    const confirmResult = await confirmLinePayPayment(
      transactionId,
      totalAmount
    );
    if (confirmResult.returnCode !== "0000") {
      console.error("❌ LINE Pay確認失敗:", confirmResult);
      throw new Error(`❌ 付款確認失敗: ${confirmResult.returnMessage}`);
    }

    // console.log("✅ LINE Pay確認回應:", confirmResult);

    // 更新資料庫
    await connection.beginTransaction();
    try {
      await connection.execute(
        `UPDATE product_orders 
         SET payment_status = 1, 
             payment_method = 'line_pay', 
             total_amount = ?
         WHERE order_id = ?`,
        [totalAmount, orderId]
      );
      await connection.commit();

      // 刪除Cookie
      await cookieStore.delete(`order_${orderId}`);
      // console.log(`✅ 訂單 ${orderId} 付款成功！`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    // 跳轉到訂單確認頁面
    return NextResponse.redirect(
      `${process.env.PRODUCT_LINEPAY_RETURN_HOST}/product-cart/order-confirmation/${orderId}`
    );
  } catch (error) {
    console.error("❌ 確認付款失敗:", error);

    // 失敗時返回錯誤頁面
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>付款失敗</title>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.location.href = '/camping/checkout/linepay/cancel';
              }, 2000);
            };
          </script>
        </head>
        <body>
          <div style="display:flex;justify-content:center;align-items:center;height:100vh;">
            <h1>❌ 付款失敗: ${error.message}</h1>
          </div>
        </body>
      </html>`,
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 500,
      }
    );
  } finally {
    connection.release();
  }
}
