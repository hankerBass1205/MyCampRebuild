import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function DELETE(request, { params }) {
  try {
    const { userId, articleId } = await params;

    if (!articleId) {
      return NextResponse.json({ error: "缺少必要的參數" }, { status: 400 });
    }

    // 刪除收藏文章
    const query = `
      DELETE FROM article_like
      WHERE user_id = ? AND article_id = ?
    `;
    const [result] = await db.execute(query, [userId, articleId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "刪除收藏文章失敗" }, { status: 404 });
    }

    return NextResponse.json({ message: "收藏文章刪除成功" });
  } catch (error) {
    console.error("刪除收藏文章失敗:", error);
    return NextResponse.json({ error: "刪除收藏文章失敗" }, { status: 500 });
  }
}
