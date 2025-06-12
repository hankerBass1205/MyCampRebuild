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

    const userId = formData.get("userId");
    const userName = formData.get("userName");
    const userAvatar = formData.get("userAvatar");
    const categoryId = formData.get("category");
    const typeId = formData.get("titleType");
    const title = formData.get("threadTitle");
    const content = formData.get("threadContent");
    const file = formData.get("threadImage");

    console.log('Form Data:', {
      userId, userName, userAvatar, categoryId, typeId, title, content, file
    });

    // 檢查必填欄位
    if (!userId || !categoryId || !typeId || !title || !content) {
      return NextResponse.json({ success: false, message: "請填寫所有必要欄位" }, { status: 400 });
    }

    let imagePath = "";

    // 檢查是否有圖片檔案
    if (file && file !== 'undefined' && file !== '') {
      console.log('Received file:', file);

      // 直接使用路徑，不需要檢查 file.name
      const ext = path.extname(file).toLowerCase();
      const allowedExts = [".jpg", ".jpeg", ".png"];
      
      if (!allowedExts.includes(ext)) {
        console.log('Invalid file extension:', ext);
        return NextResponse.json({ success: false, message: "圖片格式錯誤，只允許 jpg, jpeg, png" }, { status: 400 });
      }

      // 儲存圖片路徑
      imagePath = file;
      console.log('Image path stored:', imagePath);
    } else {
      // 如果沒有上傳圖片，則使用 typeId 選擇預設圖片
      console.log('No file uploaded. Using default image for type:', typeId);

      const defaultImages = {
        '1': '/images/forum/liImg_sample_01.png',
        '2': '/images/forum/liImg_sample_02.png',
        '3': '/images/forum/liImg_sample_03.png',
        '4': '/images/forum/liImg_sample_04.png',
        '5': '/images/forum/liImg_sample_05.png'
      };

      imagePath = defaultImages[typeId] || '/images/forum/liImg_sample_01.png'; // 預設為第 1 項
      console.log('Using default image path:', imagePath);
    }

    // **插入新文章**
    const [result] = await db.execute(
      `INSERT INTO forum_data 
      (user_id, user_name, user_avatar, category_id, type_id, thread_title, thread_content, thread_image, created_at, updated_at, floor, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1, 1)`,
      [userId, userName, userAvatar, categoryId, typeId, title, content, imagePath]
    );

    console.log('Post inserted with ID:', result.insertId);

    return NextResponse.json({ success: true, message: "文章發布成功", threadId: result.insertId }, { status: 201 });

  } catch (error) {
    console.error("發文失敗:", error);
    return NextResponse.json({ success: false, message: "發文失敗，請稍後再試" }, { status: 500 });
  }
}
