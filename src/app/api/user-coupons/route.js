import db from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Received body:", body); // 打印请求体，检查是否正确接收数据
    const {
      user_id,
      name,
      coupon_code,
      start_date,
      end_date,
      discount,
      discount_value,
      min_purchase,
      max_discount,
      coupon_status,
      level_id
    } = body;

    // 检查是否缺少必要字段
    if (!user_id || !name || !coupon_code) {
      return new Response(JSON.stringify({ message: "缺少必要的字段" }), {
        // status: 400,
      });
    }

    // 检查用户是否已领取过此优惠券
    const [existing] = await db.query(
      "SELECT * FROM user_coupons WHERE user_id = ? AND coupon_code = ? LIMIT 1",
      [user_id, coupon_code]
    );
    console.log("Existing coupons:", existing);

    if (Array.isArray(existing) && existing.length > 0) {
      return new Response(JSON.stringify({ message: "您已領取過此優惠券" }), {
        // status: 400,
      });
    }

    // 插入优惠券数据
    await db.query(
      `INSERT INTO user_coupons 
       (user_id, name, coupon_code, start_date, end_date, discount, discount_value, min_purchase, max_discount, created_at, updated_at, coupon_status, level_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
      [
        user_id,
        name,
        coupon_code,
        new Date(start_date),
        new Date(end_date),
        discount,
        discount_value,
        min_purchase || null, // 允许为空
        max_discount || null, // 允许为空
        coupon_status || 1, // ✅ 默认值为 1
        level_id || null, // ✅ 允许为空
      ]
    );
    return new Response(JSON.stringify({ message: "優惠券已添加" }), {
      status: 200,
    });
  } catch (error) {
    console.error("数据库错误:", error);
    return new Response(JSON.stringify({ message: "伺服器錯誤" }), {
      status: 500,
    });
  }
}
