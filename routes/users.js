const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', requireAuth, (req, res) => {
  return res.status(200).json({ user: req.user });
});

module.exports = router;
