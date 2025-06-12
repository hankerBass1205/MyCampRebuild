import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: 獲取特定討論的所有回覆
export async function GET(req, { params }) {
  try {
    // 等待參數解析完成
    const { discussionId } = await Promise.resolve(params);
    
    if (!discussionId) {
      return Response.json(
        { error: '討論ID不能為空' },
        { status: 400 }
      );
    }

    // 檢查數據庫連接
    if (!db) {
      return Response.json(
        { error: '數據庫連接失敗' },
        { status: 500 }
      );
    }

    const [replies] = await db.query(
      `SELECT 
        r.id,
        r.content,
        r.created_at,
        r.updated_at,
        r.user_id,
        r.status,
        u.name as user_name,
        u.avatar as user_image
      FROM user_discussion_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.discussion_id = ? 
        AND r.status = 1
      ORDER BY r.created_at ASC`,
      [discussionId]
    );

    return Response.json({ replies });
  } catch (error) {
    console.error('獲取回覆失敗:', error);
    return Response.json(
      { 
        error: '獲取回覆失敗',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST: 新增回覆
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    // 等待 params 解析完成
    const { discussionId } = await Promise.resolve(params);
    const { content } = await req.json();

    if (!content?.trim()) {
      return Response.json(
        { error: '請輸入回覆內容' },
        { status: 400 }
      );
    }

    // 檢查討論是否存在且未被刪除
    const [discussions] = await db.query(
      'SELECT id FROM user_discussions WHERE id = ? AND status = 1',
      [discussionId]
    );

    if (!discussions.length) {
      return Response.json(
        { error: '討論不存在或已被刪除' },
        { status: 404 }
      );
    }

    // 新增回覆
    const [result] = await db.query(
      `INSERT INTO user_discussion_replies 
        (discussion_id, user_id, content)
      VALUES (?, ?, ?)`,
      [discussionId, session.user.id, content]
    );

    // 獲取新增的回覆資訊
    const [newReply] = await db.query(
      `SELECT 
        r.id,
        r.content,
        r.created_at,
        r.updated_at,
        r.user_id,
        r.status,
        u.name as user_name,
        u.avatar as user_image
      FROM user_discussion_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?`,
      [result.insertId]
    );

    return Response.json(
      { reply: newReply[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('新增回覆失敗:', error);
    return Response.json(
      { error: '新增回覆失敗' },
      { status: 500 }
    );
  }
}