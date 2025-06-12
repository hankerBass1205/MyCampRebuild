import { NextResponse } from "next/server";
import { createECPayPayment } from "@/utils/payment/ecpay";
import pool from "@/lib/db";

export async function POST(req) {
  const connection = await pool.getConnection();

  try {
    const { orderId } = await req.json();

    // ✅ **查詢訂單資訊**
    const [orderRows] = await connection.execute(
      "SELECT order_id, total_amount, shipping_fee FROM product_orders WHERE order_id = ?",
      [orderId]
    );

    if (orderRows.length === 0) {
      throw new Error("❌ 找不到訂單資訊");
    }

    const order = orderRows[0];

    // ✅ **查詢訂單商品**
    const [orderItems] = await connection.execute(
      `SELECT pod.product_id, pod.quantity, pod.price, p.name AS product_name
       FROM product_order_details pod
       JOIN products p ON pod.product_id = p.id
       WHERE pod.order_id = ?`,
      [orderId]
    );

    if (orderItems.length === 0) {
      throw new Error("❌ 訂單沒有商品資訊");
    }

    // ✅ **建立付款請求資料**
    const orderData = {
      orderId: order.order_id.toString(),
      totalAmount: parseInt(order.total_amount).toString(),
      shippingFee: parseInt(order.shipping_fee).toString() || "0",
      items: orderItems.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: parseInt(item.price),
      })),
    };

    // console.log("📦 ECPay 付款請求資料:", orderData);

    // ✅ **產生 ECPay 付款表單**
    const formHtml = createECPayPayment(orderData);

    // console.log("📦 產生的 ECPay 付款表單:", formHtml);

    // ✅ **回傳 HTML Form 給前端**
    return NextResponse.json({ success: true, form: formHtml });
  } catch (error) {
    console.error("❌ ECPay 付款請求失敗:", error);
    return NextResponse.json({ error: "付款請求失敗" }, { status: 500 });
  } finally {
    connection.release();
  }
}
