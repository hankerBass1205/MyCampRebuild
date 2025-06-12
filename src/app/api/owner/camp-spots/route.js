import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';  // 引入資料庫連接池

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const [camps] = await db.query(`
      SELECT 
        ca.application_id,
        ca.name as camp_name,
        ca.address,
        ca.status as application_status,
        ca.image_url as camp_image,
        ca.operation_status as camp_status,
        csa.spot_id,
        csa.name,
        csa.capacity,
        csa.status,
        csa.description,
        csa.created_at,
        COALESCE(aso.max_quantity, 0) as max_quantity,
        COALESCE(aso.price, csa.price) as price
      FROM camp_applications ca
      LEFT JOIN camp_spot_applications csa 
        ON ca.application_id = csa.application_id
      LEFT JOIN activity_spot_options aso 
        ON csa.spot_id = aso.spot_id
      WHERE ca.owner_id = ?
      ORDER BY ca.application_id, csa.spot_id
    `, [session.user.id]);

    // 整理資料結構
    const groupedCamps = camps.reduce((acc, camp) => {
      if (!acc[camp.application_id]) {
        acc[camp.application_id] = {
          application_id: camp.application_id,
          camp_name: camp.camp_name,
          address: camp.address,
          camp_image: camp.camp_image,
          camp_status: camp.camp_status,
          spots: [],
          status: camp.application_status
        };
      }

      if (camp.spot_id) {
        // 生成真正唯一的 key
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const unique_key = `${camp.application_id}-${camp.spot_id}-${timestamp}-${random}`;

        acc[camp.application_id].spots.push({
          spot_id: camp.spot_id,
          name: camp.name,
          capacity: camp.capacity,
          status: camp.status,
          description: camp.description,
          created_at: camp.created_at,
          max_quantity: parseInt(camp.max_quantity) || 0,
          price: parseInt(camp.price) || 0,
          unique_key: unique_key  // 使用新生成的唯一 key
        });
      }

      // console.log('營地狀態:', camp.status);

      return acc;
    }, {});

    // console.log('處理後的營位資料:', groupedCamps);

    return NextResponse.json({ 
      success: true, 
      camps: Object.values(groupedCamps)
    });

  } catch (error) {
    console.error('獲取營位列表失敗:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isOwner) {
      return NextResponse.json({ error: '未授權的請求' }, { status: 401 });
    }

    const data = await request.json();
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      console.log('新增營位 - 收到的資料:', data);

      // 1. 先新增到 camp_spot_applications 表
      const [result] = await connection.query(
        `INSERT INTO camp_spot_applications (
          application_id,
          name,
          capacity,
          price,
          description,
          status,
          owner_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.application_id,
          data.name,
          data.capacity,
          data.price,
          data.description || null,
          1,  // 預設啟用
          session.user.name  // 加入營主名稱
        ]
      );

      const spotId = result.insertId;
      console.log('營位基本資料新增完成, spotId:', spotId);

      // 2. 先獲取當前最大排序值
      const [sortOrder] = await connection.query(
        `SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order
         FROM activity_spot_options 
         WHERE application_id = ?`,
        [data.application_id]
      );

      // 3. 再新增到 activity_spot_options 表
      await connection.query(
        `INSERT INTO activity_spot_options (
          spot_id,
          application_id,
          price,
          max_quantity,
          sort_order
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          spotId,
          data.application_id,
          data.price,
          data.maxQuantity,
          sortOrder[0].next_order
        ]
      );

      console.log('營位選項新增完成');

      await connection.commit();
      return NextResponse.json({ 
        success: true, 
        spot_id: spotId 
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('新增營位失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '新增營位失敗' 
      }, 
      { status: 500 }
    );
  }
} 