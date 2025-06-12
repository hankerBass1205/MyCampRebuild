import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function PUT(request, { params }) {
  // console.log('收到 PUT 請求，參數:', params);
  
  try {
    const session = await getServerSession(authOptions);
      // console.log('使用者狀態:', {
      //   isAuthenticated: !!session,
      //   userId: session?.user?.id
      // });

    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    // 1. 修正 params.cartId 的使用方式
    const cartId = await params.cartId;
    
    // 2. 修正前端傳來的參數名稱
    const { quantity, totalPrice, startDate, endDate, optionId } = await request.json();
    
    // 記錄接收到的資料
    // console.log('接收到的更新資料:', {
    //   cartId,
    //   quantity,
    //   totalPrice,
    //   startDate,
    //   endDate,
    //   optionId
    // });

    // 使用 formatDate 函數處理日期
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    // 驗證資料
    if (!cartId || !quantity || !optionId) {
      console.error('資料驗證失敗:', { cartId, quantity, optionId });
      return NextResponse.json({ error: '無效的請求參數' }, { status: 400 });
    }

    // 加強資料驗證
    if (!formattedStartDate || !formattedEndDate) {
      return NextResponse.json({ error: '請選擇日期' }, { status: 400 });
    }

    // 更新購物車項目
    const [result] = await db.query(
      `UPDATE activity_cart 
       SET quantity = ?,
           start_date = ?,
           end_date = ?,
           total_price = ?,
           option_id = ?
       WHERE id = ? AND user_id = ?`,
      [quantity, formattedStartDate, formattedEndDate, totalPrice, optionId, cartId, session.user.id]
    );

    // console.log('資料庫更新結果:', {
    //   affectedRows: result.affectedRows,
    //   changedRows: result.changedRows
    // });

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: '找不到對應的購物車項目' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '購物車已更新'
    });

  } catch (error) {
    console.error('處理請求時發生錯誤:', error);
    return NextResponse.json(
      { error: '更新購物車失敗' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const cartId = params.cartId;
    const userId = session.user.id;

    try {
      const [rows] = await db.query(
        'SELECT * FROM activity_cart WHERE id = ? AND user_id = ?',
        [cartId, userId]
      );

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: '找不到該購物車項目' }, { status: 404 });
      }

      const [result] = await db.query(
        'DELETE FROM activity_cart WHERE id = ? AND user_id = ?',
        [cartId, userId]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json({ error: '刪除失敗' }, { status: 400 });
      }

      return NextResponse.json({ message: '成功刪除購物車項目' });

    } catch (dbError) {
      console.error('資料庫操作錯誤:', dbError);
      return NextResponse.json(
        { error: '資料庫操作失敗' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('刪除購物車項目時發生錯誤:', error);
    return NextResponse.json(
      { error: '刪除購物車項目失敗' },
      { status: 500 }
    );
  }
}

// 添加日期格式化函數
const formatDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toISOString().split('T')[0];  // 只取 YYYY-MM-DD
}; 