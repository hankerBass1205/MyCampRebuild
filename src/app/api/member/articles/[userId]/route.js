import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    // 查詢用戶的文章及其分類名稱
    const query = `
      SELECT 
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
      JOIN users u ON a.created_by = u.id
      JOIN article_categories ac ON a.article_category = ac.id
      WHERE a.created_by = ?
    `;
    const [rows] = await db.execute(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到文章" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取文章失敗:", error);
    return NextResponse.json({ error: "獲取文章失敗" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId } = params;
    const { id, content } = await request.json();

    if (!id || !content) {
      return NextResponse.json({ error: "缺少必要的參數" }, { status: 400 });
    }

    // 更新文章內容
    const query = `
      UPDATE articles
      SET content = ?, updated_at = NOW()
      WHERE id = ? AND created_by = ?
    `;
    const [result] = await db.execute(query, [content, id, userId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "更新文章失敗" }, { status: 404 });
    }

    return NextResponse.json({ message: "文章更新成功" });
  } catch (error) {
    console.error("更新文章失敗:", error);
    return NextResponse.json({ error: "更新文章失敗" }, { status: 500 });
  }
}
