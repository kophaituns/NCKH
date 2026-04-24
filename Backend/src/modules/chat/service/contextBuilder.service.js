/**
 * ============================================================================
 * CONTEXT BUILDER SERVICE - Multi-Domain AI Context
 * ============================================================================
 * Xây dựng context cho AI Chatbox để nhận diện ngành của Survey hiện tại
 * và nạp 10 tin nhắn gần nhất để AI không bị quên ngữ cảnh.
 * 
 * Features:
 * 1. Identify survey category from generated_questions table
 * 2. Load last 10 chat messages for conversation context
 * 3. Build domain-specific context for AI responses
 * 4. Support IT, Sales, Marketing domain detection
 * ============================================================================
 */

const { 
    Survey, 
    Question, 
    ChatMessage, 
    ChatConversation,
    GeneratedQuestion,
    AnalysisResult,
    SurveyResponse,
    Answer
} = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');

class ContextBuilderService {
    constructor() {
        // Domain-specific vocabulary for context enrichment
        this.domainKeywords = {
            it: ['phần cứng', 'phần mềm', 'lab', 'máy tính', 'mạng', 'code', 'programming', 'development', 'server', 'database', 'security', 'cloud', 'infrastructure'],
            sale: ['giá', 'chiết khấu', 'khuyến mãi', 'doanh số', 'khách hàng', 'mua hàng', 'bán hàng', 'revenue', 'discount', 'pricing', 'deal', 'offer'],
            marketing: ['thương hiệu', 'brand', 'quảng cáo', 'marketing', 'nhận diện', 'campaign', 'social media', 'content', 'SEO', 'awareness', 'engagement']
        };

        // Domain-specific prompts for AI
        this.domainPrompts = {
            it: `Bạn là chuyên gia phân tích dữ liệu khảo sát trong lĩnh vực CÔNG NGHỆ THÔNG TIN. 
                 Khi trả lời, hãy tập trung vào các khía cạnh kỹ thuật như: phần cứng, phần mềm, hạ tầng mạng, 
                 hiệu suất hệ thống, và các vấn đề IT thường gặp. 
                 Đưa ra các khuyến nghị cải thiện dựa trên best practices của ngành IT.`,
            
            sale: `Bạn là chuyên gia phân tích dữ liệu khảo sát trong lĩnh vực KINH DOANH & BÁN HÀNG.
                   Khi trả lời, hãy tập trung vào các khía cạnh như: chiến lược giá, chính sách chiết khấu,
                   hành vi mua hàng, mức độ hài lòng của khách hàng, và doanh số.
                   Đưa ra các khuyến nghị tối ưu hóa doanh thu và retention.`,
            
            marketing: `Bạn là chuyên gia phân tích dữ liệu khảo sát trong lĩnh vực MARKETING & THƯƠNG HIỆU.
                        Khi trả lời, hãy tập trung vào các khía cạnh như: nhận diện thương hiệu, brand positioning,
                        customer perception, campaign effectiveness, và market trends.
                        Đưa ra các khuyến nghị xây dựng và phát triển thương hiệu.`,
            
            general: `Bạn là chuyên gia phân tích dữ liệu khảo sát đa ngành.
                      Hãy phân tích dữ liệu một cách khách quan và đưa ra insights có giá trị
                      dựa trên các phản hồi thu thập được.`
        };
    }

    /**
     * Build complete context for AI Chatbox
     * @param {number} surveyId - Survey ID to analyze
     * @param {number} conversationId - Chat conversation ID
     * @param {number} userId - User ID
     * @returns {Object} Complete context object for AI
     */
    async buildContext(surveyId, conversationId, userId) {
        try {
            logger.info(`Building context for Survey: ${surveyId}, Conversation: ${conversationId}`);

            // Build all context components in parallel
            const [
                surveyContext,
                domainInfo,
                chatHistory,
                analysisContext
            ] = await Promise.all([
                this.getSurveyContext(surveyId),
                this.detectDomain(surveyId),
                this.getChatHistory(conversationId, 10),
                this.getAnalysisContext(surveyId)
            ]);

            // Compile full context
            const context = {
                survey: surveyContext,
                domain: domainInfo,
                chatHistory: chatHistory,
                analysis: analysisContext,
                systemPrompt: this.buildSystemPrompt(domainInfo),
                metadata: {
                    builtAt: new Date().toISOString(),
                    userId: userId,
                    surveyId: surveyId,
                    conversationId: conversationId
                }
            };

            logger.info(`Context built successfully for domain: ${domainInfo.category}`);
            return context;

        } catch (error) {
            logger.error('Error building context:', error);
            throw error;
        }
    }

