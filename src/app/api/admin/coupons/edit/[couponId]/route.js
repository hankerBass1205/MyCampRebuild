import db from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    // 等待解析 params
    const parsedParams = await params;
    const { couponId } = parsedParams;
    const {
      coupon_code,
      name,
      discount_type,
      discount_value,
      min_purchase,
      max_discount,
      start_date,
      end_date,
      level_id,
    } = await request.json();

    // 驗證 ID 是否存在
    if (!couponId) {
      return new Response(JSON.stringify({ error: "Invalid coupon ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 查詢 coupon 是否存在
    const [rows] = await db.query("SELECT * FROM coupons WHERE id = ?", [couponId]);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "Coupon not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 準備更新資料
    const updateData = {};
    if (coupon_code) updateData.coupon_code = coupon_code;
    if (name) updateData.name = name;
    if (discount_type) updateData.discount_type = discount_type;
    if (discount_value) updateData.discount_value = discount_value;
    if (min_purchase) updateData.min_purchase = min_purchase;
    if (max_discount) updateData.max_discount = max_discount;
    if (start_date) updateData.start_date = start_date;
    if (end_date) updateData.end_date = end_date;
    if (level_id) updateData.level_id = level_id;

    // 如果沒有要更新的資料，返回錯誤
    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: "No data provided to update" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 執行更新操作
    const [result] = await db.query("UPDATE coupons SET ? WHERE id = ?", [updateData, couponId]);

    // 檢查是否成功更新
    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ error: "Failed to update coupon" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 獲取更新後的優惠券資料
    const [updatedCoupon] = await db.query("SELECT * FROM coupons WHERE id = ?", [couponId]);

    // 回傳成功響應
    return new Response(
      JSON.stringify({
        message: "優惠券資料更新成功",
        coupon: updatedCoupon[0],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating coupon:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}