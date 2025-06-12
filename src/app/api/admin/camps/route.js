import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET 取得所有營地申請
export async function GET() {
  try {
    const [applications] = await db.query(`
      SELECT * FROM camp_applications 
      ORDER BY created_at DESC
    `);

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching camp applications:", error);
    return NextResponse.json(
      { error: "取得資料失敗" },
      { status: 500 }
    );
  }
} 