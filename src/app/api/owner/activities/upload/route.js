import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    // 驗證營主身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: '未提供檔案' },
        { status: 400 }
      );
    }

    // 修改這裡：添加 webp 支援
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '只允許上傳 JPG、PNG、WebP 或 GIF 圖片' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成唯一檔名
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `activity-${uniqueSuffix}${path.extname(file.name)}`;
    
    // 儲存路徑
    const uploadDir = path.join(process.cwd(), 'public/uploads/activities');
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // 只回傳檔名，不包含完整路徑
    return NextResponse.json({ 
      success: true,
      filename: filename  // 只回傳檔名
    });

  } catch (error) {
    console.error('上傳圖片失敗:', error);
    return NextResponse.json(
      { error: '上傳圖片失敗' },
      { status: 500 }
    );
  }
} 