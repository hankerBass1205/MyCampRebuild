import nodemailer from 'nodemailer';

// 建立郵件傳輸器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,         // SMTP 伺服器位址
  port: process.env.SMTP_PORT,         // SMTP 埠號
  auth: {
    user: process.env.SMTP_USER,       // SMTP 帳號
    pass: process.env.SMTP_PASSWORD,   // SMTP 密碼
  },
});

// 發送郵件函數
// 參數：
// - to: 收件者郵箱
// - subject: 郵件主旨
// - html: 郵件內容（HTML 格式）
export async function sendEmail({ to, subject, html }) {
  try {
    // 發送郵件
    const info = await transporter.sendMail({
      from: `"您的網站名稱" <${process.env.SMTP_FROM}>`,  // 寄件者
      to,                                                  // 收件者
      subject,                                            // 主旨
      html: `
        <!-- 郵件樣板 -->
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <!-- 郵件標題區 -->
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #28a745;">${subject}</h1>
          </div>
          <!-- 郵件內容區 -->
          <div style="padding: 20px;">
            ${html}
          </div>
          <!-- 郵件頁尾 -->
          <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
            此郵件由系統自動發送，請勿直接回覆
          </div>
        </div>
      `
    });

    // 記錄成功發送
    console.log('郵件發送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // 記錄發送失敗
    console.error('郵件發送失敗:', error);
    throw new Error(`郵件發送失敗: ${error.message}`);
  }
} 