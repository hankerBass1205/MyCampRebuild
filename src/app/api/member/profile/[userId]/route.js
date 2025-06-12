import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    // 查詢用戶基本資訊，包含會員等級和積分
    const query = `
      SELECT 
        users.id,
        users.email,
        users.name,
        users.phone,
        users.birthday,
        users.gender,
        users.address,
        users.avatar,
        users.created_at,
        users.updated_at,
        users.login_type,
        users.level_id,
        users.points,
        users.line_user_id,
        user_levels.level_name,
        user_levels.level_description,
        user_levels.required_points,
        user_levels.discount,
        user_levels.other_benefits
      FROM users
      JOIN user_levels ON users.level_id = user_levels.id
      WHERE users.id = ?
    `;
    const [rows] = await db.query(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }

    const user = rows[0];

    // 檢查點數是否達到下一階
    let newLevelId = user.level_id;
    const [levelRows] = await db.query(
      "SELECT id, required_points FROM user_levels WHERE id > ? ORDER BY id ASC",
      [user.level_id]
    );
    for (const level of levelRows) {
      if (user.points >= level.required_points) {
        newLevelId = level.id;
      } else {
        break;
      }
    }

    // 如果等級有變化，更新等級
    if (newLevelId !== user.level_id) {
      await db.query("UPDATE users SET level_id = ? WHERE id = ?", [
        newLevelId,
        userId,
      ]);
      user.level_id = newLevelId;
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("獲取用戶資料失敗:", error);
    return NextResponse.json({ error: "獲取用戶資料失敗" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { userId } = await params;
    const { name, address, phone, avatar, password, level_id, birthday } =
      await request.json();

    // 查詢用戶的登入類型
    const [userRows] = await db.query(
      "SELECT login_type, line_user_id FROM users WHERE id = ?",
      [userId]
    );
    if (userRows.length === 0) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }
    const user = userRows[0];

    // 如果有提供新密碼，且登入類型為 email，則加密新密碼
    let hashedPassword = null;
    if (password && user.login_type === "email") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 更新用戶資料
    const query = `
      UPDATE users
      SET 
        name = ?, 
        address = ?, 
        phone = ?, 
        avatar = ?, 
        password = COALESCE(?, password), 
        level_id = ?,
        birthday = ?
      WHERE id = ?
    `;
    const [result] = await db.query(query, [
      name,
      address,
      phone,
      avatar,
      hashedPassword,
      level_id,
      birthday,
      userId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "更新失敗" }, { status: 404 });
    }

    return NextResponse.json({ message: "更新成功" });
  } catch (error) {
    console.error("更新用戶資料失敗:", error);
    return NextResponse.json({ error: "更新用戶資料失敗" }, { status: 500 });
  }
}
