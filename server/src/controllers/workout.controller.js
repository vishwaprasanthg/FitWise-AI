const workoutService = require('../services/workout.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Generate personalized AI workout plan using saved Profile stats
 * @route   POST /api/workouts/generate
 * @access  Private
 */
const generate = async (req, res, next) => {
  try {
    const plan = await workoutService.generateWorkoutPlan(req.user.id, req.body);
    return successResponse(
      res,
      { plan },
      '7-Day workout plan generated and activated successfully!',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently active workout plan
 * @route   GET /api/workouts/active
 * @access  Private
 */
const getActive = async (req, res, next) => {
  try {
    const plan = await workoutService.getActiveWorkoutPlan(req.user.id);
    return successResponse(res, { plan }, 'Active workout plan retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all workout plans for user
 * @route   GET /api/workouts/plans
 * @access  Private
 */
const getAllPlans = async (req, res, next) => {
  try {
    const plans = await workoutService.getAllWorkoutPlans(req.user.id);
    return successResponse(res, { plans }, 'User workout plans retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific workout plan by ID
 * @route   GET /api/workouts/plans/:id
 * @access  Private
 */
const getPlanById = async (req, res, next) => {
  try {
    const plan = await workoutService.getWorkoutPlanById(req.user.id, req.params.id);
    return successResponse(res, { plan }, 'Workout plan retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set a specific plan as active
 * @route   PATCH /api/workouts/plans/:id/active
 * @access  Private
 */
const activatePlan = async (req, res, next) => {
  try {
    const plan = await workoutService.setActivePlan(req.user.id, req.params.id);
    return successResponse(res, { plan }, 'Workout plan activated successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update day status (completed, skipped, pending) on active or specific plan
 * @route   PATCH /api/workouts/active/day/:dayNumber/status
 * @route   PATCH /api/workouts/plans/:id/day/:dayNumber/status
 * @access  Private
 */
const updateDayStatus = async (req, res, next) => {
  try {
    const planId = req.params.id || 'active';
    const plan = await workoutService.updateDayStatus(
      req.user.id,
      planId,
      req.params.dayNumber,
      req.body.status
    );
    return successResponse(
      res,
      { plan },
      `Day ${req.params.dayNumber} marked as ${req.body.status}`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset 7-day progression cycle back to Day 1
 * @route   POST /api/workouts/active/reset-cycle
 * @route   POST /api/workouts/plans/:id/reset-cycle
 * @access  Private
 */
const resetCycle = async (req, res, next) => {
  try {
    const planId = req.params.id || 'active';
    const plan = await workoutService.resetCycle(req.user.id, planId);
    return successResponse(
      res,
      { plan },
      '7-Day workout cycle reset to Day 1 successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search and browse curated exercise repository
 * @route   GET /api/workouts/exercises
 * @access  Public / Private
 */
const getExercises = (req, res) => {
  const exercises = workoutService.getExerciseCatalog(req.query);
  return successResponse(res, { exercises, total: exercises.length }, 'Exercises retrieved', 200);
};

module.exports = {
  generate,
  getActive,
  getAllPlans,
  getPlanById,
  activatePlan,
  updateDayStatus,
  resetCycle,
  getExercises,
};
