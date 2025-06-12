// 用於追蹤已發送的訊息
const sentMessages = new Map();

export const lineMessaging = {
  // 發送一般文字訊息
  async sendText(userId, text) {
    return this.sendMessage(userId, {
      type: 'text',
      text: text
    });
  },

  // 發送訂單狀態更新
  async sendOrderUpdate(userId, booking) {
    const statusMap = {
      'pending': '待確認',
      'confirmed': '已確認',
      'cancelled': '已取消'
    };

    const paymentStatusMap = {
      'pending': '待付款',
      'paid': '已付款',
      'failed': '付款失敗',
      'refunded': '已退款'
    };

    if (!booking?.orderId) {
      console.error('訂單資料不完整:', booking);
      return false;
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://camping-platform-production.up.railway.app'
      : process.env.NEXT_PUBLIC_FRONTEND_URL;

    return this.sendMessage(userId, {
      type: 'flex',
      altText: '營地預訂通知',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#2ecc71',
          contents: [{
            type: 'text',
            text: '營地預訂通知',
            color: '#ffffff',
            weight: 'bold',
            size: 'xl',
            align: 'center'
          }]
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `訂單編號：${booking.orderId}`,
              weight: 'bold',
              size: 'md',
              align: 'center'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              spacing: 'sm',
              contents: [
                // 營地資訊區塊
                {
                  type: 'text',
                  text: '📍 營地資訊',
                  weight: 'bold',
                  size: 'sm',
                  color: '#2ecc71'
                },
                {
                  type: 'text',
                  text: `活動名稱：${booking.activity_name || '未設定'}`,
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `營地地點：${booking.city || '未設定'}`,
                  size: 'sm'
                },
                // 訂單狀態區塊
                {
                  type: 'text',
                  text: '📋 訂單狀態',
                  weight: 'bold',
                  size: 'sm',
                  color: '#2ecc71',
                  margin: 'md'
                },
                {
                  type: 'text',
                  text: `預訂狀態：${statusMap[booking.status] || booking.status}`,
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `付款狀態：${paymentStatusMap[booking.paymentStatus] || booking.paymentStatus}`,
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `付款方式：${booking.paymentMethod || '未設定'}`,
                  size: 'sm'
                },
                // 預訂資訊區塊
                {
                  type: 'text',
                  text: '⛺ 預訂資訊',
                  weight: 'bold',
                  size: 'sm',
                  color: '#2ecc71',
                  margin: 'md'
                },
                {
                  type: 'text',
                  text: `營位類型：${booking.spot_type_name || '未設定'}`,
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `預訂數量：${booking.quantity || 0} 個`,
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `活動期間：${booking.start_date || '未設定'} ~ ${booking.end_date || '未設定'}`,
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `入營時間：${booking.check_in_date || '未設定'} ~ ${booking.check_out_date || '未設定'}`,
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `預訂數量：${booking.quantity || 1} 帳`,
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `預訂天數：${booking.nights || 1} 晚`,
                  size: 'sm'
                },
                // 費用資訊區塊
                {
                  type: 'text',
                  text: '💰 費用資訊',
                  weight: 'bold',
                  size: 'sm',
                  color: '#2ecc71',
                  margin: 'md'
                },
                {
                  type: 'text',
                  text: `總金額：NT$ ${booking.amount}`,
                  size: 'sm',
                  weight: 'bold'
                }
              ]
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '查看訂單詳情',
                uri: `${baseUrl}/member/purchase-history`
              },
              style: 'primary',
              color: '#2ecc71'
            }
          ]
        }
      }
    });
  },

  // 基礎發送訊息方法
  async sendMessage(userId, message) {
    try {
      // 檢查是否已經發送過相同的訊息
      const messageKey = `${userId}_${JSON.stringify(message)}`;
      
      if (sentMessages.has(messageKey)) {
        // console.log('相同訊息已發送過，跳過:', messageKey);
        return true;
      }

      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          to: userId,
          messages: [message]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('LINE API 錯誤:', {
          status: response.status,
          error: errorData,
          userId
        });
        
        if (response.status === 403) {
          console.log('用戶未授權接收訊息');
        }
        return false;
      }

      // 標記訊息已發送
      sentMessages.set(messageKey, true);
      
      // 5 分鐘後清除紀錄
      setTimeout(() => {
        sentMessages.delete(messageKey);
      }, 5 * 60 * 1000);

      return true;

    } catch (error) {
      console.error('LINE API Error:', error);
      return false;
    }
  }
}; 