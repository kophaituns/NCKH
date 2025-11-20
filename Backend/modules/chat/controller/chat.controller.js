const chatService = require('../service/chat.service');
const logger = require('../../../src/utils/logger');
const { validationResult } = require('express-validator');

class ChatController {
    // Conversation management
    async getConversations(req, res) {
        try {
            const { page = 1, limit = 20, status = 'active' } = req.query;
            const userId = req.user.id;

            const result = await chatService.getConversations(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                status
            });

            res.json({
                success: true,
                data: result.conversations,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error getting conversations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversations',
                error: error.message
            });
        }
    }

    async createConversation(req, res) {
        try {
            const { title } = req.body;
            const userId = req.user.id;

            const conversation = await chatService.createConversation(userId, title);

            res.status(201).json({
                success: true,
                data: conversation
            });
        } catch (error) {
            logger.error('Error creating conversation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create conversation',
                error: error.message
            });
        }
    }

    async getConversation(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const conversation = await chatService.getConversation(id, userId);

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            res.json({
                success: true,
                data: conversation
            });
        } catch (error) {
            logger.error('Error getting conversation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get conversation',
                error: error.message
            });
        }
    }

    async updateConversation(req, res) {
        try {
            const { id } = req.params;
            const { title, status } = req.body;
            const userId = req.user.id;

            const conversation = await chatService.updateConversation(id, userId, {
                title,
                status
            });

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            res.json({
                success: true,
                data: conversation
            });
        } catch (error) {
            logger.error('Error updating conversation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update conversation',
                error: error.message
            });
        }
    }

    async deleteConversation(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const success = await chatService.deleteConversation(id, userId);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }

            res.json({
                success: true,
                message: 'Conversation deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting conversation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete conversation',
                error: error.message
            });
        }
    }

    // Message management
    async getMessages(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const userId = req.user.id;

            const result = await chatService.getMessages(id, userId, {
                page: parseInt(page),
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: result.messages,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error getting messages:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get messages',
                error: error.message
            });
        }
    }

    async sendMessage(req, res) {
        try {
            const { id } = req.params; // conversation_id
            const { message, api_provider = 'auto' } = req.body;
            const userId = req.user.id;

            if (!message || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Message cannot be empty'
                });
            }

            const result = await chatService.sendMessage(id, userId, message, api_provider);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error sending message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send message',
                error: error.message
            });
        }
    }

    async updateMessage(req, res) {
        try {
            const { id } = req.params;
            const { message } = req.body;
            const userId = req.user.id;

            const updatedMessage = await chatService.updateMessage(id, userId, message);

            if (!updatedMessage) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            res.json({
                success: true,
                data: updatedMessage
            });
        } catch (error) {
            logger.error('Error updating message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update message',
                error: error.message
            });
        }
    }

    async deleteMessage(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const success = await chatService.deleteMessage(id, userId);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            res.json({
                success: true,
                message: 'Message deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting message:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete message',
                error: error.message
            });
        }
    }

    // AI Chat endpoints
    async chatWithSuperDev(req, res) {
        try {
            const { message, conversation_id } = req.body;
            const userId = req.user.id;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            const result = await chatService.chatWithAI(
                conversation_id, 
                userId, 
                message, 
                'super_dev'
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error with Super Dev chat:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process chat with Super Dev',
                error: error.message
            });
        }
    }

    async chatWithGemini(req, res) {
        try {
            const { message, conversation_id } = req.body;
            const userId = req.user.id;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            const result = await chatService.chatWithAI(
                conversation_id, 
                userId, 
                message, 
                'gemini'
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error with Gemini chat:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process chat with Gemini',
                error: error.message
            });
        }
    }

    async chatWithAuto(req, res) {
        try {
            const { message, conversation_id } = req.body;
            const userId = req.user.id;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            const result = await chatService.chatWithAI(
                conversation_id, 
                userId, 
                message, 
                'auto'
            );

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error with auto chat:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process chat',
                error: error.message
            });
        }
    }
}

module.exports = new ChatController();