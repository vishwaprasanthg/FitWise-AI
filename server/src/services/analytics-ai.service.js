const geminiService = require('./gemini.service');
const analyticsService = require('./analytics.service');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Generate Algorithmic Fallback Analytics Review
 */
const generateAlgorithmicInsights = (user, analytics) => {
  const { kpis, personalRecords, weightTrend, recoveryTrend } = analytics;
  const goal = user.profile?.primaryGoal?.replace('_', ' ') || 'strength & hypertrophy';

  const highlights = [];
  if (kpis.lifetimeVolumeKg > 0) {
    highlights.push(`Moved a cumulative ${kpis.lifetimeVolumeKg.toLocaleString()} kg across ${kpis.lifetimeWorkouts} logged sessions.`);
  }
  if (personalRecords.length > 0) {
    const topPR = personalRecords[0];
    highlights.push(`Established ${personalRecords.length} Personal Records, led by ${topPR.exerciseName} at ${topPR.maxWeightKg}kg (${topPR.estimated1RM}kg estimated 1RM).`);
  }
  if (recoveryTrend.length > 0) {
    const avgRec = Math.round(recoveryTrend.reduce((sum, r) => sum + r.recoveryScore, 0) / recoveryTrend.length);
    highlights.push(`Maintained an average recovery readiness score of ${avgRec}%.`);
  }

  return {
    periodTitle: 'Athlete Monthly Performance & Overload Review',
    overallGrade: kpis.lifetimeWorkouts >= 8 ? 'A+' : kpis.lifetimeWorkouts >= 4 ? 'A' : 'B+',
    consistencyScore: Math.min(100, (kpis.lifetimeWorkouts / 12) * 100),
    summary: `Athlete ${user.name} has demonstrated structured execution toward ${goal}. Training load density and mechanical volume are progressing according to overload targets.`,
    milestones: highlights,
    coachDirectives: [
      'Maintain progressive overload on primary compound movements (+2.5kg per 2 weeks).',
      'Ensure nightly sleep hygiene to keep recovery readiness above 75%.',
      'Hit daily protein targets consistently to optimize myofibrillar protein synthesis.',
    ],
  };
};

/**
 * Generate AI Progress Evaluation
 */
const generateAthleteInsights = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  const analytics = await analyticsService.getAthleteDashboardAnalytics(userId, '30d');

  const systemInstruction = `You are FitPilot AI, an elite sports scientist and strength & conditioning director.
Analyze the athlete's 30-day training analytics and synthesize a concise, motivating, structured performance evaluation.
Output valid JSON.`;

  const prompt = `Synthesize monthly performance review for:
- Athlete: ${user.name}
- Goal: ${user.profile?.primaryGoal}
- Workouts: ${analytics.kpis.lifetimeWorkouts} total (${analytics.kpis.rangeVolumeKg} kg in past 30 days)
- Top PRs: ${analytics.personalRecords.slice(0, 3).map((p) => `${p.exerciseName}: ${p.maxWeightKg}kg`).join(', ') || 'Building baseline'}
- Recovery Readiness: ${analytics.kpis.latestRecoveryScore}%

Return JSON with structure:
{
  "periodTitle": "Monthly Performance & Overload Review",
  "overallGrade": "A",
  "consistencyScore": 92,
  "summary": "Coaching summary paragraph...",
  "milestones": ["Milestone 1", "Milestone 2"],
  "coachDirectives": ["Directive 1", "Directive 2", "Directive 3"]
}`;

  try {
    const rawAi = await geminiService.generateStructuredJson(systemInstruction, prompt);
    if (rawAi && rawAi.summary) {
      return rawAi;
    }
  } catch (err) {
    logger.warn('Gemini analytics generation failed. Using algorithmic fallback.', err.message);
  }

  return generateAlgorithmicInsights(user, analytics);
};

module.exports = {
  generateAthleteInsights,
};
