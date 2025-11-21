// modules/llm/controller/llm.controller.js
const llmService = require('../service/llm.service');
const logger = require('../../../src/utils/logger');

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
   */
  async generateQuestions(req, res) {
    try {
      const { topic, count = 5, category = 'general' } = req.body;
      
      if (!topic) {
        return res.status(400).json({
          success: false,
          message: 'Topic is required'
        });
      }

      const result = await llmService.generateQuestions({
        topic,
        count: parseInt(count),
        category
      });

      res.status(200).json({
        success: true,
        data: result
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
   * Generate questions using AI
   */
  async generateQuestions(req, res) {
    const user = req.user;
    
    try {
      console.log('🔍 Generate Questions Request Body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 Request Headers:', req.headers['content-type']);
      
      // Validate request body
      const { topic, keyword, count = 5, category = 'general' } = req.body;
      
      // Accept both 'topic' and 'keyword' (frontend uses 'keyword')
      const questionTopic = topic || keyword;
      
      if (!questionTopic || typeof questionTopic !== 'string' || !questionTopic.trim()) {
        console.log('❌ Topic/keyword validation failed:', { topic, keyword, count, category });
        return res.status(400).json({
          success: false,
          message: 'Topic or keyword is required and must be a non-empty string',
          received: req.body
        });
      }

      // Validate count
      const questionCount = parseInt(count);
      if (isNaN(questionCount) || questionCount < 1 || questionCount > 20) {
        console.log('❌ Count validation failed:', { count, questionCount });
        return res.status(400).json({
          success: false,
          message: 'Count must be a number between 1 and 20'
        });
      }

      logger.info(`🤖 User ${user.username} generating ${questionCount} questions for topic: ${questionTopic}`);
      
      // Call LLM service to generate questions using trained model
      const result = await llmService.generateQuestionsFromTrainedModel(
        questionTopic.trim(), 
        questionCount, 
        category
      );

      res.json({
        success: true,
        data: result,
        user_info: {
          user_id: user.id,
          username: user.username
        }
      });
      
    } catch (error) {
      logger.error(`❌ Error in generateQuestions: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to generate questions',
        error: error.message
      });
    }
  }

  /**
   * Predict category for text
   */
  async predictCategory(req, res) {
    try {
      const prediction = await llmService.predictCategory(req.body);
      res.status(200).json({
        success: true,
        data: prediction
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
        startDate,
        endDate 
      } = req.body;

      if (!title || !selectedQuestions || selectedQuestions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title and at least one question are required'
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
          startDate,
          endDate
        }
      );

      res.status(201).json({
        success: true,
        message: 'Survey created successfully',
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
   * Export survey as PDF
   */
  async exportSurveyPDF(req, res) {
    try {
      const { surveyId } = req.params;
      
      const pdfBuffer = await llmService.exportSurveyToPDF(surveyId, req.user.id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="survey-${surveyId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Export survey PDF error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error exporting PDF'
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
      logger.error('Generate public link error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error generating public link'
      });
    }
  }
}

module.exports = new LLMController();