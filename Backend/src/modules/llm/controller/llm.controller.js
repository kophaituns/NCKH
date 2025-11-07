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
      });
    }
  }

  /**
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
      });
    }
  }

  /**
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
      });
    }
  }

  /**
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
      });
    }
  }

  /**
   * Update prompt
   */
  async updatePrompt(req, res) {
    try {
      const { id } = req.params;
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
        success: false,
        message: error.message || 'Error deleting prompt'
      });
    }
  }
}

module.exports = new LlmController();
