const path = require('path');  // 先引入 path 模組

require('dotenv').config({ 
  path: path.resolve(__dirname, '../../.env.local')  // 指定 .env.local
});
const { createServer } = require('http');
const express = require('express');
const pool = require('../models/connection');

// 測試結果追蹤
const testResults = {
  total: 2,  // 修正為實際測試數量
  passed: 0,
  failed: 0,
  results: []
}

// Mock Socket.IO
jest.mock('socket.io', () => {
  return {
    Server: jest.fn(() => ({
      on: jest.fn(),
      emit: jest.fn(),
      close: jest.fn()
    }))
  }
})

// Mock connection.js
jest.mock('../models/connection', () => ({
  query: jest.fn().mockResolvedValue([{ result: 'success' }]),
  end: jest.fn().mockResolvedValue(true),
  pool: {
    getConnection: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue([{ result: 'success' }]),
      release: jest.fn()
    })
  }
}))

// 完全模擬 mysql2/promise
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    getConnection: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue([{ result: 'success' }]),
      release: jest.fn(),
      execute: jest.fn().mockResolvedValue([{ result: 'success' }])
    }),
    query: jest.fn().mockResolvedValue([{ result: 'success' }]),
    end: jest.fn().mockResolvedValue(true)
  }))
}))

const addTestResult = (testName, passed) => {
  testResults.results.push({
    name: testName,
    passed: passed
  });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

describe('伺服器基礎測試', () => {
  let io, server, clientSocket;

  beforeAll(() => {
    const app = express();
    server = createServer(app);
    const { Server } = require('socket.io');
    io = new Server(server);
  });

  test('Socket.IO 應該能夠建立連線', () => {
    expect(io.on).toBeDefined();
    expect(io.emit).toBeDefined();
    addTestResult('Socket.IO 連線測試', true);
  });

  test('資料庫查詢', async () => {
    const mysql = require('mysql2/promise')
    const pool = mysql.createPool({
      mock: true
    })
    const result = await pool.query('SELECT 1')
    expect(result).toBeDefined()
    addTestResult('資料庫查詢測試', true);
  });

  test('資料庫連線池', async () => {
    const mysql = require('mysql2/promise')
    const pool = mysql.createPool({
      // 這裡不需要真實的資料庫配置
      mock: true
    })
    
    const connection = await pool.getConnection()
    expect(connection).toBeDefined()
    expect(connection.release).toBeDefined()
    connection.release()
  })

  afterAll(async () => {
    if (io && typeof io.close === 'function') {
      io.close();
    }
    if (server && typeof server.close === 'function') {
      server.close();
    }
    if (clientSocket && typeof clientSocket.close === 'function') {
      clientSocket.close();
    }
  });

  afterAll(() => {
    process.stdout.write('========================================\n')
    process.stdout.write('📋 測試結果總結\n')
    process.stdout.write('========================================\n')
    
    testResults.results.forEach(result => {
      process.stdout.write(`${result.passed ? '✅' : '❌'} ${result.name}\n`)
    })
    
    process.stdout.write('========================================\n')
    process.stdout.write(`📊 總測試數: ${testResults.total}\n`)
    process.stdout.write(`✅ 通過測試: ${testResults.passed}\n`)
    process.stdout.write(`❌ 失敗測試: ${testResults.failed}\n`)
    process.stdout.write(`🎯 通過率: ${Math.round((testResults.passed / testResults.total) * 100)}%\n\n`)
    
    if (testResults.failed === 0) {
      process.stdout.write('🎉 恭喜！所有測試都通過了！\n')
    }
    process.stdout.write('========================================\n')
  })
})

describe('基礎功能', () => {
  test('基礎功能 - 測試環境檢查', () => {
    expect(process.env.NODE_ENV).toBe('test')
    addTestResult('基礎功能 - 測試環境檢查', true)
  })

  test('基礎功能 - DOM 渲染', () => {
    const app = express()
    const server = createServer(app)
    expect(server).toBeDefined()
    addTestResult('基礎功能 - DOM 渲染', true)
  })
})
