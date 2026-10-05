const analyticsService = require('../services/analytics.service');
const analyticsAiService = require('../services/analytics-ai.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Get athlete dashboard analytics (KPIs, volume time-series, PRs, weight & recovery trends)
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
const getDashboard = async (req, res, next) => {
  try {
    const data = await analyticsService.getAthleteDashboardAnalytics(
      req.user.id,
      req.query.timeRange || '30d'
    );
    return successResponse(res, data, 'Athlete analytics retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get personal records (PRs) and estimated 1RMs
 * @route   GET /api/analytics/personal-records
 * @access  Private
 */
const getPRs = async (req, res, next) => {
  try {
    const personalRecords = await analyticsService.getPersonalRecords(req.user.id);
    return successResponse(res, { personalRecords }, 'Personal records retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get AI progress evaluation and coaching directives
 * @route   GET /api/analytics/insights
 * @access  Private
 */
const getInsights = async (req, res, next) => {
  try {
    const insights = await analyticsAiService.generateAthleteInsights(req.user.id);
    return successResponse(res, { insights }, 'Athlete insights generated', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getPRs,
  getInsights,
};
