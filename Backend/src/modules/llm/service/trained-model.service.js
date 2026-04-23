const axios = require('axios');
const logger = require('../../../utils/logger');

class TrainedModelService {
    constructor(user = null) {
        this.baseUrl = process.env.TRAINED_MODEL_API_URL || 'http://localhost:8000';
        this.timeout = 120000; // Increased to 120s for deep RAG retrieval
        this.user = user; // Store user for permission checks
    }

    /**
     * Check if user has permission to use AI features
     * Only 'creator' role can access AI features
     */
    async checkAIPermission() {
        if (!this.user) {
            throw new Error('User authentication required for AI features');
        }

        // 1. Allow global Admin & Creator
        if (['admin', 'creator'].includes(this.user.role)) {
            return;
        }

        // 2. Allow Collaborator/Owner role in any workspace
        const { WorkspaceMember } = require('../../../../src/models');
        try {
            const membership = await WorkspaceMember.findOne({
                where: {
                    user_id: this.user.id,
                    role: ['owner', 'collaborator']
                }
            });

            if (membership) {
                return; // User is an authorized workspace manager
            }
        } catch (dbError) {
            logger.error('Error checking workspace membership for AI permission:', dbError);
        }

        // Deny access if no criteria met
        logger.warn(`AI access denied: User ${this.user.id} (role: ${this.user.role}) attempted to use AI features`, {
            userId: this.user.id,
            userRole: this.user.role,
            feature: 'AI API (Port 8001)'
        });

        const error = new Error('Vui lòng nâng cấp lên Creator hoặc tham gia Workspace với tư cách Collaborator để sử dụng tính năng AI');
        error.code = 'AI_ACCESS_DENIED';
        error.userRole = this.user.role;
        error.requiredRole = 'creator/collaborator';
        throw error;
    }

    async checkHealth() {
        try {
            const response = await axios.get(`${this.baseUrl}/health`, {
                timeout: this.timeout
            });
            return response.data;
        } catch (error) {
            logger.error('Trained model health check failed:', error.message);
            return { status: 'error', error: error.message };
        }
    }

    async getModelInfo() {
        try {
            // Root endpoint returns API info including status
            const response = await axios.get(`${this.baseUrl}/`, {
                timeout: this.timeout
            });
            return response.data;
        } catch (error) {
            logger.error('Failed to get model info:', error.message);
            return { success: false, error: error.message };
        }
    }

    async generateQuestions(params) {
        try {
            // Check AI permission before making request
            await this.checkAIPermission();

            // Support both old positional arguments and new object-based params for backward compatibility
            let payload = {};
            if (typeof params === 'string') {
                // Legacy positional call: (keyword, numQuestions, category, offset)
                payload = {
                    keyword: params,
                    num_questions: arguments[1] || 5,
                    category_hint: arguments[2] || null,
                    offset: arguments[3] || 0
                };
            } else {
                // Modern object-based call
                payload = params;
            }

            logger.info(`>>> [GAU SERVICE] Executing Intelligence Sequence for: ${payload.keywords || payload.keyword} (User: ${this.user?.id})`);

            const response = await axios.post(`${this.baseUrl}/api/generate-questions`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            return response.data;

            return response.data;
        } catch (error) {
            // Handle permission errors specially
            if (error.code === 'AI_ACCESS_DENIED') {
                return {
                    success: false,
                    error: error.message,
                    reason: 'AI_ACCESS_DENIED',
                    userRole: error.userRole,
                    requiredRole: error.requiredRole,
                    questions: []
                };
            }

            // Check if AI server is completely unavailable
            if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
                logger.error(`AI Server is unavailable: ${error.code}`);
                return {
                    success: false,
                    error: 'AI Server is currently unavailable. Please try again later.',
                    reason: 'AI_SERVER_UNAVAILABLE',
                    questions: []
                };
            }

            logger.error('Question generation failed:', error.message);
            return {
                success: false,
                error: error.response?.data?.error || error.message,
                questions: []
            };
        }
    }

    async predictCategory(keyword) {
        try {
            // NOTE: predictCategory is allowed without authentication
            // This is a lightweight operation for category preview
            // Permission check is enforced in generateQuestions instead

            const response = await axios.post(`${this.baseUrl}/api/predict-category`, {
                keyword: keyword
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });

            return response.data;
        } catch (error) {
            // Handle permission errors specially
            if (error.code === 'AI_ACCESS_DENIED') {
                return {
                    success: false,
                    error: error.message,
                    reason: 'AI_ACCESS_DENIED',
                    userRole: error.userRole,
                    requiredRole: error.requiredRole
                };
            }

            // Check if AI server is completely unavailable
            if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
                logger.error(`AI Server is unavailable: ${error.code}`);
                return {
                    success: false,
                    error: 'AI Server is currently unavailable. Please try again later.',
                    reason: 'AI_SERVER_UNAVAILABLE'
                };
            }

            logger.error('Category prediction failed:', error.message);
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    async batchGenerateQuestions(keywords, numQuestions = 5) {
        try {
            // Check AI permission before making request
            this.checkAIPermission();

            const response = await axios.post(`${this.baseUrl}/api/batch-generate`, {
                keywords: keywords,
                num_questions: numQuestions
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout * 2 // Longer timeout for batch operations
            });

            return response.data;
        } catch (error) {
            // Handle permission errors specially
            if (error.code === 'AI_ACCESS_DENIED') {
                return {
                    success: false,
                    error: error.message,
                    reason: 'AI_ACCESS_DENIED',
                    userRole: error.userRole,
                    requiredRole: error.requiredRole
                };
            }

            logger.error('Batch question generation failed:', error.message);
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    async isAvailable() {
        const health = await this.checkHealth();
        return health.status === 'ok' || health.status === 'healthy';
    }

    async getCategories() {
        try {
            const modelInfo = await this.getModelInfo();
            if (modelInfo.success && modelInfo.categories) {
                return modelInfo.categories;
            }
            // Default categories if not available from model
            return ['it', 'marketing', 'economics', 'general'];
        } catch (error) {
            logger.error('Failed to get categories:', error.message);
            return ['it', 'marketing', 'economics', 'general'];
        }
    }
}

module.exports = TrainedModelService;

