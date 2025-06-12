import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { format } from 'date-fns';

// 獲取購物車內容
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "請先登入" }, { status: 401 });
    }

    const [cartItems] = await pool.query(`
      SELECT 
        ac.*,
        sa.activity_name,
        sa.main_image,
        sa.title,
        aso.spot_id,
        aso.application_id,
        aso.price as unit_price,
        csa.name as spot_name
      FROM activity_cart ac
      LEFT JOIN spot_activities sa ON ac.activity_id = sa.activity_id
      LEFT JOIN activity_spot_options aso ON ac.option_id = aso.option_id
      LEFT JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id 
        AND aso.application_id = csa.application_id
      WHERE ac.user_id = ?
      ORDER BY ac.created_at DESC
    `, [session.user.id]);

    // 處理日期和價格顯示
    const formattedCartItems = cartItems.map(item => ({
      ...item,
      start_date: item.start_date ? format(new Date(item.start_date), 'yyyy-MM-dd') : null,
      end_date: item.end_date ? format(new Date(item.end_date), 'yyyy-MM-dd') : null,
      unit_price: Number(item.unit_price),
      total_price: Number(item.total_price)
    }));

    return Response.json({ cartItems: formattedCartItems });
  } catch (error) {
    console.error('獲取購物車錯誤:', error);
    return Response.json({ error: "獲取購物車失敗" }, { status: 500 });
  }
}

// 新增日期格式化函數
const formatDate = (dateString) => {
  if (!dateString) return null;
  return dateString;  // 直接返回原始日期字符串
};

// 新增購物車項目
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "請先登入" }, { status: 401 });
    }

    const {
      activityId,
      quantity,
      totalPrice,
      isQuickAdd,
      startDate,  // 原始日期字串
      endDate,    // 原始日期字串
      optionId
    } = await req.json();

    // 驗證基本參數
    if (!activityId || !quantity) {
      return Response.json({ error: "缺少必要參數" }, { status: 400 });
    }

    // 檢查購物車是否已有此活動
    const [existingItems] = await pool.query(
      'SELECT * FROM activity_cart WHERE user_id = ? AND activity_id = ?',
      [session.user.id, activityId]
    );

    if (existingItems.length > 0) {
      if (isQuickAdd) {
        // 如果是快速加入且已存在，只更新數量
        await pool.query(
          'UPDATE activity_cart SET quantity = ? WHERE user_id = ? AND activity_id = ?',
          [quantity, session.user.id, activityId]
        );
      } else {
        // 更新時處理日期
        await pool.query(`
          UPDATE activity_cart 
          SET quantity = ?,
              start_date = ?,
              end_date = ?,
              option_id = ?,
              total_price = ?
          WHERE user_id = ? AND activity_id = ?
        `, [
          quantity,
          formatDate(startDate),  // 使用新的格式化函數
          formatDate(endDate),    // 使用新的格式化函數
          optionId || null,
          totalPrice,
          session.user.id,
          activityId
        ]);
      }
      return Response.json({ message: "購物車已更新" });
    }

    // 新增購物車項目
    let insertQuery = '';
    let insertParams = [];

    if (isQuickAdd) {
      // 快速加入不需要處理日期
      insertQuery = `
        INSERT INTO activity_cart 
        (user_id, activity_id, quantity, total_price)
        VALUES (?, ?, ?, ?)
      `;
      insertParams = [session.user.id, activityId, quantity, totalPrice];
    } else {
      insertQuery = `
        INSERT INTO activity_cart 
        (user_id, activity_id, option_id, quantity, start_date, end_date, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      insertParams = [
        session.user.id,
        activityId,
        optionId || null,
        quantity,
        formatDate(startDate),  // 使用新的格式化函數
        formatDate(endDate),    // 使用新的格式化函數
        totalPrice
      ];
    }

    const [result] = await pool.query(insertQuery, insertParams);

    return Response.json({ 
      message: "成功加入購物車",
      cartItemId: result.insertId 
    });

  } catch (error) {
    console.error('加入購物車錯誤:', error);
    return Response.json({ error: "加入購物車失敗" }, { status: 500 });
  }
}

// 修改主要購物車 API 的 PUT 方法
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const { cartId, quantity, totalPrice } = await request.json();

    // 基本驗證
    if (!cartId || quantity < 1) {
      return NextResponse.json({ error: '無效的請求參數' }, { status: 400 });
    }

    // 更新數量和總價
    const [result] = await pool.query(
      'UPDATE activity_cart SET quantity = ?, total_price = ? WHERE id = ? AND user_id = ?',
      [quantity, totalPrice, cartId, session.user.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: '更新失敗' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '已更新數量'
    });

  } catch (error) {
    console.error('更新購物車數量失敗:', error);
    return NextResponse.json(
      { error: '更新購物車數量失敗' },
      { status: 500 }
    );
  }
}

// 移除購物車項目
export async function DELETE(request) {
  try {
    const { cartId } = await request.json();
    // console.log('後端收到的購物車ID:', cartId); // 調試用

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    await pool.query(
      'DELETE FROM activity_cart WHERE id = ? AND user_id = ?',
      [cartId, session.user.id]
    );

    return NextResponse.json({ 
      success: true,
      message: '從購物車除'
    });

  } catch (error) {
    console.error('移除購物車項目失敗:', error);
    return NextResponse.json(
      { error: '移除購物車項目失敗' },
      { status: 500 }
    );
  }
} 