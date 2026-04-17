// modules/llm/controller/llm.controller.js
const llmService = require('../service/llm.service');
const logger = require('../../../utils/logger');
const { circuitBreakers, CircuitBreakerError, getAllCircuitBreakerStatus } = require('../../../utils/circuitBreaker');

// ============================================================================
// INPUT VALIDATION & SANITIZATION UTILITIES
// ============================================================================

// Characters that are BLOCKED immediately (@ and #)
const BLOCKED_CHARACTERS = ['@', '#'];
const BLOCKED_CHAR_REGEX = /[@#]/g;

/**
 * Check for blocked characters (@, #) - returns error immediately if found
 */
function checkBlockedCharacters(input) {
  if (!input || typeof input !== 'string') {
    return { hasBlocked: false };
  }

  const foundBlocked = [];
  for (const char of BLOCKED_CHARACTERS) {
    if (input.includes(char)) {
      foundBlocked.push(char);
    }
  }

  if (foundBlocked.length > 0) {
    return {
      hasBlocked: true,
      blockedChars: foundBlocked,
      message: `Ký tự không được phép: ${foundBlocked.join(', ')}. Vui lòng không sử dụng @ hoặc #`
    };
  }

  return { hasBlocked: false };
}

/**
 * Sanitize user input by removing dangerous characters
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(BLOCKED_CHAR_REGEX, '') // Remove blocked @ and #
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove JS injection
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/([!$%^&*()_+=\[\]{}|\\:";'<>?,./`~\-]){3,}/g, '$1$1'); // Limit special chars (removed @ and # from this list)
}

/**
 * Validate keyword for AI processing
 */
function validateKeyword(keyword) {
  if (!keyword || typeof keyword !== 'string') {
    return { isValid: false, reason: 'EMPTY_INPUT', message: 'Keyword is required' };
  }

  // FIRST: Check for blocked characters
  const blockedCheck = checkBlockedCharacters(keyword);
  if (blockedCheck.hasBlocked) {
    return {
      isValid: false,
      reason: 'BLOCKED_CHARACTERS',
      message: blockedCheck.message,
      blockedChars: blockedCheck.blockedChars
    };
  }

  const cleaned = sanitizeInput(keyword);

  // Check minimum length
  if (cleaned.length < 3) {
    return { isValid: false, reason: 'TOO_SHORT', message: 'Keyword must be at least 3 characters' };
  }

  // Check only special characters
  if (/^[\W_]+$/.test(cleaned)) {
    return { isValid: false, reason: 'INVALID_CHARS', message: 'Keyword contains only special characters' };
  }

  // Check garbage patterns
  if (/^(test|asdf|qwerty|abc|xyz|aaa|bbb|123|111)\s*\d*$/i.test(cleaned)) {
    return { isValid: false, reason: 'GARBAGE_INPUT', message: 'Keyword appears to be test/garbage input' };
  }

  // Check repeated characters
  if (/(.)\1{3,}/.test(cleaned)) {
    return { isValid: false, reason: 'SPAM_PATTERN', message: 'Keyword contains spam-like pattern' };
  }

  // Check minimum alphabetic characters
  const alphaCount = (cleaned.match(/[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/g) || []).length;
  if (alphaCount < 2) {
    return { isValid: false, reason: 'INSUFFICIENT_ALPHA', message: 'Keyword must contain at least 2 letters' };
  }

  return { isValid: true, cleaned };
}

/**
 * Log invalid input attempt to audit log
 */
async function logInvalidInputAudit(userId, keyword, reason, endpoint, ipAddress) {
  try {
    const { AuditLog } = require('../../../models');

    if (AuditLog) {
      await AuditLog.create({
        user_id: userId || null,
        action: 'INVALID_INPUT_ATTEMPT',
        entity_type: 'llm_input',
        entity_id: null,
        details: JSON.stringify({
          keyword: keyword ? keyword.substring(0, 100) : '', // Truncate for safety
          reason: reason,
          endpoint: endpoint,
          ip_address: ipAddress,
          timestamp: new Date().toISOString()
        }),
        ip_address: ipAddress,
        created_at: new Date()
      });
    }
  } catch (error) {
    // Log to file if DB audit fails
    logger.warn(` AUDIT: Invalid input | User: ${userId} | Keyword: "${keyword?.substring(0, 50)}" | Reason: ${reason} | Endpoint: ${endpoint}`);
  }
}

class LLMController {
  /**
   * Get categories
   */
  async getCategories(req, res) {
    try {
      const categories = await llmService.getCategories();
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching categories'
      });
    }
  }

  /**
   * Generate questions using trained model
   * With input validation, sanitization, and audit logging
   */
  async generateQuestions(req, res) {
    try {
      // Support both 'topic' and 'keyword' field names for flexibility
      const { 
        topic, 
        keyword,  // Alternative field name from Frontend
        count = 5, 
        num_questions,  // Alternative field name from Frontend
        category = 'general',
        category_hint,  // Alternative field name from Frontend
        offset = 0 
      } = req.body;
      
      // Use whichever field is provided
      const inputTopic = topic || keyword;
      const inputCount = count || num_questions || 5;
      const inputCategory = category || category_hint || 'general';
      
      const userId = req.user?.id;
      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

      // ================================================================
      // STEP 1: Validate input
      // ================================================================
      const validation = validateKeyword(inputTopic);

      if (!validation.isValid) {
        // Log invalid attempt to audit
        await logInvalidInputAudit(userId, inputTopic, validation.reason, '/llm/generate', ipAddress);

        logger.warn(`Invalid input rejected | User: ${userId} | Reason: ${validation.reason} | Topic: "${inputTopic?.substring(0, 50)}"`);

        return res.status(400).json({
          success: false,
          error: 'INVALID_KEYWORD',
          message: validation.message,
          reason: validation.reason,
          suggestion: 'Please enter meaningful keywords, for example: "Machine Learning", "Digital Marketing"'
        });
      }

      // ================================================================
      // STEP 2: Sanitize input before processing
      // ================================================================
      const sanitizedTopic = sanitizeInput(inputTopic);

      logger.info(`Generating questions | User: ${userId} | Topic: "${sanitizedTopic}" | Count: ${inputCount} | Offset: ${offset}`);

      // ================================================================
      // STEP 3: Generate questions with cleaned input
      // ================================================================
      const result = await llmService.generateQuestions({
        topic: sanitizedTopic,
        count: parseInt(inputCount),
        category: inputCategory,
        userId: userId,
        offset: parseInt(offset)  // NEW: Support for regenerate
      });

      // Check for AI server unavailable error
      if (result.reason === 'AI_SERVER_UNAVAILABLE') {
        return res.status(503).json({
          success: false,
          message: result.error || 'AI Server is currently unavailable',
          reason: 'AI_SERVER_UNAVAILABLE'
        });
      }

      // Check for AI access denied error
      if (result.reason === 'AI_ACCESS_DENIED') {
        return res.status(403).json({
          success: false,
          message: result.error || 'AI access denied',
          reason: 'AI_ACCESS_DENIED',
          userRole: result.userRole,
          requiredRole: result.requiredRole
        });
      }

      // Include metadata in response for frontend
      res.status(200).json({
        success: true,
        data: result,
        category: result.category,
        confidence: result.confidence,
        metadata: result.metadata  // NEW: Include metadata
      });
    } catch (error) {
      logger.error('Generate questions error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error generating questions'
      });
    }
  }

  /**
   * Get prompts
   */
  async getPrompts(req, res) {
    try {
      const { type } = req.query;
      const prompts = await llmService.getPrompts(type);
      res.status(200).json({
        success: true,
        data: prompts
      });
    } catch (error) {
      logger.error('Get prompts error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching prompts'
      });
    }
  }

  /**
   * Create prompt
   */
  async createPrompt(req, res) {
    try {
      const prompt = await llmService.createPrompt(req.body, req.user);
      res.status(201).json({
        success: true,
        data: prompt
      });
    } catch (error) {
      logger.error('Create prompt error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating prompt'
      });
    }
  }

  /**
   * Get specific prompt
   */
  async getPrompt(req, res) {
    try {
      const { id } = req.params;
      const prompt = await llmService.getPrompt(id);
      res.status(200).json({
        success: true,
        data: prompt
      });
    } catch (error) {
      logger.error('Get prompt error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Prompt not found'
      });
    }
  }

  /**
   * Update prompt
   */
  async updatePrompt(req, res) {
    try {
      const { id } = req.params;
      const prompt = await llmService.updatePrompt(id, req.body, req.user);
      res.status(200).json({
        success: true,
        data: prompt
      });
    } catch (error) {
      logger.error('Update prompt error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating prompt'
      });
    }
  }

  /**
   * Delete prompt
   */
  async deletePrompt(req, res) {
    try {
      const { id } = req.params;
      await llmService.deletePrompt(id, req.user);
      res.status(200).json({
        success: true,
        message: 'Prompt deleted successfully'
      });
    } catch (error) {
      logger.error('Delete prompt error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting prompt'
      });
    }
  }



  /**
   * Predict category for text
   * With input validation and sanitization
   */
  async predictCategory(req, res) {
    try {
      const { keyword } = req.body;
      const userId = req.user?.id;
      const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

      // ================================================================
      // STEP 1: Validate input
      // ================================================================
      const validation = validateKeyword(keyword);

      if (!validation.isValid) {
        // Log invalid attempt to audit
        await logInvalidInputAudit(userId, keyword, validation.reason, '/llm/predict-category', ipAddress);

        logger.warn(`Invalid category prediction input | User: ${userId} | Reason: ${validation.reason}`);

        return res.status(400).json({
          success: false,
          error: 'INVALID_KEYWORD',
          message: validation.message,
          reason: validation.reason,
          data: {
            category: 'Unknown',
            confidence: 0
          }
        });
      }

      // ================================================================
      // STEP 2: Sanitize and predict
      // ================================================================
      const sanitizedKeyword = sanitizeInput(keyword);

      const prediction = await llmService.predictCategory({ keyword: sanitizedKeyword });

      // Check for AI server unavailable error
      if (prediction.reason === 'AI_SERVER_UNAVAILABLE') {
        return res.status(503).json({
          success: false,
          message: prediction.error || 'AI Server is currently unavailable',
          reason: 'AI_SERVER_UNAVAILABLE',
          data: {
            category: 'Unknown',
            confidence: 0
          }
        });
      }

      // ================================================================
      // STEP 3: Validate prediction result
      // ================================================================
      const invalidCategories = ['unknown', 'n/a', 'none', 'null', '', 'undefined'];
      const isInvalidCategory = !prediction.category ||
        invalidCategories.includes(prediction.category.toLowerCase().trim());

      // Normalize confidence to 0-100 scale for frontend
      let confidence = prediction.confidence || 0;
      if (confidence <= 1) {
        confidence = Math.round(confidence * 100);
      }

      // Log warning if category is unknown or low confidence
      if (isInvalidCategory || confidence < 50) {
        logger.warn(` Unclear category prediction | Keyword: "${sanitizedKeyword}" | Category: ${prediction.category} | Confidence: ${confidence}%`);
      }

      res.status(200).json({
        success: true,
        data: {
          category: prediction.category || 'Unknown',
          confidence: confidence,
          isValid: !isInvalidCategory && confidence >= 50,
          canGenerate: !isInvalidCategory && confidence >= 50,
          warningMessage: isInvalidCategory
            ? 'AI cannot identify the topic. Please provide more detailed keywords.'
            : confidence < 50
              ? `Low confidence (${confidence}%). Results may not be accurate.`
              : null
        }
      });
    } catch (error) {
      logger.error('Predict category error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error predicting category'
      });
    }
  }

  /**
   * Generate complete survey
   */
  async generateSurvey(req, res) {
    try {
      const survey = await llmService.generateSurvey(req.body);
      res.status(200).json({
        success: true,
        data: survey
      });
    } catch (error) {
      logger.error('Generate survey error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error generating survey'
      });
    }
  }

  /**
   * Test prompt
   */
  async testPrompt(req, res) {
    try {
      const { promptId } = req.params;
      const result = await llmService.testPrompt(promptId, req.body);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Test prompt error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error testing prompt'
      });
    }
  }

  /**
   * Create survey from generated questions
   */
  async createSurveyFromQuestions(req, res) {
    try {
      const {
        title,
        description,
        selectedQuestions,
        customQuestions,
        shareSettings,
        targetAudience,
        workspaceId,  // Add workspaceId
        startDate,
        endDate,
        quickInvite  // Add quickInvite
      } = req.body;

      if (!title || !selectedQuestions || selectedQuestions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title and at least one question are required'
        });
      }

      // Validate workspace requirement for internal surveys
      if (targetAudience === 'internal' && !workspaceId) {
        return res.status(400).json({
          success: false,
          message: 'Workspace ID is required for internal surveys'
        });
      }

      const result = await llmService.createSurveyFromQuestions(
        req.user.id,
        {
          title,
          description,
          selectedQuestions,
          customQuestions: customQuestions || [],
          shareSettings,
          targetAudience,
          workspaceId,  // Pass workspaceId
          startDate,
          endDate,
          quickInvite  // Pass quickInvite
        }
      );

      // Customize message based on invitation results
      let message = 'Survey created successfully';
      if (result.invitations && result.invitations.sent > 0) {
        message = `Survey created and ${result.invitations.sent} invitation${result.invitations.sent > 1 ? 's' : ''} sent!`;
      }

      res.status(201).json({
        success: true,
        message,
        data: result
      });
    } catch (error) {
      logger.error('Create survey from questions error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating survey'
      });
    }
  }
  /**
   * Export survey as PDF (HTML preview)
   */
  async exportSurveyPDF(req, res) {
    try {
      const { surveyId } = req.params;
      const userId = req.user.userId;
      const pdfHtml = await llmService.generateSurveyPDF(surveyId, userId); // ← ĐÚNG!
      // Return HTML for PDF conversion
      res.setHeader('Content-Type', 'text/html');
      res.send(pdfHtml);
    } catch (error) {
      logger.error('Export survey PDF error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error exporting survey PDF'
      });
    }
  }


  /**
   * Generate public link for survey
   */
  async generatePublicLink(req, res) {
    try {
      const { surveyId } = req.params;
      const { expiryDays } = req.body;

      const linkData = await llmService.generatePublicLink(surveyId, req.user.id, expiryDays);

      res.status(200).json({
        success: true,
        data: linkData
      });
    } catch (error) {
      logger.error('Create public link error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating public link'
      });
    }
  }

  /**
   * Get survey by public link token
   */
  async getSurveyByToken(req, res) {
    try {
      const { token } = req.params;

      const survey = await llmService.getSurveyByPublicLink(token);

      res.json({
        success: true,
        data: survey
      });
    } catch (error) {
      logger.error('Get survey by token error:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Survey not found'
      });
    }
  }

  /**
   * Submit survey response
   */
  async submitSurveyResponse(req, res) {
    try {
      const { token } = req.params;
      const responseData = req.body;

      const result = await llmService.submitSurveyResponse(token, responseData);

      res.json({
        success: true,
        message: result.message,
        data: { responseId: result.responseId }
      });
    } catch (error) {
      logger.error('Submit survey response error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error submitting response'
      });
    }
  }

  /**
   * Get survey responses and analytics
   */
  async getSurveyResults(req, res) {
    try {
      const { surveyId } = req.params;
      const userId = req.user ? req.user.userId : 1; // Default to admin for demo

      const results = await llmService.getSurveyResponses(surveyId, userId);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Get survey results error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error getting survey results'
      });
    }
  }

  /**
   * Get survey responses and analytics (public access for demo)
   */
  async getSurveyResultsPublic(req, res) {
    try {
      const { surveyId } = req.params;
      const userId = 1; // Use admin user for public access

      const results = await llmService.getSurveyResponses(surveyId, userId);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Get survey results error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error getting survey results'
      });
    }
  }

  /**
   * Export survey as PDF (HTML preview)
   */
  async exportSurveyPDF(req, res) {
    try {
      const { surveyId } = req.params;
      const userId = req.user.userId;

      const pdfHtml = await llmService.generateSurveyPDF(surveyId, userId);

      // Return HTML for PDF conversion
      res.setHeader('Content-Type', 'text/html');
      res.send(pdfHtml);
    } catch (error) {
      logger.error('Export survey PDF error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error exporting survey PDF'
      });
    }
  }

  /**
   * Get survey for editing
   */
  async getSurveyForEditing(req, res) {
    try {
      const { surveyId } = req.params;
      const userId = req.user?.id;

      console.log('getSurveyForEditing - userId:', userId, 'req.user:', req.user);

      const result = await llmService.getSurveyForEditing(surveyId, userId);

      res.status(200).json({
        success: true,
        data: result.survey
      });
    } catch (error) {
      logger.error('Get survey for editing error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error getting survey for editing'
      });
    }
  }

  /**
   * Update survey settings
   */
  async updateSurveySettings(req, res) {
    try {
      const { surveyId } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      const result = await llmService.updateSurveySettings(surveyId, userId, updateData);

      res.status(200).json({
        success: true,
        data: result.survey,
        message: result.message
      });
    } catch (error) {
      logger.error('Update survey settings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating survey settings'
      });
    }
  }

  /**
   * Update survey question
   */
  async updateSurveyQuestion(req, res) {
    try {
      const { surveyId, questionId } = req.params;
      const userId = req.user?.id;
      const questionData = req.body;

      const result = await llmService.updateSurveyQuestion(surveyId, questionId, userId, questionData);

      res.status(200).json({
        success: true,
        data: result.question,
        message: result.message
      });
    } catch (error) {
      logger.error('Update survey question error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating survey question'
      });
    }
  }

  /**
   * Delete survey question
   */
  async deleteSurveyQuestion(req, res) {
    try {
      const { surveyId, questionId } = req.params;
      const userId = req.user?.id;

      const result = await llmService.deleteSurveyQuestion(surveyId, questionId, userId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Delete survey question error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting survey question'
      });
    }
  }

  /**
   * Add new survey question
   */
  async addSurveyQuestion(req, res) {
    try {
      const { surveyId } = req.params;
      const userId = req.user?.id;
      const questionData = req.body;

      const result = await llmService.addSurveyQuestion(surveyId, userId, questionData);

      res.status(201).json({
        success: true,
        data: result.question,
        message: result.message
      });
    } catch (error) {
      logger.error('Add survey question error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error adding survey question'
      });
    }
  }

  // ============================================================================
  // CIRCUIT BREAKER & SAFETY ENDPOINTS
  // ============================================================================

  /**
   * Get Circuit Breaker status for all services
   */
  async getCircuitBreakerStatus(req, res) {
    try {
      const status = getAllCircuitBreakerStatus();

      res.status(200).json({
        success: true,
        data: {
          circuitBreakers: status,
          timestamp: new Date().toISOString(),
          summary: {
            total: Object.keys(status).length,
            open: Object.values(status).filter(s => s.state === 'OPEN').length,
            closed: Object.values(status).filter(s => s.state === 'CLOSED').length,
            halfOpen: Object.values(status).filter(s => s.state === 'HALF_OPEN').length
          }
        }
      });
    } catch (error) {
      logger.error('Get circuit breaker status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching circuit breaker status'
      });
    }
  }

  /**
   * Generate questions with Circuit Breaker protection
   * Wraps AI service calls to protect database when AI service is down
   */
  async generateQuestionsProtected(req, res) {
    const user = req.user;
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    const aiCircuitBreaker = circuitBreakers.aiService;

    try {
      const { topic, keyword, count = 5, category = 'general' } = req.body;
      const questionTopic = topic || keyword;
      const userId = user?.id;

      // ================================================================
      // STEP 1: Check for blocked characters (@, #)
      // ================================================================
      const blockedCheck = checkBlockedCharacters(questionTopic);
      if (blockedCheck.hasBlocked) {
        await logInvalidInputAudit(userId, questionTopic, 'BLOCKED_CHARACTERS', '/llm/generate-protected', ipAddress);

        return res.status(400).json({
          success: false,
          error: 'BLOCKED_CHARACTERS',
          message: blockedCheck.message,
          blockedChars: blockedCheck.blockedChars
        });
      }

      // ================================================================
      // STEP 2: Validate input
      // ================================================================
      const validation = validateKeyword(questionTopic);
      if (!validation.isValid) {
        await logInvalidInputAudit(userId, questionTopic, validation.reason, '/llm/generate-protected', ipAddress);

        return res.status(400).json({
          success: false,
          error: 'INVALID_KEYWORD',
          message: validation.message,
          reason: validation.reason
        });
      }

      // ================================================================
      // STEP 3: Check Circuit Breaker before calling AI
      // ================================================================
      if (!aiCircuitBreaker.canRequest()) {
        const cbState = aiCircuitBreaker.getState();
        logger.warn(`Circuit Breaker OPEN - rejecting request from user ${userId}`);

        return res.status(503).json({
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: 'AI service đang tạm ngưng do quá tải. Vui lòng thử lại sau.',
          retryAfter: cbState.stats?.lastStateChange,
          circuitState: cbState.state
        });
      }

      // ================================================================
      // STEP 4: Execute with Circuit Breaker protection
      // ================================================================
      const sanitizedTopic = sanitizeInput(questionTopic);

      const result = await aiCircuitBreaker.execute(async () => {
        return await llmService.generateQuestions({
          topic: sanitizedTopic,
          count: parseInt(count),
          category,
          userId
        });
      }, { requestId: `gen_${userId}_${Date.now()}` });

      res.status(200).json({
        success: true,
        data: result,
        circuitState: aiCircuitBreaker.getState().state
      });

    } catch (error) {
      if (error.name === 'CircuitBreakerError') {
        return res.status(503).json({
          success: false,
          error: 'CIRCUIT_OPEN',
          message: error.message,
          retryAfter: error.retryAfter
        });
      }

      logger.error('Generate questions protected error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error generating questions'
      });
    }
  }

  /**
   * Validate input endpoint - check for blocked characters and validity
   */
  async validateInput(req, res) {
    try {
      const { keyword } = req.body;

      // Check blocked characters first
      const blockedCheck = checkBlockedCharacters(keyword);
      if (blockedCheck.hasBlocked) {
        return res.status(200).json({
          success: true,
          data: {
            isValid: false,
            reason: 'BLOCKED_CHARACTERS',
            message: blockedCheck.message,
            blockedChars: blockedCheck.blockedChars,
            canProceed: false
          }
        });
      }

      // Full validation
      const validation = validateKeyword(keyword);

      res.status(200).json({
        success: true,
        data: {
          isValid: validation.isValid,
          reason: validation.reason || null,
          message: validation.message || 'Input is valid',
          cleaned: validation.cleaned || sanitizeInput(keyword),
          canProceed: validation.isValid
        }
      });
    } catch (error) {
      logger.error('Validate input error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error validating input'
      });
    }
  }
}