    /**
     * Get survey basic information
     */
    async getSurveyContext(surveyId) {
        try {
            const survey = await Survey.findByPk(surveyId, {
                include: [
                    {
                        model: Question,
                        as: 'Questions',
                        attributes: ['id', 'label', 'question_text', 'question_type_id']
                    }
                ]
            });

            if (!survey) {
                return null;
            }

            // Get response statistics
            const responseCount = await SurveyResponse.count({
                where: { survey_id: surveyId }
            });

            return {
                id: survey.id,
                title: survey.title,
                description: survey.description,
                status: survey.status,
                questionCount: survey.Questions?.length || 0,
                responseCount: responseCount,
                questions: survey.Questions?.map(q => ({
                    id: q.id,
                    text: q.question_text,
                    type: q.question_type_id
                })) || []
            };

        } catch (error) {
            logger.error('Error getting survey context:', error);
            return null;
        }
    }

    /**
     * Detect domain/category of survey based on generated_questions
     * @param {number} surveyId 
     * @returns {Object} Domain information
     */
    async detectDomain(surveyId) {
        try {
            // Method 1: Check generated_questions linked to survey
            const survey = await Survey.findByPk(surveyId, {
                include: [{
                    model: Question,
                    as: 'Questions',
                    attributes: ['question_text']
                }]
            });

            if (!survey) {
                return { category: 'general', confidence: 0, source: 'default' };
            }

            // Get question texts from survey
            const questionTexts = survey.Questions?.map(q => q.question_text) || [];

            // Method 2: Find matching generated_questions by question text
            let categoryScores = { it: 0, sale: 0, marketing: 0, general: 0 };
            
            if (questionTexts.length > 0) {
                const generatedQuestions = await GeneratedQuestion.findAll({
                    where: {
                        question_text: {
                            [Op.in]: questionTexts
                        }
                    },
                    attributes: ['category', 'keyword']
                });

                // Count categories from matched questions
                generatedQuestions.forEach(gq => {
                    const cat = gq.category?.toLowerCase() || 'general';
                    if (categoryScores.hasOwnProperty(cat)) {
                        categoryScores[cat] += 2; // Strong match
                    }
                });
            }

            // Method 3: Keyword-based detection from question content
            const allText = [survey.title, survey.description, ...questionTexts].join(' ').toLowerCase();

            for (const [domain, keywords] of Object.entries(this.domainKeywords)) {
                keywords.forEach(keyword => {
                    if (allText.includes(keyword.toLowerCase())) {
                        categoryScores[domain] = (categoryScores[domain] || 0) + 1;
                    }
                });
            }

            // Determine winner
            let maxScore = 0;
            let detectedCategory = 'general';
            
            for (const [cat, score] of Object.entries(categoryScores)) {
                if (score > maxScore) {
                    maxScore = score;
                    detectedCategory = cat;
                }
            }

            // Calculate confidence
            const totalScore = Object.values(categoryScores).reduce((a, b) => a + b, 0);
            const confidence = totalScore > 0 ? (maxScore / totalScore) : 0;

            logger.info(`Domain detected: ${detectedCategory} (confidence: ${(confidence * 100).toFixed(1)}%)`);

            return {
                category: detectedCategory,
                confidence: confidence,
                scores: categoryScores,
                source: 'hybrid_detection'
            };

        } catch (error) {
            logger.error('Error detecting domain:', error);
            return { category: 'general', confidence: 0, source: 'error_fallback' };
        }
    }

    /**
     * Get last N chat messages for conversation context
     * @param {number} conversationId 
     * @param {number} limit - Number of messages to retrieve (default 10)
     * @returns {Array} Chat messages
     */
    async getChatHistory(conversationId, limit = 10) {
        try {
            if (!conversationId) {
                return [];
            }

            const messages = await ChatMessage.findAll({
                where: {
                    conversation_id: conversationId
                },
                order: [['created_at', 'DESC']],
                limit: limit,
                attributes: ['id', 'sender_type', 'message', 'api_provider', 'created_at']
            });

            // Reverse to get chronological order
            const chronological = messages.reverse();

            logger.info(`📨 Loaded ${chronological.length} chat messages for context`);

            return chronological.map(msg => ({
                role: msg.sender_type === 'user' ? 'user' : 'assistant',
                content: msg.message,
                timestamp: msg.created_at,
                provider: msg.api_provider
            }));

        } catch (error) {
            logger.error('Error getting chat history:', error);
            return [];
        }
    }

