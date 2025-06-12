import db from "@/lib/db";
import { message } from "antd";

export async function POST(request, { params }) {
  try {
    // 等待解析 params
    const parsedParams = await params;
    const { couponId } = parsedParams;

    if (!couponId) {
      return new Response("Invalid coupon id", { status: 400 });
    }

    const [rows] = await db.query(
      "UPDATE coupons SET status = ? WHERE id = ?",
      [1, couponId]
    );

    if (rows.affectedRows === 0) {
      return new Response(JSON.stringify({ message: "Coupon not found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        message: "優惠券狀態更新成功，已設置為關閉 (status = 1)",
      }),
      {
        status: 200,
      }
    );
  } catch (err) {
    return new Response("Something went wrong", { status: 500 });
  }
}
