import React from 'react'
import { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { clippingParents } from '@popperjs/core'
import { useSession } from 'next-auth/react'
import EditExpressModal from './EditExpressModal'
import { style } from 'd3-selection'

const ThreadLi = ({
  item,
  threadId,
  setData,
  expressDataReturn,
  setReplyData,
}) => {
  const { data: session, status } = useSession()

  if (!item) return null // 防止錯誤

  const {
    category_id,
    type_id,
    thread_image,
    pinned,
    featured,
    created_at,
    updated_at,
    user_name,
    thread_title,
    thread_content,
    user_avatar,
    user_id,
    floor,
    status: threadStatus, // 重新命名 status 避免與 useSession 衝突
  } = item

  // console.log('目前登入者 id = '+ session.user.id);
  // console.log('這篇文章的作者 id = '+ user_id);

  // 解析時間
  const threadDate = new Date(updated_at).toLocaleDateString()
  const threadTime = new Date(updated_at).toLocaleTimeString()

  // 文章類型製作
  const category_name = {
    1: '好物分享',
    2: '營地見聞',
    3: '活動揪團',
    4: '露營知識',
    5: '露友閒聊',
  }

  // 標題文字製作
  const title_type_name = {
    1: '心得',
    2: '問題',
    3: '討論',
    4: '情報',
    5: '閒聊',
  }

  // 使用 DOMPurify 清理內容
  // const sanitizedContent = DOMPurify.sanitize(thread_content)
  DOMPurify.addHook('afterSanitizeAttributes', function(node) {
    if (node.tagName && node.tagName.toLowerCase() === 'iframe') {
      const src = node.getAttribute('src') || "";
      // 只允許來自 YouTube embed 的 URL
      if (!src.startsWith("https://www.youtube.com/embed/")) {
        // 移除不符合規範的 iframe
        node.parentNode && node.parentNode.removeChild(node);
      }
    }
  });
  
  // 再進行內容的清理，並允許 iframe 與相關屬性
  const sanitizedContent = DOMPurify.sanitize(thread_content, {
    ADD_TAGS: ['iframe','a'],
    ADD_ATTR: [
      'allowfullscreen', 'frameborder', 'src',
      'data-proportion', 'data-percentage', 'data-size',
      'data-align', 'data-file-name', 'data-file-size', 'data-origin', 'target'
    ],
  });

  return (
    <div className={`threadLi ${floor === 1 ? 'owner' : 'reply'}`}>
      {floor === 1 ? (
        <>
          <div className="threadPageHeader">
            <div className="threadLandlord">
              <div className='threadLandlordbox1'>

                <div className="floor">樓主</div>
                <div className="landlordImg me-4">
                  <img
                    className="avatarAdaptive"
                    src={'/uploads/avatars/' + user_avatar}
                    alt={user_name}
                  />
                </div>
                <p className="userName fs-6 my-0 ms-0 me-4">{user_name}</p>

              </div>

              <div className='threadLandlordbox2'>
                {threadStatus == 0 ? (
                  <div className="removeBox me-2">
                    <i className="fa-solid fa-trash-can me-2"></i> 下架中...
                  </div>
                ) : (
                  ''
                )}
                <div className="typeBox">
                  <i className="fa-solid fa-tag icon"></i>
                  {category_name[category_id]}
                </div>
                {pinned === 1 && (
                  <div className="pinned ms-2">
                    <i className="fa-solid fa-arrow-up"></i> 置頂
                  </div>
                )}
                {featured === 1 && (
                  <div className="featured ms-2">
                    <i className="fa-solid fa-star"></i> 精華
                  </div>
                )}
              </div>
            </div>
            <div className="dateTimeEdit">
              <span>{threadDate}</span>
              <span>{threadTime}</span>
              <span>{created_at === updated_at ? '發文' : '編輯'}</span>
              {session && session.user && session.user.id == user_id && (
                <span
                  className="editBtn"
                  data-bs-toggle="modal"
                  data-bs-target="#editExpressModal"
                  onClick={() => setData(item)}
                >
                  修改
                </span>
              )}
            </div>
          </div>
          <div className="threadPageContent">
            <div className="threadPageTitle">
              {threadStatus == 0
                ? '此討論串已下架'
                : `【${title_type_name[type_id]}】 ${thread_title}`}
            </div>
            {threadStatus == 0 ? (
              <div className="threadPageText ql-editor">
                <p>此討論串已被樓主下架囉，去別的討論串串門子吧。(๑•̀ω•́)ノ</p>
              </div>
            ) : (
              <div
                className="threadPageText ql-editor"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            )}
          </div>
        </>
      ) : (
        /* 回覆的區塊 */
        <>
          <div className="threadPageHeader">
            <div className="threadLandlord">
              <div className='threadLandlordbox1'>

              <div className="floor">{floor} 樓</div>
              <div className="landlordImg me-4">
                <img
                  className="avatarAdaptive"
                  src={'/uploads/avatars/' + user_avatar}
                  alt={user_name}
                />
              </div>
              <p className="userName fs-6 m-0">{user_name}</p>

              </div>

              {threadStatus == 0 ? (
                <div className="removeBox">
                  <i className="fa-solid fa-trash-can me-2"></i> 下架中...
                </div>
              ) : (
                ''
              )}
            </div>
            <div className="dateTimeEdit">
              <span>{threadDate}</span>
              <span>{threadTime}</span>
              <span>{created_at === updated_at ? '發文' : '編輯'}</span>
              {session && session.user && session.user.id == user_id && (
                <span
                  className="editBtn"
                  data-bs-toggle="modal"
                  data-bs-target="#EditReplyModal"
                  onClick={() => setReplyData(item)}
                >
                  修改
                </span>
              )}
            </div>
          </div>
          {threadStatus == 0 ? (
            <div className="threadPageText ql-editor">
              <p>此回覆串已經下架囉~ (๑•̀ω•́)ノ</p>
            </div>
          ) : (
            <div
              className="threadPageText ql-editor"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          )}
          {/* {console.log(sanitizedContent)} */}
        </>
      )}
    </div>
  )
}

export default ThreadLi
