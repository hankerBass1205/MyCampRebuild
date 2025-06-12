'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import '@/styles/pages/booking/chat.css';
import { IoSend, IoClose } from "react-icons/io5";
import { v4 as uuidv4 } from 'uuid';

const ChatWindow = ({ socket: initialSocket, onClose, className }) => {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isRoomCreated, setIsRoomCreated] = useState(false);
  const messagesEndRef = useRef(null);
  const [showAiHint, setShowAiHint] = useState(false);
  const inputRef = useRef(null);

  // 初始化 Socket 和 RoomId
  useEffect(() => {
    if (session?.user && initialSocket && !isJoined) {
      // console.log('=== 初始化聊天室開始 ===', {
      //   userId: session.user.id,
      //   socketId: initialSocket?.id,
      //   isJoined,
      //   currentRoomId: roomId
      // });
      
      // 先設置 socket
      setSocket(initialSocket);
      
      // 防止重複初始化的標記
      let isInitializing = false;
      
      // 只在第一次初始化時檢查聊天室
      const handleRoomCheck = (response) => {
        if (isInitializing) return; // 防止重複處理
        isInitializing = true;
        
        // console.log('收到 roomCheck 回應:', response);
        if (response.exists) {
          // console.log('使用現有聊天室:', response.roomId);
          setRoomId(response.roomId);
          setIsRoomCreated(true);
        } else {
          // 創建新聊天室
          const newRoomId = uuidv4();
          // console.log('準備創建新聊天室:', newRoomId);
          
          initialSocket.emit('createRoom', {
            roomId: newRoomId,
            userId: session.user.id
          });
        }
      };

      // 監聽聊天室創建結果
      const handleRoomCreated = (response) => {
        // console.log('收到 roomCreated 回應:', response);
        if (response.success) {
          // console.log('聊天室創建成功, roomId:', response.roomId);
          setRoomId(response.roomId);
          setIsRoomCreated(true);
        }
      };

      // 監聽聊天歷史
      const handleChatHistory = (history) => {
        // console.log('收到聊天歷史:', history?.length || 0, '條訊息');
        // 確保歷史消息按時間排序
        const sortedHistory = (history || []).sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
        setMessages(sortedHistory);
      };

      // 監聽新訊息
      const handleNewMessage = (newMessage) => {
        setMessages(prev => {
          // 如果是服務器確認的用戶消息，替換本地臨時消息
          if (newMessage.sender_type === 'member') {
            return prev.map(msg => 
              msg.id.startsWith('local-') && 
              msg.message === newMessage.message ? 
              newMessage : msg
            );
          }
          
          // 這裡的判斷條件錯誤，應該改為 'AI'
          // 原本是 if (newMessage.sender_type === 'admin')
          if (newMessage.sender_type === 'AI') {
            return prev
              .filter(msg => !msg.isThinking) // 移除思考中的消息
              .concat(newMessage);
          }
          
          return [...prev, newMessage];
        });
      };

      // 先移除所有可能的舊監聽器
      initialSocket.removeAllListeners('roomCheck');
      initialSocket.removeAllListeners('roomCreated');
      initialSocket.removeAllListeners('chatHistory');
      initialSocket.removeAllListeners('message');

      // 添加新的監聽器
      initialSocket.on('roomCheck', handleRoomCheck);
      initialSocket.on('roomCreated', handleRoomCreated);
      initialSocket.on('chatHistory', handleChatHistory);
      initialSocket.on('message', handleNewMessage);

      // 發送檢查聊天室事件
      if (!isInitializing) {
        // console.log('發送 checkRoom 事件');
        initialSocket.emit('checkRoom', {
          userId: session.user.id
        });
      }

      // 標記已初始化
      setIsJoined(true);

      return () => {
        isInitializing = false;
        // console.log('=== 清理聊天室事件監聽器 ===');
        initialSocket.removeAllListeners();
      };
    }
  }, [session?.user?.id, initialSocket]); // 只依賴這兩個值

  // 自動滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !initialSocket || !roomId) {
      return;
    }

    const messageContent = message.trim();
    setMessage(''); // 立即清空輸入框

    // 創建用戶消息對象
    const userMessage = {
      id: 'local-' + Date.now(),
      roomId,
      message: messageContent,
      sender_type: 'member',
      created_at: new Date().toISOString(),
      user_id: session.user.id
    };

    // 立即在前端顯示用戶消息
    setMessages(prev => [...prev, userMessage]);

    // 如果是 AI 觸發，立即添加思考中的消息
    if (messageContent.toLowerCase().includes('@ai')) {
      const thinkingMessage = {
        id: 'thinking-' + Date.now(),
        roomId,
        message: "AI 思考中...",
        sender_type: 'admin',
        created_at: new Date().toISOString(),
        user_id: 'ai-assistant',
        isThinking: true // 標記為思考中狀態
      };
      setMessages(prev => [...prev, thinkingMessage]);
    }

    // 發送消息到服務器
    try {
      initialSocket.emit('message', {
        roomId,
        userId: session.user.id,
        message: messageContent,
        senderType: 'member'
      });
    } catch (error) {
      console.error('發送訊息錯誤:', error);
    }
  };

  // useEffect(() => {
  //   console.log('聊天室狀態更新:', {
  //     roomId,
  //     isRoomCreated,
  //     hasSocket: !!initialSocket
  //   });
  // }, [roomId, isRoomCreated, initialSocket]);

  // 處理輸入變化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // 檢查是否剛輸入 @
    if (value.endsWith('@')) {
      setShowAiHint(true);
    } else {
      setShowAiHint(false);
    }
  };

  // 插入 AI 指令
  const insertAiCommand = () => {
    setMessage(message + 'ai '); // 在 'ai' 後面加上空白
    setShowAiHint(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`
      bg-white
      overflow-hidden
      border border-gray-200
      flex flex-col
      ${className}
    `}>
      {/* 聊天內容區域 - 自適應高度 */}
      <div className="
        flex-1 overflow-y-auto p-4
        bg-gradient-to-b from-[#F8FAF9] to-[#F6F8FB] 
        space-y-4 min-h-[28rem]
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-[#6B8E7B]/30
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:border-2
        [&::-webkit-scrollbar-thumb]:border-transparent
        [&::-webkit-scrollbar-thumb]:bg-clip-padding
        hover:[&::-webkit-scrollbar-thumb]:bg-[#6B8E7B]/50
        transition-colors
      ">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`flex ${msg.sender_type === 'member' ? 'flex-row-reverse' : 'flex-row'} gap-2`}
          >
            {/* 頭像 - 保持原位置 */}
            {msg.sender_type !== 'member' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6B8E7B] to-[#5F7A68] flex items-center justify-center text-white relative shadow-md">
                {msg.isThinking ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
              </div>
            )}

            {/* 訊息內容區塊 */}
            <div className="flex flex-col max-w-[80%]">
              {/* 發送者名稱 */}
              <span className={`text-xs text-gray-500 mb-1 ${
                msg.sender_type === 'member' ? 'text-right' : 'text-left'
              }`}>
                {msg.sender_type === 'member' ? '我' : (msg.isThinking ? 'AI 助理' : '智能客服')}
              </span>

              {/* 訊息氣泡和時間戳 */}
              <div className="relative">
                {/* 訊息氣泡 */}
                <div
                  className={`
                    rounded-2xl p-2 px-3
                    break-words whitespace-pre-wrap
                    ${msg.sender_type === 'member'
                      ? 'bg-gradient-to-br from-[#6B8E7B] to-[#5F7A68] text-white'
                      : 'bg-white shadow-md text-gray-800'
                    } 
                    ${msg.isThinking ? 'animate-pulse shadow-sm' : 'shadow-md'}
                    transition-all duration-200
                    mb-4 // 為時間戳預留空間
                  `}
                >
                  <p className="break-words mb-0 leading-relaxed whitespace-pre-line">
                    {msg.message}
                    {msg.isThinking && <span className="animate-pulse">...</span>}
                  </p>
                </div>

                {/* 時間戳 - 使用絕對定位 */}
                <div className={`
                  absolute bottom-0 text-[0.7rem] text-gray-500
                  flex items-center gap-1
                  ${msg.sender_type === 'member' ? 'right-auto left-0 -translate-x-2' : 'left-auto right-0 translate-x-2'}
                `}>
                  {format(
                    new Date(msg.created_at || msg.timestamp),
                    'HH:mm',
                    { locale: zhTW }
                  )}
                  {msg.sender_type === 'member' && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區域 - 固定高度 */}
      <div className="border-t border-gray-100 bg-white p-2 shrink-0 relative">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="relative flex-1 mt-1.5">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              placeholder={!roomId ? "聊天室初始化中..." : "輸入訊息... (輸入 @ai 可呼叫智能客服)"}
              className="w-full px-4 py-1.5 border border-gray-200 rounded-full 
                focus:outline-none focus:ring-2 focus:ring-[#6B8E7B]/50 focus:border-[#6B8E7B]
                transition-all duration-200 bg-gray-50 text-base placeholder:text-sm"
              disabled={!roomId || !isRoomCreated}
            />
            
            {/* AI 提示框 */}
            {showAiHint && (
              <div className="absolute bottom-full left-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 animate-fade-in">
                <button
                  type="button"
                  onClick={insertAiCommand}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-md transition-colors w-full text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-[#6B8E7B] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">使用智能客服</div>
                    <div className="text-xs text-gray-500">點擊使用 AI 智能助理</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!message.trim() || !roomId || !isRoomCreated}
            className="p-3 bg-[#6B8E7B] text-white rounded-full 
              disabled:bg-gray-300 disabled:cursor-not-allowed
              hover:bg-[#5F7A68] active:scale-95
              transition-all duration-200 shadow-md hover:shadow-lg
              w-[3rem] h-[3rem] flex items-center justify-center"
          >
            <IoSend className="w-6 h-6" />
          </button>
        </form>
        
        {/* 狀態顯示 */}
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <div className={`w-[0.5rem] h-[0.5rem] rounded-full ${
            !roomId ? "bg-yellow-400" :
            !isRoomCreated ? "bg-orange-400" :
            "bg-green-400"
          } animate-pulse`}></div>
          <span>
            {!roomId ? "正在初始化聊天室..." : 
             !isRoomCreated ? "正在建立聊天室連接..." : 
             "聊天室已就緒"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow; 