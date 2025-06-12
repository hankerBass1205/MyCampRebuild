'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import AdminChatModal from '@/components/admin/chat/AdminChatModal';
import io from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { showSystemAlert } from '@/utils/sweetalert';
import { motion } from 'framer-motion';

export default function AdminMessages() {
  const { data: session, status } = useSession();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [socket, setSocket] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    ('Session 狀態:', status);
    ('Session 資料:', session);
    ('是否為管理員:', session?.user?.isAdmin);
  }, [session, status]);

  useEffect(() => {
    if (status === 'loading' || !session?.user?.isAdmin) {
      return;
    }

    try {
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

      newSocket.on('connect', () => {
        // console.log('Socket 連接成功');
        setSocket(newSocket);
        newSocket.emit('getChatRooms');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket 連接錯誤:', error);
        showSystemAlert.error(
          '連接錯誤',
          '無法連接到伺服器，請檢查網路連接'
        );
        setError('連接錯誤：' + (error.message || '無法連接到伺服器'));
        setLoading(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        // console.log('Socket 重新連接成功，嘗試次數:', attemptNumber);
        setError(null);
        newSocket.emit('getChatRooms');
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket 重新連接失敗:', error);
        setRetryCount(prev => prev + 1);
      });

      newSocket.on('disconnect', (reason) => {
        // console.log('Socket 斷開連接，原因:', reason);
        setSocket(null);
      });

      newSocket.on('chatRooms', (data) => {
        try {
          // 處理聊天室數據，將 AI 消息歸類為管理員消息
          const processedRooms = Array.isArray(data) ? data.map(room => {
            return {
              ...room,
              // 如果最後一條消息是 AI 發送的，將其顯示為管理員消息
              last_message_sender: room.last_message_sender === 'AI' ? 'admin' : room.last_message_sender,
              // 未讀消息數只計算會員發送的消息
              unread_count: room.unread_count_member || 0
            };
          }) : [];
          
          setChatRooms(processedRooms);
          setLoading(false);
          setError(null);
        } catch (error) {
          console.error('處理聊天室數據錯誤:', error);
          setError('處理聊天室數據錯誤');
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket 錯誤:', error);
        showSystemAlert.error(
          'Socket 錯誤',
          error.message || '連接發生錯誤'
        );
        setError(error.message || '連接錯誤');
        setLoading(false);
      });

      return () => {
        if (newSocket) {
          // console.log('清理 Socket 連接');
          newSocket.off('connect');
          newSocket.off('connect_error');
          newSocket.off('reconnect');
          newSocket.off('reconnect_error');
          newSocket.off('disconnect');
          newSocket.off('chatRooms');
          newSocket.off('error');
          newSocket.disconnect();
          setSocket(null);
        }
      };
    } catch (error) {
      console.error('初始化錯誤:', error);
      showSystemAlert.error(
        '初始化錯誤',
        '建立 Socket 連接時發生錯誤'
      );
      setError('初始化錯誤：' + error.message);
      setLoading(false);
    }
  }, [session, status]);

  const updateChatRoomWithMessage = (message) => {
    setChatRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id === message.roomId) {
          return {
            ...room,
            last_message: message.message,
            last_message_time: message.timestamp || new Date().toISOString(),
            // 只有會員發送的消息才增加未讀數
            unread_count: message.sender_type === 'member' 
              ? (room.unread_count || 0) + 1 
              : (room.unread_count || 0)
          };
        }
        return room;
      });
    });
  };

  const fetchChatRooms = () => {
    if (socket) {
      setLoading(true);
      socket.emit('getChatRooms');
    }
  };

  const clearUnreadCount = (roomId) => {
    socket.emit('markMessagesAsRead', { roomId });
  };

  const handleRoomSelect = (room) => {
    try {
      setSelectedRoom(room);
      
      if (socket && room.unread_count > 0) {
        socket.emit('markMessagesAsRead', { 
          roomId: room.id,
          userId: session.user.id 
        });
        
        setChatRooms(prevRooms => 
          prevRooms.map(r => 
            r.id === room.id 
              ? { ...r, unread_count: 0 }
              : r
          )
        );
      }
    } catch (error) {
      showSystemAlert.error(
        '操作錯誤',
        '選擇聊天室時發生錯誤'
      );
      setError('選擇聊天室時發生錯誤');
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    
    if (socket) {
      socket.connect();
    }
  };

  if (status === 'loading') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-[#FAFAFA]"
      >
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center p-8"
        >
          <div className="w-16 h-16 border-4 border-[#8B7355] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#8B7355]">驗證中...</p>
        </motion.div>
      </motion.div>
    );
  }

  if (!session) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-screen bg-[#FAFAFA] p-4"
      >
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-4xl mb-4"
          >
            ⚠️
          </motion.div>
          <div className="text-red-400">請先登入</div>
        </div>
      </motion.div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-screen bg-[#FAFAFA] p-4"
      >
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-4xl mb-4"
          >
            🔒
          </motion.div>
          <div className="text-red-400">權限不足</div>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen bg-[#FAFAFA]"
      >
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center p-8"
        >
          <div className="w-16 h-16 border-4 border-[#8B7355] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#8B7355]">載入中...</p>
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-screen bg-[#FAFAFA] p-4"
      >
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <motion.div 
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-4xl mb-4"
          >
            ⚠️
          </motion.div>
          <div className="text-red-400 mb-4">錯誤：{error}</div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRetry}
            className="bg-[#8B7355] text-white px-6 py-2 rounded-lg hover:bg-[#7A6548] transition-colors"
          >
            重試連接
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 min-h-screen bg-[#FAFAFA]"
    >
      <motion.h1
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="text-2xl font-bold mb-6 text-[#6B4423]"
      >
        客服訊息管理
      </motion.h1>

      {chatRooms.length === 0 ? (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center bg-white rounded-xl shadow-sm p-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            💬
          </motion.div>
          <p className="text-gray-500">目前沒有任何聊天室</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#F8F7F6]">
                <tr>
                  {['會員資訊', '最後訊息', '最後更新時間', '狀態', '未讀訊息'].map((header) => (
                    <th key={header} className="px-6 py-4 text-left text-sm font-medium text-[#6B4423]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chatRooms.map((room) => (
                  <motion.tr
                    key={room.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: "#F8F7F6" }}
                    onClick={() => handleRoomSelect(room)}
                    className={`
                      cursor-pointer transition-all duration-200
                      ${selectedRoom?.id === room.id ? 'bg-[#F5F3F0]' : 'hover:bg-[#F8F7F6]'}
                    `}
                  >
                    <td className="px-6 py-4 relative group">
                      <motion.div 
                        className={`
                          absolute left-0 top-0 w-1 h-full
                          ${selectedRoom?.id === room.id ? 'bg-[#8B7355]' : 'bg-transparent'}
                        `}
                      />
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-[#6B4423]">{room.user_name}</div>
                          <div className="text-sm text-gray-500">{room.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {room.last_message || '尚無訊息'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {room.last_message_time 
                        ? format(new Date(room.last_message_time), 'yyyy/MM/dd HH:mm', { locale: zhTW })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-3 py-1.5 inline-flex text-sm font-medium rounded-full
                        ${room.status === 'active' 
                          ? 'bg-[#EDF7ED] text-[#1B5E20]' 
                          : 'bg-[#FFF8E1] text-[#F57F17]'}
                      `}>
                        {room.status === 'active' ? '進行中' : '已關閉'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {room.unread_count > 0 ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-3 py-1.5 text-sm font-medium rounded-full bg-[#FFEEF0] text-[#D32F2F]"
                        >
                          {room.unread_count}
                        </motion.span>
                      ) : (
                        <span className="px-3 py-1.5 text-sm font-medium rounded-full bg-[#F3F3F3] text-[#757575]">
                          已讀
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {selectedRoom && socket && (
        <AdminChatModal
          isOpen={true}
          onClose={() => {
            setSelectedRoom(null);
            socket.emit('getChatRooms');
          }}
          roomId={selectedRoom.id}
          socket={socket}
          room={selectedRoom}
          adminId={session?.user?.id}
          userType="admin"
          onError={(error) => {
            showSystemAlert.error('聊天視窗錯誤', error.message || '聊天視窗發生錯誤');
            setError(error.message || '聊天視窗發生錯誤');
            setSelectedRoom(null);
          }}
        />
      )}
    </motion.div>
  );
}