    /**
     * Get existing analysis results for context enrichment
     */
    async getAnalysisContext(surveyId) {
        try {
            const analyses = await AnalysisResult.findAll({
                where: { survey_id: surveyId },
                order: [['generated_at', 'DESC']],
                limit: 3
            });

            if (analyses.length === 0) {
                return null;
            }

            return analyses.map(a => ({
                type: a.analysis_type,
                data: a.result_data,
                generatedAt: a.generated_at
            }));

        } catch (error) {
            logger.error('Error getting analysis context:', error);
            return null;
        }
    }

    /**
     * Build system prompt based on detected domain
     */
    buildSystemPrompt(domainInfo) {
        const category = domainInfo?.category || 'general';
        const basePrompt = this.domainPrompts[category] || this.domainPrompts.general;
        
        const confidenceNote = domainInfo.confidence > 0.7 
            ? `(Độ tin cậy cao: ${(domainInfo.confidence * 100).toFixed(0)}%)`
            : domainInfo.confidence > 0.4
            ? `(Độ tin cậy trung bình: ${(domainInfo.confidence * 100).toFixed(0)}%)`
            : '(Đang sử dụng phân tích chung)';

        return `${basePrompt}

NGÀNH ĐƯỢC PHÁT HIỆN: ${category.toUpperCase()} ${confidenceNote}

Hướng dẫn bổ sung:
- Dựa vào ngữ cảnh cuộc hội thoại trước đó để trả lời nhất quán
- Tham khảo dữ liệu phân tích có sẵn nếu được cung cấp
- Sử dụng thuật ngữ chuyên ngành phù hợp với lĩnh vực ${category}
- Đưa ra insights cụ thể và actionable`;
    }

    /**
     * Format context for Gemini/LLM API
     */
    formatForLLM(context, userMessage) {
        const formattedMessages = [];

        // Add system prompt
        formattedMessages.push({
            role: 'system',
            content: context.systemPrompt
        });

        // Add survey context as initial context
        if (context.survey) {
            formattedMessages.push({
                role: 'system',
                content: `THÔNG TIN KHẢO SÁT:
- Tiêu đề: ${context.survey.title}
- Mô tả: ${context.survey.description || 'Không có'}
- Số câu hỏi: ${context.survey.questionCount}
- Số phản hồi: ${context.survey.responseCount}
- Ngành: ${context.domain?.category?.toUpperCase() || 'GENERAL'}`
            });
        }

        // Add analysis context if available
        if (context.analysis && context.analysis.length > 0) {
            const latestAnalysis = context.analysis[0];
            formattedMessages.push({
                role: 'system',
                content: `KẾT QUẢ PHÂN TÍCH GẦN NHẤT (${latestAnalysis.type}):
${JSON.stringify(latestAnalysis.data, null, 2)}`
            });
        }

        // Add chat history (last 10 messages)
        if (context.chatHistory && context.chatHistory.length > 0) {
            context.chatHistory.forEach(msg => {
                formattedMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            });
        }

        // Add current user message
        formattedMessages.push({
            role: 'user',
            content: userMessage
        });

        return formattedMessages;
    }

    /**
     * Get domain-specific analysis prompts
     */
    getDomainAnalysisPrompt(category, analysisType) {
        const prompts = {
            it: {
                sentiment: 'Phân tích sentiment về chất lượng phần cứng, phần mềm và hạ tầng IT',
                summary: 'Tóm tắt các vấn đề kỹ thuật chính và đề xuất giải pháp IT',
                theme: 'Trích xuất các chủ đề liên quan đến công nghệ và hệ thống'
            },
            sale: {
                sentiment: 'Phân tích sentiment về giá cả, chiết khấu và trải nghiệm mua hàng',
                summary: 'Tóm tắt phản hồi về pricing strategy và customer satisfaction',
                theme: 'Trích xuất các chủ đề liên quan đến doanh số và hành vi mua hàng'
            },
            marketing: {
                sentiment: 'Phân tích sentiment về nhận diện thương hiệu và brand perception',
                summary: 'Tóm tắt insights về brand awareness và marketing effectiveness',
                theme: 'Trích xuất các chủ đề liên quan đến thương hiệu và truyền thông'
            },
            general: {
                sentiment: 'Phân tích sentiment tổng quan từ các phản hồi',
                summary: 'Tóm tắt các điểm chính từ dữ liệu khảo sát',
                theme: 'Trích xuất các chủ đề chính từ câu trả lời'
            }
        };

        return prompts[category]?.[analysisType] || prompts.general[analysisType];
    }
}

module.exports = new ContextBuilderService();
