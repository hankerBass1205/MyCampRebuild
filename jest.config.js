const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // 指向 Next.js 應用程式的路徑
  dir: './',
})

// Jest 自定義配置
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // 處理模組別名
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
  },
  testEnvironmentOptions: {
    // 添加 Socket.IO 測試所需的配置
    testURL: 'http://localhost',
  },
  // 分別設置不同環境的測試
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
      }
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/server/**/__tests__/**/*.js'],
    }
  ]
}

// createJestConfig 會將 Next.js 配置和自定義配置合併
module.exports = createJestConfig(customJestConfig) 