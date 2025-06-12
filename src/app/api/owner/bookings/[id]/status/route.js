import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '權限不足' }, { status: 403 });
    }

    const bookingId = params.id;
    const { status } = await request.json();
    
    // 驗證狀態值
    const validStatuses = ['confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '無效的狀態值' }, { status: 400 });
    }

    // 檢查當前訂單狀態
    const [currentBooking] = await db.query(
      'SELECT status FROM bookings WHERE booking_id = ?',
      [bookingId]
    );

    if (!currentBooking || currentBooking.length === 0) {
      return NextResponse.json({ error: '找不到訂單' }, { status: 404 });
    }

    // 如果當前狀態是 pending，才允許更新
    if (currentBooking[0].status !== 'pending') {
      return NextResponse.json({ error: '只能修改待確認的訂單' }, { status: 400 });
    }

    // 更新狀態
    const [result] = await db.query(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE booking_id = ?',
      [status, bookingId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: '更新失敗' }, { status: 400 });
    }

    return NextResponse.json({ 
      message: '更新成功',
      status: status 
    });

  } catch (error) {
    console.error('更新訂單狀態失敗:', error);
    return NextResponse.json(
      { error: '更新訂單狀態失敗', message: error.message },
      { status: 500 }
    );
  }
} 