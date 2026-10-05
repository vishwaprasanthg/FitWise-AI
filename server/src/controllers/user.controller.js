const userService = require('../services/user.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    return successResponse(res, { user }, 'User profile retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete initial onboarding fitness assessment
 * @route   POST /api/users/onboarding
 * @access  Private
 */
const completeOnboarding = async (req, res, next) => {
  try {
    const user = await userService.saveOnboarding(req.user.id, req.body);
    return successResponse(
      res,
      { user },
      'Onboarding completed! Your personalized AI coach is ready.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update basic user profile details
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    return successResponse(res, { user }, 'Profile updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update workout & nutrition preferences
 * @route   PUT /api/users/preferences
 * @access  Private
 */
const updatePreferences = async (req, res, next) => {
  try {
    const user = await userService.updateUserPreferences(req.user.id, req.body);
    return successResponse(res, { user }, 'Preferences updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  completeOnboarding,
  updateProfile,
  updatePreferences,
};
