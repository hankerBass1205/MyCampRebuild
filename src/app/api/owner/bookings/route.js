import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 檢查是否為營主身份
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權的訪問' }, { status: 401 });
    }

    // 確認目前登入的營主 ID
    const ownerId = session.user.id; // 應該是 53
    // console.log('Current owner ID:', ownerId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const payment = searchParams.get('payment') || 'all';

    let sql = `
      SELECT 
        b.*,
        aso.option_id,
        aso.activity_id,
        aso.spot_id,
        csa.name AS spot_name,
        sa.activity_name,
        sa.title AS activity_title,
        bd.check_in_date,
        bd.check_out_date,
        ca.owner_id,
        o.name AS owner_name
      FROM bookings b
      LEFT JOIN activity_spot_options aso ON b.option_id = aso.option_id
      LEFT JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id
      LEFT JOIN spot_activities sa ON aso.activity_id = sa.activity_id
      LEFT JOIN booking_dates bd ON b.booking_id = bd.booking_id
      LEFT JOIN camp_applications ca ON aso.application_id = ca.application_id
      LEFT JOIN owners o ON ca.owner_id = o.id
      WHERE o.id = ?
    `;

    const queryParams = [ownerId];
    // console.log('SQL:', sql);
    // console.log('Parameters:', queryParams);

    // 加入搜尋條件
    if (search) {
      sql += ` AND (b.order_id LIKE ? OR b.contact_name LIKE ? OR b.contact_phone LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 加入狀態篩選
    if (status !== 'all') {
      sql += ` AND b.status = ?`;
      queryParams.push(status);
    }

    // 加入付款狀態篩選
    if (payment !== 'all') {
      sql += ` AND b.payment_status = ?`;
      queryParams.push(payment);
    }

    // 加入排序
    sql += ` ORDER BY b.created_at DESC`;

    // console.log('SQL查詢:', sql); // 檢查 SQL

    // 執行查詢
    const [rows] = await db.query(sql, queryParams);

    // 確保返回的是陣列
    const bookings = Array.isArray(rows) ? rows : [];
    
    return NextResponse.json({ 
      success: true,
      data: bookings 
    });

  } catch (error) {
    console.error('Error in booking query:', error);
    return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
  }
} 