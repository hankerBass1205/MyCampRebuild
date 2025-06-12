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
    // 獲取表單資料
    const formData = await req.formData();
    console.log('Received formData:', formData);

    const threadId = formData.get("threadId")
    const userId = formData.get("userId");
    const userName = formData.get("userName");
    const userAvatar = formData.get("userAvatar");
    const content = formData.get("threadContent");
 

    console.log('Form Data:', {
      userId, userName, userAvatar, content
    });

    // 檢查必填欄位
    if (!userId || !content || !threadId) {
      return NextResponse.json({ success: false, message: "請填寫所有必要欄位" }, { status: 400 });
    }

    // **查找當前最大樓層**
    const [floorResult] = await db.execute(
        `SELECT MAX(floor) AS maxFloor FROM forum_reply_data WHERE forum_id = ?`,
        [threadId]
    );

    // 強制 maxFloor 轉換為數字
    let maxFloor = Number(floorResult[0].maxFloor) || 1; // 若為 null 則預設為 1
    let nextFloor = maxFloor + 1;


    // **插入新回覆**
    const [result] = await db.execute(
      `INSERT INTO forum_reply_data 
      (	forum_id, parent_id, user_id, user_name, user_avatar, thread_content, created_at, updated_at, floor, status) 
      VALUES (?, NULL, ?, ?, ?, ?, NOW(), NOW(), ?, 1)`,
      [threadId, userId, userName, userAvatar, content, nextFloor]
    );

    console.log('Post inserted with ID:', result.insertId);

    return NextResponse.json({ success: true, message: "回覆發布成功", threadId: result.insertId }, { status: 201 });

  } catch (error) {
    console.error("發文失敗:", error);
    return NextResponse.json({ success: false, message: "回覆失敗，請稍後再試" }, { status: 500 });
  }
}
