import { NextResponse } from "next/server";
import db from "@/lib/db"; // 連接 MySQL
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const userId = session.user.id;
    const userName = session.user.name; // ✅ 確保用戶名
    const { product_id, rating, content } = await request.json();

    if (!product_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "評分範圍必須在 1-5" },
        { status: 400 }
      );
    }

    let newReviewId;

    // 檢查會員是否已經評論過此商品
    const [existingReview] = await db.execute(
      `SELECT id FROM user_discussions WHERE user_id = ? AND item_id = ? AND type = 'product'`,
      [userId, product_id]
    );

    if (existingReview.length > 0) {
      // ✅ 更新評論
      await db.execute(
        `UPDATE user_discussions 
         SET rating = ?, content = ?, updated_at = NOW() 
         WHERE user_id = ? AND item_id = ? AND type = 'product'`,
        [rating, content, userId, product_id]
      );

      newReviewId = existingReview[0].id; // ✅ 取得原本的評論 ID
    } else {
      // ✅ 新增評論
      const [result] = await db.execute(
        `INSERT INTO user_discussions (user_id, item_id, type, content, rating, created_at, updated_at, status) 
         VALUES (?, ?, 'product', ?, ?, NOW(), NOW(), 1)`,
        [userId, product_id, content, rating]
      );

      newReviewId = result.insertId; // ✅ 取得新評論的 ID
    }

    // ✅ 查詢最新的評論資訊（包含用戶名稱）
    const [newReview] = await db.execute(
      `SELECT 
        ud.id, 
        ud.user_id, 
        u.name AS user_name, 
        ud.content, 
        ud.rating, 
        ud.created_at
      FROM user_discussions ud
      JOIN users u ON ud.user_id = u.id
      WHERE ud.id = ?`,
      [newReviewId]
    );

    return NextResponse.json({ success: true, review: newReview[0] });
  } catch (error) {
    console.error("提交評論失敗:", error);
    return NextResponse.json(
      { success: false, message: "提交評論失敗" },
      { status: 500 }
    );
  }
}
