import React, { useState, useEffect } from 'react'
import ForumLi from './ForumLi'

const ForumList = ({ setCategory }) => {
  // 接收 setCategory
  const [categories, setCategories] = useState([]) // 存儲分類
  const [activeMenu, setActiveMenu] = useState(0) // 預設選中 "全部"

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/forum/categories')
        const data = await response.json()
        const validCategories = data.filter(
          (category) => category.id !== undefined
        )
        setCategories([{ id: 0, name: '全部' }, ...validCategories])
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }

    fetchCategories()
  }, [])

  const handleMenuClick = (id) => {
    // console.log("選單元件 - 選取的按鈕 id : ", id); // 確認選擇的 category ID
    setActiveMenu(id)
    setCategory(id) // 更新父層的 category
    // setTabCategory(id) // 影響發文清單或收藏清單的分類
  }

  return (
    <div className="forumList">
      <div className="forumMenu d-flex justify-content-center">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`forumMenuBtn ${
              activeMenu === category.id ? 'active' : ''
            }`}
            onClick={() => handleMenuClick(category.id)}
          >
            {category.name}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ForumList
