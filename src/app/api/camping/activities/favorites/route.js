import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    const { activityIds } = await request.json();
    
    if (!activityIds?.length) {
      return NextResponse.json({ activities: [] });
    }

    // 獲取收藏活動的詳細資訊
    const [activities] = await pool.query(`
      SELECT 
        sa.*,
        MIN(aso.price) as min_price,
        MAX(aso.price) as max_price
      FROM spot_activities sa
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
      WHERE sa.activity_id IN (?)
      GROUP BY sa.activity_id
      ORDER BY sa.start_date ASC
    `, [activityIds]);

    return NextResponse.json({ activities });

  } catch (error) {
    console.error('獲取收藏活動失敗:', error);
    return NextResponse.json(
      { error: '獲取收藏活動失敗' },
      { status: 500 }
    );
  }
} 