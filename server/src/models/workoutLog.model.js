const mongoose = require('mongoose');

const loggedSetSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    targetReps: { type: String },
    actualReps: { type: Number, required: true, min: 0 },
    weightKg: { type: Number, required: true, min: 0 },
    rpe: { type: Number, min: 1, max: 10, default: 8 },
    completed: { type: Boolean, default: true },
  },
  { _id: true }
);

const loggedExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: String },
    name: { type: String, required: true },
    targetMuscle: { type: String },
    equipment: { type: String },
    sets: [loggedSetSchema],
  },
  { _id: true }
);

const workoutLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workoutPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutPlan',
      index: true,
    },
    workoutDayName: {
      type: String,
      required: [true, 'Workout name or day title is required'],
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    exercises: [loggedExerciseSchema],
    totalVolumeKg: {
      type: Number,
      default: 0,
    },
    totalSetsCompleted: {
      type: Number,
      default: 0,
    },
    feelingRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4, // 1: Exhausted, 2: Tough, 3: Normal, 4: Great, 5: Crushed it
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to get clean JSON
workoutLogSchema.methods.toJSON = function () {
  const log = this.toObject();
  delete log.__v;
  return log;
};

const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

module.exports = WorkoutLog;
