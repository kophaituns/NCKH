<<<<<<< HEAD
// modules/llm/controller/llm.controller.js
const llmService = require('../service/llm.service');
const logger = require('../../../utils/logger');

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
        category,
        userId: req.user?.id
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
=======
// src/modules/llm/controller/llm.controller.js
const llmService = require('../service/llm.service');
const logger = require('../../../utils/logger');

class LlmController {
  /**
   * Generate a survey based on a prompt
   */
  async generateSurvey(req, res) {
    try {
      if (!llmService.isOpenAIConfigured()) {
        return res.status(503).json({
          error: true,
          message: 'LLM service is not available. OpenAI API key not configured.',
        });
      }

      const surveyData = await llmService.generateSurvey(req.user.id, req.body);

      return res.status(200).json({
        error: false,
        message: 'Survey generated successfully',
        data: surveyData
      });
    } catch (error) {
      logger.error('Error generating survey:', error);
      return res.status(500).json({
        error: true,
        message: error.message || 'An error occurred while generating survey'
>>>>>>> linh2
      });
    }
  }

  /**
<<<<<<< HEAD
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
=======
   * Analyze survey responses
   */
  async analyzeSurveyResponses(req, res) {
    try {
      const { survey_id, analysis_type } = req.body;

      const result = await llmService.analyzeSurveyResponses(req.user.id, survey_id, analysis_type);

      // Check if user has permission to analyze this survey
      if (!llmService.canAnalyzeSurvey(req.user, result.survey)) {
        return res.status(403).json({
          error: true,
          message: 'You do not have permission to analyze this survey'
        });
      }

      return res.status(200).json({
        error: false,
        message: 'Survey responses analyzed successfully',
        data: {
          analysis_id: result.analysis_id,
          analysis_type: result.analysis_type,
          result: result.result
        }
      });
    } catch (error) {
      logger.error('Error analyzing survey responses:', error);
      
      if (error.message === 'Survey not found') {
        return res.status(404).json({ error: true, message: error.message });
      }
      if (error.message === 'Invalid analysis type' || error.message === 'No responses found for this survey') {
        return res.status(400).json({ error: true, message: error.message });
      }
      
      return res.status(500).json({
        error: true,
        message: error.message || 'An error occurred while analyzing survey responses'
>>>>>>> linh2
      });
    }
  }

  /**
<<<<<<< HEAD
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
=======
   * Get all saved LLM prompts
   */
  async getLlmPrompts(req, res) {
    try {
      const prompts = await llmService.getLlmPrompts(req.query.type);

      return res.status(200).json({
        error: false,
        data: { prompts }
      });
    } catch (error) {
      logger.error('Error fetching LLM prompts:', error);
      return res.status(500).json({
        error: true,
        message: 'An error occurred while fetching LLM prompts'
>>>>>>> linh2
      });
    }
  }

  /**
<<<<<<< HEAD
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
=======
   * Create a new LLM prompt
   */
  async createLlmPrompt(req, res) {
    try {
      const { prompt_name, prompt_type, prompt_text } = req.body;

      const prompt = await llmService.createLlmPrompt(req.user.id, {
        prompt_name,
        prompt_type,
        prompt_text
      });

      return res.status(201).json({
        error: false,
        message: 'LLM prompt created successfully',
        data: { prompt }
      });
    } catch (error) {
      logger.error('Error creating LLM prompt:', error);
      
      if (error.message === 'Invalid prompt type') {
        return res.status(400).json({ error: true, message: error.message });
      }
      
      return res.status(500).json({
        error: true,
        message: 'An error occurred while creating LLM prompt'
      });
    }
  }

  /**
   * Get analysis results for a survey
   */
  async getAnalysisResults(req, res) {
    try {
      const { survey_id } = req.params;

      const { survey, analysisResults } = await llmService.getAnalysisResults(survey_id);

      // Check if user has permission to view analysis results
      if (!llmService.canAnalyzeSurvey(req.user, survey)) {
        return res.status(403).json({
          error: true,
          message: 'You do not have permission to view analysis results for this survey'
        });
      }

      return res.status(200).json({
        error: false,
        data: { analysisResults }
      });
    } catch (error) {
      logger.error(`Error fetching analysis results for survey ID ${req.params.survey_id}:`, error);
      
      if (error.message === 'Survey not found') {
        return res.status(404).json({ error: true, message: error.message });
      }
      
      return res.status(500).json({
        error: true,
        message: 'An error occurred while fetching analysis results'
      });
    }
  }

