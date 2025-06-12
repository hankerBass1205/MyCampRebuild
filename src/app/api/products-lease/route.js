import db from "@/lib/db";

export async function GET(req) {
  try {
    const url = new URL(req.url); // 取得請求的 URL
    const categoryId = url.searchParams.get("categoryId"); // 從 URL 參數獲取類別 ID
    const subcategoryId = url.searchParams.get("subcategoryId"); // 從 URL 參數獲取子類別 ID

    // 構建 SQL 查詢
    let query = `
      SELECT 
    p.id, 
    p.name, 
    p.price, 
    p.description, 
    c.name AS category_name, 
    s.name AS subcategory_name,
    pi.image_path AS main_image
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN subcategories s ON p.subcategory_id = s.id
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_main = 1
WHERE p.lease = 1;
    `;

    const conditions = []; // 用來存儲 WHERE 條件
    const params = []; // 用來存儲對應的參數，防止 SQL 注入

    // 如果有 categoryId，則加入篩選條件
    if (categoryId) {
      conditions.push("p.category_id = ?");
      params.push(categoryId);
    }

    // 如果有 subcategoryId，則加入篩選條件
    if (subcategoryId) {
      conditions.push("p.subcategory_id = ?");
      params.push(subcategoryId);
    }

    // 如果有條件，則加上 WHERE 子句
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // 執行 SQL 查詢
    const [rows] = await db.query(query, params);

    return Response.json(rows);
  } catch (error) {
    console.error("Database error:", error);
    return new Response("Error fetching products", { status: 500 });
  }
}
