import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: 搜尋活動
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const location = searchParams.get('location');
    
    // console.log('=== 搜尋參數 ===');
    // console.log('開始日期:', startDate);
    // console.log('結束日期:', endDate);
    // console.log('關鍵字:', keyword);
    // console.log('地區:', location);

    // 1. 檢查關鍵字長度
    if (keyword && (keyword.length < 2 || keyword.length > 50)) {
      return NextResponse.json(
        { error: '搜尋關鍵字長度必須在 2-50 個字元之間' },
        { status: 400 }
      );
    }

    // 2. 過濾特殊字元
    const sanitizedKeyword = keyword?.replace(/[<>{}[\]\\\/]/g, '');
    
    let query = `
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price,
        COUNT(DISTINCT aso.spot_id) as available_spots
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      WHERE sa.is_active = 1
        AND sa.end_date >= CURDATE()
    `;

    const params = [];

    // 3. 關鍵字篩選
    if (sanitizedKeyword && sanitizedKeyword.trim()) {
      query += ` AND sa.activity_name LIKE ?`;
      params.push(`%${sanitizedKeyword.trim()}%`);
    }

    // 4. 日期範圍篩選
    if (startDate && endDate) {
      query += ` AND (
        (sa.start_date <= ? AND sa.end_date >= ?) OR  /* 活動時間包含整個搜尋範圍 */
        (sa.start_date BETWEEN ? AND ?) OR            /* 活動開始日在搜尋範圍內 */
        (sa.end_date BETWEEN ? AND ?) OR             /* 活動結束日在搜尋範圍內 */
        (sa.start_date <= ? AND sa.end_date >= ?)    /* 搜尋範圍完全在活動期間內 */
      )`;
      params.push(
        startDate, endDate,      /* 活動時間包含整個搜尋範圍 */
        startDate, endDate,      /* 活動開始日在搜尋範圍內 */
        startDate, endDate,      /* 活動結束日在搜尋範圍內 */
        startDate, endDate       /* 搜尋範圍完全在活動期間內 */
      );
    }

    // 5. 地區篩選
    if (location && location !== 'all') {
      query += ` AND sa.city = ?`;
      params.push(location);
    }

    // 分組
    query += ` GROUP BY sa.activity_id`;

    // 排序
    const sortBy = searchParams.get('sortBy') || 'date_desc';
    switch (sortBy) {
      case 'price_asc':
        query += ` ORDER BY min_price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY max_price DESC`;
        break;
      case 'date_desc':
      default:
        query += ` ORDER BY sa.created_at DESC`;
        break;
    }

    // console.log('=== SQL Query ===');
    // console.log('Query:', query);
    // console.log('Parameters:', params);

    const [activities] = await pool.query(query, params);
    
    // console.log('=== 查詢結果 ===');
    // console.log('找到活動數量:', activities.length);
    // console.log('第一筆活動:', activities[0] ? {
    //   activity_id: activities[0].activity_id,
    //   activity_name: activities[0].activity_name,
    //   start_date: activities[0].start_date,
    //   end_date: activities[0].end_date
    // } : 'No activities found');

    return NextResponse.json({ activities });

  } catch (error) {
    console.error('搜尋活動錯誤:', error);
    return NextResponse.json(
      { error: '搜尋活動失敗' },
      { status: 500 }
    );
  }
} 