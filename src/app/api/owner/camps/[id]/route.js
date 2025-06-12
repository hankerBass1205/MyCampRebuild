import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

// GET: 獲取單一營地申請詳情
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const [applications] = await db.query(
      `SELECT 
        ca.*,
        GROUP_CONCAT(ci.image_url) as images
       FROM camp_applications ca
       LEFT JOIN camp_images ci ON ca.application_id = ci.application_id
       WHERE ca.application_id = ? AND ca.owner_id = ?
       GROUP BY ca.application_id`,
      [params.id, session.user.id]
    );

    if (!applications.length) {
      return NextResponse.json(
        { error: '找不到該申請' },
        { status: 404 }
      );
    }

    // 處理資料格式
    const application = {
      ...applications[0],
      images: applications[0].images ? applications[0].images.split(',') : [],
      facilities: JSON.parse(applications[0].facilities || '[]'),
      rules: JSON.parse(applications[0].rules || '[]')
    };

    return NextResponse.json({ application });

  } catch (error) {
    console.error('獲取營地申請詳情失敗:', error);
    return NextResponse.json(
      { error: '獲取申請詳情失敗' },
      { status: 500 }
    );
  }
}

// PUT: 更新營地申請
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const data = await request.json();
    const applicationId = params.id;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 更新基本資料
      await connection.query(
        `UPDATE camp_applications SET
          camp_name = ?,
          camp_type = ?,
          description = ?,
          address = ?,
          phone = ?,
          facilities = ?,
          rules = ?,
          notice = ?,
          updated_at = NOW()
         WHERE application_id = ? AND owner_id = ?`,
        [
          data.campName,
          data.campType,
          data.description,
          data.address,
          data.phone,
          JSON.stringify(data.facilities),
          JSON.stringify(data.rules),
          data.notice,
          applicationId,
          session.user.id
        ]
      );

      // 如果有新圖片，先刪除舊圖片再新增
      if (data.images && data.images.length > 0) {
        await connection.query(
          'DELETE FROM camp_images WHERE application_id = ?',
          [applicationId]
        );

        const imageValues = data.images.map(image => [
          applicationId,
          image,
          'camp'
        ]);

        await connection.query(
          `INSERT INTO camp_images (application_id, image_url, type) 
           VALUES ?`,
          [imageValues]
        );
      }

      await connection.commit();
      return NextResponse.json({ 
        success: true,
        message: '營地申請已更新'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('更新營地申請失敗:', error);
    return NextResponse.json(
      { error: '更新申請失敗' },
      { status: 500 }
    );
  }
} 