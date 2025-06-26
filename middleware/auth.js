// ==== middleware/auth.js ====
const jwt = require('jsonwebtoken');
const verifyToken = (req, res, next) => {
//   const token = req.headers['authorization'];
      const authHeader = req.headers['authorization']; // Declare this first
      if (!authHeader) return res.status(403).send('Token required from auth header');
    const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : authHeader;
  if (!token) return res.status(403).send('Token required from token');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).send('Invalid token');
  }
};
const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).send('Access denied');
  }
  next();
};
module.exports = { verifyToken, checkRole };