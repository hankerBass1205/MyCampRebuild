// /api/forum/userList.js
import mysql from 'mysql2/promise'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(req) {
  // 取得目前使用者的 session
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response(JSON.stringify({ error: '未登入' }), { status: 401 })
  }
  const userId = session.user.id // 確保 session 中有 user.id

  // 解析 URL 查詢參數
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 預期 "post" 或 "favorite"
  const page = parseInt(searchParams.get('page') || '1')
  const itemsPerPage = 10
  const offset = (page - 1) * itemsPerPage

  // 建立資料庫連線
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'camp_explorer_db',
  })

  let query = ''
  let values = []
  let countQuery = ''
  let countValues = []

  if (type === 'post') {
    // 查詢目前使用者的發文清單
    query = `
      SELECT forum_data.*, 
        forum_topic_category.name AS category_name,
        forum_title_type.name AS title_type_name,
        users.name AS user_name,
        users.avatar AS user_avatar
      FROM forum_data
      JOIN forum_topic_category ON forum_data.category_id = forum_topic_category.id
      JOIN forum_title_type ON forum_data.type_id = forum_title_type.id
      JOIN users ON forum_data.user_id = users.id
      WHERE forum_data.status = 1 AND forum_data.user_id = ?
      ORDER BY forum_data.pinned DESC, forum_data.created_at DESC
      LIMIT ? OFFSET ?`
    values.push(userId, itemsPerPage, offset)

    countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM forum_data
      WHERE forum_data.status = 1 AND forum_data.user_id = ?`
    countValues.push(userId)
  } else if (type === 'favorite') {
    // 查詢目前使用者的收藏清單
    // 假設有一個 forum_favorites 資料表，記錄 user_id 與 forum_id
    query = `
      SELECT fd.*, 
        ftc.name AS category_name,
        ftt.name AS title_type_name,
        u.name AS user_name,
        u.avatar AS user_avatar
      FROM forum_favorites ff
      JOIN forum_data fd ON ff.forum_id = fd.id
      JOIN forum_topic_category ftc ON fd.category_id = ftc.id
      JOIN forum_title_type ftt ON fd.type_id = ftt.id
      JOIN users u ON fd.user_id = u.id
      WHERE fd.status = 1 AND ff.user_id = ?
      ORDER BY fd.created_at DESC
      LIMIT ? OFFSET ?`
    values.push(userId, itemsPerPage, offset)

    countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM forum_favorites ff
      JOIN forum_data fd ON ff.forum_id = fd.id
      WHERE fd.status = 1 AND ff.user_id = ?`
    countValues.push(userId)
  } else {
    return new Response(JSON.stringify({ error: '無效的 type 參數' }), {
      status: 400,
    })
  }

  try {
    // 執行資料查詢
    const [rows] = await db.execute(query, values)
    const [countRows] = await db.execute(countQuery, countValues)
    const totalCount = countRows[0].totalCount
    const totalPages = Math.ceil(totalCount / itemsPerPage)

    await db.end()

    return new Response(
      JSON.stringify({ data: rows, totalPages, totalCount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('API 錯誤:', error)
    return new Response(JSON.stringify({ error: '伺服器錯誤' }), {
      status: 500,
    })
  }
}
