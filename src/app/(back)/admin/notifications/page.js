'use client';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { showSystemAlert } from '@/utils/sweetalert';
import { useSession } from 'next-auth/react';
import Swal from 'sweetalert2';

export default function AdminNotifications() {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [users, setUsers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [notificationTypes, setNotificationTypes] = useState([]);
  const [notification, setNotification] = useState({
    targetRole: 'user',
    type: 'system',
    title: '',
    content: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'loading' || !session?.user?.isAdmin || !mounted) {
      return;
    }

    try {
      // 建立 Socket 連接
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
        query: {
          userId: session.user.id,
          userType: 'admin'
        },
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true
      });

      // 連接事件處理
      newSocket.on('connect', () => {
        // console.log('Socket 連接成功');
        setSocket(newSocket);
        setIsConnected(true);
        // 請求初始數據
        newSocket.emit('getUsers');
        newSocket.emit('getOwners');
        newSocket.emit('getNotificationTypes');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket 連接錯誤:', error);
        showSystemAlert.error(
          '連接錯誤',
          '無法連接到伺服器，請檢查網路連接'
        );
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket 重新連接成功，嘗試次數:', attemptNumber);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket 重新連接失敗:', error);
      });

      newSocket.on('disconnect', (reason) => {
        // console.log('Socket 斷開連接，原因:', reason);
        setSocket(null);
      });

      // 數據事件處理
      newSocket.on('usersList', (data) => {
        try {
          setUsers(data);
        } catch (error) {
          console.error('處理用戶列表錯誤:', error);
        }
      });

      newSocket.on('ownersList', (data) => {
        try {
          setOwners(data);
        } catch (error) {
          console.error('處理營主列表錯誤:', error);
        }
      });

      newSocket.on('notificationTypes', (data) => {
        try {
          setNotificationTypes(data);
          setIsInitialized(true);
        } catch (error) {
          console.error('處理通知類型錯誤:', error);
        }
      });

      newSocket.on('notificationSent', (response) => {
        try {
          if (response.success) {
            showSystemAlert.success('通知發送成功');
            // 清空表單
            setNotification({
              targetRole: 'user',
              type: 'system',
              title: '',
              content: ''
            });
          } else {
            showSystemAlert.error('發送失敗', response.message || '通知發送失敗');
          }
        } catch (error) {
          console.error('處理發送回應錯誤:', error);
        }
      });

      // 錯誤處理
      newSocket.on('error', (error) => {
        console.error('Socket 錯誤:', error);
        showSystemAlert.error(
          'Socket 錯誤', 
          error.message || '連接發生錯誤'
        );
      });

      // 清理函數
      return () => {
        if (newSocket) {
          // console.log('清理 Socket 連接');
          newSocket.off('connect');
          newSocket.off('connect_error');
          newSocket.off('reconnect');
          newSocket.off('reconnect_error');
          newSocket.off('disconnect');
          newSocket.off('usersList');
          newSocket.off('ownersList');
          newSocket.off('notificationTypes');
          newSocket.off('notificationSent');
          newSocket.off('error');
          newSocket.disconnect();
          setSocket(null);
          setIsConnected(false);
          setIsInitialized(false);
        }
      };
    } catch (error) {
      console.error('初始化錯誤:', error);
      showSystemAlert.error(
        '初始化錯誤',
        '建立 Socket 連接時發生錯誤'
      );
    }
  }, [session, status, mounted]);

  // 權限檢查
  if (status === 'loading') {
    return <div className="text-center p-4">驗證中...</div>;
  }

  if (!session) {
    return <div className="text-center text-red-500 p-4">請先登入</div>;
  }

  if (!session?.user?.isAdmin) {
    return <div className="text-center text-red-500 p-4">權限不足</div>;
  }

  // 載入中狀態
  if (!isConnected || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8B7355] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B4423]">
            {!isConnected ? "正在連接伺服器..." : "正在載入資料..."}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {!isConnected ? "請稍候，正在建立連線" : "正在獲取必要資訊"}
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 檢查 socket 連接和初始化狀態
    if (!socket || !isConnected || !isInitialized) {
      // console.log('發送檢查失敗:', {
      //   socketExists: !!socket,
      //   isConnected,
      //   isInitialized,
      //   users: users.length,
      //   owners: owners.length
      // });
      showSystemAlert.error(
        '連接錯誤',
        '系統正在初始化，請稍後再試'
      );
      return;
    }

    try {
      setIsSending(true);
      // console.log('開始發送通知:', {
      //   targetRole: notification.targetRole,
      //   type: notification.type,
      //   title: notification.title,
      //   content: notification.content,
      //   usersCount: users.length,
      //   ownersCount: owners.length
      // });

      // 準備顯示的目標用戶資訊
      let targetInfo = '';
      if (notification.targetRole === 'all') {
        targetInfo = '所有會員和營地主';
      } else if (notification.targetRole === 'user') {
        targetInfo = '所有一般會員';
      } else if (notification.targetRole === 'owner') {
        targetInfo = '所有營地主';
      }

      // 通知類型說明
      let typeInfo = '';
      switch(notification.type) {
        case 'system':
          typeInfo = '系統通知';
          break;
        case 'message':
          typeInfo = '一般訊息';
          break;
        case 'alert':
          typeInfo = '重要提醒';
          break;
      }

      // console.log('確認發送資訊:', {
      //   targetInfo,
      //   typeInfo,
      //   users: users.length,
      //   owners: owners.length
      // });

      // 跳出確認提示
      const result = await Swal.fire({
        title: '確定要發送通知嗎？',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>發送對象：</strong>${targetInfo}</p>
            <p class="mb-2"><strong>通知類型：</strong>${typeInfo}</p>
            <p class="mb-2"><strong>通知標題：</strong>${notification.title}</p>
            <p class="mb-2"><strong>通知內容：</strong></p>
            <p class="text-gray-600 bg-gray-50 p-2 rounded">${notification.content}</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--secondary-1)',
        cancelButtonColor: 'var(--gray-6)',
        confirmButtonText: '確定發送',
        cancelButtonText: '取消',
        width: '600px'
      });

      if (!result.isConfirmed) {
        // console.log('使用者取消發送');
        setIsSending(false);
        return;
      }

      // 根據目標角色選擇接收者
      let targetUsers = [];
      if (notification.targetRole === 'all') {
        targetUsers = [...users, ...owners].map(user => user.id);
      } else if (notification.targetRole === 'user') {
        targetUsers = users.map(user => user.id);
      } else if (notification.targetRole === 'owner') {
        targetUsers = owners.map(owner => owner.id);
      }

      // 檢查是否有目標用戶
      if (!targetUsers || targetUsers.length === 0) {
        // console.log('沒有符合條件的接收者:', {
        //   targetRole: notification.targetRole,
        //   usersCount: users.length,
        //   ownersCount: owners.length,
        //   targetUsers
        // });
        showSystemAlert.error('發送失敗', '沒有符合條件的接收者');
        setIsSending(false);
        return;
      }

      // 發送通知
      // console.log('觸發 socket 事件: sendGroupNotification');
      socket.emit('sendGroupNotification', {
        ...notification,
        targetUsers
      });

      // 監聽發送結果
      socket.once('notificationSent', (response) => {
        // console.log('收到發送結果:', response);
        if (response.success) {
          console.log('通知發送成功');
        } else {
          console.error('通知發送失敗:', response.message);
        }
      });

    } catch (error) {
      console.error('發送過程發生錯誤:', error);
      showSystemAlert.error(
        '發送失敗', 
        error.message || '發送通知時發生錯誤'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-3xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#6B4423]">系統通知管理</h1>
          <p className="mt-2 text-gray-600">發送系統通知給指定用戶群組</p>
        </div>

        {/* 通知表單 */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          {(!isConnected || !isInitialized) && (
            <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg">
              <p>系統正在初始化中，請稍候再發送通知</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 目標對象 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#6B4423]">
                發送對象
              </label>
              <select
                value={notification.targetRole}
                onChange={(e) => setNotification({ ...notification, targetRole: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8B7355] focus:border-transparent transition-all"
              >
                <option value="all">所有會員和營地主</option>
                <option value="user">所有一般會員</option>
                <option value="owner">所有營地主</option>
              </select>
            </div>

            {/* 通知類型 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#6B4423]">
                通知類型
              </label>
              <select
                value={notification.type}
                onChange={(e) => setNotification({ ...notification, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8B7355] focus:border-transparent transition-all"
              >
                <option value="system">系統通知</option>
                <option value="message">一般訊息</option>
                <option value="alert">重要提醒</option>
              </select>
            </div>

            {/* 通知標題 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#6B4423]">
                通知標題
              </label>
              <input
                type="text"
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8B7355] focus:border-transparent transition-all"
                placeholder="請輸入通知標題"
                required
              />
            </div>

            {/* 通知內容 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#6B4423]">
                通知內容
              </label>
              <textarea
                value={notification.content}
                onChange={(e) => setNotification({ ...notification, content: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8B7355] focus:border-transparent transition-all min-h-[120px]"
                placeholder="請輸入通知內容"
                required
              />
            </div>

            {/* 送出按鈕 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSending}
                className={`
                  w-full px-6 py-3 rounded-lg text-white font-medium
                  transition-all duration-200
                  ${isSending 
                    ? 'bg-[#D1C4B6] cursor-not-allowed'
                    : 'bg-[#8B7355] hover:bg-[#6B4423] active:transform active:scale-[0.98]'}
                `}
              >
                {isSending ? '發送中...' : '發送通知'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 