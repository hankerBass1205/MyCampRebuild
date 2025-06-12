// ===== 套件與工具引入 =====
import db from '@/lib/db';  // MySQL 資料庫連接：用於資料存取
import bcrypt from 'bcryptjs';  // 密碼加密工具：用於密碼雜湊處理

// ===== 重設密碼 API 處理函數 =====
export async function POST(request) {
  try {
    // 從請求中取得重設密碼所需資訊
    const { email, otp, newPassword } = await request.json();

    // ===== 密碼規則驗證 =====
    // 檢查新密碼長度是否符合要求
    if (newPassword.length < 8) {
      return Response.json(
        { error: '密碼長度必須至少8個字元' },
        { status: 400 }
      );
    }

    // ===== OTP 驗證 =====
    // 查詢有效的重設密碼記錄
    const [resetRecord] = await db.execute(
      `SELECT pr.*, u.id as user_id 
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE u.email = ? 
       AND pr.otp = ?
       AND pr.used = 0
       AND pr.expires_at > NOW()
       ORDER BY pr.created_at DESC
       LIMIT 1`,
      [email, otp]
    );

    // 驗證 OTP 是否有效
    if (!resetRecord.length) {
      return Response.json(
        { error: '無效的請求或驗證碼已過期' },
        { status: 400 }
      );
    }

    // ===== 密碼加密 =====
    // 使用 bcrypt 加密新密碼
    const saltRounds = 10;  // 加密強度
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // ===== 更新密碼 =====
    // 將新密碼更新到使用者資料表
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, resetRecord[0].user_id]
    );

    // ===== 更新 OTP 狀態 =====
    // 將已使用的 OTP 標記為已使用
    await db.execute(
      'UPDATE password_resets SET used = 1 WHERE id = ?',
      [resetRecord[0].id]
    );

    // ===== 回傳成功訊息 =====
    return Response.json({ 
      success: true,
      message: '密碼重設成功'
    });

  } catch (error) {
    // ===== 錯誤處理 =====
    console.error('重設密碼錯誤:', error);
    return Response.json(
      { error: '重設密碼過程發生錯誤' },
      { status: 500 }
    );
  }
} 