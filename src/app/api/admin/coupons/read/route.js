import db from "@/lib/db";

export async function GET(request) {
  try {
     // 查詢所有優惠券
     const query = "SELECT * FROM coupons;";
     const [rows] = await db.query(query);

     // 回傳優惠券列表
    return Response.json(rows);

  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ error: "Database error" }, { status: 500 });
  }
}