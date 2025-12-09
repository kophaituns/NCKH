// src/modules/templates/service/template.service.js
const { SurveyTemplate, Question, QuestionOption, QuestionType, User } = require('../../../models');
const { Op } = require('sequelize');
const { validateQuestion, normalizeQuestionData, QUESTION_TYPES_WITH_PREDEFINED_OPTIONS } = require('../validator/templates.validator');

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
        },
        {
          model: Question,
          as: 'Questions',
          attributes: ['id'], // Only need ID for counting
          required: false // LEFT JOIN để cả templates không có questions cũng được lấy
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Add question count to each template
    const templatesWithCount = rows.map(template => ({
      ...template.toJSON(),
      question_count: template.Questions ? template.Questions.length : 0
    }));

    return {
      templates: templatesWithCount,
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
              attributes: ['id', 'type_name']
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
    const { Survey } = require('../../../models');
    
    try {
      const template = await SurveyTemplate.findByPk(templateId);

      if (!template) {
        throw new Error('Template not found');
      }

      // Check ownership
      if (user.role !== 'admin' && template.created_by !== user.id) {
        throw new Error('Access denied. You do not own this template.');
      }

      // Check for dependent surveys
      const surveysUsingTemplate = await Survey.findAll({
        where: { template_id: templateId },
        attributes: ['id', 'title']
      });

      if (surveysUsingTemplate.length > 0) {
        const surveyTitles = surveysUsingTemplate.map(s => s.title || `Survey #${s.id}`).join(', ');
        throw new Error(`Cannot delete template. It is being used by ${surveysUsingTemplate.length} survey(s): ${surveyTitles}. Please delete or reassign these surveys first.`);
      }

      // Delete related questions and options first
      const questions = await Question.findAll({
        where: { template_id: templateId },
        include: [{ 
          model: QuestionOption, 
          as: 'QuestionOptions', 
          required: false 
        }]
      });

      // Delete options first
      for (const question of questions) {
        if (question.QuestionOptions && question.QuestionOptions.length > 0) {
          await QuestionOption.destroy({
            where: { question_id: question.id }
          });
        }
      }

      // Delete questions
      if (questions.length > 0) {
        await Question.destroy({
          where: { template_id: templateId }
        });
      }

      // Finally delete the template
      await template.destroy();

      return { message: 'Template deleted successfully' };
    } catch (error) {
      console.error('Delete template error:', error);
      
      // Handle Sequelize foreign key constraint errors
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new Error('Cannot delete template because it is being used by surveys. Please delete or reassign the surveys first.');
      }
      
      // Re-throw other errors as-is
      throw error;
    }
  }

  /**
   * Bulk delete templates
   */
  async deleteTemplates(templateIds, user) {
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      throw new Error('No template IDs provided');
    }

    const where = {
      id: { [Op.in]: templateIds }
    };

    // If not admin, restrict to own templates
    if (user.role !== 'admin') {
      where.created_by = user.id;
    }

    const count = await SurveyTemplate.count({ where });

    if (count === 0) {
      throw new Error('No templates found or access denied');
    }

    await SurveyTemplate.destroy({ where });

    return { message: `${count} templates deleted successfully` };
  }

  /**
   * Add question to template
   */
  async addQuestion(templateId, questionData, user) {
    const sequelize = require('../../../models').sequelize;
    
    // Use a transaction to ensure atomicity
    const transaction = await sequelize.transaction();
    
    try {
      const template = await SurveyTemplate.findByPk(templateId, { transaction });

      if (!template) {
        await transaction.rollback();
        throw new Error('Template not found');
      }

      // Check ownership
      if (user.role !== 'admin' && template.created_by !== user.id) {
        await transaction.rollback();
        throw new Error('Access denied. You do not own this template.');
      }

      // Validate question data based on type
      await validateQuestion(questionData);

      // Normalize question data (handle predefined options, defaults, etc.)
      const normalizedData = await normalizeQuestionData(questionData);

      // Get question type to check if it needs options
      const questionType = await QuestionType.findByPk(normalizedData.question_type_id, { transaction });
      const typeName = questionType.type_name;

      // Create the question
      const question = await Question.create({
        template_id: templateId,
        label: normalizedData.label || normalizedData.question_text,
        question_text: normalizedData.question_text,
        question_type_id: normalizedData.question_type_id,
        required: normalizedData.required || normalizedData.is_required || false,
        display_order: normalizedData.display_order || 1,
        // Store maxScore for rating type (if needed, you might need to add this column to Question model)
        // For now, we'll handle it in options or metadata
      }, { transaction });

      // Handle options based on question type
      if (typeName === 'yes_no') {
        // Yes/No: Auto-create predefined options ["Yes", "No"]
        const yesNoOptions = QUESTION_TYPES_WITH_PREDEFINED_OPTIONS['yes_no'];
        for (let i = 0; i < yesNoOptions.length; i++) {
          await QuestionOption.create({
            question_id: question.id,
            option_text: yesNoOptions[i],
            display_order: i + 1
          }, { transaction });
        }
      } else if (normalizedData.options && Array.isArray(normalizedData.options) && normalizedData.options.length > 0) {
        // For types that require options: multiple_choice, multiple_select, dropdown
        // normalizedData.options is already normalized to array of objects with option_text and display_order
        for (const opt of normalizedData.options) {
          if (opt && opt.option_text && opt.option_text.trim().length > 0) {
            await QuestionOption.create({
              question_id: question.id,
              option_text: opt.option_text.trim(),
              display_order: opt.display_order || 1
            }, { transaction });
          }
        }
      }
      // For checkbox, text, and rating: no options needed

      // Commit the transaction
      await transaction.commit();
      
      return this.getTemplateById(templateId);
      
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all question types
   * 
   * Question Types Definition:
   * 1. text - Single line text input (no options)
   * 2. multiple_choice - Select ONE option from list (requires options array, min 2)
   * 3. multiple_select - Select MULTIPLE options from list (requires options array, min 2)
   * 4. checkbox - Single true/false checkbox (no options, value is boolean)
   * 5. dropdown - Select ONE from dropdown list (requires options array, min 2)
   * 6. rating - Numeric scale rating (requires maxScore property, default 5, no options)
   * 7. yes_no - Binary Yes/No question (auto-creates ["Yes", "No"] options)
   */
  async getQuestionTypes() {
    const types = await QuestionType.findAll({
      order: [['id', 'ASC']]
    });

    return types;
  }

  /**
   * Export template to PDF
   */
  async exportTemplateToPDF(templateId, userId) {
    try {
      // Get template with questions and options
      const template = await SurveyTemplate.findByPk(templateId, {
        include: [
          {
            model: User,
            attributes: ['username', 'full_name']
          },
          {
            model: Question,
            as: 'Questions',
            attributes: ['id', 'question_text', 'question_type_id', 'required', 'display_order'],
            include: [
              {
                model: QuestionType,
                as: 'QuestionType',
                attributes: ['type_name', 'description']
              },
              {
                model: QuestionOption,
                as: 'QuestionOptions',
                attributes: ['option_text', 'display_order'],
                order: [['display_order', 'ASC']]
              }
            ],
            order: [['display_order', 'ASC']]
          }
        ]
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Check if user has access (for now, allow all authenticated users)
      if (!userId) {
        throw new Error('Access denied - authentication required');
      }

      // Create HTML content for PDF
      let htmlContent = `
        <div class="header">
          <div class="title">${template.title}</div>
          <div class="description">${template.description || 'Không có mô tả'}</div>
          <div class="meta">Ngày tạo: ${new Date(template.created_at).toLocaleDateString('vi-VN')}</div>
        </div>
      `;

      // Add questions - use the alias 'Questions'
      const questions = template.Questions || [];

      if (questions.length === 0) {
        htmlContent += `
          <div class="no-questions">
            <p><strong>Chưa có câu hỏi nào trong template này.</strong></p>
            <p>Vui lòng thêm câu hỏi vào template trước khi xuất PDF.</p>
          </div>
        `;
      } else {
        questions.forEach((question, index) => {
          const questionType = question.QuestionType?.type_name || 'text';
          const options = question.QuestionOptions || [];

          htmlContent += `
            <div class="question">
              <div class="question-number">${index + 1}. ${question.question_text}</div>
              <div class="question-type">[${questionType}]</div>
          `;

          // Handle different question types according to definitions
          if (questionType === 'multiple_choice' && options.length > 0) {
            // Multiple Choice: select ONE option
            htmlContent += '<div class="options"><strong>Chọn một đáp án:</strong><br>';
            options.forEach((option) => {
              htmlContent += `<div class="option"><span class="radio"></span> ${option.option_text}</div>`;
            });
            htmlContent += '</div>';
          } else if (questionType === 'multiple_select' && options.length > 0) {
            // Multiple Select: select MULTIPLE options
            htmlContent += '<div class="options"><strong>Chọn nhiều đáp án:</strong><br>';
            options.forEach((option) => {
              htmlContent += `<div class="option"><span class="checkbox"></span> ${option.option_text}</div>`;
            });
            htmlContent += '</div>';
          } else if (questionType === 'checkbox') {
            // Checkbox: single true/false checkbox (no options)
            htmlContent += `
              <div class="options">
                <div class="option"><span class="checkbox"></span> Đồng ý</div>
              </div>
            `;
          } else if (questionType === 'dropdown' && options.length > 0) {
            // Dropdown: select ONE from dropdown
            htmlContent += '<div class="options"><strong>Chọn từ danh sách:</strong><br>';
            options.forEach((option) => {
              htmlContent += `<div class="option">• ${option.option_text}</div>`;
            });
            htmlContent += '</div>';
          } else if (questionType === 'yes_no') {
            // Yes/No: predefined ["Yes", "No"]
            htmlContent += `
              <div class="options">
                <div class="option"><span class="radio"></span> Yes</div>
                <div class="option"><span class="radio"></span> No</div>
              </div>
            `;
          } else if (questionType === 'rating') {
            // Rating: numeric scale (default 1-5, can have maxScore)
            const maxRating = question.maxScore || 5;
            htmlContent += `<div class="rating"><strong>Đánh giá từ 1 đến ${maxRating}:</strong><br>`;
            for (let i = 1; i <= maxRating; i++) {
              htmlContent += `<span class="rating-box">${i}</span>`;
            }
            htmlContent += '</div>';
          } else {
            // Text: single line input
            htmlContent += '<div class="text-answer"></div>';
          }

          htmlContent += '</div>';
        });
      }

      return {
        htmlContent,
        template: {
          title: template.title,
          questionCount: questions.length
        }
      };

    } catch (error) {
      console.error('Error exporting template to PDF:', error);
      throw new Error(`Failed to export PDF: ${error.message}`);
    }
  }
}

module.exports = new TemplateService();
