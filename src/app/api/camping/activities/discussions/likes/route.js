import db from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: 獲取用戶已點讚的評論列表
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: '請先登入' }, { status: 401 });
    }

    // 獲取用戶所有點讚的評論 ID
    const [likes] = await db.query(
      'SELECT discussion_id FROM user_discussion_likes WHERE user_id = ?',
      [session.user.id]
    );

    const likedDiscussionIds = likes.map(like => like.discussion_id);

    return Response.json({ likedDiscussionIds });
  } catch (error) {
    console.error('獲取點讚記錄失敗:', error);
    return Response.json({ error: '獲取點讚記錄失敗' }, { status: 500 });
  }
} 