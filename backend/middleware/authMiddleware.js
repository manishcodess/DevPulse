const jwt = require('jsonwebtoken');

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production' ? null : 'devpulse_dev_secret');

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in production. Exiting.');
  process.exit(1);
}

const verifyToken = (req, res, next) => {
  let token = req.cookies?.devpulse_token;
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader) token = authHeader.split(' ')[1];
  }

  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.userId = decoded.id;
    next();
  });
};

module.exports = {
  verifyToken,
  JWT_SECRET
};
