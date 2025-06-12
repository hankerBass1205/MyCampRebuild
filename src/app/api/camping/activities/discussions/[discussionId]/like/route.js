import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST: 處理點讚/取消點讚
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }

    // 等待 params 解析完成
    const { discussionId } = await Promise.resolve(params);

    // 檢查討論是否存在且未被刪除
    const [discussion] = await db.query(
      'SELECT id FROM user_discussions WHERE id = ? AND status = 1',
      [discussionId]
    );

    if (!discussion.length) {
      return Response.json({ error: '討論不存在或已被刪除' }, { status: 404 });
    }

    // 檢查是否已點讚
    const [existingLike] = await db.query(
      'SELECT id FROM user_discussion_likes WHERE user_id = ? AND discussion_id = ?',
      [session.user.id, discussionId]
    );

    if (existingLike.length > 0) {
      // 如果已點讚，則取消點讚
      await db.query(
        'DELETE FROM user_discussion_likes WHERE user_id = ? AND discussion_id = ?',
        [session.user.id, discussionId]
      );
      return Response.json({ liked: false });
    } else {
      // 如果未點讚，則新增點讚
      await db.query(
        'INSERT INTO user_discussion_likes (user_id, discussion_id) VALUES (?, ?)',
        [session.user.id, discussionId]
      );
      return Response.json({ liked: true });
    }
  } catch (error) {
    console.error('點讚操作失敗:', error);
    return Response.json({ error: '點讚操作失敗' }, { status: 500 });
  }
} 