const mongoose = require('mongoose');
const WorkoutLog = require('../models/workoutLog.model');

/**
 * Log a completed workout session
 */
const createWorkoutLog = async (userId, logData) => {
  // Calculate total volume and sets completed
  let totalVolumeKg = 0;
  let totalSetsCompleted = 0;

  if (logData.exercises && Array.isArray(logData.exercises)) {
    logData.exercises.forEach((ex) => {
      if (ex.sets && Array.isArray(ex.sets)) {
        ex.sets.forEach((s) => {
          if (s.completed) {
            totalSetsCompleted += 1;
            totalVolumeKg += (s.actualReps || 0) * (s.weightKg || 0);
          }
        });
      }
    });
  }

  const newLog = await WorkoutLog.create({
    userId,
    ...logData,
    totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    totalSetsCompleted,
    startTime: logData.startTime ? new Date(logData.startTime) : new Date(),
    endTime: logData.endTime ? new Date(logData.endTime) : new Date(),
  });

  return newLog.toJSON();
};

/**
 * Get all workout logs for user
 */
const getWorkoutLogs = async (userId, options = {}) => {
  const limit = parseInt(options.limit) || 20;
  const page = parseInt(options.page) || 1;
  const skip = (page - 1) * limit;

  const logs = await WorkoutLog.find({ userId })
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(limit);

  const total = await WorkoutLog.countDocuments({ userId });

  return {
    logs: logs.map((l) => l.toJSON()),
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Get single workout log by ID
 */
const getWorkoutLogById = async (userId, logId) => {
  const log = await WorkoutLog.findOne({ _id: logId, userId });
  if (!log) {
    const error = new Error('Workout log not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
  return log.toJSON();
};

/**
 * Compute aggregate workout statistics for user
 */
const getWorkoutSummaryStats = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const stats = await WorkoutLog.aggregate([
    { $match: { userId: userObjectId } },
    {
      $group: {
        _id: null,
        totalWorkouts: { $sum: 1 },
        totalVolumeKg: { $sum: '$totalVolumeKg' },
        totalSets: { $sum: '$totalSetsCompleted' },
        avgDurationMinutes: { $avg: '$durationMinutes' },
        lastWorkoutDate: { $max: '$startTime' },
      },
    },
  ]);

  if (!stats.length) {
    return {
      totalWorkouts: 0,
      totalVolumeKg: 0,
      totalSets: 0,
      avgDurationMinutes: 0,
      lastWorkoutDate: null,
    };
  }

  const result = stats[0];
  return {
    totalWorkouts: result.totalWorkouts || 0,
    totalVolumeKg: Math.round(result.totalVolumeKg || 0),
    totalSets: result.totalSets || 0,
    avgDurationMinutes: Math.round((result.avgDurationMinutes || 0) * 10) / 10,
    lastWorkoutDate: result.lastWorkoutDate || null,
  };
};

/**
 * Delete workout log by ID
 */
const deleteWorkoutLog = async (userId, logId) => {
  const log = await WorkoutLog.findOneAndDelete({ _id: logId, userId });
  if (!log) {
    const error = new Error('Workout log not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
  return { success: true, message: 'Workout log deleted successfully' };
};

module.exports = {
  createWorkoutLog,
  getWorkoutLogs,
  getWorkoutLogById,
  getWorkoutSummaryStats,
  deleteWorkoutLog,
};
