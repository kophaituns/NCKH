// modules/templates/service/template.service.js
const { SurveyTemplate, Question, QuestionOption, QuestionType, User, Survey, Answer } = require('../../../src/models');
const { Op } = require('sequelize');

class TemplateService {
  /**
   * Get all templates
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
          as: 'Questions',
          include: [
            {
              model: QuestionType,
              as: 'QuestionType',
              attributes: ['id', 'type_name', 'description']
            },
            {
              model: QuestionOption,
              as: 'QuestionOptions',
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
          template_id: template.id,
          question_type_id: q.question_type_id,
          question_text: q.question_text,
          required: q.required !== undefined ? q.required : false,
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
   * Delete template (with comprehensive safety checks)
   */
  async deleteTemplate(templateId, user) {
    const template = await SurveyTemplate.findByPk(templateId);

    if (!template) {
      return { ok: false, status: 404, code: 'NOT_FOUND', message: 'Template not found' };
    }

    // Permission check: creator can only delete their own templates
    if (user.role === 'creator' && template.created_by !== user.id) {
      return { 
        ok: false, 
        status: 403, 
        code: 'FORBIDDEN',
        message: 'You can only delete your own templates.' 
      };
    }

    // Admin can delete any template, but creator can only delete their own
    if (user.role !== 'admin' && template.created_by !== user.id) {
      return { 
        ok: false, 
        status: 403, 
        code: 'FORBIDDEN',
        message: 'Access denied. You do not own this template.' 
      };
    }

    // SAFETY CHECK 1: Check if any surveys use this template
    const surveyCount = await Survey.count({ 
      where: { template_id: templateId } 
    });

    // SAFETY CHECK 2: Get all question IDs under this template
    const questions = await Question.findAll({
      where: { template_id: templateId },
      attributes: ['id'],
      raw: true
    });
    const questionIds = questions.map(q => q.id);

    // SAFETY CHECK 3: Get all option IDs under these questions
    let optionIds = [];
    if (questionIds.length > 0) {
      const options = await QuestionOption.findAll({
        where: { question_id: questionIds },
        attributes: ['id'],
        raw: true
      });
      optionIds = options.map(o => o.id);
    }

    // SAFETY CHECK 4: Check answers referencing these questions
    let answersByQuestion = 0;
    if (questionIds.length > 0) {
      answersByQuestion = await Answer.count({
        where: { question_id: questionIds }
      });
    }

    // SAFETY CHECK 5: Check answers referencing these options (CRITICAL!)
    let answersByOption = 0;
    if (optionIds.length > 0) {
      answersByOption = await Answer.count({
        where: { option_id: optionIds }
      });
    }

    // Calculate total answers
    const totalAnswers = answersByQuestion + answersByOption;

    // PREVENT DELETION if template is in use
    if (surveyCount > 0 || totalAnswers > 0) {
      return {
        ok: false,
        status: 400,
        code: 'TEMPLATE_IN_USE',
        message: 'This template is used by existing surveys or responses and cannot be deleted.',
        details: {
          surveys: surveyCount,
          answersByQuestion: answersByQuestion,
          answersByOption: answersByOption,
          totalAnswers: totalAnswers
        }
      };
    }

    // Safe to delete - no dependencies found
    await template.destroy();

    return { 
      ok: true, 
      status: 200, 
      message: 'Template deleted successfully' 
    };
  }

  /**
   * Archive template (soft delete alternative)
   */
  async archiveTemplate(templateId, user) {
    const template = await SurveyTemplate.findByPk(templateId);

    if (!template) {
      return { ok: false, status: 404, message: 'Template not found' };
    }

    // Permission check: creator can only archive their own templates
    if (user.role === 'creator' && template.created_by !== user.id) {
      return { 
        ok: false, 
        status: 403, 
        message: 'Access denied. You can only archive your own templates.' 
      };
    }

    // Admin can archive any template, but creator can only archive their own
    if (user.role !== 'admin' && template.created_by !== user.id) {
      return { 
        ok: false, 
        status: 403, 
        message: 'Access denied. You do not own this template.' 
      };
    }

    // Update template to set is_archived flag
    await template.update({ is_archived: 1 });

    return { 
      ok: true, 
      status: 200, 
      message: 'Template archived successfully',
      template 
    };
  }

  /**
   * Unarchive template
   */
  async unarchiveTemplate(templateId, user) {
    const template = await SurveyTemplate.findByPk(templateId);

    if (!template) {
      return { ok: false, status: 404, message: 'Template not found' };
    }

    // Permission check
    if (user.role === 'creator' && template.created_by !== user.id) {
      return { 
        ok: false, 
        status: 403, 
        message: 'Access denied. You can only unarchive your own templates.' 
      };
    }

    if (user.role !== 'admin' && template.created_by !== user.id) {
      return { 
        ok: false, 
        status: 403, 
        message: 'Access denied. You do not own this template.' 
      };
    }

    // Update template to clear is_archived flag
    await template.update({ is_archived: 0 });

    return { 
      ok: true, 
      status: 200, 
      message: 'Template unarchived successfully',
      template 
    };
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
      template_id: templateId,
      question_type_id: questionData.question_type_id,
      question_text: questionData.question_text,
      required: questionData.required || false,
      display_order: questionData.display_order || 1
    });

    // Create options if provided
    if (questionData.options && Array.isArray(questionData.options)) {
      const optionPromises = questionData.options.map((opt, index) => {
        // Support both string format and object format
        const optionText = typeof opt === 'string' ? opt : opt.option_text;
        const displayOrder = typeof opt === 'string' ? index + 1 : (opt.display_order !== undefined ? opt.display_order : index + 1);
        
        return QuestionOption.create({
          question_id: question.id,
          option_text: optionText,
          display_order: displayOrder
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
