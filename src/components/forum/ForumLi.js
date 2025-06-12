'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import PaginationArea from './PaginationArea'
import { clippingParents } from '@popperjs/core'

const ForumLi = ({
  currentPage,
  itemsPerPage,
  category,
  setCurrentPage,
  apiType = 'all',
}) => {
  const [forumData, setForumData] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [currentData, setCurrentData] = useState([])
  const [totalForumDataLength, setTotalForumDataLength] = useState(0)
  const [showNoContent, setShowNoContent] = useState(false) // 🌟 新增狀態

  useEffect(() => {
    let apiUrl = ''
    if (apiType === 'post') {
      apiUrl = `/api/forum/myposts?type=post&page=${currentPage}`
      if (category && category !== 0) {
        apiUrl += `&category=${category}`
      }
    } else if (apiType === 'favorite') {
      apiUrl = `/api/forum/favorites?type=favorite&page=${currentPage}`
      if (category && category !== 0) {
        apiUrl += `&category=${category}`
      }
    } else {
      const effectiveCategory = category || '全部'
      apiUrl = `/api/forum/get?category_id=${effectiveCategory}&page=${currentPage}`
    }

    const fetchData = async () => {
      try {
        const response = await fetch(apiUrl)
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        setForumData(data.data)
        setTotalPages(data.totalPages)
        setTotalForumDataLength(data.totalCount)
      } catch (error) {
        console.error('Error fetching forum data:', error)
      }
    }

    fetchData()
  }, [category, currentPage, setCurrentPage, apiType])

  useEffect(() => {
    setCurrentData(forumData)

    // 🌟 每次資料變更時，重新計時 1 秒後顯示 "沒有內容"
    setShowNoContent(false) // 先重置狀態
    if (forumData.length === 0) {
      const timer = setTimeout(() => {
        setShowNoContent(true) // 0.2 秒後顯示 "沒有內容"
      }, 200)
      return () => clearTimeout(timer) // 清除計時器，避免記憶體洩漏
    }
  }, [forumData, currentPage, itemsPerPage])

  return (
    <>
      {/* 🌟 1 秒延遲顯示 "沒有內容" */}
      {/* 新增條件判斷：當 currentData 為空時，顯示 "沒有內容" */}
      {showNoContent && currentData.length === 0 ? (
        <p className="text-center mt-4">沒有相關的內容哦。(´ー`)</p> // 這是新增的部分
      ) : (
        currentData.map((forum) => {
          if (!forum) {
            return null
          }
          const {
            id,
            category_name,
            title_type_name,
            pinned,
            featured,
            thread_image,
            thread_title,
            thread_content,
            user_avatar,
            user_name,
            updated_at,
            status,
          } = forum

          const sanitizedContent = thread_content?.replace(/<[^>]*>/g, '') || ''

          const threadDate = new Date(updated_at).toLocaleDateString()
          const threadTime = new Date(updated_at).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })

          return (
            <Link
              key={id}
              href={`/forum/thread/${id}`}
              className="forumLi hover linkStyle"
            >
              <div className="forumLiBox1">
                <div className="liTitle d-flex flex-wrap justify-content-between">
                  {status == 0 ? (
                    <div className="removeBox">
                      <i className="fa-solid fa-trash-can me-2"></i> 下架中...
                    </div>
                  ) : (
                    ''
                  )}
                  <div className="typeBox">
                    <i className="fa-solid fa-tag icon"></i>
                    {category_name}
                  </div>
                  {pinned === 1 && (
                    <div className="pinned">
                      <i className="fa-solid fa-arrow-up"></i> 置頂
                    </div>
                  )}
                  {featured === 1 && (
                    <div className="featured">
                      <i className="fa-solid fa-star"></i> 精華
                    </div>
                  )}
                </div>
                <div className="thread_image">
                  <img src={thread_image} alt={thread_title} />
                </div>
              </div>
              <div className="forumLiBox2">
                <div className="threadTitle">
                  {status == 0
                    ? '此討論串已下架'
                    : `【${title_type_name}】${thread_title}`}
                </div>
                <hr className="threadLine" />
                {status == 0 ? (
                  <div className="threadContent">
                    
                    此討論串已被樓主下架囉，去別的討論串串門子吧。(๑•̀ω•́)ノ
                    
                  </div>
                ) : (
                  <div
                    className="threadContent"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  />
                )}
              </div>
              <div className="forumLiBox3">
                <div className="threadAvatar">
                  <img
                    className="avatarAdaptive"
                    src={'/uploads/avatars/' + user_avatar}
                    alt={user_name}
                  />
                </div>
                <p className="threadUserName">{user_name}</p>
                <p className="threadDate">
                  {threadDate}
                  <span className="threadTime">{threadTime}</span>
                </p>
              </div>
            </Link>
          )
        })
      )}

      <PaginationArea
        totalPages={totalPages}
        currentPage={currentPage}
        setCurrentPage={(pageNumber) => {
          window.scrollTo(0, 0)
          setCurrentPage(pageNumber)
        }}
      />
    </>
  )
}

export default ForumLi
