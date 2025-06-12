import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: 獲取營主的活動列表
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const ownerId = session.user.id;
    // console.log('查詢營主ID:', ownerId);

    // 先獲取活動基本資訊
    const [activities] = await pool.query(`
      SELECT 
        sa.*,
        ca.name as camp_name,
        ca.address as camp_address,
        ca.image_url as camp_image,
        ca.operation_status,
        (SELECT MIN(price) FROM camp_spot_applications WHERE application_id = sa.application_id) as min_price,
        (SELECT MAX(price) FROM camp_spot_applications WHERE application_id = sa.application_id) as max_price
      FROM spot_activities sa
      LEFT JOIN camp_applications ca ON sa.application_id = ca.application_id
      WHERE sa.owner_id = ?
    `, [ownerId]);

    // console.log('活動基本資訊:', activities);

    // 為每個活動獲取營位資訊
    const activitiesWithSpots = await Promise.all(activities.map(async (activity) => {
      // 先獲取活動關聯的營位ID
      const [spotOptions] = await pool.query(`
        SELECT 
          csa.spot_id,
          csa.name as spotType,
          csa.capacity as people_per_spot,
          csa.status,
          aso.max_quantity as totalQuantity,
          COALESCE(
            (SELECT COUNT(*)
             FROM bookings b
             WHERE b.option_id = aso.option_id
             AND b.status = 'confirmed'
            ), 0
          ) as bookedQuantity
        FROM camp_spot_applications csa
        LEFT JOIN activity_spot_options aso 
          ON csa.spot_id = aso.spot_id 
          AND csa.application_id = ?
        WHERE csa.application_id = ?
      `, [activity.application_id, activity.application_id]);

      // console.log(`活動 ${activity.activity_id} (${activity.activity_name}) 的營位資訊:`, spotOptions);

      return {
        ...activity,
        booking_overview: JSON.stringify(spotOptions)
      };
    }));

    return NextResponse.json({ 
      activities: activitiesWithSpots 
    });

  } catch (error) {
    console.error('獲取資料失敗:', error);
    return NextResponse.json(
      { error: '獲取資料失敗' }, 
      { status: 500 }
    );
  }
}

// POST: 新增活動
export async function POST(request) {
  const connection = await pool.getConnection();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const data = await request.json();
    console.log('新增活動 - 收到的資料:', data);

    await connection.beginTransaction();

    // 1. 新增活動基本資料
    const [result] = await connection.query(`
      INSERT INTO spot_activities (
        owner_id, application_id, activity_name, 
        title, subtitle, main_image, 
        description, notice, start_date, 
        end_date, is_active, city, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      session.user.id,
      data.application_id,
      data.activity_name,
      data.title,
      data.subtitle,
      data.main_image,
      data.description,
      data.notice,
      data.start_date,
      data.end_date,
      1,
      data.city,
      data.is_featured ? 1 : 0
    ]);

    const activityId = result.insertId;
    console.log('活動基本資料新增完成, activityId:', activityId);

    // 2. 先檢查是否有相關的營位選項
    const [checkResult] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM activity_spot_options 
      WHERE application_id = ?
    `, [data.application_id]);
    
    console.log('現有營位選項數量:', checkResult[0].count);

    // 3. 更新所有相關的 activity_spot_options 記錄
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
      success: true,
      activity_id: activityId 
    });

  } catch (error) {
    console.error('新增活動失敗:', error);
    await connection.rollback();
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  } finally {
    connection.release();
  }
}

// PUT: 更新活動
export async function PUT(request, { params }) {
  try {
    // ... 驗證 session 等程式碼 ...

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
        is_featured = ?
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
      activityId,
      session.user.id
    ]);

    // ... 其他程式碼 ...
  } catch (error) {
    // ... 錯誤處理 ...
  }
} 