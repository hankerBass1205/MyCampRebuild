const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Next.js 前端地址
    methods: ['GET', 'POST'],
  },
});

// 儲存使用者資訊
const users = new Map(); // key: socket.id, value: { username, status }

io.on('connection', (socket) => {
  console.log('新使用者連線:', socket.id);

  // 使用者加入聊天室
  socket.on('join', (username) => {
    users.set(socket.id, { username, status: '在線' });
    io.emit('userList', Array.from(users.entries())); // 廣播使用者清單
  });

  // 使用者發送訊息
  socket.on('sendMessage', (message) => {
    const user = users.get(socket.id);
    if (!user) {
      // 如果 user 不存在，記錄錯誤並返回
      console.log(`錯誤：未找到 socket.id ${socket.id} 的使用者`);
      return;
    }
    io.emit('message', {
      username: user.username,
      text: message,
      timestamp: new Date(),
    });
  });

  // 使用者狀態更新
  socket.on('updateStatus', (status) => {
    const user = users.get(socket.id);
    if (user) {
      user.status = status;
      io.emit('userList', Array.from(users.entries())); // 更新使用者清單
    }
  });

  // 使用者斷線
  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('userList', Array.from(users.entries())); // 更新使用者清單
  });
});

server.listen(4000, () => {
  console.log('Socket.IO 伺服器運行於端口 4000');
});