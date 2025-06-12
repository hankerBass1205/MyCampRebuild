import mysql from 'mysql2/promise';
import { NextResponse } from "next/server";

export async function DELETE(req) {
      // 建立資料庫連線
      const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'camp_explorer_db',
        })
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const forumId = searchParams.get("forum_id");

    if (!userId || !forumId) {
      return NextResponse.json({ success: false, message: "缺少必要參數" }, { status: 400 });
    }

    await db.query("DELETE FROM forum_favorites WHERE user_id = ? AND forum_id = ?", [userId, forumId]);

    return NextResponse.json({ success: true, message: "取消收藏成功" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "伺服器錯誤" }, { status: 500 });
  }
}
