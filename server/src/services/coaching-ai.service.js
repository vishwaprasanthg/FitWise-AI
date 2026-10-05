const geminiService = require('./gemini.service');
const WorkoutPlan = require('../models/workoutPlan.model');
const logger = require('../utils/logger');

/**
 * Calculate Recovery Score (0 - 100)
 */
const calculateRecoveryScore = (energyRating, sorenessLevel, adherenceScore) => {
  // Energy: 1-5 -> 8 to 40 pts
  const energyPts = (energyRating || 3) * 8;
  // Soreness: 1 (fresh) to 5 (sore) -> (6 - soreness) * 8 -> 8 to 40 pts
  const freshnessPts = (6 - Math.min(5, Math.max(1, sorenessLevel || 3))) * 8;
  // Adherence: 1-5 -> 4 to 20 pts
  const adherencePts = (adherenceScore || 3) * 4;

  const total = Math.min(100, Math.max(0, energyPts + freshnessPts + adherencePts));
  return Math.round(total);
};

/**
 * Get Recovery Grade
 */
const getRecoveryGrade = (score) => {
  if (score >= 75) return 'Optimal';
  if (score >= 50) return 'Moderate Fatigue';
  return 'High Fatigue';
};

/**
 * Generate AI Coaching Feedback using Gemini or Algorithmic Rule Engine
 */
const generateCoachingAnalysis = async (user, activePlan, recentLogs, checkInData, recoveryScore) => {
  const recoveryGrade = getRecoveryGrade(recoveryScore);
  const totalVolumeLastWeek = recentLogs.reduce((acc, l) => acc + (l.totalVolumeKg || 0), 0);
  const workoutsCompletedCount = recentLogs.length;

  const systemInstruction = `You are FitPilot AI, a master sports scientist and strength coach.
Your task is to analyze the athlete's weekly check-in, recent workout volume, and recovery state, then provide concise, actionable coaching guidance.
Output MUST be valid JSON adhering exactly to the required JSON schema.`;

  const prompt = `Analyze this weekly fitness check-in:
- Athlete Name: ${user.name}
- Goal: ${user.profile?.primaryGoal || 'muscle_gain'}
- Active Routine: ${activePlan ? activePlan.title : 'None'}
- Workouts Completed in Past 7 Days: ${workoutsCompletedCount}
- Total Volume Lifted: ${totalVolumeLastWeek} kg
- Recovery Score: ${recoveryScore}/100 (${recoveryGrade})
- Energy Level: ${checkInData.energyRating}/5
- Soreness Level: ${checkInData.sorenessLevel}/5
- Adherence Score: ${checkInData.adherenceScore}/5
- Athlete Feedback: "${checkInData.userFeedback || 'Training felt good this week.'}"

Return JSON matching this exact structure:
{
  "analysisSummary": "2-3 concise sentences analyzing their training stimulus, recovery status, and fatigue management.",
  "recommendedAction": "progressive_overload" (Options: "progressive_overload", "increase_volume", "maintain", "deload", "adjust_exercises"),
  "progressionNotes": "Actionable cue for next week (e.g. increase weight by 2-5% on primary compound lifts, prioritize 8 hours of sleep).",
  "planAdjustmentsSummary": "Summary of plan modifications applied for the upcoming week."
}`;

  let rawAnalysis = await geminiService.generateStructuredJson(systemInstruction, prompt);

  if (rawAnalysis && rawAnalysis.analysisSummary && rawAnalysis.recommendedAction) {
    logger.info(`Gemini AI successfully generated weekly coaching feedback for ${user.name}`);
    return {
      analysisSummary: rawAnalysis.analysisSummary,
      recommendedAction: rawAnalysis.recommendedAction,
      progressionNotes: rawAnalysis.progressionNotes || 'Focus on smooth eccentrics and progressive overload.',
      planAdjustmentsSummary: rawAnalysis.planAdjustmentsSummary || 'Workout intensity targets updated.',
      recoveryGrade,
    };
  }

  // Fallback Algorithmic Coaching Engine
  logger.info('Using algorithmic fallback coaching engine.');
  let recommendedAction = 'progressive_overload';
  let analysisSummary = `You logged ${workoutsCompletedCount} sessions moving ${totalVolumeLastWeek}kg of volume with an optimal recovery score of ${recoveryScore}%. Your muscular readiness is prime for progressive overload.`;
  let progressionNotes = 'Increase working loads by 2.5kg to 5kg on your primary compound lifts while maintaining strict form.';
  let planAdjustmentsSummary = 'Target loads incremented across compound foundations.';

  if (recoveryScore < 50 || checkInData.sorenessLevel >= 5) {
    recommendedAction = 'deload';
    analysisSummary = `Your recovery score is ${recoveryScore}% (${recoveryGrade}) with heightened muscle soreness (${checkInData.sorenessLevel}/5). Accumulation fatigue is high.`;
    progressionNotes = 'Implement an active recovery deload: reduce working volume by 1 set per exercise and maintain RPE at 6-7.';
    planAdjustmentsSummary = 'Session volume moderated to facilitate central nervous system recovery.';
  } else if (recoveryScore < 70 || checkInData.adherenceScore < 3) {
    recommendedAction = 'maintain';
    analysisSummary = `Steady weekly adherence with moderate recovery score (${recoveryScore}%). Volume is well matched to current capacity.`;
    progressionNotes = 'Maintain current working weights, focusing on perfecting repetition tempo and maximizing time under tension.';
    planAdjustmentsSummary = 'Target sets and reps maintained with emphasis on technical execution.';
  }

  return {
    analysisSummary,
    recommendedAction,
    progressionNotes,
    planAdjustmentsSummary,
    recoveryGrade,
  };
};

/**
 * Adapt active WorkoutPlan in database
 */
const adaptActiveWorkoutPlan = async (workoutPlanId, recommendedAction) => {
  if (!workoutPlanId) return false;

  const plan = await WorkoutPlan.findById(workoutPlanId);
  if (!plan) return false;

  if (recommendedAction === 'progressive_overload' || recommendedAction === 'increase_intensity') {
    plan.summary = `${plan.summary} [Updated: Overload progression applied +2.5kg target]`;
    // Update weight recommendation and RPE on exercises
    plan.schedule.forEach((day) => {
      day.exercises.forEach((ex) => {
        ex.weightRecommendation = 'Increase load +2.5kg if previous target was met';
        ex.rpeTarget = Math.min(10, (ex.rpeTarget || 8) + 0.5);
      });
    });
  } else if (recommendedAction === 'deload') {
    plan.summary = `${plan.summary} [Deload Week: Reduced volume for full systemic recovery]`;
    plan.schedule.forEach((day) => {
      day.exercises.forEach((ex) => {
        ex.sets = Math.max(2, ex.sets - 1);
        ex.rpeTarget = Math.max(6, (ex.rpeTarget || 8) - 1.5);
        ex.weightRecommendation = 'Light-Moderate (RPE 6.5) - Deload Phase';
      });
    });
  } else if (recommendedAction === 'increase_volume') {
    plan.summary = `${plan.summary} [Updated: Volume boosted +1 work set on primary lifts]`;
    plan.schedule.forEach((day) => {
      day.exercises.forEach((ex, idx) => {
        if (idx === 0) ex.sets = Math.min(5, ex.sets + 1);
      });
    });
  }

  await plan.save();
  return true;
};

module.exports = {
  calculateRecoveryScore,
  getRecoveryGrade,
  generateCoachingAnalysis,
  adaptActiveWorkoutPlan,
};
