const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const workoutRoutes = require('./workout.routes');
const workoutLogRoutes = require('./workoutLog.routes');
const checkInRoutes = require('./checkIn.routes');
const nutritionRoutes = require('./nutrition.routes');
const chatRoutes = require('./chat.routes');
const analyticsRoutes = require('./analytics.routes');

const router = express.Router();

// Mount sub-routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workouts', workoutRoutes);
router.use('/workout-logs', workoutLogRoutes);
router.use('/check-ins', checkInRoutes);
router.use('/nutrition', nutritionRoutes);
router.use('/chat', chatRoutes);
router.use('/analytics', analyticsRoutes);

// Root API info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to FitPilot AI API',
    documentation: '/api/health',
    version: '1.0.0',
  });
});

module.exports = router;
