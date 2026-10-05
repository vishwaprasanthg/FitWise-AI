const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const config = require('../config/env');

/**
 * Generate JWT Token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Cookie Options for Secure HttpOnly Cookies
 */
const getCookieOptions = () => {
  const isProduction = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};

/**
 * Register a new user
 */
const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('A user with this email already exists.');
    error.statusCode = 409;
    error.isOperational = true;
    throw error;
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const token = generateToken({ id: user._id, email: user.email });

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Login user
 */
const loginUser = async ({ email, password }) => {
  // Explicitly select password field since it is set to select: false
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.isOperational = true;
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.isOperational = true;
    throw error;
  }

  const token = generateToken({ id: user._id, email: user.email });

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Get User Profile by ID (Isolated query)
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
  return user.toJSON();
};

module.exports = {
  generateToken,
  getCookieOptions,
  registerUser,
  loginUser,
  getUserProfile,
};
