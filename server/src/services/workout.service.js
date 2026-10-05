const User = require('../models/user.model');
const WorkoutPlan = require('../models/workoutPlan.model');
const workoutAiService = require('./workout-ai.service');
const exercisesCatalog = require('../data/exercises');

/**
 * Generate a new workout plan for user using their saved Profile stats
 */
const generateWorkoutPlan = async (userId, options = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  // Generate structured 7-day plan (automatically utilizing user.profile)
  const planData = await workoutAiService.generateWorkoutPlanAI(user, options);

  // Deactivate existing plans
  await WorkoutPlan.updateMany({ userId, isActive: true }, { isActive: false });

  // Save new active plan
  const newPlan = await WorkoutPlan.create({
    userId,
    ...planData,
    currentDayNumber: 1,
    isActive: true,
  });

  return newPlan.toJSON();
};

/**
 * Get active workout plan
 */
const getActiveWorkoutPlan = async (userId) => {
  const plan = await WorkoutPlan.findOne({ userId, isActive: true });
  return plan ? plan.toJSON() : null;
};

/**
 * Get all user workout plans
 */
const getAllWorkoutPlans = async (userId) => {
  const plans = await WorkoutPlan.find({ userId }).sort({ createdAt: -1 });
  return plans.map((p) => p.toJSON());
};

/**
 * Get single plan by ID
 */
const getWorkoutPlanById = async (userId, planId) => {
  const plan = await WorkoutPlan.findOne({ _id: planId, userId });
  if (!plan) {
    const error = new Error('Workout plan not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
  return plan.toJSON();
};

/**
 * Set an existing plan as active
 */
const setActivePlan = async (userId, planId) => {
  const plan = await WorkoutPlan.findOne({ _id: planId, userId });
  if (!plan) {
    const error = new Error('Workout plan not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  await WorkoutPlan.updateMany({ userId }, { isActive: false });
  plan.isActive = true;
  await plan.save();

  return plan.toJSON();
};

/**
 * Update Day Status (Done, Skip, Pending) and Advance 7-Day Progression
 */
const updateDayStatus = async (userId, planId, dayNumber, status) => {
  let query = { userId };
  if (!planId || planId === 'active') {
    query.isActive = true;
  } else {
    query._id = planId;
  }

  const plan = await WorkoutPlan.findOne(query);
  if (!plan) {
    const error = new Error('No workout plan found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  const targetDayNum = parseInt(dayNumber, 10);
  const targetDay = plan.schedule.find((d) => d.dayNumber === targetDayNum);
  if (!targetDay) {
    const error = new Error(`Day ${dayNumber} not found in workout plan`);
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  // Update day status
  targetDay.status = status;
  if (status === 'completed') {
    targetDay.completedAt = new Date();
  } else if (status === 'pending') {
    targetDay.completedAt = undefined;
  }

  // Find next pending day in progression
  const nextPendingDay = plan.schedule.find((d) => d.status === 'pending');
  if (nextPendingDay) {
    plan.currentDayNumber = nextPendingDay.dayNumber;
  } else {
    // If all days are completed or skipped, set to Day 7
    plan.currentDayNumber = 7;
  }

  await plan.save();
  return plan.toJSON();
};

/**
 * Reset 7-Day Cycle back to Day 1
 */
const resetCycle = async (userId, planId) => {
  let query = { userId };
  if (!planId || planId === 'active') {
    query.isActive = true;
  } else {
    query._id = planId;
  }

  const plan = await WorkoutPlan.findOne(query);
  if (!plan) {
    const error = new Error('No workout plan found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  plan.schedule.forEach((day) => {
    day.status = 'pending';
    day.completedAt = undefined;
  });
  plan.currentDayNumber = 1;

  await plan.save();
  return plan.toJSON();
};

/**
 * Search exercise repository
 */
const getExerciseCatalog = (filters = {}) => {
  let results = [...exercisesCatalog];

  if (filters.muscleGroup) {
    const mg = filters.muscleGroup.toLowerCase();
    results = results.filter((ex) => ex.targetMuscleGroup.toLowerCase() === mg);
  }

  if (filters.equipment) {
    const eq = filters.equipment.toLowerCase();
    results = results.filter((ex) => ex.equipment.some((e) => e.toLowerCase() === eq));
  }

  if (filters.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(
      (ex) =>
        ex.name.toLowerCase().includes(term) ||
        ex.targetMuscle.toLowerCase().includes(term) ||
        ex.targetMuscleGroup.toLowerCase().includes(term)
    );
  }

  return results;
};

module.exports = {
  generateWorkoutPlan,
  getActiveWorkoutPlan,
  getAllWorkoutPlans,
  getWorkoutPlanById,
  setActivePlan,
  updateDayStatus,
  resetCycle,
  getExerciseCatalog,
};
