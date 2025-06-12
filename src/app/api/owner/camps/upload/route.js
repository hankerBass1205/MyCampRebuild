import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json(
        { error: '未提供圖片' },
        { status: 400 }
      );
    }

    // 驗證檔案大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '圖片大小不能超過 10MB' },
        { status: 400 }
      );
    }

    // 驗證檔案類型
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      return NextResponse.json(
        { error: '只支援 JPG、PNG 或 GIF 格式' },
        { status: 400 }
      );
    }

    // 生成唯一檔名
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
    const filename = `${timestamp}-${originalName}`;
    
    // 確保上傳目錄存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'camps');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // 儲存檔案
    const buffer = Buffer.from(await file.arrayBuffer());
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // 只返回檔案名稱
    return NextResponse.json({ 
      success: true,
      filename: filename  // 只返回檔案名稱
    });

  } catch (error) {
    console.error('上傳圖片失敗:', error);
    return NextResponse.json(
      { error: '上傳圖片失敗' },
      { status: 500 }
    );
  }
} 