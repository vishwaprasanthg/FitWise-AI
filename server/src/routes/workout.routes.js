const express = require('express');
const {
  generate,
  getActive,
  getAllPlans,
  getPlanById,
  activatePlan,
  updateDayStatus,
  resetCycle,
  getExercises,
} = require('../controllers/workout.controller');
const {
  generateWorkoutRequestSchema,
  updateDayStatusRequestSchema,
} = require('../validators/workout.validator');
const { validate } = require('../validators/auth.validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public / Protected exercise catalog route
router.get('/exercises', getExercises);

// Protected routes
router.use(protect);

router.post('/generate', validate(generateWorkoutRequestSchema), generate);
router.get('/active', getActive);
router.patch('/active/day/:dayNumber/status', validate(updateDayStatusRequestSchema), updateDayStatus);
router.post('/active/reset-cycle', resetCycle);

router.get('/plans', getAllPlans);
router.get('/plans/:id', getPlanById);
router.patch('/plans/:id/active', activatePlan);
router.patch('/plans/:id/day/:dayNumber/status', validate(updateDayStatusRequestSchema), updateDayStatus);
router.post('/plans/:id/reset-cycle', resetCycle);

module.exports = router;
