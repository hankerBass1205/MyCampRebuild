import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

// GET: 獲取單個活動詳情
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const [activities] = await pool.query(`
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price,
        ca.address as camp_address,
        ca.name as camp_name
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      LEFT JOIN camp_applications ca ON sa.application_id = ca.application_id
      WHERE sa.activity_id = ? AND sa.owner_id = ?
      GROUP BY sa.activity_id
    `, [params.id, session.user.id]);

    if (!activities.length) {
      return NextResponse.json({ error: '活動不存在' }, { status: 404 });
    }

    return NextResponse.json({ activity: activities[0] });
  } catch (error) {
    console.error('獲取活動詳情失敗:', error);
    return NextResponse.json({ error: '獲取活動詳情失敗' }, { status: 500 });
  }
}

// PUT: 更新活動
export async function PUT(request, { params }) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const activityId = await params.id;
    const data = await request.json();
    
    console.log('更新活動 - 收到的資料:', {
      activityId,
      applicationId: data.application_id,
      data: data
    });

    await connection.beginTransaction();

    // 1. 更新活動基本資料
    await connection.query(`
      UPDATE spot_activities 
      SET
        activity_name = ?,
        title = ?,
        subtitle = ?,
        description = ?,
        notice = ?,
        start_date = ?,
        end_date = ?,
        main_image = ?,
        is_active = ?,
        city = ?,
        is_featured = ?,
        application_id = ?
      WHERE activity_id = ? AND owner_id = ?
    `, [
      data.activity_name,
      data.title,
      data.subtitle,
      data.description,
      data.notice,
      data.start_date,
      data.end_date,
      data.main_image,
      data.is_active ? 1 : 0,
      data.city,
      data.is_featured ? 1 : 0,
      data.application_id,
      activityId,
      session.user.id
    ]);

    console.log('活動基本資料更新完成');

    // 2. 更新所有相關的營位選項的 activity_id
    const [updateResult] = await connection.query(`
      UPDATE activity_spot_options 
      SET activity_id = ?
      WHERE application_id = ?
    `, [activityId, data.application_id]);

    console.log('營位選項更新結果:', {
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows
    });

    await connection.commit();
    console.log('交易提交完成');

    return NextResponse.json({ 
      message: '活動更新成功',
      updateResult: {
        affectedRows: updateResult.affectedRows,
        changedRows: updateResult.changedRows
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('更新活動失敗:', error);
    return NextResponse.json(
      { message: '更新活動失敗', error: error.message },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// DELETE: 刪除活動
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    // 開始資料庫交易
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 先刪除活動選項
      await connection.query(
        'DELETE FROM activity_spot_options WHERE activity_id = ?',
        [params.id]
      );

      // 再刪除活動本身
      await connection.query(
        'DELETE FROM spot_activities WHERE activity_id = ? AND owner_id = ?',
        [params.id, session.user.id]
      );

      await connection.commit();
      return NextResponse.json({ message: '活動刪除成功' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('刪除活動失敗:', error);
    return NextResponse.json({ error: '刪除活動失敗' }, { status: 500 });
  }
} 