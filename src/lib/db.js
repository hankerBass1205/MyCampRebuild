import mysql from 'mysql2/promise';

// 建立資料庫連接池
const db = mysql.createPool({
  // Railway 變數名稱 || 本地開發變數名稱
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  
  // 連接池設定
  waitForConnections: true,
  connectionLimit: 10,  // 固定值即可
  queueLimit: 0,
  
  // 時區設定
  timezone: '+08:00',  // 固定值即可
  
  // 連接保持設定
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// 添加錯誤處理
db.on('error', (err) => {
  console.error('資料庫連接池錯誤:', err);
});

// 測試資料庫連接
const testConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ 資料庫連接成功');
    connection.release();
  } catch (error) {
    console.error('❌ 資料庫連接失敗:', error);
    throw error;
  }
};

// 啟動時測試連接
testConnection();

// 導出資料庫連接池供其他模組使用
export default db;