const mongoose = require('mongoose');

const aiCoachFeedbackSchema = new mongoose.Schema(
  {
    analysisSummary: { type: String, required: true },
    recommendedAction: {
      type: String,
      enum: ['increase_volume', 'maintain', 'deload', 'adjust_exercises', 'increase_intensity', 'progressive_overload'],
      default: 'progressive_overload',
    },
    progressionNotes: { type: String },
    planAdjustmentsSummary: { type: String },
    recoveryGrade: { type: String, default: 'Optimal' }, // Optimal, Moderate, High Fatigue
  },
  { _id: false }
);

const checkInSchema = new mongoose.Schema(
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
    checkInDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    currentWeight: {
      type: Number,
    },
    adherenceScore: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    energyRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    sorenessLevel: {
      type: Number,
      min: 1,
      max: 5,
      required: true, // 1 = Fresh, 5 = Severely sore
    },
    recoveryScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    userFeedback: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    aiCoachFeedback: aiCoachFeedbackSchema,
    isPlanUpdated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

checkInSchema.methods.toJSON = function () {
  const checkIn = this.toObject();
  delete checkIn.__v;
  return checkIn;
};

const CheckIn = mongoose.model('CheckIn', checkInSchema);

module.exports = CheckIn;
