import db from "@/lib/db";
import { message } from "antd";
import { headers } from "next/headers";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      coupon_code,
      discount_type,
      discount_value,
      min_purchase,
      max_discount,
      start_date,
      end_date,
      level_id,
    } = body;

    // 檢查必填欄位，包括日期
    if (
      !name ||
      !coupon_code ||
      !discount_type ||
      !discount_value ||
      !start_date ||
      !end_date
    ) {
      return new Response(
        JSON.stringify({ message: "缺少必填欄位" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 驗證日期格式
    const isValidDate = (dateStr) => {
      if (!dateStr) return false; // 如果日期為空，則返回 false
      const date = new Date(dateStr); // 將日期字串轉換為 Date 物件
      return !Number.isNaN(date.valueOf()); // 檢查日期是否有效
    };

    if (!isValidDate(start_date)) {
      return new Response(
        JSON.stringify({ message: "開始日期格式無效" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!isValidDate(end_date)) {
      return new Response(
        JSON.stringify({ message: "結束日期格式無效" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const [result] = await db.query(
      `INSERT INTO coupons (name, coupon_code, discount_type, discount_value, min_purchase, max_discount, start_date, end_date, level_id, created_at, updated_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)`,
      [
        name,
        coupon_code,
        discount_type,
        discount_value,
        min_purchase || null,
        max_discount || null,
        start_date,
        end_date,
        level_id || 1, // 預設等級為 1，如果未提供
      ]
    );

    // 查詢剛插入的優惠券完整資料
    const [rows] = await db.query(
      `SELECT * FROM coupons WHERE id = ?`,
      [result.insertId]
    );

    const newCoupon = rows[0]; // 取得剛插入的優惠券資料

    return new Response(
      JSON.stringify({
        message: "新增優惠券成功",
        coupon: {
          id: newCoupon.id,
          name: newCoupon.name,
          coupon_code: newCoupon.coupon_code,
          discount_type: newCoupon.discount_type,
          discount_value: newCoupon.discount_value,
          min_purchase: newCoupon.min_purchase,
          max_discount: newCoupon.max_discount,
          start_date: newCoupon.start_date,
          end_date: newCoupon.end_date,
          level_id: newCoupon.level_id,
          status: newCoupon.status,
          created_at: newCoupon.created_at,
          updated_at: newCoupon.updated_at,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ message: "新增優惠券失敗" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}