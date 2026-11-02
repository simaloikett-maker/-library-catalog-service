const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};
const cookieMaxAge = 60 * 60 * 1000;

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

function validateCredentials({ username, email, password }, registering = false) {
  if (registering && (typeof username !== 'string' || username.trim().length < 2)) {
    return 'username must be at least 2 characters';
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'a valid email is required';
  }
  if (typeof password !== 'string' || password.length < 8) {
    return 'password must be at least 8 characters';
  }
  return null;
}

function issueTokenCookie(user, res, next) {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) {
    const error = new Error('AUTH_TOKEN_SECRET is required');
    error.status = 500;
    return next(error);
  }

  const token = jwt.sign({}, secret, { subject: user.id, expiresIn: '1h' });
  res.cookie('authToken', token, { ...cookieOptions, maxAge: cookieMaxAge });
  return res.status(200).json({ user: publicUser(user) });
}

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    const validationError = validateCredentials({ username, email, password }, true);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'patron',
    });
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error && error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'username or email';
      return res.status(409).json({ error: `${field} already exists` });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const validationError = validateCredentials({ email, password });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return issueTokenCookie(user, res, next);
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('authToken', cookieOptions);
  return res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
