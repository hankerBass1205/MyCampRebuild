import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(request) {
  try {
    // 驗證使用者身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const ownerId = session.user.id;
    // console.log('Current owner ID:', ownerId);

    // 只查詢 camp_applications 表
    const sql = `
      SELECT 
        application_id,
        name,
        address,
        status,
        operation_status,
        status_reason,
        created_at,
        updated_at,
        image_url
      FROM camp_applications
      WHERE owner_id = ?
      ORDER BY created_at DESC
    `;

    // 執行查詢
    const [applications] = await db.query(sql, [ownerId]);

    // 格式化日期
    const formattedApplications = applications.map(app => ({
      ...app,
      created_at: app.created_at.toISOString(),
      updated_at: app.updated_at ? app.updated_at.toISOString() : null
    }));

    return NextResponse.json({ 
      success: true,
      data: formattedApplications
    });

  } catch (error) {
    console.error('獲取申請狀態失敗:', error);
    return NextResponse.json(
      { 
        error: '獲取申請狀態失敗',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 