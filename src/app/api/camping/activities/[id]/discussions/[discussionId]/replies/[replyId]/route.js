import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT: 更新回覆
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    const { replyId } = params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return Response.json(
        { error: '請輸入回覆內容' },
        { status: 400 }
      );
    }

    // 檢查權限
    const [replies] = await db.query(
      `SELECT user_id 
       FROM user_discussion_replies 
       WHERE id = ? AND status = 1`,
      [replyId]
    );

    if (!replies.length) {
      return Response.json(
        { error: '回覆不存在或已被刪除' },
        { status: 404 }
      );
    }

    if (replies[0].user_id !== session.user.id) {
      return Response.json(
        { error: '無權限編輯此回覆' },
        { status: 403 }
      );
    }

    // 更新回覆
    await db.query(
      `UPDATE user_discussion_replies 
       SET content = ?
       WHERE id = ?`,
      [content, replyId]
    );

    // 獲取更新後的回覆資訊
    const [updatedReply] = await db.query(
      `SELECT 
        r.id,
        r.content,
        r.created_at,
        r.updated_at,
        r.user_id,
        r.status,
        u.name as user_name,
        u.image as user_image
      FROM user_discussion_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?`,
      [replyId]
    );

    return Response.json({ reply: updatedReply[0] });
  } catch (error) {
    console.error('更新回覆失敗:', error);
    return Response.json(
      { error: '更新回覆失敗' },
      { status: 500 }
    );
  }
}

// DELETE: 刪除回覆（軟刪除）
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    const { replyId } = params;

    // 檢查權限
    const [replies] = await db.query(
      `SELECT user_id 
       FROM user_discussion_replies 
       WHERE id = ? AND status = 1`,
      [replyId]
    );

    if (!replies.length) {
      return Response.json(
        { error: '回覆不存在或已被刪除' },
        { status: 404 }
      );
    }

    if (replies[0].user_id !== session.user.id) {
      return Response.json(
        { error: '無權限刪除此回覆' },
        { status: 403 }
      );
    }

    // 軟刪除回覆
    await db.query(
      `UPDATE user_discussion_replies 
       SET status = 0 
       WHERE id = ?`,
      [replyId]
    );

    return Response.json({ message: '回覆已刪除' });
  } catch (error) {
    console.error('刪除回覆失敗:', error);
    return Response.json(
      { error: '刪除回覆失敗' },
      { status: 500 }
    );
  }
}