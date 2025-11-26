const axios = require('axios');
const { ChatConversation, ChatMessage, User } = require('../../../src/models');
const logger = require('../../../src/utils/logger');
const { Op } = require('sequelize');

class ChatService {
    constructor() {
        this.superDevApiKey = process.env.SUPER_DEV_API_KEY || 'ae948cd99dc0254d6a33cb38d00112d7a04963a4';
        this.geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyAi1bfxyJ59znqHOrVDVV5kzdf5AmtaL3I';
        this.defaultProvider = process.env.CHAT_DEFAULT_PROVIDER || 'auto';
        
        // API endpoints
        this.superDevApiUrl = 'https://api.superdev.ai/v1/chat';
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    }

    // Conversation management
    async getConversations(userId, options = {}) {
        try {
            const { page = 1, limit = 20, status = 'active' } = options;
            const offset = (page - 1) * limit;

            const where = {
                user_id: userId,
                status: status
            };

            const { count, rows } = await ChatConversation.findAndCountAll({
                where,
                include: [{
                    model: ChatMessage,
                    as: 'messages',
                    limit: 1,
                    order: [['created_at', 'DESC']],
                    attributes: ['id', 'message', 'sender_type', 'created_at']
                }],
                order: [['last_message_at', 'DESC'], ['created_at', 'DESC']],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);

            return {
                conversations: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            logger.error('Error getting conversations:', error);
            throw error;
        }
    }

    async createConversation(userId, title = 'New Chat') {
        try {
            const conversation = await ChatConversation.create({
                user_id: userId,
                title,
                status: 'active'
            });

            return conversation;
        } catch (error) {
            logger.error('Error creating conversation:', error);
            throw error;
        }
    }

    async getConversation(conversationId, userId) {
        try {
            const conversation = await ChatConversation.findOne({
                where: {
                    id: conversationId,
                    user_id: userId
                },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name']
                }]
            });

            return conversation;
        } catch (error) {
            logger.error('Error getting conversation:', error);
            throw error;
        }
    }

    async updateConversation(conversationId, userId, updates) {
        try {
            const [updatedRows] = await ChatConversation.update(updates, {
                where: {
                    id: conversationId,
                    user_id: userId
                }
            });

            if (updatedRows === 0) {
                return null;
            }

            return await this.getConversation(conversationId, userId);
        } catch (error) {
            logger.error('Error updating conversation:', error);
            throw error;
        }
    }

    async deleteConversation(conversationId, userId) {
        try {
            const deletedRows = await ChatConversation.destroy({
                where: {
                    id: conversationId,
                    user_id: userId
                }
            });

            return deletedRows > 0;
        } catch (error) {
            logger.error('Error deleting conversation:', error);
            throw error;
        }
    }

