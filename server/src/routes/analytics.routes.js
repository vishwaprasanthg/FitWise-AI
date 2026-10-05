const express = require('express');
const {
  getDashboard,
  getPRs,
  getInsights,
} = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/personal-records', getPRs);
router.get('/insights', getInsights);

module.exports = router;
