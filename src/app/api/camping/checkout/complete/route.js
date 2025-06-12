import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    
    // console.log('接收到的訂單ID:', orderId);

    if (!orderId) {
      return NextResponse.json({ error: '未提供訂單編號' }, { status: 400 });
    }

    // 執行 SQL 查詢，使用 order_id 查詢
    const [bookingResult] = await pool.query(`
      SELECT 
        b.order_id,
        b.timestamp_id,
        b.contact_name,
        b.contact_phone,
        b.contact_email,
        b.payment_method,
        b.total_price as total_amount,
        b.created_at,
        b.status,
        b.payment_status,
        b.quantity,
        DATE(b.booking_date) as start_date,
        DATE_ADD(DATE(b.booking_date), INTERVAL b.nights DAY) as end_date,
        b.nights,
        sa.activity_name,
        csa.name as spot_name
      FROM bookings b
      LEFT JOIN activity_spot_options aso ON b.option_id = aso.option_id
      LEFT JOIN spot_activities sa ON aso.activity_id = sa.activity_id
      LEFT JOIN camp_spot_applications csa ON aso.application_id = csa.application_id
      WHERE b.order_id = ?
    `, [orderId]);

    // console.log('資料庫查詢結果:', bookingResult[0]);

    if (bookingResult.length === 0) {
      return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
    }

    // 整理訂單資料格式
    const orderData = {
      ...bookingResult[0],
      items: [{
        activity_name: bookingResult[0].activity_name || '露營活動',
        spot_name: bookingResult[0].spot_name || '營位',
        start_date: bookingResult[0].start_date,
        end_date: bookingResult[0].end_date,
        quantity: bookingResult[0].quantity,
        unit_price: bookingResult[0].total_amount / bookingResult[0].quantity,
        subtotal: bookingResult[0].total_amount
      }]
    };

    // console.log('返回的訂單資料:', orderData);
    return NextResponse.json(orderData);

  } catch (error) {
    console.error('詳細錯誤資訊:', error);
    return NextResponse.json({ 
      error: '獲取訂單資料失敗',
      details: error.message
    }, { status: 500 });
  }
}
