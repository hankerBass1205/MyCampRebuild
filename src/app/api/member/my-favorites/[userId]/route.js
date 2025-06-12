import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    // 查詢用戶的收藏文章及其分類名稱
    const query = `
      SELECT DISTINCT
        a.id,
        a.article_category,
        ac.name AS article_category_name,
        a.title,
        a.subtitle,
        a.content,
        a.image_name,
        a.image_description,
        a.status,
        a.sort_order,
        a.views,
        a.created_at,
        a.updated_at,
        a.created_by,
        a.updated_by,
        u.name, 
        u.gender,
        u.address,
        u.avatar,
        u.last_login,
        u.status AS user_status,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        u.login_type
      FROM articles a
      JOIN article_like al ON a.id = al.article_id
      JOIN users u ON a.created_by = u.id
      JOIN article_categories ac ON a.article_category = ac.id
      WHERE al.user_id = ?
      GROUP BY a.id
    `;
    const [rows] = await db.execute(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到收藏文章" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取收藏文章失敗:", error);
    return NextResponse.json({ error: "獲取收藏文章失敗" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = params;
    const { articleId } = await request.json();

    if (!articleId) {
      return NextResponse.json({ error: "缺少必要的參數" }, { status: 400 });
    }

    // 添加收藏文章
    const query = `
      INSERT INTO article_like (user_id, article_id)
      VALUES (?, ?)
    `;
    const [result] = await db.execute(query, [userId, articleId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "添加收藏文章失敗" }, { status: 500 });
    }

    return NextResponse.json({ message: "收藏文章添加成功" });
  } catch (error) {
    console.error("添加收藏文章失敗:", error);
    return NextResponse.json({ error: "添加收藏文章失敗" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = params;
    const { articleId } = await request.json();

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
