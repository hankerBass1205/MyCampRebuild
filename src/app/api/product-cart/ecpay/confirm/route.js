import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req) {
  const connection = await db.getConnection();

  try {
    const data = await req.formData();
    const result = Object.fromEntries(data);

    // console.log("📦 ECPay 回傳數據:", result);

    // **✅ 優先從 CustomField1 取得 `orderId`**
    let orderId = result.CustomField1 ? result.CustomField1.trim() : null;

    // **🚨 CustomField1 為空，則使用 MerchantTradeNo 解析**
    if (!orderId || isNaN(orderId) || orderId.length > 10) {
      console.warn(`⚠️ CustomField1 無效 (${orderId})，改用 MerchantTradeNo`);
      const orderIdMatch = result.MerchantTradeNo.match(/^EC(\d+)/);
      orderId = orderIdMatch ? orderIdMatch[1] : null;
    }

    if (!orderId) {
      throw new Error("❌ 找不到有效的訂單 ID");
    }

    // ✅ **更新訂單狀態**
    await connection.execute(
      `UPDATE product_orders SET payment_status = 1 WHERE order_id = ?`,
      [orderId]
    );

    console.log(`✅ 訂單 ${orderId} 付款成功，準備跳轉`);

    // ✅ **讓瀏覽器自動跳轉到訂單確認頁面**
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/product-cart/order-confirmation/${orderId}`,
      },
    });
  } catch (error) {
    console.error("❌ 確認付款失敗:", error);
    return new Response("付款確認失敗", { status: 500 });
  } finally {
    connection.release();
  }
}
