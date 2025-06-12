import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: 獲取評論列表
export async function GET(req, context) {
  try {
    // 先等待整個 params 物件
    const params = await context.params;
    const id = params.id;
    
    // 只獲取有效評論（status = 1）
    const [discussions] = await db.query(`
      SELECT 
        ud.*,
        u.name as user_name,
        COUNT(udl.id) as likes_count
      FROM user_discussions ud
      JOIN users u ON ud.user_id = u.id
      LEFT JOIN user_discussion_likes udl ON ud.id = udl.discussion_id
      WHERE ud.type = 'camp' 
      AND ud.item_id = ?
      AND ud.status = 1
      GROUP BY ud.id
      ORDER BY ud.created_at DESC
    `, [id]);

    // 計算平均評分（只計算有效評論）
    const [[ratingResult]] = await db.query(`
      SELECT 
        CAST(AVG(rating) AS DECIMAL(10,1)) as avg_rating, 
        COUNT(*) as total
      FROM user_discussions
      WHERE type = 'camp' 
      AND item_id = ? 
      AND status = 1
    `, [id]);

    return Response.json({
      discussions,
      averageRating: Number(ratingResult?.avg_rating || 0),
      total: ratingResult?.total || 0
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return Response.json({ error: '獲取評論失敗' }, { status: 500 });
  }
}

// POST: 新增評論
export async function POST(req, context) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }

    // 先等待整個 params 物件
    const params = await context.params;
    const id = params.id;
    
    // console.log('Session 資訊:', {
    //   user: session.user,
    //   id: session.user.id,
    //   params: params
    // });

    const { content, rating } = await req.json();

    // 驗證評論內容
    if (!content?.trim()) {
      return Response.json({ error: '請輸入評論內容' }, { status: 400 });
    }

    // 驗證評分
    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ error: '請給予有效評分(1-5)' }, { status: 400 });
    }

    // 檢查是否已經有有效評論（status = 1）
    const [existingComments] = await db.query(`
      SELECT id FROM user_discussions
      WHERE user_id = ? 
      AND type = 'camp' 
      AND item_id = ?
      AND status = 1
    `, [session.user.id, id]);

    // console.log('現有評論:', existingComments);

    if (existingComments.length > 0) {
      return Response.json({ 
        error: '您已經評論過此活動',
        debug: {
          userId: session.user.id,
          itemId: id,
          existingComments
        }
      }, { status: 400 });
    }

    // 新增評論
    const [result] = await db.query(`
      INSERT INTO user_discussions 
      (user_id, type, item_id, content, rating, status)
      VALUES (?, 'camp', ?, ?, ?, 1)
    `, [session.user.id, id, content, rating]);

    return Response.json({ 
      message: '評論發布成功',
      comment_id: result.insertId 
    });
  } catch (error) {
    console.error('Error adding discussion:', error);
    return Response.json({ 
      error: '評論發布失敗',
      debug: error.message 
    }, { status: 500 });
  }
} 