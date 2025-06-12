import db from "@/lib/db";
import { message } from "antd";

export async function DELETE(request, { params }) {
  try {
    // 等待解析 params
    const parsedParams = await params;
    const { couponId } = parsedParams;

    console.log(couponId);
    
    if(!couponId){
        return new Response(JSON.stringify({ message: "Invalid couponId"}),{
            status: 400
        });
    }
    // 更新 coupon 的 status 為 0（表示關閉或「邏輯刪除」）
    const [rows] = await db.query(
        "UPDATE coupons SET status = ? WHERE id = ?",
        [0, couponId]
    );
    // 檢查是否成功更新
    if (rows.affectedRows === 0) {
      return new Response(JSON.stringify({ message: "Coupon not found" }), {
        status: 200,
        headers:{ "Content-Type" : "application/json"},
      });
    }

    return new Response(JSON.stringify({ message: "優惠券狀態更新成功，已設置為關閉 (status = 0)" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
    });
  }
}
