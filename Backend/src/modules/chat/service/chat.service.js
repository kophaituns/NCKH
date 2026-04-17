const axios = require('axios');
const { ChatConversation, ChatMessage, User } = require('../../../models');
const logger = require('../../../utils/logger');
const { Op } = require('sequelize');
const contextBuilderService = require('./contextBuilder.service');

class ChatService {
    constructor() {
        this.superDevApiKey = process.env.SUPER_DEV_API_KEY || 'ae948cd99dc0254d6a33cb38d00112d7a04963a4';
        this.geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyAi1bfxyJ59znqHOrVDVV5kzdf5AmtaL3I';
        this.defaultProvider = process.env.CHAT_DEFAULT_PROVIDER || 'auto';
        this.superDevApiUrl = 'https://api.superdev.ai/v1/chat';
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    }

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
                    totalPages
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
                title: title,
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
                    model: ChatMessage,
                    as: 'messages',
                    order: [['created_at', 'DESC']],
                    limit: 50
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
            const conversation = await ChatConversation.findOne({
                where: {
                    id: conversationId,
                    user_id: userId
                }
            });

            if (!conversation) {
                throw new Error('Conversation not found');
            }

            if (updates.title) {
                conversation.title = updates.title;
            }

            if (updates.status) {
                conversation.status = updates.status;
            }

            await conversation.save();

