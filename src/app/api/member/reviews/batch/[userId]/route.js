import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request, { params }) {
  try {
    const { userId } = await params;
    const { reviews } = await request.json();

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { message: "沒有提供評論資料" },
        { status: 400 }
      );
    }

    // 獲取第一個評論的訂單ID (所有評論都應該屬於同一個訂單)
    const orderId = reviews[0].orderId;

    // 開始資料庫交易
    await db.query("START TRANSACTION");

    // 檢查這些商品是否已經評論過
    for (const review of reviews) {
      const [existingReview] = await db.query(
        `SELECT id FROM user_discussions 
         WHERE user_id = ? AND item_meta = ? AND item_id = ? AND type = 'product'`,
        [userId, `order_id:${orderId}`, review.itemId]
      );

      if (existingReview.length > 0) {
        await db.query("ROLLBACK");
        return NextResponse.json(
          { message: `商品(ID:${review.itemId})已經評價過` },
          { status: 400 }
        );
      }
    }

    // 批量插入評論
    for (const review of reviews) {
      await db.query(
        `INSERT INTO user_discussions 
         (user_id, type, item_id, content, rating, item_meta, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          review.type,
          review.itemId,
          review.content,
          review.rating,
          `order_id:${orderId}`, // 將訂單ID儲存在 item_meta 欄位
        ]
      );
    }

    // 提交交易
    await db.query("COMMIT");

    return NextResponse.json({ success: true, message: "評論提交成功" });
  } catch (error) {
    // 回滾交易
    await db.query("ROLLBACK");
    console.error("批量提交評論失敗:", error);
    return NextResponse.json(
      { error: "提交評論失敗", message: error.message },
      { status: 500 }
    );
  }
}
