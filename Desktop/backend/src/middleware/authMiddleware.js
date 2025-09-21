const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // Try to get token from cookies first, then from Authorization header
  let token = req.cookies.token;
  
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
    console.log('Auth middleware - Token found in Authorization header');
  }

  console.log('Auth middleware - Cookies:', req.cookies);
  console.log('Auth middleware - Authorization header:', req.headers.authorization);
  console.log('Auth middleware - Token present:', !!token);
  
  if (!token) {
    console.log('Auth middleware - No token found in cookies or headers');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded successfully, user ID:', decoded.id);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      console.log('Auth middleware - User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }
    
    console.log('Auth middleware - User found:', req.user.email);
    next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
