// app/api/member/rental/[userId]/route.js
import { getServerSession } from "next-auth";
import db from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);

    // 验证用户身份
    if (!session?.user?.id || session.user.id.toString() !== userId) {
      return NextResponse.json({ error: "未登入該帳號" }, { status: 401 });
    }

    // 获取租借数据
    const [leases] = await db.query(
      `
      SELECT 
        pl.id,
        pl.appointment_starts,
        pl.appointment_end,
        pl.price AS lease_price,
        p.name AS product_name,
        p.description,
        p.price AS product_price,
        GROUP_CONCAT(CONCAT('images/products/', pi.image_path)) AS images
      FROM products_lease pl
      JOIN products p ON pl.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE pl.user_id = ?
      GROUP BY pl.id
      ORDER BY pl.appointment_starts DESC
    `,
      [userId]
    );

    // 格式化数据，确保价格为数字类型
    const formattedLeases = leases.map((lease) => ({
      ...lease,
      images: lease.images ? lease.images.split(",") : [],
      lease_price: parseFloat(lease.lease_price), // 确保价格为数字
      product_price: parseFloat(lease.product_price), // 确保价格为数字
    }));

    return NextResponse.json({ leases: formattedLeases });
  } catch (error) {
    console.error("獲取租借紀錄失敗:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
