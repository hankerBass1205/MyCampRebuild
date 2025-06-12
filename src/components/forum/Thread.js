import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { forumData, commentsData } from '@/data/forum/data'
import ThreadLi from './ThreadLi'
import PaginationArea from './PaginationArea'

const Thread = () => {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') // 從 URL 查詢參數獲取 id

  // 根據 id 查找對應的帖子
  const thread = forumData.find((forum) => forum.thread_id === parseInt(id))

  // 這裡確保 useState 在條件語句之前調用
  const [currentPage, setCurrentPage] = useState(1)

  // 如果帖子不存在，返回錯誤訊息
  if (!thread) {
    return <div>該帖子不存在</div>
  }

  // 合併樓主的帖子和回覆資料
  const combinedData = [
    thread,
    ...commentsData.filter((comment) => comment.thread_id === thread.thread_id),
  ]

  // 每頁顯示的資料數量
  const itemsPerPage = 10
  const totalPages = Math.ceil(combinedData.length / itemsPerPage)

  // 計算當前頁顯示的資料範圍
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = combinedData.slice(startIndex, endIndex)

  return (
    <>
      {currentData.map((item, index) => (
        <ThreadLi key={index} item={item} />
      ))}
      {/* 如果總頁數大於 1，顯示分頁元件 */}
      {totalPages > 1 && (
        <PaginationArea
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      )}
    </>
  )
}

export default Thread
