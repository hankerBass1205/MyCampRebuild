import { NextResponse } from "next/server";

// db連線
import db from "@/lib/db";
// 導入當前session抓取使用者
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      cartItems,
      deliveryMethod,
      paymentMethod,
      customerInfo,
      totalAmount,
      selectedCoupon,
      couponDiscount,
    } = body;

    let shippingFee;
    if (deliveryMethod === "home_delivery") {
      shippingFee = 100;
    } else if (deliveryMethod === "7-11") {
      shippingFee = 60;
    }

    // 插入訂單主檔
    const [orderResult] = await db.execute(
      `INSERT INTO product_orders (
        member_id, recipient_name, recipient_phone, recipient_email, 
        shipping_address, delivery_method,shipping_fee, payment_method, used_coupon,coupon_discount,note, total_amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?, ?, NOW())`,
      [
        userId,
        customerInfo.name,
        customerInfo.phone,
        customerInfo.email,
        customerInfo.address,
        deliveryMethod,
        shippingFee,
        paymentMethod,
        selectedCoupon?.name ? selectedCoupon.name : null,
        couponDiscount,
        customerInfo.note,
        totalAmount,
      ]
    );

    const newOrderId = orderResult.insertId;

    for (const cartItem of cartItems) {
      console.log("🔍 訂單商品:", cartItem);

      // 確保 product_id 和 quantity 是有效的
      if (!cartItem.product_id || !cartItem.quantity) {
        console.error("❌ 錯誤：product_id 或 quantity 無效");
        continue;
      }

      // 插入訂單明細
      await db.execute(
        `INSERT INTO product_order_details (order_id, product_id, quantity, price, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [
          newOrderId,
          cartItem.product_id,
          cartItem.quantity,
          cartItem.product_price,
        ]
      );

      // 扣除庫存
      const [updateResult] = await db.execute(
        `UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?`,
        [cartItem.quantity, cartItem.product_id]
      );

      console.log("🔍 庫存更新影響行數:", updateResult.affectedRows);

      if (updateResult.affectedRows === 0) {
        console.error(`❌ 商品 ID ${cartItem.product_id} 扣庫存失敗`);
      }
    }

    // 清空購物車
    await db.execute(`DELETE FROM product_cart_items WHERE user_id = ?`, [
      userId,
    ]);

    //若有使用優惠卷則改變狀態
    if (selectedCoupon) {
      await db.execute(
        ` UPDATE user_coupons SET coupon_status = 0 WHERE id = ?`,
        [selectedCoupon.id]
      );
    }

    return NextResponse.json({ success: true, orderId: newOrderId });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}

// 呼叫接收此API的函式
// const handleSubmitOrder = async (e) => {
//     e.preventDefault(); // 阻止表單預設行為 (避免頁面刷新或跳轉)

//     // 組合要送出的資料
//     const payload = {
//       cartItems: cart, // 購物車明細
//       deliveryMethod, // 配送方式
//       paymentMethod, // 付款方式
//       customerInfo, // 顧客表單資訊
//       subtotal, // 商品小計
//     };

//     try {
//       // 呼叫後端 API: POST /api/orders
//       const res = await fetch("/api/orders", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) {
//         // 如果響應狀態不是 2xx，視為失敗
//         throw new Error("下單失敗，請稍後再試");
//       }

//       // 若成功，導向「訂單確認」頁面
//       router.push("/product-cart/order-confirmation");
//     } catch (error) {
//       // 顯示錯誤訊息或做其他錯誤處理
//       alert(error.message);
//     }
//   };