    // Message management
    async getMessages(conversationId, userId, options = {}) {
        try {
            const { page = 1, limit = 50 } = options;
            const offset = (page - 1) * limit;

            // Verify user owns this conversation
            const conversation = await this.getConversation(conversationId, userId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            const { count, rows } = await ChatMessage.findAndCountAll({
                where: {
                    conversation_id: conversationId
                },
                order: [['created_at', 'ASC']],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);

            return {
                messages: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            logger.error('Error getting messages:', error);
            throw error;
        }
    }

    async sendMessage(conversationId, userId, message, apiProvider = 'auto') {
        try {
            // Verify conversation exists and user owns it
            const conversation = await this.getConversation(conversationId, userId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            // Save user message first
            const userMessage = await ChatMessage.create({
                conversation_id: conversationId,
                sender_type: 'user',
                message: message.trim(),
                status: 'sent'
            });

            // Update conversation last message time
            await ChatConversation.update({
                last_message_at: new Date()
            }, {
                where: { id: conversationId }
            });

            // Get AI response
            const aiResponse = await this.chatWithAI(conversationId, userId, message, apiProvider);

            return {
                userMessage,
                aiResponse
            };
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    async updateMessage(messageId, userId, newMessage) {
        try {
            // Verify user owns the conversation containing this message
            const message = await ChatMessage.findOne({
                where: { id: messageId },
                include: [{
                    model: ChatConversation,
                    as: 'conversation',
                    where: { user_id: userId }
                }]
            });

            if (!message) {
                return null;
            }

            // Only allow updating user messages
            if (message.sender_type !== 'user') {
                throw new Error('Cannot update AI messages');
            }

            await message.update({
                message: newMessage.trim(),
                updated_at: new Date()
            });

            return message;
        } catch (error) {
            logger.error('Error updating message:', error);
            throw error;
        }
    }

    async deleteMessage(messageId, userId) {
        try {
            const deletedRows = await ChatMessage.destroy({
                where: { id: messageId },
                include: [{
                    model: ChatConversation,
                    as: 'conversation',
                    where: { user_id: userId }
                }]
            });

            return deletedRows > 0;
        } catch (error) {
            logger.error('Error deleting message:', error);
            throw error;
        }
    }

    // AI Chat integration
    async chatWithAI(conversationId, userId, message, provider = 'auto') {
        try {
            // Verify conversation
            const conversation = await this.getConversation(conversationId, userId);
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            // Auto-select provider if needed
            if (provider === 'auto') {
                provider = this.selectBestProvider(message);
            }

            let aiResponse;
            let responseTime;
            const startTime = Date.now();

            try {
                if (provider === 'super_dev') {
                    aiResponse = await this.callSuperDevAPI(message);
                } else if (provider === 'gemini') {
                    aiResponse = await this.callGeminiAPI(message);
                } else {
                    throw new Error('Invalid AI provider specified');
                }

                responseTime = Date.now() - startTime;

                // Save AI response
                const savedMessage = await ChatMessage.create({
                    conversation_id: conversationId,
                    sender_type: 'ai',
                    message: aiResponse.text,
                    api_provider: provider,
                    response_time: responseTime,
                    tokens_used: aiResponse.tokensUsed,
                    status: 'delivered',
                    metadata: aiResponse.metadata
                });

                // Update conversation last message time
                await ChatConversation.update({
                    last_message_at: new Date()
                }, {
                    where: { id: conversationId }
                });

                return savedMessage;

            } catch (apiError) {
                responseTime = Date.now() - startTime;

                // Save error message
                const errorMessage = await ChatMessage.create({
                    conversation_id: conversationId,
                    sender_type: 'ai',
                    message: 'Sorry, I encountered an error processing your request.',
                    api_provider: provider,
                    response_time: responseTime,
                    status: 'error',
                    error_message: apiError.message
                });

                logger.error(`AI API Error (${provider}):`, apiError);
                return errorMessage;
            }

        } catch (error) {
            logger.error('Error in chatWithAI:', error);
            throw error;
        }
    }

    selectBestProvider(message) {
        // Simple logic to select best provider based on message content
        // You can enhance this with more sophisticated logic
        
        const codeKeywords = ['code', 'programming', 'function', 'variable', 'debug', 'api', 'database'];
        const hasCodeKeywords = codeKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );

        // Use Super Dev for technical/coding questions, Gemini for general chat
        return hasCodeKeywords ? 'super_dev' : 'gemini';
    }

    async callSuperDevAPI(message) {
        try {
            const response = await axios.post(this.superDevApiUrl, {
                message: message,
                max_tokens: 1000
            }, {
                headers: {
                    'Authorization': `Bearer ${this.superDevApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            return {
                text: response.data.response || response.data.message || 'No response received',
                tokensUsed: response.data.tokens_used || 0,
                metadata: {
                    model: response.data.model || 'super_dev',
                    finish_reason: response.data.finish_reason
                }
            };
        } catch (error) {
            logger.error('Super Dev API Error:', error);
            throw new Error(`Super Dev API Error: ${error.response?.data?.message || error.message}`);
        }
    }

    async callGeminiAPI(message) {
        try {
            const response = await axios.post(
                `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: message
                        }]
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            const candidate = response.data.candidates?.[0];
            const content = candidate?.content?.parts?.[0]?.text;

            if (!content) {
                throw new Error('No response content received from Gemini');
            }

            return {
                text: content,
                tokensUsed: response.data.usageMetadata?.totalTokenCount || 0,
                metadata: {
                    model: 'gemini-1.5-flash',
                    finish_reason: candidate?.finishReason || 'STOP',
                    safety_ratings: candidate?.safetyRatings
                }
            };
        } catch (error) {
            logger.error('Gemini API Error:', error);
            throw new Error(`Gemini API Error: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    // Analytics and utility methods
    async getChatStats(userId) {
        try {
            const totalConversations = await ChatConversation.count({
                where: { user_id: userId }
            });

            const totalMessages = await ChatMessage.count({
                include: [{
                    model: ChatConversation,
                    as: 'conversation',
                    where: { user_id: userId }
                }]
            });

            const apiUsage = await ChatMessage.findAll({
                attributes: [
                    'api_provider',
                    [ChatMessage.sequelize.fn('COUNT', ChatMessage.sequelize.col('id')), 'count'],
                    [ChatMessage.sequelize.fn('AVG', ChatMessage.sequelize.col('response_time')), 'avg_response_time'],
                    [ChatMessage.sequelize.fn('SUM', ChatMessage.sequelize.col('tokens_used')), 'total_tokens']
                ],
                include: [{
                    model: ChatConversation,
                    as: 'conversation',
                    where: { user_id: userId }
                }],
                where: {
                    sender_type: 'ai',
                    api_provider: { [Op.ne]: null }
                },
                group: ['api_provider'],
                raw: true
            });

            return {
                totalConversations,
                totalMessages,
                apiUsage
            };
        } catch (error) {
            logger.error('Error getting chat stats:', error);
            throw error;
        }
    }
}

module.exports = new ChatService();