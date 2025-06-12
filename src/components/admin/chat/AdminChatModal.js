'use client';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { IoSend, IoClose } from "react-icons/io5";

export default function AdminChatModal({ isOpen, onClose, roomId, socket, room, adminId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // 監聽新訊息
  useEffect(() => {
    if (!socket || !roomId) return;

    // 加入聊天室
    socket.emit('joinRoom', {
      roomId: roomId,
      userId: room.admin_id,
      userType: 'admin'
    });

    // 標記訊息已讀
    socket.emit('markMessagesAsRead', {
      roomId: roomId
    });

    // 統一處理所有類型的消息
    const handleMessage = (message) => {
      if (message.room_id === roomId) {
        setMessages(prev => {
          // 檢查消息是否已存在
          const messageExists = prev.some(m => m.id === message.id);
          if (messageExists) return prev;
          return [...prev, message];
        });
      }
    };

    // 監聽歷史訊息
    const handleChatHistory = (history) => {
      const processedMessages = history.map(msg => ({
        ...msg,
        // 管理員和 AI 的消息顯示在右側，其他都在左側
        position: (msg.sender_type === 'admin' && msg.user_id === adminId) || msg.sender_type === 'AI' 
          ? 'right' 
          : 'left'
      }));
      setMessages(processedMessages);
    };

    // 監聽錯誤
    const handleError = (error) => {
      console.error('Chat error:', error);
      // 可以添加錯誤提示UI
    };

    // 註冊事件監聽
    socket.on('message', handleMessage);
    socket.on('chatHistory', handleChatHistory);
    socket.on('error', handleError);

    // 清理函數
    return () => {
      socket.off('message', handleMessage);
      socket.off('chatHistory', handleChatHistory);
      socket.off('error', handleError);
    };
  }, [socket, roomId, room.admin_id, adminId]);

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      roomId: roomId,
      message: newMessage.trim(),
      senderType: 'admin',
      userId: room.admin_id
    };

    socket.emit('message', messageData);
    setNewMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white w-[37.5rem] h-[40.375rem] rounded-lg shadow-2xl flex flex-col">
        {/* 標題欄 */}
        <div className="bg-gradient-to-r from-[#6B8E7B] to-[#5F7A68] p-4 rounded-t-lg shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-white">客服聊天室</h3>
              <div className="bg-green-400 w-2 h-2 rounded-full animate-pulse"></div>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white transition-colors"
            >
              <IoClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 聊天內容區域 */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#F8F9FA] space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender_type === 'member' ? 'flex-row' : 'flex-row-reverse'
              } gap-2`}
            >
              {/* 用戶頭像 - 只在用戶消息顯示 */}
              {msg.sender_type === 'member' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6B8E7B] to-[#5F7A68] flex items-center justify-center text-white shadow-md shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* 訊息內容區塊 */}
              <div className={`flex flex-col max-w-[70%] ${
                msg.sender_type === 'member' ? '' : 'items-end'
              }`}>
                <span className="text-xs text-gray-500 mb-1">
                  {msg.sender_type === 'member' ? '用戶' : (msg.sender_type === 'AI' ? 'AI 助理' : '客服')}
                </span>
                <div className={`rounded-2xl p-2 px-3 ${
                  msg.sender_type === 'member' 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-[#6B8E7B] text-white'
                }`}>
                  {msg.message}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 輸入區域 */}
        <div className="border-t border-gray-100 bg-white p-2 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-4 border border-gray-200 rounded-full
                focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/50 focus:border-[#6B8E7B]
                transition-all duration-200 bg-gray-50 text-base"
              placeholder="輸入訊息..."
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !socket}
              className="p-3 bg-[#6B8E7B] text-white rounded-full
                disabled:bg-gray-300 disabled:cursor-not-allowed
                hover:bg-[#5F7A68] active:scale-95
                transition-all duration-200 shadow-md hover:shadow-lg
                w-[3rem] h-[3rem] flex items-center justify-center"
            >
              <IoSend className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 