import http from '../http';

class ChatService {
    // Conversation management
    async getConversations(page = 1, limit = 20, status = 'active') {
        try {
            console.log('Getting conversations...');
            const response = await http.get('/modules/chat/conversations', {
                params: { page, limit, status }
            });
            console.log('Get conversations response:', response);
            return response.data;
        } catch (error) {
            console.error('Get conversations error:', error);
            console.error('Error response:', error.response);
            throw new Error(error.response?.data?.message || 'Failed to get conversations');
        }
    }

    async createConversation(title = 'New Chat') {
        try {
            // Ensure title is a string to prevent circular reference
            const conversationTitle = typeof title === 'string' ? title : 'New Chat';
            
            console.log('Creating conversation with title:', conversationTitle);
            console.log('Auth token:', localStorage.getItem('authToken')?.substring(0, 20) + '...');
            console.log('API Base URL:', http.defaults.baseURL);
            
            const response = await http.post('/modules/chat/conversations', { title: conversationTitle });
            console.log('Create conversation response status:', response.status);
            return response.data;
        } catch (error) {
            console.error('Create conversation error:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Failed to create conversation');
        }
    }

    async getConversation(conversationId) {
        try {
            const response = await http.get(`/modules/chat/conversations/${conversationId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get conversation');
        }
    }

    async updateConversation(conversationId, updates) {
        try {
            const response = await http.put(`/modules/chat/conversations/${conversationId}`, updates);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update conversation');
        }
    }

    async deleteConversation(conversationId) {
        try {
            const response = await http.delete(`/modules/chat/conversations/${conversationId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete conversation');
        }
    }

    // Message management
    async getMessages(conversationId, page = 1, limit = 50) {
        try {
            const response = await http.get(`/modules/chat/conversations/${conversationId}/messages`, {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get messages');
        }
    }

    async sendMessage(conversationId, message, apiProvider = 'auto') {
        try {
            // Use AI endpoints for actual chat responses
            let response;
            
            console.log('Sending message with provider:', apiProvider);
            
            if (apiProvider === 'gemini') {
                response = await http.post('/modules/chat/ai/gemini', {
                    message,
                    conversationId
                });
            } else if (apiProvider === 'serper') {
                response = await http.post('/modules/chat/ai/serper', {
                    message,
                    conversationId
                });
            } else if (apiProvider === 'super-dev') {
                response = await http.post('/modules/chat/ai/super-dev', {
                    message,
                    conversationId
                });
            } else {
                // Auto provider - let backend decide
                response = await http.post('/modules/chat/ai/auto', {
                    message,
                    conversationId
                });
            }
            
            console.log('AI response received:', response.status);
            return response.data;
        } catch (error) {
            console.error('Send message error:', error);
            console.error('Error response:', error.response);
            throw new Error(error.response?.data?.message || 'Failed to send message');
        }
    }

    async updateMessage(messageId, message) {
        try {
            const response = await http.put(`/modules/chat/messages/${messageId}`, { message });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update message');
        }
    }

    async deleteMessage(messageId) {
        try {
            const response = await http.delete(`/modules/chat/messages/${messageId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete message');
        }
    }

    // Direct AI chat endpoints
    async chatWithSuperDev(message, conversationId = null) {
        try {
            const response = await http.post('/modules/chat/ai/super-dev', {
                message,
                conversation_id: conversationId
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to chat with Super Dev');
        }
    }

    async chatWithGemini(message, conversationId = null) {
        try {
            const response = await http.post('/modules/chat/ai/gemini', {
                message,
                conversation_id: conversationId
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to chat with Gemini');
        }
    }

    async chatWithAuto(message, conversationId = null) {
        try {
            const response = await http.post('/modules/chat/ai/auto', {
                message,
                conversation_id: conversationId
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to chat with AI');
        }
    }

    // Health check
    async healthCheck() {
        try {
            const response = await http.get('/modules/chat/health');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Chat service unavailable');
        }
    }
}

const chatService = new ChatService();
export default chatService;
