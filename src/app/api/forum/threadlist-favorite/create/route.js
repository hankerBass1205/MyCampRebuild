import mysql from 'mysql2/promise';
import { NextResponse } from "next/server";

export async function POST(req) {
    // 建立資料庫連線
    const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'camp_explorer_db',
    })
  try {
    const { user_id, forum_id } = await req.json();

    if (!user_id || !forum_id) {
      return NextResponse.json({ success: false, message: "缺少必要參數" }, { status: 400 });
    }

    await db.query("INSERT INTO forum_favorites (user_id, forum_id) VALUES (?, ?)", [user_id, forum_id]);

    return NextResponse.json({ success: true, message: "收藏成功" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "伺服器錯誤" }, { status: 500 });
  }
}
