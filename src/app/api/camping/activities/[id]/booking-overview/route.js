import db from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const activityId = id;

    if (!activityId) {
      return Response.json({ error: "活動ID是必需的" }, { status: 400 });
    }

    // 修改查詢以符合實際資料表結構
    const query = `
      SELECT 
        aso.option_id,
        csa.name as spot_name,
        csa.capacity as people_per_spot,
        aso.max_quantity as total_quantity,
        COALESCE(
          (SELECT COUNT(*) 
           FROM bookings b 
           WHERE b.option_id = aso.option_id 
           AND b.status = 'confirmed'
          ), 0
        ) as booked_quantity
      FROM activity_spot_options aso
      JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id 
        AND aso.application_id = csa.application_id
      WHERE aso.activity_id = ?
      ORDER BY aso.sort_order ASC
    `;

    const [results] = await db.query(query, [activityId]);

    // 處理數據格式
    const bookingOverview = results.map(row => ({
      spotType: row.spot_name,
      capacity: `(可容納 ${row.people_per_spot} 人)`,
      totalQuantity: row.total_quantity,
      bookedQuantity: row.booked_quantity,
      availableQuantity: Math.max(0, row.total_quantity - row.booked_quantity)
    }));

    return Response.json({
      success: true,
      data: bookingOverview
    });

  } catch (error) {
    console.error("Error fetching booking overview:", error);
    return Response.json(
      { 
        success: false,
        error: "獲取預訂狀況失敗" 
      },
      { status: 500 }
    );
  }
}