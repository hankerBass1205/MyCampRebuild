import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import { writeFile } from "fs/promises";
import path from "path";

// 建立資料庫連線
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "camp_explorer_db",
});

export async function POST(req) {
    try {
        const { threadId, categoryId, typeId, threadImg, title, content, status } = await req.json()

        if (!threadId) {
            return Response.json({ success: false, message: '缺少文章 ID' }, { status: 400 })
        }

        // 更新文章內容
        const updateQuery = `
            UPDATE forum_data 
            SET category_id = ?, type_id = ?, thread_image = ?, thread_title = ?, thread_content = ?, status = ?, updated_at = NOW() 
            WHERE id = ?
        `

        const values = [categoryId, typeId, threadImg, title, content, status, threadId]
        await db.query(updateQuery, values)

        return Response.json({ success: true, message: '文章更新成功' }, { status: 200 })
    } catch (error) {
        console.error('更新文章時發生錯誤:', error)
        return Response.json({ success: false, message: '內部伺服器錯誤' }, { status: 500 })
    }
}
