import { NextResponse } from "next/server";
import { createLinePayRequest } from "@/utils/payment/linepay2";
import db from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req) {
  const connection = await db.getConnection();

  try {
    const { orderId } = await req.json();

    const [orderRows] = await connection.execute(
      "SELECT order_id, total_amount, shipping_fee, coupon_discount FROM product_orders WHERE order_id = ?",
      [orderId]
    );

    if (orderRows.length === 0) {
      throw new Error("❌ 找不到訂單資訊");
    }

    const order = orderRows[0];

    const [orderItems] = await connection.execute(
      `SELECT pod.product_id, pod.quantity, pod.price, p.name AS product_name
       FROM product_order_details pod
       JOIN products p ON pod.product_id = p.id
       WHERE pod.order_id = ?`,
      [orderId]
    );

    if (!orderItems || orderItems.length === 0) {
      throw new Error(`❌ 訂單 ${order.order_id} 沒有商品`);
    }

    // console.log("orderItems:", orderItems);

    const productTotal = orderItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
    const shippingFee = Number(order.shipping_fee || 0);
    const couponDiscount = Number(order.coupon_discount || 0);
    const finalAmount = productTotal + shippingFee - couponDiscount;

    const orderData = {
      orderId: `${order.order_id}-${Date.now()}`,
      amount: Math.floor(finalAmount),
      currency: "TWD",
      packages: [
        {
          id: `package-${order.order_id}`,
          name: "商品訂單",
          amount: Math.floor(finalAmount),
          products: [
            ...orderItems.map((item) => ({
              id: item.product_id.toString(),
              name: item.product_name || "商品",
              quantity: Math.floor(Number(item.quantity)),
              price: Math.floor(Number(item.price)),
            })),
            ...(shippingFee > 0
              ? [
                  {
                    id: "SHIPPING_FEE",
                    name: "運費",
                    quantity: 1,
                    price: Math.floor(shippingFee),
                  },
                ]
              : []),
            ...(couponDiscount > 0
              ? [
                  {
                    id: "COUPON_DISCOUNT",
                    name: "優惠折扣",
                    quantity: 1,
                    price: -Math.floor(couponDiscount),
                  },
                ]
              : []),
          ],
        },
      ],
      redirectUrls: {
        confirmUrl: `${process.env.PRODUCT_LINEPAY_RETURN_HOST}${process.env.PRODUCT_LINEPAY_RETURN_CONFIRM_URL}?orderId=${order.order_id}`,
        cancelUrl: `${process.env.PRODUCT_LINEPAY_RETURN_HOST}${process.env.PRODUCT_LINEPAY_RETURN_CANCEL_URL}`,
      },
    };

    const packageTotal = orderData.packages[0].products.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );
    if (packageTotal !== orderData.amount) {
      throw new Error(
        `金額不一致: products總和=${packageTotal}, amount=${orderData.amount}`
      );
    }

    // console.log("送進API前的orderData:", JSON.stringify(orderData, null, 2));
    const linePayResult = await createLinePayRequest(orderData, true);

    const cookieStore = await cookies();
    await cookieStore.set(`order_${orderId}`, JSON.stringify(orderData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 15,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: linePayResult.paymentUrl,
    });
  } catch (error) {
    console.error("❌ LINE Pay 失敗:", error.message, error.stack);
    return NextResponse.json(
      { error: error.message || "付款請求失敗" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
