import db from '@/lib/db';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    const [result] = await db.execute(
      `SELECT pr.*, u.email 
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

    if (!result.length) {
      return Response.json(
        { error: '驗證碼無效或已過期' },
        { status: 400 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('驗證OTP錯誤:', error);
    return Response.json(
      { error: '驗證過程發生錯誤' },
      { status: 500 }
    );
  }
} 