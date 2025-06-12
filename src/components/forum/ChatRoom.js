'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react' // 引入 useSession
import io from 'socket.io-client'

const socket = io('http://localhost:4000')

export default function ChatRoom() {
  const { data: session, status } = useSession() // 取得 session 和載入狀態
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [statusState, setStatusState] = useState('在線') // 使用者狀態
  const [isJoined, setIsJoined] = useState(false) // 新增加入狀態
  const chatListRef = useRef(null) // 建立 ref 用於聊天清單

  // 初始化 Socket.IO 監聽
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.name) {
      // 使用 session.user.name 作為使用者名稱加入聊天室
      socket.emit('join', session.user.name)
      setIsJoined(true) // 標記已加入
    }

    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg])
    })

    socket.on('userList', (userList) => {
      setUsers(userList.map(([id, data]) => ({ id, ...data })))
    })

    return () => {
      socket.off('message')
      socket.off('userList')
    }
  }, [session, status, isJoined]) // 當 session 或 status 或 isJoined 改變時執行

  // 當 messages 更新時，捲動到最下方
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight // 捲到最底部
    }
  }, [messages]) // 依賴 messages 陣列

  // 新增處理 Enter 鍵的功能
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage() // 按 Enter 時觸發送出
    }
  }

  // 發送訊息
  const sendMessage = () => {
    if (message && isJoined) {
      // 確保已加入才發送訊息
      socket.emit('sendMessage', message)
      setMessage('')
    }
  }

  // 更新狀態
  const updateStatus = (newStatus) => {
    setStatusState(newStatus)
    socket.emit('updateStatus', newStatus)
  }

  // 如果未登入，顯示提示
  if (status === 'loading') {
    // return <p>載入中...</p>;
    return ''
  }
  if (status === 'unauthenticated') {
    // return <p>請先登入才能使用聊天室。</p>;
    return ''
  }

  return (
    <>
      <div
        className="modal fade"
        id="chatroomModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                歡樂 KPI 聊天室
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {/* 聊天訊息區塊 */}
              <div className="chat-area">
                <h2 className="chat-area-title">即時聊天室</h2>
                <div
                  className="chat-text-list p-2 d-flex flex-column"
                  ref={chatListRef}
                >
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message ${
                        msg.username === session?.user?.name
                          ? 'sent'
                          : 'received'
                      }`}
                    >
                      <p>
                        <strong className="px-1">{msg.username}</strong>:{' '}
                        {msg.text}{' '}
                        <small className="ms-2">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </small>
                      </p>
                    </div>
                  ))}
                </div>
                <div className="d-flex">
                  <input
                    type="text"
                    className="chat-input my-3 px-2 flex-grow-1"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown} // 監聽鍵盤事件
                    placeholder="請輸入訊息..."
                    title="按 Enter 鍵送出訊息"
                  />
                  <button
                    className=" my-3 ms-2"
                    onClick={sendMessage}
                    title="送出訊息"
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </div>
              </div>

              {/* 使用者清單區塊 */}
              <div className="user-list d-flex flex-column">
                <h2 className="chat-area-title">目前使用者</h2>
                <div className="d-flex mb-4 member-box">
                  <div className="chat-avatar me-3">
                    <img
                      src={'/uploads/avatars/' + session.user.avatar}
                      className="avatarAdaptive"
                    />
                  </div>
                  <div className="d-flex flex-column justify-content-center">
                    <h4>{session.user.name}</h4>
                    <div style={{ fontWeight: 300 }}>
                      <span>狀態設定：</span>
                      <select
                        value={statusState}
                        onChange={(e) => updateStatus(e.target.value)}
                        className="rounded-1"
                      >
                        <option value="在線">在線</option>
                        <option value="忙碌">忙碌</option>
                        <option value="離線">離線</option>
                      </select>
                    </div>
                  </div>
                </div>

                <h2 className="chat-area-title">使用者清單</h2>
                <ul className="flex-grow-1">
                  {users.map((user) => (
                    <li key={user.id}>
                      {user.username} - {user.status}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" className="btn btn-primary">Save changes</button>
            </div> */}
          </div>
        </div>
      </div>
    </>
  )
}
