// /api/favorites/route.js
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

  // 取得分類參數，預設 "0" 表示全部
  const categoryId = searchParams.get('category') || '0'
  let categoryCondition = ''
  const values = [userId]

  if (categoryId !== '0') {
    // 若有指定分類，則在查詢中加入條件。注意這邊對應的是 forum_data 的 category_id
    categoryCondition = ' AND fd.category_id = ?'
    values.push(categoryId)
  }
  values.push(itemsPerPage, offset)

  const query = `
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
    WHERE fd.status = 1 
      AND ff.user_id = ? ${categoryCondition}
    ORDER BY fd.created_at DESC
    LIMIT ? OFFSET ?`

  const countQuery = `
    SELECT COUNT(*) AS totalCount
    FROM forum_favorites ff
    JOIN forum_data fd ON ff.forum_id = fd.id
    WHERE fd.status = 1 
      AND ff.user_id = ? ${categoryCondition}`

  try {
    const [rows] = await db.execute(query, values)
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
    console.error('Error fetching favorites:', error)
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 })
  }
}
