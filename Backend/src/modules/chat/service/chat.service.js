const axios = require('axios');
const { ChatConversation, ChatMessage, User } = require('../../../models');
const logger = require('../../../utils/logger');
const { Op } = require('sequelize');

class ChatService {
    constructor() {
        this.superDevApiKey = process.env.SUPER_DEV_API_KEY || 'ae948cd99dc0254d6a33cb38d00112d7a04963a4';
        this.geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyAjBABJxT7FCDy8zIOSUBcMrQYQoKiVN3M';
        this.serperApiKey = process.env.SERPER_API_KEY || 'ebb93c8f37924c0ebb979860e8409e39b275b6d2';
        this.defaultProvider = process.env.CHAT_DEFAULT_PROVIDER || 'serper';
        this.superDevApiUrl = 'https://api.superdev.ai/v1/chat'; // Not working
        this.serperApiUrl = 'https://google.serper.dev/search';
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        
        console.log('ChatService initialized with:');
        console.log('- Gemini API Key:', this.geminiApiKey ? 'configured' : 'missing');
        console.log('- Serper API Key:', this.serperApiKey ? 'configured' : 'missing');
        console.log('- Default Provider:', this.defaultProvider);
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
            console.log('ChatService.createConversation called with userId:', userId, 'title:', title);
            
            const conversation = await ChatConversation.create({
                user_id: userId,
                title: title,
                status: 'active'
            });

            console.log('Conversation created in database:', conversation.id);
            return conversation;
        } catch (error) {
            console.error('ChatService.createConversation error:', error);
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

    // AI Chat Methods
    async chatWithSerper(conversationId, userId, userMessage) {
        try {
            // Save user message first
            await this.sendMessage(conversationId, userId, userMessage);

            const startTime = Date.now();

            // Use Serper for search-based responses
            const searchResponse = await axios.post(this.serperApiUrl, {
                q: userMessage,
                num: 3
            }, {
                timeout: 30000,
                headers: {
                    'X-API-KEY': this.serperApiKey,
                    'Content-Type': 'application/json'
                }
            });

            const responseTime = Date.now() - startTime;
            
            // Format search results into a readable response
            const searchResults = searchResponse.data.organic || [];
            let aiMessage = `Based on your question: "${userMessage}"\n\n`;
            
            if (searchResults.length > 0) {
                aiMessage += 'Here are some relevant search results:\n\n';
                searchResults.slice(0, 3).forEach((result, index) => {
                    aiMessage += `${index + 1}. **${result.title}**\n`;
                    aiMessage += `   ${result.snippet}\n`;
                    aiMessage += `   Source: ${result.link}\n\n`;
                });
            } else {
                aiMessage += 'I couldn\'t find specific search results for your question, but I\'m here to help with any other questions you might have.';
            }

            const aiChatMessage = await ChatMessage.create({
                conversation_id: conversationId,
                sender_type: 'ai',
                message: aiMessage,
                api_provider: 'serper',
                response_time: responseTime,
                status: 'delivered'
            });

            // Update conversation timestamp
            const conversation = await ChatConversation.findByPk(conversationId);
            conversation.last_message_at = new Date();
            await conversation.save();

            return {
                success: true,
                userMessage: await ChatMessage.findOne({
                    where: { conversation_id: conversationId, sender_type: 'user' },
                    order: [['created_at', 'DESC']]
                }),
                aiMessage: aiChatMessage
            };

        } catch (error) {
            logger.error('Error in Serper chat:', error);
            
            // Create error message
            await ChatMessage.create({
                conversation_id: conversationId,
                sender_type: 'ai',
                message: 'Sorry, I encountered an error while processing your request. Please try again.',
                api_provider: 'serper',
                status: 'error',
                error_message: error.message
            });

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

    async chatWithGemini(conversationId, userId, userMessage) {
        try {
            await this.sendMessage(conversationId, userId, userMessage);

            const startTime = Date.now();

            const response = await axios.post(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
                contents: [{
                    parts: [{
                        text: userMessage
                    }]
                }]
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

    async chatWithAuto(conversationId, userId, userMessage) {
        try {
            // Always use Serper since it's the only working API
            return await this.chatWithSerper(conversationId, userId, userMessage);
        } catch (error) {
            logger.error('Error in Auto chat:', error);
            
            // Create fallback message
            const fallbackMessage = await ChatMessage.create({
                conversation_id: conversationId,
                sender_type: 'ai',
                message: `I apologize, but I'm currently unable to process your request due to a technical issue. Your message "${userMessage}" was received, but I cannot provide a proper response at the moment. Please try again later.`,
                api_provider: 'fallback',
                status: 'error',
                error_message: error.message
            });

            return {
                success: false,
                userMessage: await ChatMessage.findOne({
                    where: { conversation_id: conversationId, sender_type: 'user' },
                    order: [['created_at', 'DESC']]
                }),
                aiMessage: fallbackMessage,
                error: error.message
            };
        }
    }
}

module.exports = new ChatService();
