const express = require('express');
const {
  sendMessage,
  getHistory,
  clearHistory,
} = require('../controllers/chat.controller');
const { sendMessageSchema, clearChatSchema } = require('../validators/chat.validator');
const { validate } = require('../validators/auth.validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', validate(sendMessageSchema), sendMessage);
router.get('/', getHistory);
router.delete('/', clearHistory);

module.exports = router;
