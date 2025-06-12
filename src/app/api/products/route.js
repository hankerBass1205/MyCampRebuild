import db from "@/lib/db";

export async function GET(req) {
  try {
    const url = new URL(req.url);

    // 取得前端傳來的搜尋參數
    const categoryId = url.searchParams.get("categoryId");
    const subcategoryId = url.searchParams.get("subcategoryId");

    // ★ 取得價格範圍
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");

    // 基礎查詢
    let query = `
      SELECT 
        p.id, p.name, p.price, p.description, 
        c.name AS category_name, 
        s.name AS subcategory_name,
        (
          SELECT image_path 
          FROM product_images 
          WHERE product_id = p.id AND is_main = 1 
          LIMIT 1
        ) AS main_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
    `;

    const conditions = [];
    const params = [];

    // 若有 categoryId
    if (categoryId) {
      conditions.push("p.category_id = ?");
      params.push(categoryId);
    }

    // 若有 subcategoryId
    if (subcategoryId) {
      conditions.push("p.subcategory_id = ?");
      params.push(subcategoryId);
    }

    // ★ 若有 minPrice, maxPrice
    //   注意：要確保 minPrice, maxPrice 為數字
    if (minPrice !== null && maxPrice !== null) {
      conditions.push("p.price BETWEEN ? AND ?");
      params.push(Number(minPrice), Number(maxPrice));
    }

    // 如有條件，則加上 WHERE
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    const [rows] = await db.query(query, params);

    return Response.json(rows);
  } catch (error) {
    console.error("Database error:", error);
    return new Response("Error fetching products", { status: 500 });
  }
}
