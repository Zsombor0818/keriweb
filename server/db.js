const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+00:00",
  charset: "utf8mb4",
});

pool.q = (sql, params) => pool.execute(sql, params).then(([rows]) => rows);
pool.q1 = (sql, params) => pool.q(sql, params).then((rows) => rows[0] ?? null);
pool.run = (sql, params) => pool.execute(sql, params).then(([ok]) => ok);

module.exports = pool;
