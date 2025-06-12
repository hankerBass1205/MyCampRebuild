import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { 
      items,
      amount,
      contactInfo,
      paymentMethod = 'cash'
    } = await request.json();

    // 檢查必要資料
    if (!items || !items.length) {
      throw new Error('購物車是空的');
    }

    await connection.beginTransaction();

    // 生成訂單編號和時間戳記
    const timestamp_id = Date.now();
    const order_id = timestamp_id;

    // 根據付款方式決定訂單狀態
    const orderStatus = paymentMethod === 'cash' ? 'confirmed' : 'pending';
    const paymentStatus = paymentMethod === 'cash' ? 'pending' : 'pending';

    // 為每個項目建立訂單
    for (const item of items) {
      if (!item.optionId) {
        throw new Error('營位選項資料不完整');
      }

      // 檢查營位選項
      const [optionCheck] = await connection.query(
        `SELECT aso.*, sa.activity_name
         FROM activity_spot_options aso
         LEFT JOIN spot_activities sa ON aso.activity_id = sa.activity_id
         WHERE aso.option_id = ?`,
        [item.optionId]
      );
      
      if (optionCheck.length === 0) {
        throw new Error(`找不到營位選項: ${item.optionId}`);
      }

      // 寫入訂單，使用不同的狀態
      await connection.query(
        `INSERT INTO bookings (
          order_id,
          timestamp_id,
          option_id,
          user_id,
          quantity,
          total_price,
          contact_name,
          contact_phone,
          contact_email,
          status,
          payment_status,
          payment_method,
          booking_date,
          nights
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_id,
          timestamp_id,
          item.optionId,
          session.user.id,
          item.quantity,
          item.total_price,
          contactInfo.contactName,
          contactInfo.contactPhone,
          contactInfo.contactEmail,
          orderStatus,
          paymentStatus,
          paymentMethod,
          item.startDate,
          item.nights || 1
        ]
      );
    }

    // 清空購物車
    await connection.query(
      `DELETE FROM activity_cart WHERE user_id = ? AND activity_id IN (
         SELECT sa.activity_id 
         FROM spot_activities sa
         JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id
         WHERE aso.option_id IN (?)
       )`,
      [session.user.id, items.map(item => item.optionId)]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      orderId: order_id,
      timestampId: timestamp_id,
      message: paymentMethod === 'cash' ? '訂單建立成功，請於現場付款' : '訂單建立成功'
    });

  } catch (error) {
    await connection.rollback();
    console.error('預訂失敗:', error);
    return NextResponse.json(
      { error: error.message || '預訂失敗' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// 獲取預訂詳情的 GET 方法
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');  // 改用 orderId

    if (!orderId) {
      return NextResponse.json({ error: '未提供訂單編號' }, { status: 400 });
    }

    const [bookings] = await pool.query(
      `SELECT b.*, 
        aso.spot_name as option_name,
        sa.activity_name
      FROM bookings b
      JOIN activity_spot_options aso ON b.option_id = aso.option_id
      JOIN spot_activities sa ON aso.activity_id = sa.activity_id
      WHERE b.order_id = ? AND b.user_id = ?`,  // 改用 order_id 查詢
      [orderId, session.user.id]
    );

    if (bookings.length === 0) {
      return NextResponse.json({ error: '找不到訂單記錄' }, { status: 404 });
    }

    return NextResponse.json(bookings[0]);

  } catch (error) {
    console.error('獲取訂單詳情失敗:', error);
    return NextResponse.json(
      { error: '獲取訂單詳情失敗' },
      { status: 500 }
    );
  }
} 