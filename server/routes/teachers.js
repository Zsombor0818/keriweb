// server/routes/teachers.js
const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/', async (_req, res) => {
  try {
    res.json(await db.q('SELECT * FROM teachers ORDER BY is_leadership DESC, sort_order, name'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, subjects, qualification, is_leadership, role, initials, sort_order } = req.body;
    const ok = await db.run(
      'INSERT INTO teachers (name,subjects,qualification,is_leadership,role,initials,sort_order) VALUES (?,?,?,?,?,?,?)',
      [name, subjects||'', qualification||'', is_leadership?1:0, role||'', initials||'', sort_order||99]
    );
    res.json({ ok: true, id: ok.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, subjects, qualification, is_leadership, role, initials, sort_order } = req.body;
    await db.run(
      'UPDATE teachers SET name=?,subjects=?,qualification=?,is_leadership=?,role=?,initials=?,sort_order=? WHERE id=?',
      [name, subjects||'', qualification||'', is_leadership?1:0, role||'', initials||'', sort_order||99, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.run('DELETE FROM teachers WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
