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

    const { activityId } = await request.json();
    if (!activityId) {
      return NextResponse.json(
        { error: '缺少活動ID' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: '無法獲取用戶ID' },
        { status: 400 }
      );
    }

    // 使用交易確保資料一致性
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 檢查活動是否存在
      const [activities] = await connection.query(
        'SELECT activity_id FROM spot_activities WHERE activity_id = ?',
        [activityId]
      );

      if (activities.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: '找不到該活動' },
          { status: 404 }
        );
      }

      // 檢查是否已經收藏
      const [existing] = await connection.query(
        'SELECT * FROM user_favorites WHERE user_id = ? AND type = ? AND item_id = ?',
        [userId, 'camp', activityId]
      );

      if (existing.length > 0) {
        // 如果已收藏，則取消收藏
        await connection.query(
          'DELETE FROM user_favorites WHERE user_id = ? AND type = ? AND item_id = ?',
          [userId, 'camp', activityId]
        );
        await connection.commit();
        return NextResponse.json({ 
          message: '已取消收藏',
          isFavorite: false 
        });
      } else {
        // 如果未收藏，則新增收藏
        await connection.query(
          'INSERT INTO user_favorites (user_id, type, item_id) VALUES (?, ?, ?)',
          [userId, 'camp', activityId]
        );
        await connection.commit();
        return NextResponse.json({ 
          message: '已加入收藏',
          isFavorite: true 
        });
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('收藏操作失敗:', error);
    return NextResponse.json(
      { 
        error: '收藏操作失敗',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET 方法保持不變
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ favorites: [] });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ favorites: [] });
    }

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');

    if (activityId) {
      const [result] = await pool.query(
        'SELECT * FROM user_favorites WHERE user_id = ? AND type = ? AND item_id = ?',
        [userId, 'camp', activityId]
      );
      return NextResponse.json({ isFavorite: result.length > 0 });
    } else {
      const [favorites] = await pool.query(
        'SELECT item_id as activity_id FROM user_favorites WHERE user_id = ? AND type = ?',
        [userId, 'camp']
      );
      return NextResponse.json({ 
        favorites: favorites.map(f => f.activity_id) 
      });
    }
  } catch (error) {
    console.error('獲取收藏狀態失敗:', error);
    return NextResponse.json(
      { error: '獲取收藏狀態失敗' },
      { status: 500 }
    );
  }
} 