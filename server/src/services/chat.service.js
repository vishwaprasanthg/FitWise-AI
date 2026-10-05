const User = require('../models/user.model');
const WorkoutPlan = require('../models/workoutPlan.model');
const WorkoutLog = require('../models/workoutLog.model');
const CheckIn = require('../models/checkIn.model');
const MealPlan = require('../models/mealPlan.model');
const ChatMessage = require('../models/chatMessage.model');
const { calculateTDEEAndMacros } = require('../utils/nutrition-calculator');
const chatAiService = require('./chat-ai.service');

/**
 * Send a message to Coach Pulse and receive intelligent AI response
 */
const sendMessage = async (userId, content, conversationId = 'default') => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  // 1. Gather rich athlete context in parallel
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [activePlan, recentLogs, latestCheckIn, activeMealPlan] = await Promise.all([
    WorkoutPlan.findOne({ userId, isActive: true }),
    WorkoutLog.find({ userId, startTime: { $gte: sevenDaysAgo } }).sort({ startTime: -1 }),
    CheckIn.findOne({ userId }).sort({ checkInDate: -1 }),
    MealPlan.findOne({ userId, isActive: true }),
  ]);

  const targets = calculateTDEEAndMacros(user);

  const context = {
    user,
    activePlan,
    recentLogs,
    latestCheckIn,
    activeMealPlan,
    targets,
  };

  // 2. Fetch past conversation history
  const history = await ChatMessage.find({ userId, conversationId })
    .sort({ createdAt: 1 })
    .limit(20);

  // 3. Save User message to DB
  const userMsg = await ChatMessage.create({
    userId,
    conversationId,
    role: 'user',
    content,
  });

  // 4. Generate Coach Response
  const coachReplyText = await chatAiService.generateCoachResponse(content, history, context);

  // 5. Save Assistant response to DB
  const assistantMsg = await ChatMessage.create({
    userId,
    conversationId,
    role: 'assistant',
    content: coachReplyText,
  });

  return {
    userMessage: userMsg.toJSON(),
    assistantMessage: assistantMsg.toJSON(),
    contextSummary: {
      goal: user.profile?.primaryGoal,
      recoveryScore: latestCheckIn?.recoveryScore || 85,
      activeProgram: activePlan?.title || null,
      targetCalories: targets.targetDailyCalories,
    },
  };
};

/**
 * Retrieve chat history for conversation
 */
const getChatHistory = async (userId, conversationId = 'default') => {
  const messages = await ChatMessage.find({ userId, conversationId }).sort({ createdAt: 1 });
  return messages.map((m) => m.toJSON());
};

/**
 * Clear chat history for conversation
 */
const clearChatHistory = async (userId, conversationId = 'default') => {
  await ChatMessage.deleteMany({ userId, conversationId });
  return { success: true, message: 'Chat history cleared successfully' };
};

module.exports = {
  sendMessage,
  getChatHistory,
  clearChatHistory,
};
