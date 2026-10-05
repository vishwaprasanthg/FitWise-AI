const chatService = require('../services/chat.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Send message to Coach Pulse & get context-aware response
 * @route   POST /api/chat
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const data = await chatService.sendMessage(
      req.user.id,
      req.body.content,
      req.body.conversationId
    );
    return successResponse(res, data, 'Coach Pulse response generated', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get chat message history
 * @route   GET /api/chat
 * @access  Private
 */
const getHistory = async (req, res, next) => {
  try {
    const messages = await chatService.getChatHistory(req.user.id, req.query.conversationId);
    return successResponse(res, { messages }, 'Chat history retrieved', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear chat message history
 * @route   DELETE /api/chat
 * @access  Private
 */
const clearHistory = async (req, res, next) => {
  try {
    const result = await chatService.clearChatHistory(req.user.id, req.query.conversationId);
    return successResponse(res, result, 'Chat history cleared', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getHistory,
  clearHistory,
};
