const checkInService = require('../services/checkIn.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Submit weekly fitness check-in & generate AI coach adaptation
 * @route   POST /api/check-ins
 * @access  Private
 */
const submitCheckIn = async (req, res, next) => {
  try {
    const checkIn = await checkInService.submitWeeklyCheckIn(req.user.id, req.body);
    return successResponse(
      res,
      { checkIn },
      'Weekly check-in submitted and AI coaching plan evaluated!',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get check-in history
 * @route   GET /api/check-ins
 * @access  Private
 */
const getHistory = async (req, res, next) => {
  try {
    const checkIns = await checkInService.getCheckInHistory(req.user.id);
    return successResponse(res, { checkIns }, 'Check-in history retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get most recent check-in
 * @route   GET /api/check-ins/latest
 * @access  Private
 */
const getLatest = async (req, res, next) => {
  try {
    const checkIn = await checkInService.getLatestCheckIn(req.user.id);
    return successResponse(res, { checkIn }, 'Latest check-in retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single check-in by ID
 * @route   GET /api/check-ins/:id
 * @access  Private
 */
const getCheckInById = async (req, res, next) => {
  try {
    const checkIn = await checkInService.getCheckInById(req.user.id, req.params.id);
    return successResponse(res, { checkIn }, 'Check-in retrieved', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitCheckIn,
  getHistory,
  getLatest,
  getCheckInById,
};
