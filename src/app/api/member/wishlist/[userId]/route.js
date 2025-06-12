import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    // 查詢用戶的願望清單，並包含商品或活動的名稱、描述和價格或圖片
    const query = `
      SELECT 
        uf.id,
        uf.user_id,
        uf.type,
        uf.item_id,
        DATE_FORMAT(uf.created_at, '%Y-%m-%d') AS created_at,
        CASE 
          WHEN uf.type = 'product' THEN p.name
          WHEN uf.type = 'camp' THEN sa.activity_name
        END AS item_name,
        CASE 
          WHEN uf.type = 'product' THEN p.description
          WHEN uf.type = 'camp' THEN sa.description
        END AS item_description,
        CASE 
          WHEN uf.type = 'product' THEN p.price
          WHEN uf.type = 'camp' THEN CONCAT(MIN(aso.price), ' - ', MAX(aso.price))
        END AS item_price,
        CASE 
          WHEN uf.type = 'product' THEN pi.image_path
          WHEN uf.type = 'camp' THEN sa.main_image
          ELSE NULL
        END AS item_image
      FROM user_favorites uf
      LEFT JOIN products p ON uf.item_id = p.id AND uf.type = 'product'
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
      LEFT JOIN spot_activities sa ON uf.item_id = sa.activity_id AND uf.type = 'camp'
      LEFT JOIN activity_spot_options aso ON sa.activity_id = aso.activity_id AND uf.type = 'camp'
      WHERE uf.user_id = ?
      GROUP BY uf.id, uf.user_id, uf.type, uf.item_id, uf.created_at, p.name, sa.activity_name, p.description, sa.description, pi.image_path, sa.main_image
      ORDER BY 
        CASE 
          WHEN uf.type = 'product' THEN p.price
          WHEN uf.type = 'camp' THEN MIN(aso.price)
        END ASC,
        uf.created_at ASC
    `;
    const [rows] = await db.query(query, [userId]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到願望清單" }, { status: 404 });
    }

    // 將價格範圍轉換為數值
    rows.forEach((row) => {
      if (row.type === "camp" && row.item_price) {
        const [minPrice, maxPrice] = row.item_price.split(" - ").map(Number);
        row.item_price = { min: minPrice, max: maxPrice };
      }
    });

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取願望清單失敗:", error);
    return NextResponse.json({ error: "獲取願望清單失敗" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = await params;
    const { id } = await request.json();

    // 刪除 user_favorites 資料表中的項目
    const query = `
      DELETE FROM user_favorites
      WHERE id = ? AND user_id = ?
    `;
    const [result] = await db.query(query, [id, userId]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "刪除失敗，沒有找到該項目" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "刪除成功" });
  } catch (error) {
    console.error("刪除願望清單項目失敗:", error);
    return NextResponse.json(
      { error: "刪除願望清單項目失敗" },
      { status: 500 }
    );
  }
}
