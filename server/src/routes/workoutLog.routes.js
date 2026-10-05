const express = require('express');
const {
  createLog,
  getLogs,
  getStats,
  getLogById,
  deleteLog,
} = require('../controllers/workoutLog.controller');
const { createWorkoutLogSchema } = require('../validators/workoutLog.validator');
const { validate } = require('../validators/auth.validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', validate(createWorkoutLogSchema), createLog);
router.get('/', getLogs);
router.get('/stats', getStats);
router.get('/:id', getLogById);
router.delete('/:id', deleteLog);

module.exports = router;
