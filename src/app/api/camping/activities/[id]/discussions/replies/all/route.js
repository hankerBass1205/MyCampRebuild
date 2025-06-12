import db from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { id } = params;

    // 一次性獲取特定活動的所有討論的回覆
    const [replies] = await db.query(`
      SELECT 
        r.*,
        u.name as user_name,
        u.avatar as user_image
      FROM user_discussion_replies r
      JOIN users u ON r.user_id = u.id
      JOIN user_discussions d ON r.discussion_id = d.id
      WHERE d.item_id = ?
        AND d.type = 'camp'
        AND r.status = 1
      ORDER BY r.created_at DESC
    `, [id]);

    return Response.json({ replies });
  } catch (error) {
    console.error('獲取回覆失敗:', error);
    return Response.json(
      { error: '獲取回覆失敗' },
      { status: 500 }
    );
  }
} 