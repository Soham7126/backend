const express = require('express');
const {
  signup,
  login,
  getMe,
  logout,
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', getMe);  // Removed protect middleware
router.post('/logout', logout);

// Debug route to check user data
router.get('/debug/users', async (req, res) => {
  const User = require('../models/User');
  try {
    const users = await User.find({}).select('email createdAt');
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
