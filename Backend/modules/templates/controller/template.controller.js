// modules/templates/controller/template.controller.js
const templateService = require('../service/template.service');
const logger = require('../../../src/utils/logger');

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

      // Normalize questions format to match public API
      const normalizedQuestions = (template.Questions || []).map(q => ({
        id: q.id,
        label: q.question_text,
        type: q.QuestionType ? q.QuestionType.type_name : 'open_ended',
        required: q.required,
        display_order: q.display_order,
        options: (q.QuestionOptions || []).map(opt => ({
          id: opt.id,
          text: opt.option_text,
          display_order: opt.display_order
        }))
      }));

      res.status(200).json({
        success: true,
        ok: true,
        data: { 
          template,
          template_id: template.id,
          title: template.title
        },
        template: template,
        questions: normalizedQuestions
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
        ok: true,
        message: 'Template created successfully',
        id: template.id,
        data: { 
          template,
          template_id: template.id
        }
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
      const templateId = Number(req.params.id);

      // Validation
      if (!templateId || isNaN(templateId)) {
        return res.status(400).json({
          success: false,
          ok: false,
          code: 'INVALID_INPUT',
          message: 'Invalid template ID'
        });
      }

      const result = await templateService.deleteTemplate(templateId, req.user);

      // Return the status and response from service
      return res.status(result.status).json({
        success: result.ok,
        ok: result.ok,
        code: result.code,
        message: result.message,
        details: result.details
      });
    } catch (error) {
      logger.error('Delete template error:', error);
      
      // Handle FK constraint error gracefully as a fallback
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          success: false,
          ok: false,
          code: 'TEMPLATE_IN_USE',
          message: 'This template is used by existing surveys or responses and cannot be deleted.'
        });
      }
      
      return res.status(500).json({
        success: false,
        ok: false,
        message: 'Failed to delete template',
        error: error.message
      });
    }
  }

  /**
   * Archive template
   */
  async archiveTemplate(req, res) {
    try {
      const templateId = Number(req.params.id);

      if (!templateId || isNaN(templateId)) {
        return res.status(400).json({
          success: false,
          ok: false,
          message: 'Invalid template ID'
        });
      }

      const result = await templateService.archiveTemplate(templateId, req.user);

      return res.status(result.status).json({
        success: result.ok,
        ok: result.ok,
        message: result.message,
        data: result.template ? { template: result.template } : undefined
      });
    } catch (error) {
      logger.error('Archive template error:', error);
      
      return res.status(500).json({
        success: false,
        ok: false,
        message: 'Failed to archive template',
        error: error.message
      });
    }
  }

  /**
   * Unarchive template
   */
  async unarchiveTemplate(req, res) {
    try {
      const templateId = Number(req.params.id);

      if (!templateId || isNaN(templateId)) {
        return res.status(400).json({
          success: false,
          ok: false,
          message: 'Invalid template ID'
        });
      }

      const result = await templateService.unarchiveTemplate(templateId, req.user);

      return res.status(result.status).json({
        success: result.ok,
        ok: result.ok,
        message: result.message,
        data: result.template ? { template: result.template } : undefined
      });
    } catch (error) {
      logger.error('Unarchive template error:', error);
      
      return res.status(500).json({
        success: false,
        ok: false,
        message: 'Failed to unarchive template',
        error: error.message
      });
    }
  }

  /**
   * Add question to template
   */
  async addQuestion(req, res) {
    try {
      const { id } = req.params;
      // Accept both 'label' and 'question_text' for backward compatibility
      const { question_type_id, label, question_text, is_required, display_order, options } = req.body;
      const questionLabel = label || question_text;

      // Validation
      if (!question_type_id || !questionLabel) {
        return res.status(400).json({
          success: false,
          message: 'Question type and text are required'
        });
      }

      // Pass normalized data to service
      const normalizedBody = {
        ...req.body,
        question_text: questionLabel
      };

      const template = await templateService.addQuestion(id, normalizedBody, req.user);
      
      // Get the last added question
      const lastQuestion = template.Questions && template.Questions.length > 0 
        ? template.Questions[template.Questions.length - 1]
        : null;

      // Normalize the question response to include 'label'
      const normalizedQuestion = lastQuestion ? {
        ...lastQuestion.toJSON(),
        label: lastQuestion.question_text
      } : null;

      res.status(201).json({
        success: true,
        ok: true,
        message: 'Question added successfully',
        question: normalizedQuestion,
        data: { 
          template,
          question_id: normalizedQuestion ? normalizedQuestion.id : null,
          question: normalizedQuestion
        }
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

  /**
   * Get questions by template ID
   */
  async getQuestionsByTemplate(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          ok: false,
          message: 'Invalid template ID'
        });
      }

      const template = await templateService.getTemplateById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          ok: false,
          message: 'Template not found'
        });
      }

      res.status(200).json({
        success: true,
        ok: true,
        questions: template.Questions || []
      });
    } catch (error) {
      logger.error('Get questions by template error:', error);
      res.status(500).json({
        success: false,
        ok: false,
        message: error.message || 'Error fetching questions'
      });
    }
  }
}

module.exports = new TemplateController();
