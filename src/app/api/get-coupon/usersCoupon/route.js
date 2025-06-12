import { NextResponse } from "next/server";
import db from "@/lib/db"; // 連接 MySQL
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * 獲取當前登入使用者的可用優惠券
 */
export async function GET(request) {
  try {
    // 獲取登入狀態
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const userId = session.user.id;

    // 查詢該使用者的有效優惠券（未過期、未使用）
    const [coupons] = await db.execute(
      `SELECT 
          id, name, coupon_code, discount, discount_value, 
          min_purchase, max_discount, start_date, end_date, coupon_status
       FROM user_coupons 
       WHERE user_id = ? 
       AND coupon_status = 1 
       AND end_date > NOW()`,
      [userId]
    );

    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error("獲取優惠券錯誤:", error);
    return NextResponse.json(
      { success: false, message: "無法獲取優惠券" },
      { status: 500 }
    );
  }
}
