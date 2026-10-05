const User = require('../models/user.model');
const WorkoutPlan = require('../models/workoutPlan.model');
const WorkoutLog = require('../models/workoutLog.model');
const CheckIn = require('../models/checkIn.model');
const coachingAiService = require('./coaching-ai.service');

/**
 * Submit weekly check-in & trigger AI Coaching Loop
 */
const submitWeeklyCheckIn = async (userId, checkInData) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  // 1. Fetch active workout plan
  const activePlan = await WorkoutPlan.findOne({ userId, isActive: true });

  // 2. Fetch logged workouts in the past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentLogs = await WorkoutLog.find({
    userId,
    startTime: { $gte: sevenDaysAgo },
  }).sort({ startTime: -1 });

  // 3. Compute recovery score
  const recoveryScore = coachingAiService.calculateRecoveryScore(
    checkInData.energyRating,
    checkInData.sorenessLevel,
    checkInData.adherenceScore
  );

  // 4. Generate AI Coach Analysis
  const aiCoachFeedback = await coachingAiService.generateCoachingAnalysis(
    user,
    activePlan,
    recentLogs,
    checkInData,
    recoveryScore
  );

  // 5. Update user profile weight if updated
  if (checkInData.currentWeight) {
    if (!user.profile) user.profile = {};
    user.profile.weight = checkInData.currentWeight;
    await user.save();
  }

  // 6. Auto-apply adaptations to active workout plan if enabled
  let isPlanUpdated = false;
  if (checkInData.autoApplyAdjustments !== false && activePlan) {
    isPlanUpdated = await coachingAiService.adaptActiveWorkoutPlan(
      activePlan._id,
      aiCoachFeedback.recommendedAction
    );
  }

  // 7. Save Check-in
  const newCheckIn = await CheckIn.create({
    userId,
    workoutPlanId: activePlan ? activePlan._id : undefined,
    currentWeight: checkInData.currentWeight || user.profile?.weight,
    adherenceScore: checkInData.adherenceScore,
    energyRating: checkInData.energyRating,
    sorenessLevel: checkInData.sorenessLevel,
    recoveryScore,
    userFeedback: checkInData.userFeedback || '',
    aiCoachFeedback,
    isPlanUpdated,
    checkInDate: new Date(),
  });

  return newCheckIn.toJSON();
};

/**
 * Get all check-ins for user
 */
const getCheckInHistory = async (userId) => {
  const checkIns = await CheckIn.find({ userId }).sort({ checkInDate: -1 });
  return checkIns.map((c) => c.toJSON());
};

/**
 * Get most recent check-in for user
 */
const getLatestCheckIn = async (userId) => {
  const checkIn = await CheckIn.findOne({ userId }).sort({ checkInDate: -1 });
  return checkIn ? checkIn.toJSON() : null;
};

/**
 * Get single check-in by ID
 */
const getCheckInById = async (userId, checkInId) => {
  const checkIn = await CheckIn.findOne({ _id: checkInId, userId });
  if (!checkIn) {
    const error = new Error('Check-in record not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
  return checkIn.toJSON();
};

module.exports = {
  submitWeeklyCheckIn,
  getCheckInHistory,
  getLatestCheckIn,
  getCheckInById,
};
