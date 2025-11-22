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
      
      const result = await llmService.exportSurveyToPDF(surveyId, req.user.id);
      
      // Return HTML content that can be printed as PDF by browser
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${result.survey.title} - PDF Export</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #007bff; padding-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .description { font-size: 16px; color: #666; margin-bottom: 15px; line-height: 1.5; }
            .meta { font-size: 14px; color: #999; }
            .question { margin: 30px 0; padding: 20px; border-left: 4px solid #007bff; background: #f8f9fa; page-break-inside: avoid; }
            .question-number { font-weight: bold; color: #007bff; font-size: 18px; margin-bottom: 10px; }
            .question-type { font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 500; margin-bottom: 10px; }
            .options { margin: 20px 0; }
            .option { margin: 10px 0; padding: 8px 12px; background: white; border: 1px solid #dee2e6; border-radius: 4px; }
            .checkbox { display: inline-block; width: 16px; height: 16px; border: 2px solid #007bff; margin-right: 10px; vertical-align: middle; }
            .text-answer { margin: 15px 0; border: 1px solid #dee2e6; height: 40px; background: white; border-radius: 4px; }
            .rating { margin: 15px 0; display: flex; gap: 10px; align-items: center; }
            .rating-box { width: 30px; height: 30px; border: 2px solid #007bff; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 4px; }
            .no-questions { padding: 40px 20px; text-align: center; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px; }
            @media print { 
              body { background: white; } 
              .container { box-shadow: none; } 
              .question { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${result.htmlContent}
          </div>
          <div class="footer">
            <p>Khảo sát được tạo bằng Survey System - ${new Date().toLocaleDateString('vi-VN')}</p>
            <p>Tổng số câu hỏi: ${result.survey.questionCount}</p>
          </div>
          <script>
            // Auto print when page loads
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 1000);
            }
          </script>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
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
      const userId = req.user.userId;

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
  getSurveyResults: llmController.getSurveyResults.bind(llmController)
};