            return conversation;
        } catch (error) {
            logger.error('Error updating conversation:', error);
            throw error;
        }
    }

    async deleteConversation(conversationId, userId) {
        try {
            const conversation = await ChatConversation.findOne({
                where: {
                    id: conversationId,
                    user_id: userId
                }
            });

            if (!conversation) {
                throw new Error('Conversation not found');
            }

            await conversation.destroy();
        } catch (error) {
            logger.error('Error deleting conversation:', error);
            throw error;
        }
    }

    async getMessages(conversationId, userId, options = {}) {
        try {
            const { page = 1, limit = 50 } = options;
            const offset = (page - 1) * limit;

            const conversation = await ChatConversation.findOne({
                where: {
                    id: conversationId,
                    user_id: userId
                }
            });

            if (!conversation) {
                throw new Error('Conversation not found');
            }

            const { count, rows } = await ChatMessage.findAndCountAll({
                where: {
                    conversation_id: conversationId
                },
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);

            return {
                messages: rows.reverse(),
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Error getting messages:', error);
            throw error;
        }
    }

    async sendMessage(conversationId, userId, messageText) {
        try {
            const conversation = await ChatConversation.findOne({
                where: {
                    id: conversationId,
                    user_id: userId
                }
            });

            if (!conversation) {
                throw new Error('Conversation not found');
            }

            const userMessage = await ChatMessage.create({
                conversation_id: conversationId,
                sender_type: 'user',
                message: messageText,
                status: 'sent'
            });

            conversation.last_message_at = new Date();
            await conversation.save();

            return {
                userMessage,
                conversationUpdated: true
            };
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    async updateMessage(messageId, messageText) {
        try {
            const message = await ChatMessage.findByPk(messageId);

            if (!message) {
                throw new Error('Message not found');
            }

            message.message = messageText;
            await message.save();

            return message;
        } catch (error) {
            logger.error('Error updating message:', error);
            throw error;
        }
    }

    async deleteMessage(messageId) {
        try {
            const message = await ChatMessage.findByPk(messageId);

            if (!message) {
                throw new Error('Message not found');
            }

            await message.destroy();
        } catch (error) {
            logger.error('Error deleting message:', error);
            throw error;
        }
    }

    async chatWithSuperDev(conversationId, userId, userMessage) {
        try {
            await this.sendMessage(conversationId, userId, userMessage);

            const startTime = Date.now();

            const response = await axios.post(this.superDevApiUrl, {
                message: userMessage,
                api_key: this.superDevApiKey
            }, {
                timeout: 30000
            });

            const responseTime = Date.now() - startTime;
            const aiMessage = response.data.message || response.data.response;

            const aiChatMessage = await ChatMessage.create({
                conversation_id: conversationId,
                sender_type: 'ai',
                message: aiMessage,
                api_provider: 'super_dev',
                response_time: responseTime,
                status: 'delivered'
            });

            const conversation = await ChatConversation.findByPk(conversationId);
            conversation.last_message_at = new Date();
            await conversation.save();

            return {
                success: true,
                userMessage,
                aiMessage: aiChatMessage
            };
        } catch (error) {
            logger.error('Error in Super Dev chat:', error);

            await ChatMessage.create({
                conversation_id: conversationId,
                sender_type: 'ai',
                message: 'Sorry, there was an error processing your request.',
                api_provider: 'super_dev',
                status: 'error',
                error_message: error.message
            });

            throw error;
        }
    }

    async chatWithGemini(conversationId, userId, userMessage, surveyId = null) {
        try {
            await this.sendMessage(conversationId, userId, userMessage);

            const startTime = Date.now();

            // Build context if surveyId is provided
            let systemContext = null;
            let formattedContents = [];
            
            if (surveyId) {
                try {
                    const context = await contextBuilderService.buildContext(surveyId, conversationId, userId);
                    const formattedMessages = contextBuilderService.formatForLLM(context, userMessage);
                    
                    // Convert to Gemini format
                    formattedContents = formattedMessages.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    }));
                    
                    logger.info(`Context built for survey ${surveyId}, domain: ${context.domain?.category}`);
                } catch (contextError) {
                    logger.warn('Failed to build context, using direct message:', contextError.message);
                }
            }

            // Use formatted contents if available, otherwise use direct message
            const requestContents = formattedContents.length > 0 
                ? formattedContents 
                : [{ parts: [{ text: userMessage }] }];

            const response = await axios.post(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
                contents: requestContents
            }, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const responseTime = Date.now() - startTime;
            const aiMessage = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

            const aiChatMessage = await ChatMessage.create({
                conversation_id: conversationId,
                sender_type: 'ai',
                message: aiMessage,
                api_provider: 'gemini',
                response_time: responseTime,
                status: 'delivered',
                metadata: surveyId ? { surveyId, contextUsed: true } : null
            });

            const conversation = await ChatConversation.findByPk(conversationId);
            conversation.last_message_at = new Date();
            await conversation.save();

            return {
                success: true,
                userMessage,
                aiMessage: aiChatMessage,
                contextUsed: surveyId ? true : false
            };
        } catch (error) {
            logger.error('Error in Gemini chat:', error);

            await ChatMessage.create({
                conversation_id: conversationId,
                sender_type: 'ai',
                message: 'Sorry, there was an error processing your request.',
                api_provider: 'gemini',
                status: 'error',
                error_message: error.message
            });

            throw error;
        }
    }

    async chatWithAuto(conversationId, userId, userMessage, surveyId = null) {
        try {
            const provider = this.defaultProvider === 'auto' ? 'gemini' : this.defaultProvider;

            if (provider === 'gemini') {
                return await this.chatWithGemini(conversationId, userId, userMessage, surveyId);
            } else {
                return await this.chatWithSuperDev(conversationId, userId, userMessage);
            }
        } catch (error) {
            logger.error('Error in Auto chat:', error);
            throw error;
        }
    }

    /**
     * Chat with domain-aware context
     * Uses ContextBuilderService to detect survey domain and load chat history
     */
    async chatWithContext(conversationId, userId, userMessage, surveyId) {
        try {
            logger.info(`Starting context-aware chat for survey ${surveyId}`);
            
            // Build comprehensive context
            const context = await contextBuilderService.buildContext(surveyId, conversationId, userId);
            
            // Log domain detection result
            logger.info(`📂 Domain detected: ${context.domain?.category} (confidence: ${(context.domain?.confidence * 100).toFixed(1)}%)`);
            logger.info(`📨 Chat history loaded: ${context.chatHistory?.length || 0} messages`);
            
            // Use Gemini with context
            return await this.chatWithGemini(conversationId, userId, userMessage, surveyId);
            
        } catch (error) {
            logger.error('Error in context-aware chat:', error);
            // Fallback to regular chat
            return await this.chatWithGemini(conversationId, userId, userMessage);
        }
    }

    /**
     * Get domain information for a survey
     */
    async getSurveyDomain(surveyId) {
        try {
            return await contextBuilderService.detectDomain(surveyId);
        } catch (error) {
            logger.error('Error getting survey domain:', error);
            return { category: 'general', confidence: 0 };
        }
    }
}

module.exports = new ChatService();