  /**
   * Get prompt by ID
   */
  async getPromptById(req, res) {
    try {
      const { id } = req.params;
      const prompt = await llmService.getPromptById(id, req.user.id, req.user.role);

      return res.status(200).json({
        success: true,
        data: { prompt }
      });
    } catch (error) {
      logger.error('Get prompt error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Error fetching prompt'
>>>>>>> linh2
      });
    }
  }

  /**
   * Update prompt
   */
  async updatePrompt(req, res) {
    try {
      const { id } = req.params;
<<<<<<< HEAD
      const prompt = await llmService.updatePrompt(id, req.body, req.user);
      res.status(200).json({
        success: true,
        data: prompt
      });
    } catch (error) {
      logger.error('Update prompt error:', error);
      res.status(500).json({
=======
      const prompt = await llmService.updatePrompt(id, req.body, req.user.id, req.user.role);

      return res.status(200).json({
        success: true,
        message: 'Prompt updated successfully',
        data: { prompt }
      });
    } catch (error) {
      logger.error('Update prompt error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
>>>>>>> linh2
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
<<<<<<< HEAD
      await llmService.deletePrompt(id, req.user);
      res.status(200).json({
        success: true,
        message: 'Prompt deleted successfully'
      });
    } catch (error) {
      logger.error('Delete prompt error:', error);
      res.status(500).json({
=======
      const result = await llmService.deletePrompt(id, req.user.id, req.user.role);

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Delete prompt error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
>>>>>>> linh2
        success: false,
        message: error.message || 'Error deleting prompt'
      });
    }
  }

  /**
   * Generate questions using AI
   */
  async generateQuestions(req, res) {
<<<<<<< HEAD
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
        category,
        user?.id
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
=======
    try {
      const { keyword, category, count } = req.body;
      
      if (!keyword) {
        return res.status(400).json({
          error: true,
          message: 'Keyword is required'
        });
      }

      const result = await llmService.generateQuestions(req.user.id, {
        keyword,
        category,
        count: count || 5
      });

      return res.status(200).json({
        error: false,
        message: 'Questions generated successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error generating questions:', error);
      return res.status(500).json({
        error: true,
        message: error.message || 'Error generating questions'
>>>>>>> linh2
      });
    }
  }

  /**
<<<<<<< HEAD
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
=======
   * Predict category for keyword
   */
  async predictCategory(req, res) {
    try {
      const { keyword } = req.body;
      
      if (!keyword) {
        return res.status(400).json({
          error: true,
          message: 'Keyword is required'
        });
      }

      const result = await llmService.predictCategory(req.user.id, { keyword });

      return res.status(200).json({
        error: false,
        message: 'Category predicted successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error predicting category:', error);
      return res.status(500).json({
        error: true,
>>>>>>> linh2
        message: error.message || 'Error predicting category'
      });
    }
  }

  /**
<<<<<<< HEAD
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
=======
   * Get available categories
   */
  async getCategories(req, res) {
    try {
      const result = await llmService.getCategories();

      return res.status(200).json({
        error: false,
        data: result
      });
    } catch (error) {
      logger.error('Error getting categories:', error);
      return res.status(500).json({
        error: true,
        message: 'Error getting categories'
>>>>>>> linh2
      });
    }
  }

  /**
<<<<<<< HEAD
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
=======
   * Check Hugging Face API health
   */
  async checkHuggingFaceHealth(req, res) {
    try {
      const result = await llmService.checkHuggingFaceHealth();

      return res.status(200).json({
        error: false,
        data: result
      });
    } catch (error) {
      logger.error('Error checking Hugging Face health:', error);
      return res.status(500).json({
        error: true,
        message: 'Error checking API health'
>>>>>>> linh2
      });
    }
  }
}

<<<<<<< HEAD
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
  addSurveyQuestion: llmController.addSurveyQuestion.bind(llmController)
};
=======
module.exports = new LlmController();
>>>>>>> linh2
