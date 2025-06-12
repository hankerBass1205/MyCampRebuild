const path = require('path');
require('dotenv').config({ 
  path: process.env.NODE_ENV === 'development' 
    ? path.resolve(process.cwd(), '.env.local')
    : path.resolve(process.cwd(), '.env.production')
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const next = require('next');
const initializeWebSocket = require('./websocket');
const db = require('./models/connection');

// 新增 Next.js 初始化
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const app = express();

// CORS 配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://camping-platform-production.up.railway.app',
        process.env.NEXT_PUBLIC_FRONTEND_URL,
      ]
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));

const server = http.createServer(app);

// Socket.IO 設定
const io = new Server(server, {
  cors: corsOptions,
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  allowEIO3: true,
  maxHttpBufferSize: 1e8, // 100 MB
  perMessageDeflate: {
    threshold: 32768
  }
});

// 添加連接日誌
io.on('connection', (socket) => {
  console.log('新的 Socket 連接:', socket.id);
  console.log('用戶類型:', socket.handshake.query.userType);
  console.log('用戶 ID:', socket.handshake.query.userId);
});

// 初始化 WebSocket
initializeWebSocket(io, db);

// 修改啟動流程
const startServer = async () => {
  try {
    // 只在生產環境準備 Next.js
    if (process.env.NODE_ENV === 'production') {
      await nextApp.prepare();
      // 處理所有 Next.js 請求
      app.all('*', (req, res) => {
        return handle(req, res);
      });
    }

    const port = process.env.PORT || 3002;

    server.listen(port, () => {
      console.log(`伺服器運行在端口 ${port}`);
      console.log(`環境：${process.env.NODE_ENV}`);
      console.log(`前端 URL：${process.env.NEXT_PUBLIC_FRONTEND_URL}`);
    });

  } catch (error) {
    console.error('伺服器啟動錯誤:', error);
    process.exit(1);
  }
};

startServer();

// 錯誤處理
io.on('connect_error', (error) => {
  console.error('Socket.IO 連接錯誤:', error);
});

io.on('connect_timeout', (timeout) => {
  console.error('Socket.IO 連接超時:', timeout);
});

process.on('unhandledRejection', (error) => {
  console.error('未處理的 Promise 拒絕:', error);
});

process.on('uncaughtException', (error) => {
  console.error('未捕獲的異常:', error);
}); 