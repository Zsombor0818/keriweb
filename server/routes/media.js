const router = require('express').Router();
const db     = require('../db');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { requireAuth } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', requireAuth, async (_req, res) => {
  try {
    res.json(await db.q('SELECT * FROM media ORDER BY uploaded_at DESC'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nincs feltöltött fájl' });
    const ok = await db.run(
      'INSERT INTO media (filename,original_name,mimetype,size) VALUES (?,?,?,?)',
      [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size]
    );
    res.json({ ok: true, id: ok.insertId, filename: req.file.filename, url: `/uploads/${req.file.filename}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const media = await db.q1('SELECT * FROM media WHERE id=?', [req.params.id]);
    if (!media) return res.status(404).json({ error: 'Nem található' });
    const filePath = path.join(UPLOAD_DIR, media.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await db.run('DELETE FROM media WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
