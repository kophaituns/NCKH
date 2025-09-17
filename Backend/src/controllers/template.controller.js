// src/controllers/template.controller.js
const { SurveyTemplate, Question, QuestionOption, QuestionType } = require('../models');
const logger = require('../utils/logger');

/**
 * Create a new survey template
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.createTemplate = async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    // Create template
    const template = await SurveyTemplate.create({
      title,
      description,
      created_by: req.user.id,
      status: 'draft'
    });

    // If questions are provided, create them
    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        // Create question
        const question = await Question.create({
          survey_template_id: template.id,
          question_text: q.question_text,
          question_type_id: q.question_type_id,
          required: q.required || false,
          display_order: i + 1
        });

        // If options are provided for this question, create them
        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
          for (let j = 0; j < q.options.length; j++) {
            await QuestionOption.create({
              question_id: question.id,
              option_text: q.options[j],
              display_order: j + 1
            });
          }
        }
      }
    }

    return res.status(201).json({
      error: false,
      message: 'Survey template created successfully',
      data: { template }
    });
  } catch (error) {
    logger.error('Error creating survey template:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while creating survey template'
    });
  }
};

/**
 * Get all survey templates
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getAllTemplates = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get templates
    const { count, rows: templates } = await SurveyTemplate.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      error: false,
      data: {
        templates,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching survey templates:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching survey templates'
    });
  }
};

/**
 * Get template by ID with questions and options
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get template with questions and options
    const template = await SurveyTemplate.findByPk(id, {
      include: [
        {
          model: Question,
          include: [
            {
              model: QuestionOption
            },
            {
              model: QuestionType
            }
          ]
        }
      ]
    });

    if (!template) {
      return res.status(404).json({
        error: true,
        message: 'Survey template not found'
      });
    }

    return res.status(200).json({
      error: false,
      data: { template }
    });
  } catch (error) {
    logger.error(`Error fetching template with ID ${req.params.id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching survey template'
    });
  }
};

/**
 * Update template
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    // Find template
    const template = await SurveyTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        error: true,
        message: 'Survey template not found'
      });
    }

    // Check if user has permission to update this template
    if (req.user.role === 'student' || (req.user.role === 'teacher' && template.created_by !== req.user.id)) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to update this template'
      });
    }

    // Update template
    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(status && { status })
    };

    await template.update(updateData);

    return res.status(200).json({
      error: false,
      message: 'Survey template updated successfully',
      data: { template }
    });
  } catch (error) {
    logger.error(`Error updating template with ID ${req.params.id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while updating survey template'
    });
  }
};

/**
 * Delete template
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Find template
    const template = await SurveyTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        error: true,
        message: 'Survey template not found'
      });
    }

    // Check if user has permission to delete this template
    if (req.user.role === 'student' || (req.user.role === 'teacher' && template.created_by !== req.user.id)) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to delete this template'
      });
    }

    // Check if template is being used by any surveys
    const usedByCount = await Survey.count({
      where: { template_id: id }
    });

    if (usedByCount > 0) {
      return res.status(400).json({
        error: true,
        message: 'Cannot delete a template that is being used by surveys'
      });
    }

    // Delete template (questions and options will be deleted by cascade)
    await template.destroy();

    return res.status(200).json({
      error: false,
      message: 'Survey template deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting template with ID ${req.params.id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while deleting survey template'
    });
  }
};

/**
 * Get question types
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getQuestionTypes = async (req, res) => {
  try {
    const questionTypes = await QuestionType.findAll();

    return res.status(200).json({
      error: false,
      data: { questionTypes }
    });
  } catch (error) {
    logger.error('Error fetching question types:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching question types'
    });
  }
};
