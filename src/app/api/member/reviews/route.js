// app/api/member/reviews/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    // 驗證用戶
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "未授權" }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, product_id, rating, content } = body;

    // 輸入驗證
    if (!order_id || !product_id || !rating) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 });
    }

    // 驗證訂單歸屬
    const [order] = await db.query(
      `SELECT member_id FROM product_orders 
       WHERE order_id = ?`,
      [order_id]
    );

    if (order.length === 0 || order[0].member_id !== session.user.userId) {
      return NextResponse.json({ error: "訂單驗證失敗" }, { status: 403 });
    }

    // 檢查是否已評論
    const [existing] = await db.query(
      `SELECT id FROM user_discussions 
       WHERE user_id = ? 
         AND order_id = ?
         AND item_id = ?`,
      [session.user.userId, order_id, product_id]
    );

    // Upsert操作
    const query =
      existing.length > 0
        ? `UPDATE user_discussions SET
         rating = ?,
         content = ?,
         updated_at = NOW()
       WHERE id = ?`
        : `INSERT INTO user_discussions (
         user_id, type, item_id, order_id, 
         rating, content, status, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`;

    const params =
      existing.length > 0
        ? [rating, content, existing[0].id]
        : [session.user.userId, "product", product_id, order_id, rating, content];

    await db.query(query, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("提交評論失敗:", error);
    return NextResponse.json(
      { error: "伺服器錯誤: " + error.message },
      { status: 500 }
    );
  }
}
