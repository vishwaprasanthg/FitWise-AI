const express = require('express');
const {
  submitCheckIn,
  getHistory,
  getLatest,
  getCheckInById,
} = require('../controllers/checkIn.controller');
const { submitCheckInSchema } = require('../validators/checkIn.validator');
const { validate } = require('../validators/auth.validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', validate(submitCheckInSchema), submitCheckIn);
router.get('/', getHistory);
router.get('/latest', getLatest);
router.get('/:id', getCheckInById);

module.exports = router;
