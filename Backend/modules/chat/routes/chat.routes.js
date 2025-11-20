const express = require('express');
const { authenticate } = require('../../auth-rbac/middleware/auth.middleware');
const chatController = require('../controller/chat.controller');

const router = express.Router();

// Apply authentication to all chat routes
router.use(authenticate);

// Conversation routes
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.createConversation);
router.get('/conversations/:id', chatController.getConversation);
router.put('/conversations/:id', chatController.updateConversation);
router.delete('/conversations/:id', chatController.deleteConversation);

// Message routes
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);
router.put('/messages/:id', chatController.updateMessage);
router.delete('/messages/:id', chatController.deleteMessage);

// AI Chat routes
router.post('/ai/super-dev', chatController.chatWithSuperDev);
router.post('/ai/gemini', chatController.chatWithGemini);
router.post('/ai/auto', chatController.chatWithAuto);

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        module: 'chat',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;