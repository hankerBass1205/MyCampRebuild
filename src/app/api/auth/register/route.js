// ===== 套件與工具引入 =====
import { NextResponse } from 'next/server';  // Next.js 回應處理工具
import bcrypt from 'bcryptjs';  // 改為使用 bcryptjs
import pool from '@/lib/db';  // MySQL 資料庫連接池：用於資料庫操作

// ===== 註冊 API 處理函數 =====
export async function POST(request) {
  try {
    // 從請求中取得註冊資訊
    const { email, password, role } = await request.json();

    // ===== 資料驗證 =====
    // 檢查必填欄位
    if (!email || !password) {
      return NextResponse.json(
        { error: '電子信箱和密碼為必填欄位' }, 
        { status: 400 }
      );
    }

    // ===== 資料庫連接 =====
    const connection = await pool.getConnection();

    try {
      // ===== 信箱重複檢查 =====
      // 檢查 users 表是否已存在此信箱
      const [existingUsers] = await connection.query(
        'SELECT email FROM users WHERE email = ?',
        [email]
      );

      // 檢查 owners 表是否已存在此信箱
      const [existingOwners] = await connection.query(
        'SELECT email FROM owners WHERE email = ?',
        [email]
      );

      // 若信箱已被註冊，回傳錯誤
      if (existingUsers.length > 0 || existingOwners.length > 0) {
        return NextResponse.json(
          { error: '此電子信箱已被註冊' }, 
          { status: 400 }
        );
      }

      // ===== 密碼加密 =====
      const saltRounds = 10;  // 加密強度
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // ===== 時間戳記 =====
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // ===== 使用者建立 =====
      if (role === 'owner') {
        // 建立營地主帳號
        await connection.query(
          'INSERT INTO owners (email, password, name, status, created_at) VALUES (?, ?, ?, ?, ?)',
          [email, hashedPassword, email.split('@')[0], 1, now]
        );
      } else {
        // 建立一般會員帳號（包含預設值）
        await connection.query(`
          INSERT INTO users (
            email, 
            password, 
            name,
            phone,
            birthday,
            gender,
            address,
            avatar,
            status,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            email,
            hashedPassword,
            email.split('@')[0],        // 使用信箱前綴作為預設名稱
            '未設定',                    // 預設電話
            '2000-01-01',              // 預設生日
            'male',                     // 預設性別
            '未設定',                    // 預設地址
            'default-avatar.png',       // 預設大頭貼
            1,                          // 狀態啟用
            now,                        // 建立時間
            now                         // 更新時間
          ]
        );
      }

      // ===== 回傳成功訊息 =====
      return NextResponse.json({ 
        success: true,
        message: '註冊成功',
        role: role 
      });

    } finally {
      // ===== 釋放資料庫連接 =====
      connection.release();
    }

  } catch (error) {
    // ===== 錯誤處理 =====
    console.error('註冊錯誤:', error);
    return NextResponse.json({ 
      success: false,
      error: '註冊過程發生錯誤',
      details: error.message 
    }, { status: 500 });
  }
}

// ===== GET 請求處理 =====
export async function GET() {
  return NextResponse.json(
    { message: '請使用 POST 方法進行註冊' },
    { status: 405 }
  );
}