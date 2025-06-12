'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

const Userside = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  // 新增一個 state 來記錄當前被點選的按鈕
  const [activeBtn, setActiveBtn] = useState('')

  // 統一一個函式來更新 active 按鈕狀態
  const handleActive = (btnKey) => {
    setActiveBtn(btnKey)
  }

  const handlePostList = () => {
    handleActive('postList')
    router.push('/forum?list=post') // Forum 頁面接收到 list=post 後，載入發文清單
  }

  const handleFavoriteList = () => {
    handleActive('favoriteList')
    router.push('/forum?list=favorite') // Forum 頁面接收到 list=favorite 後，載入收藏清單
  }

  // console.log("登入狀態:", status);
  // console.log("使用者資訊:", session);
  // console.log(session?.user?.avatar);

  return (
    <div className="userSide">
      <span className='boxA'>
        <div className="avatar">
          <img
            className="avatarAdaptive"
            src={session ? '/uploads/avatars/'+session?.user?.avatar : '/uploads/avatars/default-avatar-1.png'}
            alt={session?.user?.name || '未登入'}
          />
        </div>
        <p className="userName">{session ? session.user.name : '請先登入'}</p>
      </span>

      <span className='boxB'>
      {session ? (
        <div
          className={`btnUserName ${activeBtn === 'express' ? 'activeUserSide' : ''}`}
          data-bs-toggle="modal"
          data-bs-target="#expressModal"
          onClick={() => handleActive('express')}
        >
          <i className="fa-solid fa-message icon"></i>我要發文
        </div>
      ) : (
        <div
          className="btnUserName doExpressNon"
          onClick={() => {
            Swal.fire({
              title: '請先登入!',
              html: '<div style="height:40px">登入以參與討論交流哦！(ゝ∀･)</div>',
              icon: 'warning',
              draggable: false,
              showConfirmButton: false,
              timer: 2000,
            })
          }}
        >
          <i className="fa-solid fa-message icon"></i>我要發文
        </div>
      )}

      {session ? (
        <div 
          className={`btnUserName ${activeBtn === 'postList' ? 'activeUserSide' : ''}`} 
          onClick={handlePostList}
        >
          <i className="fa-solid fa-user-large icon"></i>發文清單
        </div>
      ) : (
        ''
      )}
      {session ? (
        <div 
          className={`btnUserName ${activeBtn === 'favoriteList' ? 'activeUserSide' : ''}`} 
          onClick={handleFavoriteList}
        >
          <i className="fa-solid fa-heart icon"></i>收藏清單
        </div>
      ) : (
        ''
      )}
      {session ? (
        <div
          className={`btnUserName ${activeBtn === 'chat' ? 'activeUserSide' : ''}`}
          data-bs-toggle="modal"
          data-bs-target="#chatroomModal"
          onClick={() => handleActive('chat')}
        >
          <i className="fa-solid fa-comment icon"></i>即時聊天
        </div>
      ) : (
        ''
      )}
      </span>
    </div>
  )
}

export default Userside
