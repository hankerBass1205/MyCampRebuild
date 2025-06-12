import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 獲取活動列表
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    // console.log('API 收到的參數:', {
    //   url: request.url,
    //   params: Object.fromEntries(searchParams.entries())
    // });

    // 先獲取地區計數
    const countQuery = `
      SELECT 
        city,
        COUNT(*) as count
      FROM spot_activities
      WHERE is_active = 1
        AND end_date >= CURDATE()
        AND city IS NOT NULL
      GROUP BY city
    `;
    
    const [locationCounts] = await pool.query(countQuery);
    
    let query = `
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price,
        ca.name as camp_name,
        /* 計算平均評分 */
        ROUND(
          COALESCE(
            (SELECT AVG(ud.rating)
             FROM user_discussions ud
             WHERE ud.type = 'camp'
             AND ud.item_id = sa.activity_id
             AND ud.status = 1),
            0
          ),
          1
        ) as avg_rating,
        /* 計算評論數量 */
        COALESCE(
          (SELECT COUNT(*)
           FROM user_discussions ud
           WHERE ud.type = 'camp'
           AND ud.item_id = sa.activity_id
           AND ud.status = 1),
          0
        ) as review_count,
        SUM(
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
          )
        ) as available_spots
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      LEFT JOIN camp_applications ca ON sa.application_id = ca.application_id
      LEFT JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id
      WHERE sa.is_active = 1
        AND sa.end_date >= CURDATE()
    `;

    const params = [];

    // 地區篩選
    const location = searchParams.get('location');
    if (location && location !== 'all') {
      // console.log('篩選地區:', location);
      query += ` AND sa.city = ?`;
      params.push(location);
    }

    // 分組和排序
    query += ` GROUP BY sa.activity_id`;

    // 排序處理
    const sortBy = searchParams.get('sortBy') || 'date_desc';
    switch (sortBy) {
      case 'price_asc':
        query += ` ORDER BY min_price ASC, sa.start_date ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY min_price DESC, sa.start_date ASC`;
        break;
      default: // date_desc
        query += ` ORDER BY sa.start_date DESC, min_price ASC`;
    }

    // 在執行查詢前記錄完整的 SQL
    // console.log('完整 SQL:', {
    //   query,
    //   params,
    //   location: searchParams.get('location')
    // });

    const [activities] = await pool.query(query, params);
    // console.log('查詢結果數量:', activities.length);

    // console.log('獲取活動列表資料:', activities);

    return NextResponse.json({ 
      success: true,
      activities: activities,
      locationCounts: locationCounts.reduce((acc, row) => {
        acc[row.city] = row.count;
        return acc;
      }, {})
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { error: '獲取活動列表失敗' },
      { status: 500 }
    );
  }
} 