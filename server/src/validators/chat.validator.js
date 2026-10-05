const { z } = require('zod');

const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(2000, 'Message content exceeds 2000 characters limit'),
  conversationId: z.string().optional().default('default'),
});

const clearChatSchema = z.object({
  conversationId: z.string().optional().default('default'),
});

module.exports = {
  sendMessageSchema,
  clearChatSchema,
};