// Create instance
const llmController = new LLMController();

module.exports = {
  getPrompts: llmController.getPrompts.bind(llmController),
  getCategories: llmController.getCategories.bind(llmController),
  generateQuestions: llmController.generateQuestions.bind(llmController),
  createSurveyFromQuestions: llmController.createSurveyFromQuestions.bind(llmController),
  exportSurveyPDF: llmController.exportSurveyPDF.bind(llmController),
  createPrompt: llmController.createPrompt.bind(llmController),
  getPrompt: llmController.getPrompt.bind(llmController),
  updatePrompt: llmController.updatePrompt.bind(llmController),
  deletePrompt: llmController.deletePrompt.bind(llmController),
  predictCategory: llmController.predictCategory.bind(llmController),
  generateSurvey: llmController.generateSurvey.bind(llmController),
  testPrompt: llmController.testPrompt.bind(llmController),
  generatePublicLink: llmController.generatePublicLink.bind(llmController),
  getSurveyByToken: llmController.getSurveyByToken.bind(llmController),
  submitSurveyResponse: llmController.submitSurveyResponse.bind(llmController),
  getSurveyResults: llmController.getSurveyResults.bind(llmController),
  getSurveyResultsPublic: llmController.getSurveyResultsPublic.bind(llmController),
  // Survey editing methods
  getSurveyForEditing: llmController.getSurveyForEditing.bind(llmController),
  updateSurveySettings: llmController.updateSurveySettings.bind(llmController),
  updateSurveyQuestion: llmController.updateSurveyQuestion.bind(llmController),
  deleteSurveyQuestion: llmController.deleteSurveyQuestion.bind(llmController),
  addSurveyQuestion: llmController.addSurveyQuestion.bind(llmController),
  // Circuit Breaker & Safety
  getCircuitBreakerStatus: llmController.getCircuitBreakerStatus.bind(llmController),
  generateQuestionsProtected: llmController.generateQuestionsProtected.bind(llmController),
  validateInput: llmController.validateInput.bind(llmController)
};