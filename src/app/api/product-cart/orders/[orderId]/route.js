import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  try {
    const { orderId } = await params; // ✅ 確保 `params` 是 await
    const session = await getServerSession(authOptions);

    // 0. 確認是否登入
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    // 1. 確保 `orderId` 存在
    if (!orderId) {
      return NextResponse.json({ error: "無效的訂單 ID" }, { status: 400 });
    }

    // 2. 查詢 `product_orders` 主表
    const [order] = await db.execute(
      `SELECT * FROM product_orders WHERE order_id = ?`,
      [orderId]
    );

    if (!order.length) {
      return NextResponse.json({ error: "找不到訂單" }, { status: 404 });
    }

    if (order[0].member_id !== session.user.id) {
      return NextResponse.json({ error: "沒有權限" }, { status: 403 });
    }

    // 3. 查詢 `product_order_details` 明細，並且連結 `product_images`抓到主圖片
    const [items] = await db.execute(
      `
      SELECT 
        d.product_id,
        d.quantity,
        d.price AS product_price,
        p.name AS product_name, 
        COALESCE(img.image_path, '/images/default-product.jpg') AS product_image
      FROM product_order_details d
      LEFT JOIN products p ON d.product_id = p.id  
      LEFT JOIN product_images img 
        ON d.product_id = img.product_id AND img.is_main = 1
      WHERE d.order_id = ?
    `,
      [orderId]
    );

    // 4. 回傳訂單資訊
    return NextResponse.json({ ...order[0], items });
  } catch (error) {
    console.error("獲取訂單失敗:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
