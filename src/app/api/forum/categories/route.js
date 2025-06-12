import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const query = `
      SELECT id, name FROM forum_topic_category 
      WHERE status = 1 
      ORDER BY sort_order ASC
    `
    const categories = await db.query(query)

    // 假設 categories 返回的是一個嵌套的陣列，取第一個陣列作為分類資料
    const validCategories = categories[0].map(category => ({
      id: category.id,
      name: category.name
    }))

    // console.log('分類資料:', validCategories) // ✅ 確保返回正確格式的資料

    return NextResponse.json(validCategories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
