// server/db.js  –  MySQL2 connection pool (promise interface)
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "dev.zsombordev.hu",
  port: parseInt(process.env.DB_PORT || "41563"),
  user: process.env.DB_USER || "keri_user",
  password: process.env.DB_PASS || "keri_pass",
  database: process.env.DB_NAME || "keri_cms",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+00:00",
  charset: "utf8mb4",
});

// Helpers
pool.q = (sql, params) => pool.execute(sql, params).then(([rows]) => rows);
pool.q1 = (sql, params) => pool.q(sql, params).then((rows) => rows[0] ?? null);
pool.run = (sql, params) => pool.execute(sql, params).then(([ok]) => ok);

module.exports = pool;
