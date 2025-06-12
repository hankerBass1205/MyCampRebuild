import { writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

// 允許的圖片格式
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

// 設定圖片上傳的路徑 (存放在 public/uploads/forum/title/)
const uploadDir = path.join(process.cwd(), 'public/uploads/forum/title/');

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('image'); // 取得上傳的圖片

    if (!file) {
      return NextResponse.json({ success: false, message: '未選擇圖片' }, { status: 400 });
    }

    // 確保是允許的圖片格式
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: '不支援的圖片格式' }, { status: 400 });
    }

    // 產生時間戳記檔名 (YYYYMMDDHHMMSS_random.jpg)
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomStr}.${fileExt}`;

    // 設定儲存路徑
    const filePath = path.join(uploadDir, fileName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 寫入檔案
    await writeFile(filePath, fileBuffer);

    // 回傳圖片 URL
    const imageUrl = `/uploads/forum/title/${fileName}`;
    return NextResponse.json({ success: true, imageUrl }, { status: 200 });
  } catch (error) {
    console.error('圖片上傳失敗：', error);
    return NextResponse.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}
