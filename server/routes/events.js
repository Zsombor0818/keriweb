// server/routes/events.js
const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    res.json(await db.q('SELECT * FROM events ORDER BY sort_order, id'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, date_label, description, sort_order } = req.body;
    const ok = await db.run(
      'INSERT INTO events (title,date_label,description,sort_order) VALUES (?,?,?,?)',
      [title, date_label||'', description||'', sort_order||99]
    );
    res.json({ ok: true, id: ok.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { title, date_label, description, sort_order } = req.body;
    await db.run(
      'UPDATE events SET title=?,date_label=?,description=?,sort_order=? WHERE id=?',
      [title, date_label||'', description||'', sort_order||99, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.run('DELETE FROM events WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
