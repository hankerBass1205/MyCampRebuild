import { NextResponse } from "next/server";
import db from "@/lib/db"; // 連接 MySQL
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * 獲取當前登入使用者的商品願望清單 (只限 type='product')
 */
export async function GET(request) {
  try {
    // 取得登入用戶資訊
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const userId = session.user.id;

    // 查詢使用者的收藏清單，並連接 products 和 product_images 表獲取商品資訊
    const [wishlist] = await db.execute(
      `SELECT 
          uf.id, 
          uf.item_id, 
          p.name AS product_name, 
          p.price AS product_price,
          pi.image_path AS product_image,
          uf.created_at 
       FROM user_favorites uf
       JOIN products p ON uf.item_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
       WHERE uf.user_id = ? AND uf.type = 'product'`,
      [userId]
    );

    return NextResponse.json({ success: true, wishlist });
  } catch (error) {
    console.error("獲取商品願望清單錯誤:", error);
    return NextResponse.json(
      { success: false, message: "無法獲取商品願望清單" },
      { status: 500 }
    );
  }
}

/**
 * 新增商品收藏 (強制 type='product')
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const userId = session.user.id;
    const { item_id } = await request.json();
    const type = "product"; // 強制設定為 product

    if (!item_id) {
      return NextResponse.json(
        { success: false, message: "缺少 item_id" },
        { status: 400 }
      );
    }

    // 檢查是否已經收藏
    const [existing] = await db.execute(
      `SELECT id FROM user_favorites WHERE user_id = ? AND type = ? AND item_id = ?`,
      [userId, type, item_id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "已經收藏過該商品" },
        { status: 400 }
      );
    }

    // 新增收藏
    await db.execute(
      `INSERT INTO user_favorites (user_id, type, item_id, created_at) VALUES (?, ?, ?, NOW())`,
      [userId, type, item_id]
    );

    return NextResponse.json({ success: true, message: "收藏成功" });
  } catch (error) {
    console.error("新增商品收藏錯誤:", error);
    return NextResponse.json(
      { success: false, message: "收藏失敗" },
      { status: 500 }
    );
  }
}

/**
 * 刪除商品收藏 (只限 type='product')
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const userId = session.user.id;
    const { item_id } = await request.json();
    const type = "product"; // 強制設定為 product

    if (!item_id) {
      return NextResponse.json(
        { success: false, message: "缺少 item_id" },
        { status: 400 }
      );
    }

    // 刪除收藏 (只刪除 type='product')
    const [result] = await db.execute(
      `DELETE FROM user_favorites WHERE user_id = ? AND type = ? AND item_id = ?`,
      [userId, type, item_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "找不到該收藏，無法刪除" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "成功移除商品收藏" });
  } catch (error) {
    console.error("刪除商品收藏錯誤:", error);
    return NextResponse.json(
      { success: false, message: "刪除失敗" },
      { status: 500 }
    );
  }
}
