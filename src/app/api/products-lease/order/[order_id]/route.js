import db from "@/lib/db";

export async function GET(req, context) {
  // Await context.params to ensure it's properly resolved before accessing
  const { params } = context; 
  const { order_id } = await params;  // Await params

  try {
    const result = await db.query(
      "SELECT * FROM products_lease WHERE order_id = ?",
      [order_id]
    );

    if (result.length === 0) {
      return new Response(JSON.stringify({ message: "訂單不存在" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(result[0]), { status: 200 });
  
  } catch (error) {
    console.error("❌ 讀取訂單錯誤:", error);
    return new Response(JSON.stringify({ message: "系統錯誤" }), { status: 500 });
  }
}
