import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activityId");
    const date = searchParams.get("date") || new Date().toISOString().split('T')[0];

    if (!activityId) {
      return NextResponse.json(
        { error: "缺少必要參數 activityId" },
        { status: 400 }
      );
    }

    // 查詢營位狀況
    const query = `
      SELECT 
        aso.option_id,
        aso.spot_id,
        csa.name as spot_name,
        csa.capacity as max_people,
        aso.max_quantity as total_quantity,
        csa.price as base_price,
        aso.price as activity_price,
        COALESCE(
          (
            SELECT SUM(b.quantity)
            FROM bookings b
            WHERE b.option_id = aso.option_id
            AND b.status = 'confirmed'
            AND b.payment_status = 'paid'
            AND DATE(b.booking_date) = ?
          ), 0
        ) as booked_quantity
      FROM activity_spot_options aso
      LEFT JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id
      WHERE aso.activity_id = ?
      AND csa.status = 1
      GROUP BY aso.option_id
    `;

    const results = await executeQuery({
      query: query,
      values: [date, activityId],
    });

    // 處理查詢結果
    const spotsAvailability = results.reduce((acc, spot) => {
      acc[spot.option_id] = {
        spot_id: spot.spot_id,
        spot_name: spot.spot_name,
        total: spot.total_quantity,
        booked: spot.booked_quantity,
        available: Math.max(0, spot.total_quantity - spot.booked_quantity),
        max_people: spot.max_people,
        price: spot.activity_price || spot.base_price,
        status: spot.total_quantity - spot.booked_quantity > 0 ? '可預訂' : '已滿位'
      };
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        spots: spotsAvailability,
        date: date,
        total_spots: results.length,
        available_spots: Object.values(spotsAvailability).filter(s => s.available > 0).length
      }
    });

  } catch (error) {
    console.error("查詢營位狀況時發生錯誤:", error);
    return NextResponse.json(
      { error: "查詢營位狀況時發生錯誤" },
      { status: 500 }
    );
  }
}