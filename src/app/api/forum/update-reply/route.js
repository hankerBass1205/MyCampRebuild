import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { writeFile } from 'fs/promises'
import path from 'path'

// 建立資料庫連線
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'camp_explorer_db',
})

export async function POST(req) {
  try {
    const { threadId, floor, content, status } = await req.json()

    if (!threadId || !floor) {
      return NextResponse.json(
        { success: false, message: '缺少文章 ID 或樓層' },
        { status: 400 }
      )
    }

    // 更新文章內容
    const updateQuery = `
            UPDATE forum_reply_data 
            SET thread_content = ?, status = ?, updated_at = NOW() 
            WHERE id = ?
            AND floor = ?
        `

    const values = [content, status, threadId, floor]
    await db.query(updateQuery, values)

    return Response.json(
      { success: true, message: '回覆更新成功' },
      { status: 200 }
    )
  } catch (error) {
    console.error('更新文章時發生錯誤:', error)
    return Response.json(
      { success: false, message: '內部伺服器錯誤' },
      { status: 500 }
    )
  }
}
