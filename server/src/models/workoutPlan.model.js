const mongoose = require('mongoose');

const workoutExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: String },
    name: { type: String, required: true },
    targetMuscle: { type: String },
    equipment: { type: String },
    sets: { type: Number, default: 3 },
    reps: { type: String, default: '8-12 reps' },
    restSeconds: { type: Number, default: 60 },
    rpeTarget: { type: Number, min: 1, max: 10, default: 8 },
    weightRecommendation: { type: String, default: 'Moderate' },
    instructions: [{ type: String }],
    tips: { type: String },
  },
  { _id: true }
);

const workoutDaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true, min: 1, max: 7 },
    dayName: { type: String, required: true },
    isRestDay: { type: Boolean, default: false },
    targetMuscles: [{ type: String }],
    estimatedDuration: { type: Number, default: 45 }, // in minutes
    exercises: [workoutExerciseSchema],
    status: {
      type: String,
      enum: ['pending', 'completed', 'skipped'],
      default: 'pending',
    },
    completedAt: { type: Date },
  },
  { _id: true }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the workout plan'],
      trim: true,
    },
    goal: {
      type: String,
      enum: ['muscle_gain', 'weight_loss', 'strength', 'endurance', 'general_fitness', 'maintenance'],
      required: true,
    },
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    daysPerWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    targetDurationMinutes: {
      type: Number,
      default: 45,
    },
    currentDayNumber: {
      type: Number,
      default: 1,
      min: 1,
      max: 7,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    summary: {
      type: String,
      default: 'Personalized AI workout routine tailored to your fitness baseline and target goals.',
    },
    schedule: [workoutDaySchema],
    aiMetadata: {
      model: { type: String, default: 'gemini-1.5-flash' },
      generatedAt: { type: Date, default: Date.now },
      customInstructions: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to get clean JSON
workoutPlanSchema.methods.toJSON = function () {
  const plan = this.toObject();
  delete plan.__v;
  return plan;
};

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);

module.exports = WorkoutPlan;
