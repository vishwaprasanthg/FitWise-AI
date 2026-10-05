const express = require('express');
const { register, login, logout, getMe } = require('../controllers/auth.controller');
const { registerSchema, loginSchema, validate } = require('../validators/auth.validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
