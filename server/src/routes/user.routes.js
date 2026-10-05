const express = require('express');
const {
  getProfile,
  completeOnboarding,
  updateProfile,
  updatePreferences,
} = require('../controllers/user.controller');
const {
  onboardingSchema,
  profileUpdateSchema,
  preferencesUpdateSchema,
} = require('../validators/user.validator');
const { validate } = require('../validators/auth.validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All user routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.post('/onboarding', validate(onboardingSchema), completeOnboarding);
router.put('/profile', validate(profileUpdateSchema), updateProfile);
router.put('/preferences', validate(preferencesUpdateSchema), updatePreferences);

module.exports = router;
