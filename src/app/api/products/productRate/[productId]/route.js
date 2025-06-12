import { NextResponse } from "next/server";

import db from "@/lib/db"; // 連接 MySQL

export async function GET(request, { params }) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "缺少商品 ID" },
        { status: 400 }
      );
    }

    // 獲取該商品的評論和平均評分
    const [reviews] = await db.execute(
      `SELECT ud.id, ud.user_id, u.name AS user_name, ud.content, ud.rating, ud.created_at
       FROM user_discussions ud
       JOIN users u ON ud.user_id = u.id
       WHERE ud.item_id = ? AND ud.type = 'product' AND ud.status = 1
       ORDER BY ud.created_at DESC`,
      [productId]
    );

    // 計算平均評分
    const [averageResult] = await db.execute(
      `SELECT AVG(rating) AS avg_rating, COUNT(*) AS total_reviews
       FROM user_discussions
       WHERE item_id = ? AND type = 'product' AND rating IS NOT NULL`,
      [productId]
    );

    return NextResponse.json({
      success: true,
      reviews,
      avg_rating: averageResult[0]?.avg_rating || 0,
      total_reviews: averageResult[0]?.total_reviews || 0,
    });
  } catch (error) {
    console.error("獲取評論失敗:", error);
    return NextResponse.json(
      { success: false, message: "獲取評論失敗" },
      { status: 500 }
    );
  }
}
