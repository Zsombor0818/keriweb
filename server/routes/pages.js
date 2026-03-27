// server/routes/pages.js
const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    res.json(await db.q('SELECT id, slug, title, updated_at FROM pages ORDER BY slug'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:slug', async (req, res) => {
  try {
    const row = await db.q1('SELECT * FROM pages WHERE slug=?', [req.params.slug]);
    if (!row) return res.status(404).json({ error: 'Nem található' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:slug', requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const existing = await db.q1('SELECT id FROM pages WHERE slug=?', [req.params.slug]);
    if (existing) {
      await db.run('UPDATE pages SET title=?,content=? WHERE slug=?', [title, content||'', req.params.slug]);
    } else {
      await db.run('INSERT INTO pages (slug,title,content) VALUES (?,?,?)', [req.params.slug, title, content||'']);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
