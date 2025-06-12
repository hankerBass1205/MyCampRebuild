// app/api/product-cart/reviews/[reviewId]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import db from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const { reviewId } = await params;
    const { content, rating } = await request.json();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const userId = session.user.id;

    const [review] = await db.execute(
      `SELECT user_id FROM user_discussions WHERE id = ? AND type = 'product'`,
      [reviewId]
    );
    if (review.length === 0) {
      return NextResponse.json({ error: "評論不存在" }, { status: 404 });
    }
    if (review[0].user_id !== userId) {
      return NextResponse.json({ error: "無權編輯" }, { status: 403 });
    }

    await db.execute(
      `UPDATE user_discussions SET content = ?, rating = ? WHERE id = ?`,
      [content, rating, reviewId]
    );

    const [updatedReview] = await db.execute(
      `SELECT id, user_id, content, rating, created_at FROM user_discussions WHERE id = ?`,
      [reviewId]
    );

    return NextResponse.json(updatedReview[0]);
  } catch (error) {
    console.error("更新評論失敗:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { reviewId } = await params;

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const userId = session.user.id;

    const [review] = await db.execute(
      `SELECT user_id FROM user_discussions WHERE id = ? AND type = 'product'`,
      [reviewId]
    );
    if (review.length === 0) {
      return NextResponse.json({ error: "評論不存在" }, { status: 404 });
    }
    if (review[0].user_id !== userId) {
      return NextResponse.json({ error: "無權刪除" }, { status: 403 });
    }

    await db.execute(`DELETE FROM user_discussions WHERE id = ?`, [reviewId]);

    return NextResponse.json({ success: true, message: "評論已刪除" });
  } catch (error) {
    console.error("刪除評論失敗:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
