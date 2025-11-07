// src/modules/templates/controller/template.controller.js
const templateService = require('../service/template.service');
const logger = require('../../../utils/logger');

class TemplateController {
  /**
   * Get all templates
   */
  async getAllTemplates(req, res) {
    try {
      const { page, limit, search } = req.query;

      const result = await templateService.getAllTemplates(
        { page, limit, search },
        req.user
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching templates'
      });
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;

      const template = await templateService.getTemplateById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { template }
      });
    } catch (error) {
      logger.error('Get template error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching template'
      });
    }
  }

  /**
   * Create new template
   */
  async createTemplate(req, res) {
    try {
      const { title, description, questions } = req.body;

      // Validation
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      const template = await templateService.createTemplate(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: { template }
      });
    } catch (error) {
      logger.error('Create template error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error creating template'
      });
    }
  }

  /**
   * Update template
   */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;

      const template = await templateService.updateTemplate(id, req.body, req.user);

      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: { template }
      });
    } catch (error) {
      logger.error('Update template error:', error);

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

      res.status(500).json({
        success: false,
        message: error.message || 'Error updating template'
      });
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;

      await templateService.deleteTemplate(id, req.user);

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      logger.error('Delete template error:', error);

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

      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting template'
      });
    }
  }

  /**
   * Add question to template
   */
  async addQuestion(req, res) {
    try {
      const { id } = req.params;
      const { question_type_id, question_text, is_required, display_order, options } = req.body;

      // Validation
      if (!question_type_id || !question_text) {
        return res.status(400).json({
          success: false,
          message: 'Question type and text are required'
        });
      }

      const template = await templateService.addQuestion(id, req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Question added successfully',
        data: { template }
      });
    } catch (error) {
      logger.error('Add question error:', error);

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

      res.status(500).json({
        success: false,
        message: error.message || 'Error adding question'
      });
    }
  }

  /**
   * Get question types
   */
  async getQuestionTypes(req, res) {
    try {
      const types = await templateService.getQuestionTypes();

      res.status(200).json({
        success: true,
        data: { types }
      });
    } catch (error) {
      logger.error('Get question types error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching question types'
      });
    }
  }
}

module.exports = new TemplateController();
