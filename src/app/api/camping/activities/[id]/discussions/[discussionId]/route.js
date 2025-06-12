import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT: 更新評論
export async function PUT(req, context) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }

    // 正確處理動態參數
    const params = await context.params;
    const { id, discussionId } = params;

    const { content, rating } = await req.json();

    // 驗證評論內容
    if (!content?.trim()) {
      return Response.json({ error: '請輸入評論內容' }, { status: 400 });
    }

    // 驗證評分
    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ error: '請給予有效評分(1-5)' }, { status: 400 });
    }

    // 檢查評論是否存在且屬於當前用戶
    const [discussion] = await db.query(`
      SELECT * FROM user_discussions 
      WHERE id = ? AND user_id = ? AND status = 1
    `, [discussionId, session.user.id]);

    if (!discussion.length) {
      return Response.json({ error: '無權編輯此評論' }, { status: 403 });
    }

    // 更新評論
    await db.query(`
      UPDATE user_discussions 
      SET content = ?, rating = ?, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [content, rating, discussionId, session.user.id]);

    return Response.json({ 
      message: '評論更新成功'
    });

  } catch (error) {
    console.error('Error updating discussion:', error);
    return Response.json({ 
      error: '評論更新失敗',
      debug: error.message 
    }, { status: 500 });
  }
}

// DELETE: 刪除評論
export async function DELETE(req, context) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }

    // 正確處理動態參數
    const params = await context.params;
    const { id, discussionId } = params;

    // 檢查評論是否存在且屬於當前用戶
    const [discussion] = await db.query(`
      SELECT * FROM user_discussions 
      WHERE id = ? AND user_id = ? AND status = 1
    `, [discussionId, session.user.id]);

    if (!discussion.length) {
      return Response.json({ error: '無權刪除此評論' }, { status: 403 });
    }

    // 軟刪除評論（將狀態改為 0）
    await db.query(`
      UPDATE user_discussions 
      SET status = 0, updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [discussionId, session.user.id]);

    return Response.json({ 
      message: '評論刪除成功'
    });

  } catch (error) {
    console.error('Error deleting discussion:', error);
    return Response.json({ 
      error: '評論刪除失敗',
      debug: error.message 
    }, { status: 500 });
  }
} 