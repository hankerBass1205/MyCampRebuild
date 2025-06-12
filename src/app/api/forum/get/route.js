import mysql from 'mysql2/promise'

export async function GET(req) {
  try {
    // 建立資料庫連線
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'camp_explorer_db',
    })

    // 解析 URL 查詢參數
    const { searchParams } = new URL(req.url)
    const category_id = searchParams.get('category_id')
    const page = parseInt(searchParams.get('page') || 1)
    const itemsPerPage = 10

    // 計算資料的起始與結束位置
    const offset = (page - 1) * itemsPerPage

    // 建立 SQL 查詢，使用 JOIN 將 forum_data 和 forum_topic_category 連結
    let query = `
    SELECT forum_data.*, 
        forum_topic_category.name AS category_name,
        forum_title_type.name AS title_type_name,
        users.name AS user_name,
        users.avatar AS user_avatar
    FROM forum_data
    JOIN forum_topic_category ON forum_data.category_id = forum_topic_category.id
    JOIN forum_title_type ON forum_data.type_id = forum_title_type.id
    JOIN users ON forum_data.user_id = users.id
    `

    let values = []

    // 如果有 category_id，則加入過濾條件
    if (category_id > 0) {
      query += ' AND forum_data.category_id = ?'
      values.push(category_id)
    }

    // 修改排序，將 pinned = 1 的文章排在最前面
    query += ' ORDER BY forum_data.pinned DESC, forum_data.created_at DESC'
    query += ' LIMIT ? OFFSET ?'
    values.push(itemsPerPage, offset)

    // 執行 SQL 查詢
    const [rows] = await db.execute(query, values)

    // 計算總筆數查詢
    let countQuery = `
    SELECT COUNT(*) AS totalCount 
    FROM forum_data 
    WHERE forum_data.status = 1`

    if (category_id > 0) {
      countQuery += ' AND forum_data.category_id = ?'
    }

    const [countRows] = await db.execute(
      countQuery,
      category_id > 0 ? [category_id] : []
    )
    const totalCount = countRows[0].totalCount // 取得總筆數

    const totalPages = Math.ceil(totalCount / itemsPerPage)

    // 關閉資料庫連線
    await db.end()

    // 回傳查詢結果、總頁數和總筆數
    return new Response(
      JSON.stringify({ data: rows, totalPages, totalCount }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('API 錯誤:', error)
    return new Response(JSON.stringify({ error: '伺服器錯誤' }), {
      status: 500,
    })
  }
}
