// app/api/products/[id]/route.js
import { NextResponse } from "next/server";
import db from "@/lib/db";

//update
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const {
      name,
      description,
      price,
      stock,
      category_id,
      subcategory_id,
      status,
    } = await request.json();

    if (!id || !name || !price || !stock) {
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

    // 更新產品
    await db.execute(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, stock = ?, category_id = ?, subcategory_id = ?, status = ?, updated_at = NOW() 
       WHERE id = ?`,
      [
        name,
        description,
        price,
        stock,
        category_id,
        subcategory_id,
        status || 1,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: "產品更新成功" });
  } catch (error) {
    console.error("更新產品失敗:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}

//delete

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少產品ID" },
        { status: 400 }
      );
    }

    // 刪除產品
    await db.execute(`DELETE FROM products WHERE id = ?`, [id]);

    return NextResponse.json({ success: true, message: "產品已刪除" });
  } catch (error) {
    console.error("刪除產品失敗:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
