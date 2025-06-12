const mysql = require('mysql2/promise');

console.log('=== 資料庫連線設定 ===');
console.log('當前環境:', process.env.NODE_ENV);

/**
 * 資料庫連線池配置
 * 使用連線池可以：
 * 1. 自動管理連線數量
 * 2. 提高效能
 * 3. 避免連線過多導致資料庫負擔
 * 4. 自動重新連線
 */
const pool = mysql.createPool({
  // Railway 變數名稱 || 本地開發變數名稱
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || process.env.DB_PORT,
  connectionLimit: 10,
  timezone: '+08:00',
  waitForConnections: true,
  queueLimit: 0,
  // 添加以下設定
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000,
  // acquireTimeout: 10000,
  // timeout: 10000,
  // 添加重連機制
  multipleStatements: true,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// 輸出當前資料庫設定（不包含敏感資訊）
console.log('[CONNECTION.JS] 資料庫設定:', {
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || process.env.DB_PORT,
  environment: process.env.NODE_ENV
});

/**
 * 測試資料庫連線
 */
pool.getConnection()
  .then((connection) => {
    console.log('✅ 資料庫連線成功');
    connection.release();
  })
  .catch((err) => {
    console.error('❌ 資料庫連線失敗:', err);
  });

module.exports = pool;
