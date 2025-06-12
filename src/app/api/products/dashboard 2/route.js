// app/api/products/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

// Read
export async function GET() {
  try {
    const [products] = await db.execute(`
      SELECT 
        p.id, p.name, p.price, p.stock, p.status, p.created_at, p.updated_at,p.category_id, p.subcategory_id,p.description,
        c.name AS category_name, sc.name AS subcategory_name,
        pi.image_path AS main_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("獲取產品失敗:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}

//Create
export async function POST(request) {
  try {
    const {
      name,
      description,
      price,
      stock,
      category_id,
      subcategory_id,
      status,
    } = await request.json();

    if (!name || !price || !stock || !category_id || !subcategory_id) {
      return NextResponse.json(
        { success: false, error: "缺少必要欄位" },
        { status: 400 }
      );
    }

    // 檢查分類和子分類是否存在
    const [category] = await db.execute(
      `SELECT id FROM categories WHERE id = ?`,
      [category_id]
    );
    const [subcategory] = await db.execute(
      `SELECT id FROM subcategories WHERE id = ?`,
      [subcategory_id]
    );
    if (category.length === 0 || subcategory.length === 0) {
      return NextResponse.json(
        { success: false, error: "分類或子分類不存在" },
        { status: 400 }
      );
    }

    // 插入產品
    const [result] = await db.execute(
      `INSERT INTO products (name, description, price, stock, category_id, subcategory_id, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        description,
        price,
        stock,
        category_id,
        subcategory_id,
        status || 1,
      ]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("新增產品失敗:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
