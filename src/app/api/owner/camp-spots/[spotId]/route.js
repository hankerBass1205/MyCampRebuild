import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/lib/db';

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: '未授權的請求' }, { status: 401 });
  }

  const connection = await db.getConnection();
  try {
    const owner_id = session.user.id;
    const data = await request.json();
    const spotId = params.spotId;
    // console.log('收到的編輯資料:', data);  // 記錄收到的資料

    await connection.beginTransaction();

    // 檢查營位是否存在且屬於該營主
    const [spotCheck] = await connection.query(
      `SELECT s.*, aso.max_quantity, aso.sort_order, a.owner_id
       FROM camp_spot_applications s 
       JOIN camp_applications a ON s.application_id = a.application_id 
       LEFT JOIN activity_spot_options aso ON s.spot_id = aso.spot_id
       WHERE s.spot_id = ? AND a.owner_id = ?
       LIMIT 1`,
      [spotId, owner_id]
    );

    if (!spotCheck.length) {
      throw new Error('找不到該營位或無權限修改');
    }

    // 如果是狀態切換（停用/啟用）
    if (data.hasOwnProperty('status') && Object.keys(data).length === 1) {
      // console.log('執行狀態切換:', data.status);
      await connection.query(
        `UPDATE camp_spot_applications 
         SET status = ?
         WHERE spot_id = ?`,
        [data.status, spotId]
      );
    } 
    // 如果是編輯營位資料
    else {
      // console.log('執行完整編輯');
      
      // 確保數值正確轉換
      const updateData = {
        name: data.name?.trim(),
        capacity: parseInt(data.capacity, 10),
        price: parseFloat(data.price),
        description: data.description?.trim() || null,
        maxQuantity: parseInt(data.maxQuantity, 10),
        status: parseInt(data.status, 10)
      };

      // 驗證必要欄位
      if (!updateData.name || !updateData.capacity || !updateData.price || !updateData.maxQuantity) {
        throw new Error('缺少必要欄位');
      }

      // 1. 更新營位基本資料
      await connection.query(
        `UPDATE camp_spot_applications 
         SET name = ?,
             capacity = ?,
             price = ?,
             description = ?,
             status = ?
         WHERE spot_id = ?`,
        [
          updateData.name,
          updateData.capacity,
          updateData.price,
          updateData.description,
          updateData.status,
          spotId
        ]
      );

      // 2. 更新活動營位選項
      await connection.query(
        `UPDATE activity_spot_options 
         SET price = ?,
             max_quantity = ?
         WHERE spot_id = ?`,
        [
          updateData.price,
          updateData.maxQuantity,
          spotId
        ]
      );

      // console.log('更新完成:', updateData);
    }

    await connection.commit();
    return NextResponse.json({ 
      success: true,
      message: '更新成功'
    });

  } catch (error) {
    await connection.rollback();
    console.error('更新營位失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '更新營位失敗',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const owner_id = session.user.id;
    const spotId = params.spotId;

    // 開始交易
    await db.query('START TRANSACTION');

    try {
      // 檢查營位是否存在且屬於該營主
      const [spot] = await db.query(`
        SELECT cs.*, ca.owner_id, 
          (SELECT COUNT(*) 
           FROM bookings b 
           JOIN activity_spot_options aso ON b.option_id = aso.option_id 
           WHERE aso.spot_id = cs.spot_id 
           AND b.status = 'confirmed') as booking_count
        FROM camp_spot_applications cs
        JOIN camp_applications ca ON cs.application_id = ca.application_id
        WHERE cs.spot_id = ? AND ca.owner_id = ?
      `, [spotId, owner_id]);

      if (!spot.length) {
        await db.query('ROLLBACK');
        return NextResponse.json(
          { error: '找不到符合的營位或無權限刪除' },
          { status: 404 }
        );
      }

      // 檢查是否有已確認的訂單
      if (spot[0].booking_count > 0) {
        await db.query('ROLLBACK');
        return NextResponse.json(
          { error: '此營位有已確認的訂單，無法刪除' },
          { status: 400 }
        );
      }

      // 刪除相關的活動營位選項
      await db.query(`
        DELETE FROM activity_spot_options 
        WHERE spot_id = ? AND application_id = ?
      `, [spotId, spot[0].application_id]);

      // 刪除營位
      await db.query(`
        DELETE FROM camp_spot_applications 
        WHERE spot_id = ?
      `, [spotId]);

      // 重新排序剩餘的營位
      await db.query('SET @rank := 0');
      
      await db.query(`
        UPDATE activity_spot_options
        SET sort_order = (@rank := @rank + 1)
        WHERE application_id = ?
        ORDER BY sort_order ASC
      `, [spot[0].application_id]);

      await db.query('COMMIT');

      return NextResponse.json({ 
        success: true,
        message: '營位刪除成功'
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('刪除營位失敗:', error);
    return NextResponse.json(
      { error: '刪除營位失敗' },
      { status: 500 }
    );
  }
} 