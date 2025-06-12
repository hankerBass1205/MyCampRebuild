'use client'
import React, { useState } from 'react'
import Userside from '@/components/forum/Userside'
import Forum from '@/components/forum/Forum'
import '@/styles/pages/forum/index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // 確保載入 JavaScript
import Modalexpress from '@/components/forum/Modalexpress'
import ChatRoom from '@/components/forum/ChatRoom';


export default function ForumPage() {
  
  // 父元件中定義一個重置的狀態旗標
  const [resetFlag, setResetFlag] = useState(false)

  // 這個函式會被 Modalexpress 呼叫，更新 resetFlag
  const handleResetTrigger = () => {
    setResetFlag(true)
  }

  return (
    <>
      {/* 將更新 resetFlag 的函式傳給 Modalexpress */}
      <Modalexpress onResetCategory={handleResetTrigger} />
      <ChatRoom />
      <div className="container" id="forumListTop">
        <div className="forumArea">
          <Userside />
          <div className="forumUL">

            {/* 將 resetFlag 與 setResetFlag 傳給 Forum */}
            <Forum resetFlag={resetFlag} setResetFlag={setResetFlag} />
          </div>
        </div>
      </div>
    </>
  )
}
