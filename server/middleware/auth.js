const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Nincs bejelentkezve' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Érvénytelen token' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Nincs jogosultsága' });
    next();
  });
}

module.exports = { requireAuth, requireAdmin, JWT_SECRET };
