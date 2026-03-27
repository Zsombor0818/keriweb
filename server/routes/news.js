const router = require("express").Router();
const db = require("../db");
const slugify = require("slugify");
const { requireAuth } = require("../middleware/auth");

router.get("/", async(req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const query = `
  SELECT * FROM news
  WHERE published=1
  ORDER BY created_at DESC
  LIMIT ${limit}
`;

        res.json(await db.q(query));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get("/by-slug/:slug", async(req, res) => {
    try {
        const row = await db.q1("SELECT * FROM news WHERE slug=? AND published=1", [
            req.params.slug,
        ]);
        if (!row) return res.status(404).json({ error: "Nem található" });
        res.json(row);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get("/admin/all", requireAuth, async(req, res) => {
    try {
        res.json(await db.q("SELECT * FROM news ORDER BY created_at DESC"));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post("/", requireAuth, async(req, res) => {
    try {
        const { title, excerpt, body, tag, published } = req.body;
        if (!title) return res.status(400).json({ error: "Cím kötelező" });

        let slug = slugify(title, { lower: true, strict: true, locale: "hu" });
        let base = slug,
            i = 1;
        while (await db.q1("SELECT id FROM news WHERE slug=?", [slug]))
            slug = `${base}-${i++}`;

        const ok = await db.run(
            "INSERT INTO news (slug,title,excerpt,body,tag,published) VALUES (?,?,?,?,?,?)", [
                slug,
                title,
                excerpt || "",
                body || "",
                tag || "",
                published === false || published === "0" ? 0 : 1,
            ],
        );
        res.json({ ok: true, id: ok.insertId, slug });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put("/:id", requireAuth, async(req, res) => {
    try {
        const { title, excerpt, body, tag, published } = req.body;
        await db.run(
            "UPDATE news SET title=?,excerpt=?,body=?,tag=?,published=? WHERE id=?", [
                title,
                excerpt || "",
                body || "",
                tag || "",
                published ? 1 : 0,
                req.params.id,
            ],
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete("/:id", requireAuth, async(req, res) => {
    try {
        await db.run("DELETE FROM news WHERE id=?", [req.params.id]);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;