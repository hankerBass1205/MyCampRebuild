import { NextResponse } from "next/server";
import db from "@/lib/db"; // 資料庫連線
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // 確保你的 NextAuth 設定正確

// GET /api/product-cart
export async function GET(request) {
  try {
    // 使用 NextAuth 獲取當前登入的使用者
    const session = await getServerSession(authOptions);
    // console.log("⚡ API 取得 session:", session);

    // 若未登入，返回 401 未授權
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    // 獲取當前登入使用者的 ID
    const userId = session.user.id;

    // 查詢購物車資料
    const [rows] = await db.query(
      `
      SELECT 
          c.id AS cart_item_id,
          c.product_id,
          c.quantity,
          p.name AS product_name,
          p.price AS product_price,
          p.stock AS product_stock,
          (
            SELECT image_path 
            FROM product_images 
            WHERE product_id = c.product_id AND is_main = 1 
            LIMIT 1
          ) AS product_image
      FROM product_cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      `,
      [userId]
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("購物車獲取失敗:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/product-cart
export async function POST(request) {
  try {
    // 使用 NextAuth 獲取當前登入的使用者
    const session = await getServerSession(authOptions);

    // 若未登入，返回 401 未授權
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    // 獲取當前登入使用者的 ID
    const userId = session.user.id;

    // 從 request 取得 body
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    // 檢查購物車是否已存在相同商品
    const [existing] = await db.query(
      `SELECT id, quantity 
       FROM product_cart_items
       WHERE user_id = ? AND product_id = ?
       LIMIT 1`,
      [userId, productId]
    );

    if (existing.length > 0) {
      // 如果商品已存在，更新數量
      const cartItem = existing[0];
      const newQty = cartItem.quantity + quantity;
      await db.query(
        `UPDATE product_cart_items
         SET quantity = ?, updated_at = NOW()
         WHERE id = ?`,
        [newQty, cartItem.id]
      );
    } else {
      // 如果商品不存在，新增一筆資料
      await db.query(
        `INSERT INTO product_cart_items (user_id, product_id, quantity)
         VALUES (?, ?, ?)`,
        [userId, productId, quantity]
      );
    }

    return NextResponse.json({ message: "成功加入購物車" }, { status: 200 });
  } catch (error) {
    console.error("加入購物車失敗:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
