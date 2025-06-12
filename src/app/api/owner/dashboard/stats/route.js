import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET() {
  try {
    // 驗證營主身份
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const ownerId = session.user.id;

    // 取得所有需要的統計數據
    const stats = await getDashboardStats(ownerId);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('獲取儀表板統計失敗:', error);
    return NextResponse.json({ error: '獲取數據失敗' }, { status: 500 });
  }
}

async function getDashboardStats(ownerId) {
  try {
    // 1. 總訂單數
    const totalBookingsResult = await db.query(
      `SELECT COUNT(DISTINCT b.booking_id) as total 
       FROM bookings b
       JOIN activity_spot_options aso ON b.option_id = aso.option_id
       JOIN spot_activities sa ON aso.activity_id = sa.activity_id
       WHERE sa.owner_id = ?`,
      [ownerId]
    );

    // 2. 總營收 (已付款的訂單)
    const totalRevenueResult = await db.query(
      `SELECT COALESCE(SUM(b.total_price), 0) as total
       FROM bookings b
       JOIN activity_spot_options aso ON b.option_id = aso.option_id
       JOIN spot_activities sa ON aso.activity_id = sa.activity_id
       WHERE sa.owner_id = ? 
       AND b.payment_status = 'paid'`,
      [ownerId]
    );

    // 3. 本月營收
    const monthlyRevenueResult = await db.query(
      `SELECT COALESCE(SUM(b.total_price), 0) as total
       FROM bookings b
       JOIN activity_spot_options aso ON b.option_id = aso.option_id
       JOIN spot_activities sa ON aso.activity_id = sa.activity_id
       WHERE sa.owner_id = ? 
       AND b.payment_status = 'paid'
       AND DATE_FORMAT(b.created_at, '%Y-%m') = DATE_FORMAT(CURRENT_DATE, '%Y-%m')`,
      [ownerId]
    );

    // 4. 待處理訂單
    const pendingBookingsResult = await db.query(
      `SELECT COUNT(DISTINCT b.booking_id) as total
       FROM bookings b
       JOIN activity_spot_options aso ON b.option_id = aso.option_id
       JOIN spot_activities sa ON aso.activity_id = sa.activity_id
       WHERE sa.owner_id = ? 
       AND b.status = 'pending'`,
      [ownerId]
    );

    // 5. 總活動數
    const totalActivitiesResult = await db.query(
      `SELECT COUNT(*) as total
       FROM spot_activities
       WHERE owner_id = ?`,
      [ownerId]
    );

    // 6. 進行中活動
    const activeActivitiesResult = await db.query(
      `SELECT COUNT(*) as total
       FROM spot_activities
       WHERE owner_id = ? 
       AND is_active = 1
       AND start_date <= CURRENT_DATE 
       AND end_date >= CURRENT_DATE`,
      [ownerId]
    );

    // 獲取近6個月的營收數據
    const revenueDataResult = await db.query(
      `SELECT 
        DATE_FORMAT(b.created_at, '%Y-%m') as month,
        COALESCE(SUM(b.total_price), 0) as amount
       FROM bookings b
       JOIN activity_spot_options aso ON b.option_id = aso.option_id
       JOIN spot_activities sa ON aso.activity_id = sa.activity_id
       WHERE sa.owner_id = ? 
       AND b.payment_status = 'paid'
       AND b.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
       ORDER BY month ASC`,
      [ownerId]
    );

    // 獲取熱門活動排行
    const popularActivitiesResult = await db.query(
      `SELECT 
        sa.activity_name as name,
        COUNT(b.booking_id) as bookings
       FROM spot_activities sa
       LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
       LEFT JOIN bookings b ON aso.option_id = b.option_id
       WHERE sa.owner_id = ?
       GROUP BY sa.activity_id, sa.activity_name
       ORDER BY bookings DESC
       LIMIT 5`,
      [ownerId]
    );

    // 獲取活動地區分布
    const locationStatsResult = await db.query(
      `SELECT 
         sa.city as name,
         COUNT(*) as value
       FROM spot_activities sa
       WHERE sa.owner_id = ?
       GROUP BY sa.city
       ORDER BY value DESC
       LIMIT 5`,
      [ownerId]
    );

    // 獲取每日訂單趨勢
    const bookingTrendsResult = await db.query(
      `SELECT 
         DATE_FORMAT(b.created_at, '%Y-%m-%d') as date,
         COUNT(*) as bookings
       FROM bookings b
       JOIN activity_spot_options aso ON b.option_id = aso.option_id
       JOIN spot_activities sa ON aso.activity_id = sa.activity_id
       WHERE sa.owner_id = ?
       AND b.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
       GROUP BY DATE_FORMAT(b.created_at, '%Y-%m-%d')
       ORDER BY date ASC`,
      [ownerId]
    );

    // 計算平均訂單金額
    const avgOrderValueResult = await db.query(
      `SELECT ROUND(AVG(total_price), 0) as avg_value
       FROM bookings b
       JOIN activity_spot_options aso ON b.option_id = aso.option_id
       JOIN spot_activities sa ON aso.activity_id = sa.activity_id
       WHERE sa.owner_id = ? AND b.payment_status = 'paid'`,
      [ownerId]
    );

    // 計算訂單完成率
    const completionRateResult = await db.query(
      `SELECT 
         ROUND(
           (COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) * 100.0) / 
           NULLIF(COUNT(*), 0), 
         1) as completion_rate
       FROM bookings b
       JOIN activity_spot_options aso ON b.option_id = aso.option_id
       JOIN spot_activities sa ON aso.activity_id = sa.activity_id
       WHERE sa.owner_id = ?`,
      [ownerId]
    );

    // 整理所有統計數據
    return {
      totalBookings: parseInt(totalBookingsResult[0][0].total),
      totalRevenue: parseInt(totalRevenueResult[0][0].total),
      monthlyRevenue: parseInt(monthlyRevenueResult[0][0].total),
      pendingBookings: parseInt(pendingBookingsResult[0][0].total),
      totalActivities: parseInt(totalActivitiesResult[0][0].total),
      activeActivities: parseInt(activeActivitiesResult[0][0].total),
      avgOrderValue: parseInt(avgOrderValueResult[0][0].avg_value || 0),
      completionRate: parseFloat(completionRateResult[0][0].completion_rate || 0),
      customerSatisfaction: 4.5,
      topLocations: locationStatsResult[0] || [],
      bookingTrends: bookingTrendsResult[0] || [],
      revenueData: revenueDataResult[0] || [],
      popularActivities: popularActivitiesResult[0] || []
    };

  } catch (error) {
    throw error;
  }
} 