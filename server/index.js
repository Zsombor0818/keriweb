// server/index.js
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 26052;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/news", require("./routes/news"));
app.use("/api/pages", require("./routes/pages"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/teachers", require("./routes/teachers"));
app.use("/api/events", require("./routes/events"));
app.use("/api/media", require("./routes/media"));
app.use("/api/users", require("./routes/users"));

app.get("/admin", (_req, res) =>
  res.sendFile(path.join(__dirname, "../public/admin.html")),
);
app.get("/admin/*", (_req, res) =>
  res.sendFile(path.join(__dirname, "../public/admin.html")),
);
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html")),
);

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  🚀  Keri CMS  →  http://localhost:${PORT}  ║`);
  console.log(`║  📋  Admin     →  /admin               ║`);
  console.log(`║  🔑  Belépés   →  admin / admin123     ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});
