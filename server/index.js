const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/healthcheck", async(_req, res) => {
    try {
        const db = require("./db");
        await db.q("SELECT 1");
        res.json({
            ok: true,
            db: "connected",
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            node: process.version,
            uptime: Math.floor(process.uptime()) + "s",
        });
    } catch (e) {
        res.status(500).json({
            ok: false,
            db: "ERROR",
            error: e.message,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            hint: "Ellenőrizd a .env fájl DB_* értékeit és hogy fut-e a MySQL!",
        });
    }
});

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

app.use((err, _req, res, _next) => {
    console.error("Szerver hiba:", err.message);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, async() => {});