import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "start_date"; // 默認按開始日期排序
    let sortOrder = searchParams.get("sortOrder") || "DESC"; // 默認降序
    const filterBy = searchParams.get("filterBy");

    // 檢查 sortBy 的值是否有效
    const validSortFields = ["start_date", "uc.discount_value", "end_date"];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({ error: "無效的排序字段" }, { status: 400 });
    }

    // 如果排序字段是開始日期，則將排序順序設置為升序
    if (sortBy === "start_date") {
      sortOrder = "ASC";
    }

    // 查詢用戶的優惠券
    let query = `
      SELECT 
        uc.id AS user_coupon_id,
        uc.name AS coupon_name,
        uc.coupon_code,
        uc.discount,
        uc.discount_value AS user_discount_value,
        uc.min_purchase AS user_min_purchase,
        uc.max_discount AS user_max_discount,
        uc.end_date,
        uc.level_id,
        uc.coupon_status,
        c.min_purchase AS coupon_min_purchase,
        c.max_discount AS coupon_max_discount,
        c.start_date,
        c.end_date AS coupon_end_date,
        c.created_at AS coupon_created_at
      FROM user_coupons uc
      JOIN coupons c ON uc.coupon_code = c.coupon_code
      WHERE uc.user_id = ? AND c.status = 1
    `;

    const queryParams = [userId];

    if (filterBy) {
      // 處理特殊篩選條件 "expired"
      if (filterBy === "expired") {
        // 選擇已過期的優惠券（現在的日期超過了結束日期）
        query += ` AND uc.end_date < CURDATE() AND uc.end_date IS NOT NULL`;
      } else {
        // 針對一般狀態（0 或 1）的篩選
        query += ` AND uc.coupon_status = ?`;
        queryParams.push(filterBy);
      }
    }

    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    const [rows] = await db.execute(query, queryParams);

    if (rows.length === 0) {
      console.log("查詢結果為空:", rows);
      return NextResponse.json({ error: "沒有找到優惠券" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("獲取優惠券失敗:", error);
    return NextResponse.json({ error: "獲取優惠券失敗" }, { status: 500 });
  }
}
