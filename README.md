# 露營探索家 Camp Explorer

這是一個使用 Next.js 建立的現代化露營預訂平台。

## 技術棧

### 前端
![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_18-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue)
![React Icons](https://img.shields.io/badge/React_Icons-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![SweetAlert2](https://img.shields.io/badge/SweetAlert2-FF3E00?style=for-the-badge&logo=javascript&logoColor=white)
![Next-Auth](https://img.shields.io/badge/NextAuth.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-%23EC5990.svg?style=for-the-badge&logo=reacthookform&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant%20Design-%230170FE.svg?style=for-the-badge&logo=ant-design&logoColor=white)

### 後端
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![Nodemailer](https://img.shields.io/badge/Nodemailer-339933?style=for-the-badge&logo=node.js&logoColor=white)

## 功能特點

### 用戶功能
- 👤 會員系統
  - 一般會員註冊/登入
  - 營地主註冊/登入
  - 第三方登入 (Google、LINE)
  - 忘記密碼功能
- 🏕️ 營地瀏覽
- 📱 響應式設計
- 💬 即時聊天室
- ❤️ 收藏功能
- 📝 評價系統
- 🎫 優惠券系統
- 📝 評價與評論
- 📅 預訂歷史查看

### 營主功能
- 📊 營地管理
- 📈 數據分析
- 🗓️ 預訂管理
- 💰 收益統計
- 📸 圖片管理

## 專案特色

### 前端特色
- 🚀 使用 App Router 實現快速導航
- 💅 整合 Bootstrap 5 與 Tailwind CSS
- 🔒 完整的身份驗證系統
- 📱 響應式設計
- 🔍 整合搜尋功能
- 🗺️ 整合地圖功能
- 📊 數據視覺化

### 後端特色
- 🔐 JWT 身份驗證
- 📨 電子郵件通知系統
- 💳 多元支付整合（LINE Pay、ECPay）
- 🔄 WebSocket 即時通訊
- 📁 檔案上傳處理
- 🗄️ 資料庫交易處理

## 開始使用

### 環境要求
![Node.js](https://img.shields.io/badge/Node.js_18+-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL_8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![NPM](https://img.shields.io/badge/NPM_9.0+-CB3837?style=for-the-badge&logo=npm&logoColor=white)

### 安裝步驟

1. 克隆專案
```bash
git clone https://github.com/your-username/camp-explorer.git
cd camp-explorer
```

2. 安裝依賴
```bash
npm install
```

3. 設定環境變數
```bash
cp .env.example .env.local
```

4. 啟動開發伺服器
```bash
# 同時啟動前端和後端服務
npm run dev
```

## 專案結構

```
camp-explorer/
├── src/
│   ├── app/              # 頁面路由
│   ├── components/       # React 組件
│   │   ├── auth/        # 認證相關組件
│   │   ├── common/      # 通用組件
│   │   └── layout/      # 布局組件
│   ├── lib/             # 工具函數
│   ├── styles/          # 樣式文件
│   └── utils/           # 通用工具
├── public/              # 靜態資源
└── server/             # 後端服務
```

## 開發團隊
- 前端開發：[開發者名稱]
- 後端開發：[開發者名稱]
- UI/UX 設計：[設計師名稱]

## 授權
此專案使用 MIT 授權。

