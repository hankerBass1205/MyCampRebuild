import db from "@/lib/db";
import { lineMessaging } from "@/utils/lineMessaging";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const orderId = id;
    // console.log("接收到的訂單編號:", orderId);

    // 修改 SQL 查詢以匹配實際的資料表結構
    const [[userInfo]] = await db.execute(
      `
      SELECT 
        b.*,
        u.line_user_id,
        u.login_type,
        u.name as user_name,
        sa.activity_name,
        sa.title as activity_title,
        sa.city,
        csa.name as spot_type_name,
        DATE_FORMAT(sa.start_date, '%Y-%m-%d') as activity_start_date,
        DATE_FORMAT(sa.end_date, '%Y-%m-%d') as activity_end_date,
        DATE_FORMAT(b.booking_date, '%Y-%m-%d') as check_in_date,
        DATE_FORMAT(DATE_ADD(b.booking_date, INTERVAL b.nights DAY), '%Y-%m-%d') as check_out_date,
        b.quantity as booking_quantity,
        b.nights as booking_nights,
        b.payment_method
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN activity_spot_options aso ON b.option_id = aso.option_id
      JOIN spot_activities sa ON aso.activity_id = sa.activity_id
      JOIN camp_spot_applications csa ON aso.spot_id = csa.spot_id
      WHERE b.order_id = ?
    `,
      [orderId]
    );

    if (!userInfo) {
      // console.log("找不到訂單資料，訂單編號:", orderId);
      return Response.json(
        { error: "找不到訂單資料" },
        { status: 404 }
      );
    }

    if (!userInfo.line_user_id) {
      return Response.json({
        success: false,
        message: "此用戶未綁定 LINE，不需要發送通知"
      });
    }

    // 在準備通知資料之前，加入這行來檢查 SQL 查詢結果
    // console.log('SQL查詢結果:', userInfo);

    // 準備通知資料
    const notificationData = {
      orderId: userInfo.order_id,
      bookingId: userInfo.booking_id,
      userName: userInfo.user_name,
      activity_name: userInfo.activity_name,
      activity_title: userInfo.activity_title,
      city: userInfo.city,
      camp_location: userInfo.city,
      start_date: userInfo.activity_start_date,
      end_date: userInfo.activity_end_date,
      check_in_date: userInfo.check_in_date,
      check_out_date: userInfo.check_out_date,
      quantity: userInfo.booking_quantity,
      nights: userInfo.booking_nights,
      amount: userInfo.total_price,
      status: userInfo.status,
      paymentStatus: userInfo.payment_status,
      paymentMethod: userInfo.payment_method,
      contact_name: userInfo.contact_name,
      contact_phone: userInfo.contact_phone,
      contact_email: userInfo.contact_email,
      spot_type_name: userInfo.spot_type_name
    };

    // 檢查準備好的通知資料
    // console.log('準備發送的通知資料:', notificationData);

    // 發送 LINE 通知
    const sendResult = await lineMessaging.sendOrderUpdate(
      userInfo.line_user_id, 
      notificationData
    );

    if (sendResult) {
      return Response.json({ 
        success: true, 
        message: "LINE 通知發送成功",
        notificationData
      });
    } else {
      return Response.json({ 
        success: false, 
        message: "LINE 通知發送失敗，用戶可能未授權或封鎖訊息"
      });
    }

  } catch (error) {
    console.error("發送 LINE 通知失敗:", error);
    return Response.json({ error: "發送通知失敗" }, { status: 500 });
  }
}
