import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 檢查 session 和 token
    if (!session?.accessToken) {
      console.log('Missing access token:', session);
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    const { orderId, items, contactName, contactEmail } = await request.json();
    
    // 檢查並打印日期資料
    console.log('Original dates:', {
      start_date: items[0].start_date,
      end_date: items[0].end_date
    });

    // 使用完整的 OAuth2 設定
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`  // 完整的回調 URL
    );

    // 設置完整的憑證
    oauth2Client.setCredentials({
      access_token: session.accessToken,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/calendar'
    });

    const calendar = google.calendar({ 
      version: 'v3', 
      auth: oauth2Client 
    });

    console.log('Using access token:', session.accessToken);
    
    // 日期處理函數
    function formatDate(dateString) {
      const date = new Date(dateString);
      const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      console.log(`Formatting date: ${dateString} -> ${formatted}`);
      return formatted;
    }

    // 新增一個函數處理結束日期
    function formatEndDate(dateString) {
      const date = new Date(dateString);
      // 加一天，因為 Google Calendar 的結束日期是 exclusive
      date.setDate(date.getDate() + 1);
      const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      console.log(`Formatting end date: ${dateString} -> ${formatted} (added 1 day)`);
      return formatted;
    }

    const event = {
      summary: `露營預訂：${items[0].activity_name}`,
      location: items[0].spot_name,
      description: `
訂單編號：${orderId}
營地：${items[0].activity_name}
營位：${items[0].spot_name}
數量：${items[0].quantity}個
聯絡人：${contactName}
Email：${contactEmail}
      `.trim(),
      start: {
        date: formatDate(items[0].start_date),
        timeZone: 'Asia/Taipei',
      },
      end: {
        date: formatEndDate(items[0].end_date),  // 使用修改後的 formatEndDate
        timeZone: 'Asia/Taipei',
      },
      reminders: {
        useDefault: true
      },
    };

    // 加入最終日期檢查
    console.log('Final event dates:', {
      start: event.start.date,
      end: event.end.date
    });

    try {
      // 先測試 token
      const oauth2 = google.oauth2('v2');
      await oauth2.userinfo.get({ auth: oauth2Client });
      
      // 如果上面沒有拋出錯誤，再創建事件
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      
      console.log('Event created successfully:', response.data.htmlLink);
      
      return NextResponse.json({
        success: true,
        eventLink: response.data.htmlLink,
        orderId
      });

    } catch (error) {
      console.error('Calendar API Error:', {
        message: error.message,
        stack: error.stack,
        token: session.accessToken?.substring(0, 10) + '...'  // 只顯示 token 的一部分
      });
      
      return NextResponse.json(
        { error: '建立日曆事件失敗', details: error.message },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('General Error:', error);
    return NextResponse.json(
      { error: '處理請求失敗', details: error.message },
      { status: 500 }
    );
  }
}
