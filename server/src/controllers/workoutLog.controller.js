const workoutLogService = require('../services/workoutLog.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Record a completed workout session
 * @route   POST /api/workout-logs
 * @access  Private
 */
const createLog = async (req, res, next) => {
  try {
    const log = await workoutLogService.createWorkoutLog(req.user.id, req.body);
    return successResponse(res, { log }, 'Workout logged successfully!', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user workout history
 * @route   GET /api/workout-logs
 * @access  Private
 */
const getLogs = async (req, res, next) => {
  try {
    const result = await workoutLogService.getWorkoutLogs(req.user.id, req.query);
    return successResponse(res, result, 'Workout history retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregate workout summary stats
 * @route   GET /api/workout-logs/stats
 * @access  Private
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await workoutLogService.getWorkoutSummaryStats(req.user.id);
    return successResponse(res, { stats }, 'Workout statistics retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific workout session log
 * @route   GET /api/workout-logs/:id
 * @access  Private
 */
const getLogById = async (req, res, next) => {
  try {
    const log = await workoutLogService.getWorkoutLogById(req.user.id, req.params.id);
    return successResponse(res, { log }, 'Workout log retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a workout session log
 * @route   DELETE /api/workout-logs/:id
 * @access  Private
 */
const deleteLog = async (req, res, next) => {
  try {
    const result = await workoutLogService.deleteWorkoutLog(req.user.id, req.params.id);
    return successResponse(res, result, 'Workout log deleted', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLog,
  getLogs,
  getStats,
  getLogById,
  deleteLog,
};
