const jwt = require('jsonwebtoken');
const User = require('../models/User');

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let payload;
  try {
    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret) {
      const error = new Error('AUTH_TOKEN_SECRET is required');
      error.status = 500;
      return next(error);
    }

    payload = jwt.verify(token, secret);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }

  User.findById(payload.sub)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired authentication token' });
      }

      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
      return next();
    })
    .catch(next);
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
