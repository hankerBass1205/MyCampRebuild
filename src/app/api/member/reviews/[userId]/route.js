import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");
    const sortOption = searchParams.get("sort");

    // 查詢用戶的評論，並包含商品或活動的名稱和描述
    let query = `
      SELECT 
        ud.type,
        ud.item_id,
        ud.content,
        ud.rating,
        ud.status,
        ud.created_at,
        ud.updated_at,
        CASE 
          WHEN ud.type = 'product' THEN p.name
          WHEN ud.type = 'camp' THEN sa.activity_name
        END AS item_name,
        CASE 
          WHEN ud.type = 'product' THEN p.description
          WHEN ud.type = 'camp' THEN sa.description
        END AS item_description,
        CASE 
          WHEN ud.type = 'product' THEN pi.image_path
          WHEN ud.type = 'camp' THEN sa.main_image
        END AS item_image
      FROM user_discussions ud
      LEFT JOIN products p ON ud.item_id = p.id AND ud.type = 'product'
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = 1
      LEFT JOIN spot_activities sa ON ud.item_id = sa.activity_id AND ud.type = 'camp'
      WHERE ud.user_id = ?
    `;

    const queryParams = [userId];

    if (typeFilter) {
      query += " AND ud.type = ?";
      queryParams.push(typeFilter);
    }

    if (sortOption) {
      if (sortOption === "date") {
        query += " ORDER BY ud.created_at asc";
      } else if (sortOption === "rating") {
        query += " ORDER BY ud.rating DESC";
      }
    }

    const [rows] = await db.query(query, queryParams);

    if (rows.length === 0) {
      return NextResponse.json({ error: "沒有找到評論" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取評論失敗:", error);
    return NextResponse.json({ error: "獲取評論失敗" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = await params;
    const { itemId, rating, content } = await request.json();

    // 更新用戶的評論評分和內容
    const query = `
      UPDATE user_discussions
      SET rating = ?, content = ?
      WHERE user_id = ? AND item_id = ?
    `;
    const [result] = await db.query(query, [rating, content, userId, itemId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "更新評論失敗" }, { status: 404 });
    }

    return NextResponse.json({ success: "評論更新成功" });
  } catch (error) {
    console.error("更新評論失敗:", error);
    return NextResponse.json({ error: "更新評論失敗" }, { status: 500 });
  }
}
