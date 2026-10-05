const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: String,
      default: 'default',
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    metadata: {
      intent: { type: String, default: 'general' },
      referencedExercise: { type: String },
      referencedWorkoutPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan' },
      referencedMealPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'MealPlan' },
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.methods.toJSON = function () {
  const msg = this.toObject();
  delete msg.__v;
  return msg;
};

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
