'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import '@/styles/pages/404.css'

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    let timer = null
    
    // 確保組件已經掛載後再開始計時
    const startCountdown = () => {
      timer = setInterval(() => {
        setCountdown((prev) => {
          const newCount = prev - 1
          if (newCount <= 0) {
            clearInterval(timer)
            // 使用 setTimeout 來確保狀態更新完成後再跳轉
            setTimeout(() => {
              router.push('/')
            }, 0)
          }
          return newCount
        })
      }, 1000)
    }

    startCountdown()

    // 清理函數
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [router])

  return (
    <div className="not-found-container">
      <h1>404</h1>
      <h2>糟糕！頁面不見了</h2>
      <p>
        看來您要尋找的頁面已經離家出走了。
        別擔心，讓我們帶您回到首頁繼續探索吧！
      </p>
      <div className="actions">
        <Link href="/" className="back-home">
          <i className="fas fa-home me-2"></i>
          返回首頁
        </Link>
      </div>
      <p className="countdown">
        <i className="fas fa-clock me-2"></i>
        系統將在 {countdown} 秒後自動返回首頁...
      </p>
    </div>
  )
} 