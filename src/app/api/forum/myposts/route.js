// /api/mypost/route.js
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(req) {
  // 取得使用者 session
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '未登入' }, { status: 401 })
  }
  const userId = session.user.id

  // 解析 URL 查詢參數
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const itemsPerPage = 10
  const offset = (page - 1) * itemsPerPage

  // 建立資料庫連線
  // const db = await mysql.createConnection({
  //   host: 'localhost',
  //   user: 'root',
  //   password: '',
  //   database: 'camp_explorer_db',
  // })

  // 取得分類參數，預設值 "0" 表示全部
  const categoryId = searchParams.get('category') || '0'
  let categoryCondition = ''
  const values = [userId]

  if (categoryId !== '0') {
    // 若有指定分類，加入條件
    categoryCondition = ' AND forum_data.category_id = ?'
    values.push(categoryId)
  }
  // 加入分頁參數
  values.push(itemsPerPage, offset)

  const query = `
    SELECT forum_data.*, 
      forum_topic_category.name AS category_name,
      forum_title_type.name AS title_type_name,
      users.avatar AS user_avatar
    FROM forum_data
    JOIN forum_topic_category ON forum_data.category_id = forum_topic_category.id
    JOIN forum_title_type ON forum_data.type_id = forum_title_type.id
    JOIN users ON forum_data.user_id = users.id
    WHERE forum_data.user_id = ? ${categoryCondition}
    ORDER BY forum_data.pinned DESC, forum_data.created_at DESC
    LIMIT ? OFFSET ?`

  const countQuery = `
    SELECT COUNT(*) AS totalCount
    FROM forum_data
    WHERE forum_data.user_id = ? ${categoryCondition}`

  try {
    const [rows] = await db.execute(query, values)
    // count query 的參數只需要 userId 以及（如果有）分類參數
    const countValues = [userId]
    if (categoryId !== '0') {
      countValues.push(categoryId)
    }
    const [countRows] = await db.execute(countQuery, countValues)
    const totalCount = countRows[0].totalCount
    const totalPages = Math.ceil(totalCount / itemsPerPage)

    // await db.end()

    return NextResponse.json(
      { data: rows, totalPages, totalCount },
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error fetching my posts:', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
