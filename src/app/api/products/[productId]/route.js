import db from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const { productId } = await params;

    // 查詢商品資訊
    const [productRows] = await db.query(
      `SELECT p.*, c.name AS category_name, s.name AS subcategory_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories s ON p.subcategory_id = s.id
       WHERE p.id = ?`,
      [productId]
    );

    if (productRows.length === 0) {
      return new Response("Product not found", { status: 404 });
    }

    const product = productRows[0];

    // 查詢商品圖片
    const [imageRows] = await db.query(
      "SELECT image_path FROM product_images WHERE product_id = ?",
      [productId]
    );

    return Response.json({ ...product, images: imageRows });
  } catch (error) {
    console.error("Database error:", error);
    return new Response("Error fetching product", { status: 500 });
  }
}
