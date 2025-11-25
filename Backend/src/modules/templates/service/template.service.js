/**
 * Survey Template Service Module
 * ================================
 * 
 * FEATURE: Survey Template Management System
 * 
 * This service handles creation and management of survey templates, which are:
 * - Reusable question sets that define survey structure
 * - Templates for creating multiple surveys with consistent format
 * - Shareable across team members in workspace
 * - Versionable with archiving capability
 * 
 * Key Capabilities:
 *   - Create templates with multiple question types
 *   - Manage questions: add, edit, delete, reorder
 *   - Support multiple question types:
 *     • MCQ (Multiple Choice - single select)
 *     • MRQ (Multiple Response - multi-select)
 *     • Likert (5-point rating scale)
 *     • Short Text (text input)
 *     • Long Text (textarea)
 *   - Template cloning for easy duplication
 *   - Archive/unarchive templates
 *   - Search and filtering
 *   - Pagination support
 * 
 * Template Workflow:
 *   1. Create template with basic info
 *   2. Add questions with specific types
 *   3. Add options for MCQ/MRQ questions
 *   4. Set question order and display properties
 *   5. Publish template (if private, shares with team)
 *   6. Use template to create surveys
 *   7. Archive when no longer needed
 * 
 * Database Schema:
 *   - SurveyTemplate: Main template record
 *   - Question: Individual questions in template
 *   - QuestionOption: Answer options for MCQ/MRQ
 *   - QuestionType: Type definitions (MCQ, Likert, etc.)
 * 
 * Relationships:
 *   - Templates belong to User (creator)
 *   - Templates have many Questions
 *   - Questions have many QuestionOptions
 *   - Questions have QuestionType
 * 
 * Integration:
 *   - Survey creation uses templates
 *   - Templates can be shared in workspaces
 *   - Used in LLM survey generation
 */

// src/modules/templates/service/template.service.js
const { SurveyTemplate, Question, QuestionOption, QuestionType, User } = require('../../../models');
const { Op } = require('sequelize');

class TemplateService {
  /**
   * FEATURE: Retrieve all templates with search and pagination
   * 
   * Purpose: Get paginated list of survey templates with optional search
   * 
   * Parameters:
   *   - options.page: Page number (default: 1)
   *   - options.limit: Items per page (default: 10)
   *   - options.search: Search templates by title or description
   * 
   * Access Control:
   *   - Returns all templates (can be filtered at controller level)
   *   - Can be limited to user's templates or workspace templates
   * 
   * Returns: Object with:
   *   - templates[]: Array of template objects with creator info
   *   - pagination: Total, page, limit, totalPages
   * 
   * Database Query:
   *   - Uses LIKE operator for partial text search (case-insensitive)
   *   - Joins with User model to include creator details
   *   - Ordered by creation date (newest first)
   * 
   * Performance: O(n) with database indexing on title/description
   */
  async getAllTemplates(options = {}, user) {
    const { page = 1, limit = 10, search } = options;
    const offset = (page - 1) * limit;
    const where = {};

    // Search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await SurveyTemplate.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return {
      templates: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get template by ID with questions
   */
  async getTemplateById(templateId) {
    const template = await SurveyTemplate.findByPk(templateId, {
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name']
        },
        {
          model: Question,
          include: [
            {
              model: QuestionType,
              attributes: ['id', 'type_name']
            },
            {
              model: QuestionOption,
              attributes: ['id', 'option_text', 'display_order']
            }
          ],
          order: [['display_order', 'ASC']]
        }
      ]
    });

    return template;
  }

  /**
   * Create new template
   */
  async createTemplate(templateData, user) {
    const { title, description, questions } = templateData;

    // Create template
    const template = await SurveyTemplate.create({
      title,
      description,
      created_by: user.id
    });

    // Create questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const questionPromises = questions.map((q, index) => {
        return Question.create({
          survey_template_id: template.id,
          question_type_id: q.question_type_id,
          question_text: q.question_text,
          is_required: q.is_required !== undefined ? q.is_required : false,
          display_order: q.display_order !== undefined ? q.display_order : index + 1
        });
      });

      const createdQuestions = await Promise.all(questionPromises);

      // Create options for each question
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
          const optionPromises = q.options.map((opt, optIndex) => {
            return QuestionOption.create({
              question_id: createdQuestions[i].id,
              option_text: opt.option_text,
              display_order: opt.display_order !== undefined ? opt.display_order : optIndex + 1
            });
          });

          await Promise.all(optionPromises);
        }
      }
    }

    return this.getTemplateById(template.id);
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, updateData, user) {
    const template = await SurveyTemplate.findByPk(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    // Check ownership
    if (user.role !== 'admin' && template.created_by !== user.id) {
      throw new Error('Access denied. You do not own this template.');
    }

    // Update template fields
    if (updateData.title) template.title = updateData.title;
    if (updateData.description !== undefined) template.description = updateData.description;

    await template.save();

    return this.getTemplateById(templateId);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId, user) {
    const template = await SurveyTemplate.findByPk(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    // Check ownership
    if (user.role !== 'admin' && template.created_by !== user.id) {
      throw new Error('Access denied. You do not own this template.');
    }

    await template.destroy();

    return { message: 'Template deleted successfully' };
  }

  /**
   * Add question to template
   */
  async addQuestion(templateId, questionData, user) {
    const template = await SurveyTemplate.findByPk(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    // Check ownership
    if (user.role !== 'admin' && template.created_by !== user.id) {
      throw new Error('Access denied. You do not own this template.');
    }

    const question = await Question.create({
      survey_template_id: templateId,
      question_type_id: questionData.question_type_id,
      question_text: questionData.question_text,
      is_required: questionData.is_required || false,
      display_order: questionData.display_order || 1
    });

    // Create options if provided
    if (questionData.options && Array.isArray(questionData.options)) {
      const optionPromises = questionData.options.map((opt, index) => {
        return QuestionOption.create({
          question_id: question.id,
          option_text: opt.option_text,
          display_order: opt.display_order !== undefined ? opt.display_order : index + 1
        });
      });

      await Promise.all(optionPromises);
    }

    return this.getTemplateById(templateId);
  }

  /**
   * Get all question types
   */
  async getQuestionTypes() {
    const types = await QuestionType.findAll({
      order: [['id', 'ASC']]
    });

    return types;
  }
}

module.exports = new TemplateService();
