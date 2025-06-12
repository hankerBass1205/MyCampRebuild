import { NextResponse } from "next/server";
import db from "@/lib/db";
import { format } from 'date-fns';

export async function GET(req, { params }) {
  try {
    // 確保 params 已準備好
    const { id } = await params;
    
    // console.log("Fetching booking stats for activity:", id);

    // 1. 先獲取活動的營位選項
    const [activityOptions] = await db.execute(
      `SELECT 
        aso.option_id, 
        aso.max_quantity, 
        aso.spot_id,
        csa.capacity, 
        csa.name as spot_name
       FROM activity_spot_options aso
       LEFT JOIN camp_spot_applications csa 
         ON aso.spot_id = csa.spot_id 
         AND aso.application_id = csa.application_id
       WHERE aso.activity_id = ?`,
      [id]
    );

    // console.log("Activity options:", activityOptions);

    if (!activityOptions.length) {
      return NextResponse.json({ 
        error: "找不到該活動的營位選項" 
      }, { status: 404 });
    }

    // 2. 獲取預訂資料
    const [bookings] = await db.execute(`
      SELECT 
        DATE(b.booking_date) as booking_date,
        b.option_id,
        SUM(b.quantity) as total_booked
      FROM bookings b
      WHERE b.option_id IN (
        SELECT option_id 
        FROM activity_spot_options 
        WHERE activity_id = ?
      )
      AND b.status = 'confirmed'
      AND b.payment_status = 'paid'
      GROUP BY DATE(b.booking_date), b.option_id`,
      [id]
    );

    // console.log("Bookings:", bookings);

    // 3. 獲取活動日期範圍 - 修正表名為 spot_activities
    const [activityDates] = await db.execute(
      `SELECT start_date, end_date 
       FROM spot_activities 
       WHERE activity_id = ?`,  // 修正為 activity_id
      [id]
    );

    // console.log("Activity dates:", activityDates); // 添加日誌

    const formattedStats = {};

    if (activityDates.length > 0) {
      const startDate = new Date(activityDates[0].start_date);
      const endDate = new Date(activityDates[0].end_date);

      // 4. 初始化每一天的資料
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateKey = format(date, 'yyyy-MM-dd');
        formattedStats[dateKey] = {
          spots: {},
          status: 'available'
        };

        // 初始化每個營位的資料
        activityOptions.forEach(option => {
          formattedStats[dateKey].spots[option.option_id] = {
            name: option.spot_name,
            max_people: option.capacity,
            total: parseInt(option.max_quantity || 0),
            booked: 0,
            available: parseInt(option.max_quantity || 0)
          };
        });
      }
    } else {
      console.log("No activity dates found for activity:", id); // 添加錯誤日誌
    }

    // 5. 更新預訂資料
    bookings.forEach(booking => {
      const dateKey = format(new Date(booking.booking_date), 'yyyy-MM-dd');
      if (formattedStats[dateKey] && formattedStats[dateKey].spots[booking.option_id]) {
        const spotData = formattedStats[dateKey].spots[booking.option_id];
        const bookedQuantity = parseInt(booking.total_booked || 0);
        spotData.booked = bookedQuantity;
        spotData.available = Math.max(0, spotData.total - bookedQuantity);

        // 更新日期狀態
        if (spotData.available === 0) {
          formattedStats[dateKey].status = 'full';
        } else if (bookedQuantity > 0) {
          formattedStats[dateKey].status = 'partial';
        }
      }
    });

    // console.log("Formatted stats:", formattedStats);

    return NextResponse.json(formattedStats);
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return Response.json({ error: 'Failed to fetch booking stats' }, { status: 500 });
  }
}
