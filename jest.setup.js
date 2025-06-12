// 引入測試需要的擴充
import '@testing-library/jest-dom'

// 設置全域的 Socket.IO 測試環境
beforeAll(() => {
  // 模擬 window.io
  global.io = require('socket.io-client')
})

afterAll(() => {
  // 清理 Socket.IO 相關資源
  delete global.io
})

// 增加超時時間，避免 Socket.IO 測試超時
jest.setTimeout(10000)

// 如果需要，可以模擬 console.log 等方法
// global.console = {
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
// } 