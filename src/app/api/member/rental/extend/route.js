// app/api/member/rental/extend/route.js
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const { leaseId, newDate, additionalCost } = await request.json();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "需要登入才能使用" }, { status: 401 });
    }

    // 验证租借记录
    const [existingLease] = await db.query(
      "SELECT * FROM products_lease WHERE id = ? AND user_id = ?",
      [leaseId, session.user.id]
    );

    if (existingLease.length === 0) {
      return NextResponse.json({ error: "找不到租借紀錄" }, { status: 404 });
    }

    // 验证日期
    const currentEnd = new Date(existingLease[0].appointment_end);
    const newEnd = new Date(newDate);

    if (newEnd <= currentEnd) {
      return NextResponse.json(
        { error: "新日期必須晚於當前日期" },
        { status: 400 }
      );
    }

    // 計算新價格 - 確保是數字計算
    const currentPrice = parseFloat(existingLease[0].price);
    const newPrice = currentPrice + (parseFloat(additionalCost) || 0);

    // 更新数据库 - 同時更新日期和價格
    await db.query(
      "UPDATE products_lease SET appointment_end = ?, price = ? WHERE id = ?",
      [newDate, newPrice, leaseId]
    );

    return NextResponse.json({
      success: true,
      newEndDate: newDate,
      newPrice: newPrice,
    });
  } catch (error) {
    console.error("延長租借失敗:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
