import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 獲取單一活動詳情
export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = params.id;
    
    const activityId = parseInt(id);
    
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: '無效的活動 ID' },
        { status: 400 }
      );
    }

    // 查詢活動基本資訊和可用數量
    const [activities] = await pool.query(`
      SELECT 
        sa.*,
        ca.name as camp_name,
        ca.address as camp_address,
        ca.description as camp_description,
        ca.notice as camp_notice,
        csa.capacity as total_capacity,
        (
          csa.capacity - COALESCE(
            (SELECT SUM(b.quantity)
             FROM bookings b
             WHERE b.option_id = aso.option_id
             AND b.status != 'cancelled'
             AND b.payment_status != 'failed'),
            0
          )
        ) as available_quantity
      FROM spot_activities sa
      LEFT JOIN camp_applications ca ON sa.application_id = ca.application_id
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      LEFT JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id
      WHERE sa.activity_id = ? AND sa.is_active = 1
    `, [activityId]);

    if (!activities || activities.length === 0) {
      return NextResponse.json(
        { error: '活動不存在或已下架' },
        { status: 404 }
      );
    }

    const activity = activities[0];

    // 查詢活動選項和各選項的可用數量
    const [options] = await pool.query(`
      SELECT 
        aso.option_id,
        aso.activity_id,
        aso.spot_id,
        aso.max_quantity as total_spots,        -- 該活動這個區域可以賣幾個營位
        CAST(aso.price AS DECIMAL(10,0)) as price,
        csa.capacity as people_per_spot,        -- 每個營位可以住幾人
        csa.name as spot_name,
        csa.description,
        /* 計算剩餘可訂營位數 */
        CAST(
          GREATEST(
            aso.max_quantity - COALESCE(
              (SELECT SUM(b.quantity)
               FROM bookings b
               WHERE b.option_id = aso.option_id
               AND b.status != 'cancelled'
               AND b.payment_status != 'failed'),
              0
            ),
            0
          ) AS SIGNED
        ) as available_quantity               -- 剩餘可訂營位數
      FROM activity_spot_options aso
      LEFT JOIN camp_spot_applications csa 
        ON aso.spot_id = csa.spot_id 
        AND aso.application_id = csa.application_id
      WHERE aso.activity_id = ?
      ORDER BY aso.sort_order ASC, aso.price ASC
    `, [activityId]);

    // 將選項資料加入活動資料中
    activity.options = options.map(option => ({
      ...option,
      available_quantity: option.available_quantity || 0,  // 剩餘可訂營位數
      people_per_spot: option.people_per_spot || 4,       // 每個營位可住幾人
      description: option.description || null,
      max_quantity: option.total_spots                    // 該選項總共可賣幾個營位
    }));

    // 計算價格範圍
    if (options.length > 0) {
      activity.min_price = Math.min(...options.map(opt => Number(opt.price)));
      activity.max_price = Math.max(...options.map(opt => Number(opt.price)));
    }

    // 整理營地資訊
    activity.campInfo = {
      name: activity.camp_name,
      address: activity.camp_address,
      description: activity.camp_description,
      notice: activity.camp_notice,
      totalCapacity: activity.total_capacity,
      availableQuantity: activity.available_quantity
    };

    return NextResponse.json(activity);

  } catch (error) {
    console.error('獲取活動詳情錯誤:', error);
    return NextResponse.json(
      { 
        error: '獲取活動詳情失敗',
        message: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
} 