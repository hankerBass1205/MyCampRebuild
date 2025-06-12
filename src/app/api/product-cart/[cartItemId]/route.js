import { NextResponse } from "next/server";
import db from "@/lib/db"; // ✅ 資料庫連線
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ✅ 確保 NextAuth 設定正確

// 🔥 DELETE: 刪除購物車內的商品
export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ 確認是否登入
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const userId = session.user.id;
    const { cartItemId } = await context.params; // ✅ 正確解構 `params`

    // ✅ 確保該商品屬於當前使用者
    const [result] = await db.query(
      `DELETE FROM product_cart_items WHERE id = ? AND user_id = ?`,
      [cartItemId, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "刪除失敗，找不到該商品" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "刪除成功" }, { status: 200 });
  } catch (error) {
    console.error("刪除購物車商品失敗:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// 🔥 PUT: 修改購物車商品數量
export async function PUT(request, context) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ 確認是否登入
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const userId = session.user.id;
    const { cartItemId } = await context.params; // ✅ 正確解構 `params`
    const { change } = await request.json(); // ✅ 從請求中取得變更數量

    // ✅ 取得當前數量
    const [rows] = await db.query(
      `SELECT quantity FROM product_cart_items WHERE id = ? AND user_id = ?`,
      [cartItemId, userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "找不到該商品" }, { status: 404 });
    }

    const newQuantity = rows[0].quantity + change;

    // ✅ 如果數量小於等於 0，自動刪除該商品
    if (newQuantity <= 0) {
      await db.query(
        `DELETE FROM product_cart_items WHERE id = ? AND user_id = ?`,
        [cartItemId, userId]
      );
      return NextResponse.json({ message: "商品已移除" }, { status: 200 });
    }

    // ✅ 更新數量
    await db.query(
      `UPDATE product_cart_items SET quantity = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      [newQuantity, cartItemId, userId]
    );

    return NextResponse.json(
      { message: "數量更新成功", newQuantity },
      { status: 200 }
    );
  } catch (error) {
    console.error("更新購物車商品數量失敗:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
