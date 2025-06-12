// ===== 套件與工具引入 =====
import db from '@/lib/db';  // MySQL 資料庫連接：用於資料存取
import { generateOTP } from '@/lib/utils';  // OTP 生成工具：產生隨機驗證碼
import { sendEmail } from '@/lib/email';  // 郵件發送工具：處理郵件寄送

// ===== 忘記密碼 API 處理函數 =====
export async function POST(request) {
  try {
    // 從請求中取得使用者信箱
    const { email } = await request.json();

    // ===== 信箱驗證 =====
    // 檢查信箱是否存在於資料庫中
    const [users] = await db.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );

    // 若信箱不存在，回傳錯誤訊息
    if (!users.length) {
      return Response.json(
        { error: '此信箱尚未註冊' },
        { status: 404 }
      );
    }

    // ===== OTP 處理 =====
    const user = users[0];
    const otp = generateOTP();  // 生成 6 位數驗證碼
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);  // 設定 10 分鐘後過期

    // ===== 儲存 OTP =====
    // 將驗證碼資訊存入資料庫
    await db.execute(
      `INSERT INTO password_resets (user_id, otp, expires_at) 
       VALUES (?, ?, ?)`,
      [user.id, otp, expiryTime]
    );

    // ===== 發送驗證郵件 =====
    // 寄送包含驗證碼的郵件給使用者
    await sendEmail({
      to: email,
      subject: '重設密碼驗證碼',
      html: `
        <p>您的驗證碼是: ${otp}</p>
        <p>此驗證碼將在 10 分鐘後失效</p>
      `
    });

    // 回傳成功訊息
    return Response.json({ success: true });

  } catch (error) {
    // ===== 錯誤處理 =====
    console.error('發送OTP錯誤:', error);
    return Response.json(
      { error: '發送驗證碼失敗' },
      { status: 500 }
    );
  }
} 