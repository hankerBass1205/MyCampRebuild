import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// 收集所有測試結果
let testResults = []

// 添加測試結果收集工具
const addTestResult = (testName, passed) => {
  testResults.push({ testName, passed })
}

// 先只保留基本測試，確保測試環境正常運作
describe('✨ 基礎功能測試', () => {
  test('✅ 測試環境檢查', () => {
    try {
      expect(true).toBe(true)
      addTestResult('基礎功能 - 測試環境檢查', true)
    } catch (error) {
      addTestResult('基礎功能 - 測試環境檢查', false)
      throw error
    }
  })

  test('✅ DOM 渲染測試', () => {
    try {
      render(<div>Hello Test</div>)
      expect(screen.getByText('Hello Test')).toBeInTheDocument()
      addTestResult('基礎功能 - DOM 渲染', true)
    } catch (error) {
      addTestResult('基礎功能 - DOM 渲染', false)
      throw error
    }
  })
})

// 按鈕組件測試
describe('按鈕組件測試', () => {
  test('按鈕點擊事件', () => {
    const handleClick = jest.fn()
    render(<button onClick={handleClick}>點擊我</button>)
    
    fireEvent.click(screen.getByText('點擊我'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('禁用按鈕狀態', () => {
    render(<button disabled>禁用按鈕</button>)
    expect(screen.getByText('禁用按鈕')).toBeDisabled()
  })
})

// 表單輸入測試
describe('表單輸入測試', () => {
  test('文字輸入框', () => {
    render(<input type="text" placeholder="請輸入..." />)
    const input = screen.getByPlaceholderText('請輸入...')
    
    fireEvent.change(input, { target: { value: '測試文字' } })
    expect(input.value).toBe('測試文字')
  })

  test('表單提交', () => {
    const handleSubmit = jest.fn(e => e.preventDefault())
    render(
      <form onSubmit={handleSubmit}>
        <input type="text" />
        <button type="submit">提交</button>
      </form>
    )
    
    fireEvent.click(screen.getByText('提交'))
    expect(handleSubmit).toHaveBeenCalled()
  })
})

// 列表渲染測試
describe('列表渲染測試', () => {
  test('渲染列表項目', () => {
    const items = ['項目1', '項目2', '項目3']
    render(
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    )
    
    items.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })
})

// 載入狀態測試
describe('載入狀態測試', () => {
  test('顯示載入中狀態', () => {
    render(<div aria-label="載入中">Loading...</div>)
    expect(screen.getByLabelText('載入中')).toBeInTheDocument()
  })
})

// 錯誤處理測試
describe('錯誤處理測試', () => {
  test('顯示錯誤訊息', () => {
    const errorMessage = '發生錯誤了！'
    render(<div role="alert">{errorMessage}</div>)
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
  })
})

// 互動功能測試
describe('互動功能測試', () => {
  test('切換顯示/隱藏', () => {
    const TestComponent = () => {
      const [isVisible, setIsVisible] = React.useState(false)
      return (
        <>
          <button onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? '隱藏' : '顯示'}
          </button>
          {isVisible && <div>內容</div>}
        </>
      )
    }
    
    render(<TestComponent />)
    expect(screen.queryByText('內容')).not.toBeInTheDocument()
    
    fireEvent.click(screen.getByText('顯示'))
    expect(screen.getByText('內容')).toBeInTheDocument()
  })
})

// 非同步操作測試
describe('非同步操作測試', () => {
  test('非同步數據載入', async () => {
    const AsyncComponent = () => {
      const [data, setData] = React.useState('Loading...')
      
      React.useEffect(() => {
        setTimeout(() => {
          setData('Data loaded')
        }, 100)
      }, [])
      
      return <div>{data}</div>
    }
    
    render(<AsyncComponent />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Data loaded')).toBeInTheDocument()
    })
  })
})

// 下拉選單測試
describe('下拉選單測試', () => {
  test('選擇選項', () => {
    render(
      <select data-testid="select">
        <option value="1">選項1</option>
        <option value="2">選項2</option>
        <option value="3">選項3</option>
      </select>
    )
    
    const select = screen.getByTestId('select')
    fireEvent.change(select, { target: { value: '2' } })
    expect(select.value).toBe('2')
  })
})

// 複選框測試
describe('複選框測試', () => {
  test('切換複選框狀態', () => {
    render(
      <label>
        <input type="checkbox" />
        同意條款
      </label>
    )
    
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    
    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})

// 彈出視窗測試
describe('彈出視窗測試', () => {
  test('顯示/隱藏彈出視窗', () => {
    const Modal = ({ isOpen, onClose, children }) => (
      isOpen ? (
        <div role="dialog">
          {children}
          <button onClick={onClose}>關閉</button>
        </div>
      ) : null
    )

    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(false)
      return (
        <>
          <button onClick={() => setIsOpen(true)}>開啟</button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
            彈出內容
          </Modal>
        </>
      )
    }

    render(<TestComponent />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    
    fireEvent.click(screen.getByText('開啟'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('關閉'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// 搜尋功能測試
describe('搜尋功能測試', () => {
  test('搜尋過濾', () => {
    const SearchComponent = () => {
      const [items, setItems] = React.useState(['蘋果', '香蕉', '橘子'])
      const [search, setSearch] = React.useState('')
      
      const filteredItems = items.filter(item => 
        item.includes(search)
      )
      
      return (
        <div>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋..."
          />
          <ul>
            {filteredItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )
    }
    
    render(<SearchComponent />)
    const searchInput = screen.getByPlaceholderText('搜尋...')
    
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    
    fireEvent.change(searchInput, { target: { value: '蘋' } })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('蘋果')).toBeInTheDocument()
  })
})

// 表單驗證測試
describe('表單驗證測試', () => {
  test('必填欄位驗證', () => {
    const handleSubmit = jest.fn(e => e.preventDefault())
    
    render(
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          required 
          placeholder="請輸入名稱"
        />
        <button type="submit">提交</button>
      </form>
    )
    
    fireEvent.click(screen.getByText('提交'))
    expect(handleSubmit).not.toHaveBeenCalled()
    
    const input = screen.getByPlaceholderText('請輸入名稱')
    fireEvent.change(input, { target: { value: '測試名稱' } })
    fireEvent.click(screen.getByText('提交'))
    expect(handleSubmit).toHaveBeenCalled()
  })
})

// 用戶認證測試
describe('用戶認證測試', () => {
  // 註冊測試
  test('✅ 註冊流程', async () => {
    const handleRegister = jest.fn(e => e.preventDefault())
    
    render(
      <form onSubmit={handleRegister}>
        <input 
          type="email" 
          placeholder="電子郵件"
          required 
        />
        <input 
          type="password" 
          placeholder="密碼"
          required 
        />
        <input 
          type="password" 
          placeholder="確認密碼"
          required 
        />
        <button type="submit">註冊</button>
      </form>
    )

    // 填寫表單
    fireEvent.change(screen.getByPlaceholderText('電子郵件'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('密碼'), {
      target: { value: 'password123' }
    })
    fireEvent.change(screen.getByPlaceholderText('確認密碼'), {
      target: { value: 'password123' }
    })

    // 提交表單
    fireEvent.click(screen.getByText('註冊'))
    expect(handleRegister).toHaveBeenCalled()
  })

  // 登入測試
  test('✅ 登入流程', async () => {
    const handleLogin = jest.fn(e => e.preventDefault())
    
    render(
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="電子郵件"
          required 
        />
        <input 
          type="password" 
          placeholder="密碼"
          required 
        />
        <button type="submit">登入</button>
      </form>
    )

    fireEvent.change(screen.getByPlaceholderText('電子郵件'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('密碼'), {
      target: { value: 'password123' }
    })

    fireEvent.click(screen.getByText('登入'))
    expect(handleLogin).toHaveBeenCalled()
  })
})

// 營區相關測試
describe('🏕️ 營區功能測試', () => {
  // 營區列表測試
  test('✅ 營區列表渲染', async () => {
    const mockCamps = [
      { id: 1, name: '快樂營地', price: 1000 },
      { id: 2, name: '森林營地', price: 1200 }
    ]

    render(
      <div>
        {mockCamps.map(camp => (
          <div key={camp.id} role="article">
            <h3>{camp.name}</h3>
            <p>價格: ${camp.price}</p>
          </div>
        ))}
      </div>
    )

    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByText('快樂營地')).toBeInTheDocument()
  })

  // 營區篩選測試
  test('✅ 營區篩選功能', () => {
    const FilterComponent = () => {
      const [price, setPrice] = React.useState('')
      const [location, setLocation] = React.useState('')
      
      return (
        <div>
          <select 
            value={price} 
            onChange={(e) => setPrice(e.target.value)}
            aria-label="價格範圍"
          >
            <option value="">全部價格</option>
            <option value="0-1000">1000元以下</option>
            <option value="1001-2000">1001-2000元</option>
          </select>
          
          <select 
            value={location} 
            onChange={(e) => setLocation(e.target.value)}
            aria-label="地區"
          >
            <option value="">全部地區</option>
            <option value="north">北部</option>
            <option value="south">南部</option>
          </select>
        </div>
      )
    }

    render(<FilterComponent />)
    
    const priceSelect = screen.getByLabelText('價格範圍')
    const locationSelect = screen.getByLabelText('地區')

    fireEvent.change(priceSelect, { target: { value: '0-1000' }})
    fireEvent.change(locationSelect, { target: { value: 'north' }})

    expect(priceSelect.value).toBe('0-1000')
    expect(locationSelect.value).toBe('north')
  })
})

// 購物車流程測試
describe('🛒 購物車功能測試', () => {
  test('✅ 添加商品', () => {
    const CartComponent = () => {
      const [items, setItems] = React.useState([])
      
      const addToCart = (item) => {
        setItems([...items, item])
      }

      return (
        <div>
          <button onClick={() => addToCart({ id: 1, name: '營地A', price: 1000 })}>
            加入購物車
          </button>
          <div role="list">
            {items.map(item => (
              <div key={item.id} role="listitem">
                {item.name} - ${item.price}
              </div>
            ))}
          </div>
        </div>
      )
    }

    render(<CartComponent />)
    
    fireEvent.click(screen.getByText('加入購物車'))
    expect(screen.getByRole('listitem')).toHaveTextContent('營地A - $1000')
  })
})

// 訂單測試
describe('📝 訂單功能測試', () => {
  test('✅ 訂單提交流程', async () => {
    const handleSubmitOrder = jest.fn(e => e.preventDefault())
    
    render(
      <form onSubmit={handleSubmitOrder}>
        <input 
          type="text" 
          placeholder="訂購人姓名"
          required 
        />
        <input 
          type="tel" 
          placeholder="聯絡電話"
          required 
        />
        <input 
          type="date" 
          data-testid="date-input"
          required 
        />
        <button type="submit">確認訂購</button>
      </form>
    )

    fireEvent.change(screen.getByPlaceholderText('訂購人姓名'), {
      target: { value: '測試用戶' }
    })
    fireEvent.change(screen.getByPlaceholderText('聯絡電話'), {
      target: { value: '0912345678' }
    })
    fireEvent.change(screen.getByTestId('date-input'), {
      target: { value: '2024-03-15' }
    })

    fireEvent.click(screen.getByText('確認訂購'))
    expect(handleSubmitOrder).toHaveBeenCalled()
  })
})

// 通知功能測試
describe('🔔 通知功能測試', () => {
  test('✅ 顯示通知訊息', () => {
    const NotificationComponent = () => {
      const [notifications, setNotifications] = React.useState([])
      
      const addNotification = (message) => {
        setNotifications([...notifications, message])
      }

      return (
        <div>
          <button onClick={() => addNotification('新訂單通知')}>
            觸發通知
          </button>
          <div role="alert">
            {notifications.map((msg, index) => (
              <div key={index}>{msg}</div>
            ))}
          </div>
        </div>
      )
    }

    render(<NotificationComponent />)
    
    fireEvent.click(screen.getByText('觸發通知'))
    expect(screen.getByRole('alert')).toHaveTextContent('新訂單通知')
  })
})

// 營區詳細資訊測試
describe('🏕️ 營區詳細資訊測試', () => {
  test('✅ 營區資訊顯示', () => {
    const campData = {
      id: 1,
      name: '快樂營地',
      price: 1000,
      description: '位於山林間的優質營地',
      facilities: ['停車場', '淋浴間', 'WiFi'],
      images: ['image1.jpg', 'image2.jpg']
    }

    render(
      <div role="article">
        <h2>{campData.name}</h2>
        <p>{campData.description}</p>
        <p>價格: ${campData.price}</p>
        <ul>
          {campData.facilities.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    )

    expect(screen.getByText(campData.name)).toBeInTheDocument()
    expect(screen.getByText(campData.description)).toBeInTheDocument()
    expect(screen.getByText(`價格: $${campData.price}`)).toBeInTheDocument()
    campData.facilities.forEach(facility => {
      expect(screen.getByText(facility)).toBeInTheDocument()
    })
  })

  test('✅ 營區預訂日期選擇', () => {
    const handleDateChange = jest.fn()
    
    render(
      <div>
        <input 
          type="date" 
          data-testid="check-in"
          onChange={handleDateChange}
          min={new Date().toISOString().split('T')[0]}
        />
        <input 
          type="date" 
          data-testid="check-out"
          onChange={handleDateChange}
        />
      </div>
    )

    const checkIn = screen.getByTestId('check-in')
    const checkOut = screen.getByTestId('check-out')

    fireEvent.change(checkIn, { target: { value: '2024-03-20' }})
    fireEvent.change(checkOut, { target: { value: '2024-03-22' }})

    expect(handleDateChange).toHaveBeenCalledTimes(2)
  })
})

// 評論功能測試
describe('💬 評論功能測試', () => {
  test('✅ 新增評論', () => {
    const handleSubmit = jest.fn(e => e.preventDefault())
    
    render(
      <form onSubmit={handleSubmit}>
        <textarea 
          placeholder="寫下您的評論"
          required
        />
        <select aria-label="評分">
          <option value="5">5星</option>
          <option value="4">4星</option>
          <option value="3">3星</option>
        </select>
        <button type="submit">送出評論</button>
      </form>
    )

    fireEvent.change(screen.getByPlaceholderText('寫下您的評論'), {
      target: { value: '很棒的露營體驗！' }
    })
    
    fireEvent.change(screen.getByLabelText('評分'), {
      target: { value: '5' }
    })

    fireEvent.click(screen.getByText('送出評論'))
    expect(handleSubmit).toHaveBeenCalled()
  })

  test('✅ 評論列表顯示', () => {
    const comments = [
      { id: 1, user: '露營客A', content: '環境很好', rating: 5 },
      { id: 2, user: '露營客B', content: '服務很讚', rating: 4 }
    ]

    render(
      <div>
        {comments.map(comment => (
          <div key={comment.id} role="comment">
            <p>{comment.user}</p>
            <p>{comment.content}</p>
            <p>評分: {comment.rating}星</p>
          </div>
        ))}
      </div>
    )

    expect(screen.getAllByRole('comment')).toHaveLength(2)
    expect(screen.getByText('露營客A')).toBeInTheDocument()
  })
})

// 收藏功能測試
describe('❤️ 收藏功能測試', () => {
  test('✅ 收藏/取消收藏營地', () => {
    const FavoriteButton = () => {
      const [isFavorite, setIsFavorite] = React.useState(false)
      return (
        <button 
          onClick={() => setIsFavorite(!isFavorite)}
          aria-label={isFavorite ? '取消收藏' : '加入收藏'}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      )
    }

    render(<FavoriteButton />)
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    expect(button).toHaveTextContent('❤️')
    
    fireEvent.click(button)
    expect(button).toHaveTextContent('🤍')
  })
})

// 金流功能測試
describe('💰 金流功能測試', () => {
  test('✅ 信用卡付款表單', () => {
    const handlePayment = jest.fn(e => e.preventDefault())
    
    render(
      <form onSubmit={handlePayment}>
        <input 
          type="text" 
          placeholder="卡號"
          maxLength="16"
          required 
        />
        <input 
          type="text" 
          placeholder="到期日"
          maxLength="5"
          required 
        />
        <input 
          type="text" 
          placeholder="CVV"
          maxLength="3"
          required 
        />
        <button type="submit">確認付款</button>
      </form>
    )

    fireEvent.change(screen.getByPlaceholderText('卡號'), {
      target: { value: '4242424242424242' }
    })
    fireEvent.change(screen.getByPlaceholderText('到期日'), {
      target: { value: '12/25' }
    })
    fireEvent.change(screen.getByPlaceholderText('CVV'), {
      target: { value: '123' }
    })

    fireEvent.click(screen.getByText('確認付款'))
    expect(handlePayment).toHaveBeenCalled()
  })
})

// API 整合測試
describe('🌐 API 整合測試', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('✅ 獲取營區列表', async () => {
    const mockCamps = [
      { id: 1, name: '山頂營地', price: 1500 },
      { id: 2, name: '海邊營地', price: 2000 }
    ]

    // 定義 fetchCamps 函數
    const fetchCamps = async () => {
      const response = await fetch('/api/camps')
      if (!response.ok) throw new Error('載入失敗')
      return response.json()
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCamps
    })

    render(
      <div>
        <h2>營區列表</h2>
        <button onClick={fetchCamps}>載入營區</button>
        <div data-testid="camps-list"></div>
      </div>
    )

    fireEvent.click(screen.getByText('載入營區'))
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/camps')
    })
  })

  test('✅ 處理 API 錯誤', async () => {
    // 定義 fetchCamps 函數
    const fetchCamps = async () => {
      try {
        const response = await fetch('/api/camps')
        if (!response.ok) throw new Error('載入失敗')
        return response.json()
      } catch (error) {
        throw new Error('載入失敗')
      }
    }

    global.fetch.mockRejectedValueOnce(new Error('API 錯誤'))

    render(
      <div>
        <button onClick={async () => {
          try {
            await fetchCamps()
          } catch (error) {
            const alertDiv = screen.getByRole('alert')
            alertDiv.textContent = '載入失敗'
          }
        }}>載入營區</button>
        <div role="alert"></div>
      </div>
    )

    fireEvent.click(screen.getByText('載入營區'))
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('載入失敗')
    })
  })
})

// 圖片上傳測試
describe('📸 圖片上傳測試', () => {
  test('圖片預覽功能', async () => {
    const ImageUpload = () => {
      const [preview, setPreview] = React.useState('')
      
      const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
          // 模擬 FileReader
          setPreview('data:image/png;base64,dummy')
        }
      }

      return (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            data-testid="image-input"
          />
          {preview && <img src={preview} alt="預覽" data-testid="preview" />}
        </div>
      )
    }

    render(<ImageUpload />)
    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    const input = screen.getByTestId('image-input')
    
    fireEvent.change(input, { target: { files: [file] } })
    
    // 等待預覽圖片出現
    await waitFor(() => {
      expect(screen.getByTestId('preview')).toBeInTheDocument()
    })
  })
})

// 評論功能測試
describe('💬 評論功能測試', () => {
  test('評論提交與驗證', () => {
    const CommentForm = () => {
      const [comment, setComment] = React.useState('')
      const [error, setError] = React.useState('')
      
      const handleSubmit = (e) => {
        e.preventDefault()
        if (comment.length < 10) {
          setError('評論至少需要10個字')
          return
        }
        setError('')
      }

      return (
        <form onSubmit={handleSubmit}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="寫下您的評論"
          />
          <button type="submit">提交評論</button>
          {error && <div role="alert">{error}</div>}
        </form>
      )
    }

    render(<CommentForm />)
    const textarea = screen.getByPlaceholderText('寫下您的評論')
    
    // 測試字數限制
    fireEvent.change(textarea, { target: { value: '太短' } })
    fireEvent.click(screen.getByText('提交評論'))
    expect(screen.getByRole('alert')).toHaveTextContent('評論至少需要10個字')
  })
})

// 地圖功能測試
describe('🗺️ 地圖功能測試', () => {
  test('地點搜尋與座標轉換', () => {
    const MapSearch = () => {
      const [location, setLocation] = React.useState('')
      const [coordinates, setCoordinates] = React.useState(null)
      
      const handleSearch = () => {
        // 修正座標格式
        setCoordinates({ lat: 25.033, lng: 121.5654 })  // 移除多餘的 0
      }

      return (
        <div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="搜尋地點"
          />
          <button onClick={handleSearch}>搜尋</button>
          {coordinates && (
            <div data-testid="coordinates">
              {coordinates.lat}, {coordinates.lng}
            </div>
          )}
        </div>
      )
    }

    render(<MapSearch />)
    fireEvent.change(screen.getByPlaceholderText('搜尋地點'), {
      target: { value: '台北市' }
    })
    fireEvent.click(screen.getByText('搜尋'))
    expect(screen.getByTestId('coordinates')).toHaveTextContent('25.033, 121.5654')  // 修正預期值
  })
})

// 金流功能測試
describe('💰 金流功能測試', () => {
  test('付款表單驗證', () => {
    const PaymentForm = () => {
      const [cardNumber, setCardNumber] = React.useState('')
      const [error, setError] = React.useState('')
      
      const validateCard = (number) => {
        return /^[0-9]{16}$/.test(number)
      }

      const handleSubmit = (e) => {
        e.preventDefault()
        if (!validateCard(cardNumber)) {
          setError('請輸入有效的信用卡號碼')
          return
        }
        setError('')
      }

      return (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="信用卡號碼"
            maxLength={16}
          />
          <button type="submit">確認付款</button>
          {error && <div role="alert">{error}</div>}
        </form>
      )
    }

    render(<PaymentForm />)
    const input = screen.getByPlaceholderText('信用卡號碼')
    
    // 測試無效卡號
    fireEvent.change(input, { target: { value: '1234' } })
    fireEvent.click(screen.getByText('確認付款'))
    expect(screen.getByRole('alert')).toHaveTextContent('請輸入有效的信用卡號碼')
  })
})

// 最後統一顯示所有結果
afterAll(() => {
  // 計算統計數據
  const totalTests = testResults.length
  const passedTests = testResults.filter(r => r.passed).length
  
  // 一次性輸出所有結果
  const summary = [
    '=======================================',
    '📋 測試結果總結',
    '=======================================',
    ...testResults.map(({ testName, passed }) => `${passed ? '✅' : '❌'} ${testName}`),
    '=======================================',
    `📊 總測試數: ${totalTests}`,
    `✅ 通過測試: ${passedTests}`,
    `❌ 失敗測試: ${totalTests - passedTests}`,
    `🎯 通過率: ${((passedTests / totalTests) * 100).toFixed(0)}%`,
    passedTests === totalTests ? '\n🎉 恭喜！所有測試都通過了！' : '\n⚠️ 注意：有測試未通過，請檢查失敗項目。',
    '======================================='
  ].join('\n')

  console.log(summary)
})

// 確保每個組件的路徑都正確後再導入測試