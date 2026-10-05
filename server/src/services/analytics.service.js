const User = require('../models/user.model');
const WorkoutLog = require('../models/workoutLog.model');
const CheckIn = require('../models/checkIn.model');
const FoodLog = require('../models/foodLog.model');
const WorkoutPlan = require('../models/workoutPlan.model');
const { calculateTDEEAndMacros } = require('../utils/nutrition-calculator');

/**
 * Calculate estimated 1RM using Epley formula: weight * (1 + reps / 30)
 */
const calculate1RM = (weightKg, reps) => {
  if (!weightKg || !reps) return 0;
  if (reps === 1) return Math.round(weightKg);
  return Math.round(weightKg * (1 + reps / 30));
};

/**
 * Get Athlete Dashboard Analytics
 */
const getAthleteDashboardAnalytics = async (userId, timeRange = '30d') => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  // Determine date boundary
  let startDate = new Date(0); // all time
  const now = new Date();
  if (timeRange === '7d') {
    startDate = new Date();
    startDate.setDate(now.getDate() - 7);
  } else if (timeRange === '30d') {
    startDate = new Date();
    startDate.setDate(now.getDate() - 30);
  } else if (timeRange === '90d') {
    startDate = new Date();
    startDate.setDate(now.getDate() - 90);
  }

  // Fetch data in parallel
  const [allLogs, rangeLogs, checkIns, foodLogs] = await Promise.all([
    WorkoutLog.find({ userId }).sort({ startTime: 1 }),
    WorkoutLog.find({ userId, startTime: { $gte: startDate } }).sort({ startTime: 1 }),
    CheckIn.find({ userId }).sort({ checkInDate: 1 }),
    FoodLog.find({ userId, date: { $gte: startDate } }).sort({ date: 1 }),
  ]);

  // 1. Lifetime KPIs
  const lifetimeWorkouts = allLogs.length;
  const lifetimeVolumeKg = allLogs.reduce((sum, log) => sum + (log.totalVolumeKg || 0), 0);
  const lifetimeDurationMinutes = allLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

  // Range KPIs
  const rangeWorkouts = rangeLogs.length;
  const rangeVolumeKg = rangeLogs.reduce((sum, log) => sum + (log.totalVolumeKg || 0), 0);
  const avgDurationMinutes = rangeWorkouts > 0 ? Math.round(rangeLogs.reduce((sum, l) => sum + l.durationMinutes, 0) / rangeWorkouts) : 0;
  const avgFeelingRating = rangeWorkouts > 0 ? (rangeLogs.reduce((sum, l) => sum + l.feelingRating, 0) / rangeWorkouts).toFixed(1) : '5.0';

  // 2. Volume Progression Time-Series
  const volumeTimeSeries = rangeLogs.map((log) => ({
    logId: log._id,
    date: log.startTime.toISOString().split('T')[0],
    workoutName: log.workoutDayName,
    volumeKg: log.totalVolumeKg || 0,
    durationMinutes: log.durationMinutes || 0,
    feelingRating: log.feelingRating || 5,
    setCount: log.exercises.reduce((count, ex) => count + (ex.sets?.length || 0), 0),
  }));

  // 3. Extract All-Time Personal Records (PRs)
  const prMap = {};
  allLogs.forEach((log) => {
    (log.exercises || []).forEach((ex) => {
      const exName = ex.name?.trim();
      if (!exName) return;

      (ex.sets || []).forEach((set) => {
        if (!set.completed || !set.weightKg || !set.actualReps) return;

        const weight = set.weightKg;
        const reps = set.actualReps;
        const e1RM = calculate1RM(weight, reps);

        if (!prMap[exName] || e1RM > prMap[exName].estimated1RM) {
          prMap[exName] = {
            exerciseName: exName,
            maxWeightKg: weight,
            repsAtMax: reps,
            estimated1RM: e1RM,
            achievedAt: log.startTime,
            workoutName: log.workoutDayName,
          };
        }
      });
    });
  });

  const personalRecords = Object.values(prMap).sort((a, b) => b.estimated1RM - a.estimated1RM);

  // 4. Bodyweight & Recovery Readiness Trends
  const weightTrend = [];
  // Initial baseline point
  if (user.profile?.weight) {
    weightTrend.push({
      date: user.createdAt.toISOString().split('T')[0],
      weightKg: user.profile.weight,
      source: 'Initial Assessment',
    });
  }
  checkIns.forEach((c) => {
    if (c.currentWeight) {
      weightTrend.push({
        date: c.checkInDate.toISOString().split('T')[0],
        weightKg: c.currentWeight,
        source: 'Weekly Check-in',
      });
    }
  });

  const recoveryTrend = checkIns.map((c) => ({
    date: c.checkInDate.toISOString().split('T')[0],
    recoveryScore: c.recoveryScore,
    recoveryGrade: c.aiCoachFeedback?.recoveryGrade || 'Optimal',
    energyRating: c.energyRating,
    sorenessLevel: c.sorenessLevel,
    recommendedAction: c.aiCoachFeedback?.recommendedAction || 'Maintain',
  }));

  // 5. Nutrition & Macro Adherence
  const targets = calculateTDEEAndMacros(user);
  let totalLoggedCalories = 0;
  let totalLoggedProtein = 0;
  const daysLogged = new Set(foodLogs.map((f) => f.date.toISOString().split('T')[0])).size;

  foodLogs.forEach((f) => {
    totalLoggedCalories += f.calories || 0;
    totalLoggedProtein += f.protein || 0;
  });

  const avgDailyCalories = daysLogged > 0 ? Math.round(totalLoggedCalories / daysLogged) : 0;
  const avgDailyProtein = daysLogged > 0 ? Math.round(totalLoggedProtein / daysLogged) : 0;

  return {
    timeRange,
    kpis: {
      lifetimeWorkouts,
      lifetimeVolumeKg,
      lifetimeHours: (lifetimeDurationMinutes / 60).toFixed(1),
      rangeWorkouts,
      rangeVolumeKg,
      avgDurationMinutes,
      avgFeelingRating: parseFloat(avgFeelingRating),
      latestRecoveryScore: checkIns.length > 0 ? checkIns[checkIns.length - 1].recoveryScore : 85,
    },
    volumeTimeSeries,
    personalRecords,
    weightTrend,
    recoveryTrend,
    nutritionSummary: {
      daysLogged,
      avgDailyCalories,
      targetDailyCalories: targets.targetDailyCalories,
      avgDailyProtein,
      targetDailyProtein: targets.targetMacros?.proteinGrams,
      adherenceRatePercent: targets.targetDailyCalories > 0 && avgDailyCalories > 0 ? Math.min(100, Math.round((avgDailyCalories / targets.targetDailyCalories) * 100)) : 0,
    },
  };
};

/**
 * Get all Personal Records specifically
 */
const getPersonalRecords = async (userId) => {
  const analytics = await getAthleteDashboardAnalytics(userId, 'all');
  return analytics.personalRecords;
};

module.exports = {
  getAthleteDashboardAnalytics,
  getPersonalRecords,
  calculate1RM,
};
