import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const query = `
      SELECT 
        sa.*,
        ca.name as camp_name,
        ca.address as camp_address,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price,
        SUM(aso.max_quantity) as total_spots
      FROM spot_activities sa
      LEFT JOIN camp_applications ca ON sa.application_id = ca.application_id
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      WHERE sa.is_active = 1 
      AND sa.is_featured = 1
      AND sa.end_date >= CURDATE()
      GROUP BY sa.activity_id
      ORDER BY sa.start_date ASC
    `;

    const [activities] = await pool.query(query);

    return NextResponse.json({
      activities,
      message: '獲取成功'
    });

  } catch (error) {
    console.error('獲取精選活動錯誤:', error);
    return NextResponse.json(
      { error: '獲取精選活動失敗' },
      { status: 500 }
    );
  }
} 