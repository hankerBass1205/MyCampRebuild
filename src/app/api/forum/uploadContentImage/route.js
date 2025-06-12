import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function POST(req) {
  try {
    // 解析 FormData
    const formData = await req.formData()
    const file = formData.get('image') // 確保名稱與前端一致

    if (!file) {
      return NextResponse.json(
        { success: false, message: '沒有圖片被上傳' },
        { status: 400 }
      )
    }

    // 檢查檔案類型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: '不支援的圖片格式' },
        { status: 400 }
      )
    }

    // 取得檔案副檔名
    const ext = path.extname(file.name)
    const fileName = `editor_${Date.now()}${ext}`
    const uploadDir = path.join(process.cwd(), 'public/uploads/forum/content/')

    // 確保目錄存在
    await fs.mkdir(uploadDir, { recursive: true })

    // 讀取檔案資料
    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = path.join(uploadDir, fileName)

    // 寫入檔案
    await fs.writeFile(filePath, buffer)

    // 回傳圖片 URL
    const imageUrl = `/uploads/forum/content/${fileName}`
    return NextResponse.json({ success: true, imageUrl }, { status: 200 })
  } catch (error) {
    console.error('圖片上傳錯誤:', error)
    return NextResponse.json(
      { success: false, message: '伺服器錯誤' },
      { status: 500 }
    )
  }
}
