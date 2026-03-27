const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    const rows = await db.q('SELECT `key`, value FROM settings');
    const obj  = {};
    rows.forEach(r => (obj[r.key] = r.value));
    res.json(obj);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [k, v] of entries)
      await db.run('INSERT INTO settings (`key`,value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=?', [k, v, v]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
