// app/api/categories/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, category_id FROM subcategories"
    );
    return NextResponse.json({ success: true, subcategories: rows });
  } catch (error) {
    console.error("獲取子分類失敗:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
