import db from '@/lib/db'

export async function GET(req, context) {
  const { params } = await context
  const { id } = params

  // 檢查 ID 是否為數字
  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid thread ID' }), {
      status: 400,
    })
  }

  try {
    // 取得討論串的文章，JOIN users 來獲取發文者的名稱與頭像
    const [thread] = await db.execute(
      `SELECT forum_data.*, 
              users.name AS user_name, 
              users.avatar AS user_avatar 
       FROM forum_data
       JOIN users ON forum_data.user_id = users.id
       WHERE forum_data.id = ?`,
      [id]
    )

    if (thread.length === 0) {
      return new Response(JSON.stringify({ error: 'Thread not found' }), {
        status: 404,
      })
    }

    // 取得回覆，JOIN users 來獲取回覆者的名稱與頭像
    const [replies] = await db.execute(
      `SELECT forum_reply_data.*, 
              users.name AS user_name, 
              users.avatar AS user_avatar 
       FROM forum_reply_data
       JOIN users ON forum_reply_data.user_id = users.id
       WHERE forum_reply_data.forum_id = ?
       ORDER BY forum_reply_data.created_at ASC`,
      [id]
    )

    return new Response(JSON.stringify({ thread: thread[0], replies }), {
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Database error', details: error.message }),
      { status: 500 }
    )
  }
}
