const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Don't hash password here - let the User model's pre-save middleware handle it
    const user = await User.create({
      email,
      password, // Raw password - will be hashed by the model
    });

    if (user) {
      const token = generateToken(user._id);
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      res.status(201).json({
        id: user._id,
        email: user.email,
        token: token, // Also send token in response body for debugging
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt for email:', email);

  try {
    const user = await User.findOne({ email });
    console.log('User found:', !!user);

    if (user && (await user.comparePassword(password))) {
      console.log('Password comparison successful');
      const token = generateToken(user._id);
      console.log('Generated token for user:', user._id);
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      
      console.log('Cookie set successfully');
      res.json({
        id: user._id,
        email: user.email,
        token: token, // Also send token in response body for debugging
      });
    } else {
      console.log('Password comparison failed or user not found');
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.log('Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    // Get user from token in cookie if available
    const token = req.cookies.token;
    if (!token) {
      return res.status(200).json({ message: 'No user session' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(200).json({ message: 'No user found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(200).json({ message: 'Invalid session' });
  }
};

const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out' });
};

module.exports = {
  signup,
  login,
  getMe,
  logout,
};
