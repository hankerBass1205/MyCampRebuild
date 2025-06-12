import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import db from '@/lib/db';
import crypto from 'crypto';

// 獲取營主個人資料
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    // SQL 查詢營主資料
    const sql = `
      SELECT 
        id,
        email,
        name,
        company_name,
        phone,
        address,
        status
      FROM owners 
      WHERE email = ? AND status = 1
    `;
    
    const result = await db.query(sql, [session.user.email]);

    if (result.length === 0) {
      return NextResponse.json(
        { error: '找不到營主資料' },
        { status: 404 }
      );
    }

    // 直接返回第一個結果
    return NextResponse.json(result[0]);

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json(
      { error: '獲取資料失敗' },
      { status: 500 }
    );
  }
}

// 更新營主個人資料
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // SQL 更新營主資料
    const sql = `
      UPDATE owners 
      SET 
        name = ?,
        company_name = ?,
        phone = ?,
        address = ?
      WHERE email = ? AND status = 1
    `;

    await db.query(sql, [
      data.name,
      data.company_name || '',
      data.phone || null,
      data.address || null,
      session.user.email
    ]);

    return NextResponse.json({ message: '更新成功' });

  } catch (error) {
    console.error('更新營主資料失敗:', error);
    return NextResponse.json(
      { error: '更新資料失敗' },
      { status: 500 }
    );
  }
}

// 更新密碼
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權訪問' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // 將當前密碼轉換為 MD5
    const currentPasswordMd5 = crypto
      .createHash('md5')
      .update(currentPassword)
      .digest('hex');

    // 驗證當前密碼
    const [user] = await db.query(
      'SELECT password FROM owners WHERE email = ? AND status = 1',
      [session.user.email]
    );

    if (!user.length) {
      return NextResponse.json({ error: '找不到使用者' }, { status: 404 });
    }

    // 比對 MD5 密碼
    if (currentPasswordMd5 !== user[0].password) {
      return NextResponse.json({ error: '目前密碼不正確' }, { status: 400 });
    }

    // 將新密碼轉換為 MD5
    const newPasswordMd5 = crypto
      .createHash('md5')
      .update(newPassword)
      .digest('hex');

    // 更新密碼
    await db.query(
      'UPDATE owners SET password = ? WHERE email = ? AND status = 1',
      [newPasswordMd5, session.user.email]
    );

    return NextResponse.json({ message: '密碼更新成功' });
  } catch (error) {
    console.error('密碼更新失敗:', error);
    return NextResponse.json({ error: '密碼更新失敗' }, { status: 500 });
  }
} 