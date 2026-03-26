// server/routes/users.js
const router = require('express').Router();
const db     = require('../db');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, async (_req, res) => {
  try {
    res.json(await db.q('SELECT id,username,name,role,created_at FROM users ORDER BY id'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Felhasználónév és jelszó kötelező' });
    const hash = bcrypt.hashSync(password, 10);
    const ok = await db.run(
      'INSERT INTO users (username,password,name,role) VALUES (?,?,?,?)',
      [username, hash, name||'', role||'editor']
    );
    res.json({ ok: true, id: ok.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Felhasználónév már foglalt' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, role, password } = req.body;
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      await db.run('UPDATE users SET name=?,role=?,password=? WHERE id=?', [name||'', role||'editor', hash, req.params.id]);
    } else {
      await db.run('UPDATE users SET name=?,role=? WHERE id=?', [name||'', role||'editor', req.params.id]);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.run('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
