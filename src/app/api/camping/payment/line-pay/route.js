import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import pool from "@/lib/db";
import { createLinePayRequest } from "@/utils/payment/linepay";
import { cookies } from "next/headers";

// LINE Pay API 設定
// const LINE_PAY_CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID;
// const LINE_PAY_CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET;
// const LINE_PAY_VERSION = '2.3';
// const LINE_PAY_SANDBOX_URL = 'https://sandbox-api-pay.line.me';

// LINE Pay 付款
export async function POST(request) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = await request.json();
    // console.log("收到的表單資料:", body);
    // console.log("購物車項目:", body.orderData.items);

    const orderId = Date.now();  // 直接使用數字

    // 儲存訂單資訊到 cookie
    const cookieStore = await cookies();
    await cookieStore.set(
      `order_${orderId}`,
      JSON.stringify({
        userId: session.user.id,
        cartItems: body.orderData.items,
        formData: {
          contact_name: body.orderData.contactInfo.contactName,
          contact_phone: body.orderData.contactInfo.contactPhone,
          contact_email: body.orderData.contactInfo.contactEmail,
        },
        amount: body.amount,
      }),
      {
        path: "/",
        secure: true,
        sameSite: "lax",
        maxAge: 3600,
      }
    );

    // console.log("LINE Pay 請求的 orderId:", orderId);

    // LINE Pay 請求
    const linePayResult = await createLinePayRequest({
      orderId: orderId,
      amount: body.amount,
      currency: body.currency,
      packages: [
        {
          id: "1",
          amount: body.amount,
          products: body.orderData.items.map((item) => {
            // console.log("處理項目:", item); // 檢查每個項目
            return {
              id: item.optionId.toString(),
              name: `營位預訂 #${item.optionId}`,
              quantity: item.quantity,
              price: body.amount, // 使用訂單總金額
            };
          }),
        },
      ],
      redirectUrls: {
        confirmUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/camping/payment/line-pay/confirm?orderId=${orderId}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/camping/checkout/linepay/cancel`,
      },
    });

    if (linePayResult.success) {
      return NextResponse.json({
        success: true,
        web: linePayResult.paymentUrl,
        app: linePayResult.appPaymentUrl,
        orderId: orderId,
      });
    } else {
      throw new Error("LINE Pay 請求失敗");
    }
  } catch (error) {
    console.error("LINE Pay 處理失敗:", error);
    return NextResponse.json({ error: "處理失敗" }, { status: 500 });
  } finally {
    connection.release();
  }
}
