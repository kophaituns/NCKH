// src/modules/templates/service/template.service.js
const { SurveyTemplate, Question, QuestionOption, QuestionType, User } = require('../../../models');
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
          // chú ý: chỗ này code cũ dùng survey_template_id
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

      // Create the question
      const question = await Question.create({
        template_id: templateId,
        label: questionData.label || questionData.question_text, // Use label if provided, otherwise use question_text
        question_text: questionData.question_text,
        question_type_id: questionData.question_type_id,
        required: questionData.required || questionData.is_required || false,
        display_order: questionData.display_order || 1
      }, { transaction });

      // Create options if provided - with strict validation
      if (questionData.options && Array.isArray(questionData.options) && questionData.options.length > 0) {
        // Filter and process options - support both string arrays and object arrays
        const validOptions = questionData.options.filter(opt => {
          // Handle string options (from frontend)
          if (typeof opt === 'string') {
            return opt.trim().length > 0;
          }
          
          // Handle object options
          if (opt && typeof opt === 'object') {
            const optionText = opt.option_text || opt.text || opt.label || opt.value;
            return optionText && 
                   typeof optionText === 'string' && 
                   optionText.trim().length > 0;
          }
          
          return false;
        });

        // Only create options if we have valid ones
        if (validOptions.length > 0) {
          for (let i = 0; i < validOptions.length; i++) {
            const opt = validOptions[i];
            
            let optionText;
            let displayOrder = i + 1;
            
            // Handle string options (from frontend filter)
            if (typeof opt === 'string') {
              optionText = opt.trim();
            } else {
              // Handle object options
              optionText = (opt.option_text || opt.text || opt.label || opt.value).trim();
              displayOrder = opt.display_order !== undefined ? opt.display_order : i + 1;
            }
            
            // Create each option individually with proper error handling
            await QuestionOption.create({
              question_id: question.id,
              option_text: optionText,
              display_order: displayOrder
            }, { transaction });
          }
        }
      }

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
   * Update question in template
   */
  async updateQuestion(templateId, questionId, questionData, user) {
    const sequelize = require('../../../models').sequelize;
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

      const question = await Question.findOne({
        where: { id: questionId, template_id: templateId },
        include: [
          {
            model: QuestionOption,
            as: 'QuestionOptions',
            required: false
          }
        ],
        transaction
      });

      if (!question) {
        await transaction.rollback();
        throw new Error('Question not found');
      }

      // Cập nhật các field chính
      if (questionData.question_text !== undefined) {
        question.question_text = questionData.question_text;
      }

      if (questionData.label !== undefined) {
        question.label = questionData.label;
      }

      if (questionData.question_type_id !== undefined) {
        question.question_type_id = questionData.question_type_id;
      }

      if (typeof questionData.required === 'boolean' || typeof questionData.is_required === 'boolean') {
        question.required = questionData.required ?? questionData.is_required;
      }

      if (questionData.display_order !== undefined) {
        question.display_order = questionData.display_order;
      }

      await question.save({ transaction });

      // Nếu frontend gửi options lên thì cập nhật lại toàn bộ options
      if (Array.isArray(questionData.options)) {
        // Xoá options cũ
        await QuestionOption.destroy({
          where: { question_id: question.id },
          transaction
        });

        // Lọc & chuẩn hoá options mới
        const cleanOptions = questionData.options
          .map((opt) => {
            if (typeof opt === 'string') {
              const text = opt.trim();
              return text.length > 0 ? text : null;
            }

            if (opt && typeof opt === 'object') {
              const text = (opt.option_text || opt.text || opt.label || opt.value || '').trim();
              if (!text) return null;
              return {
                text,
                display_order: opt.display_order
              };
            }

            return null;
          })
          .filter(Boolean);

        // Tạo lại options mới
        for (let i = 0; i < cleanOptions.length; i++) {
          const opt = cleanOptions[i];
          const optionText = typeof opt === 'string' ? opt : opt.text;
          const displayOrder =
            typeof opt === 'string'
              ? i + 1
              : (opt.display_order !== undefined ? opt.display_order : i + 1);

          await QuestionOption.create(
            {
              question_id: question.id,
              option_text: optionText,
              display_order: displayOrder
            },
            { transaction }
          );
        }
      }

      await transaction.commit();

      // Sau khi update xong, trả lại cả template để FE dễ refresh
      return this.getTemplateById(templateId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete question from template
   */
  async deleteQuestion(templateId, questionId, user) {
    const sequelize = require('../../../models').sequelize;
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

      const question = await Question.findOne({
        where: { id: questionId, template_id: templateId },
        transaction
      });

      if (!question) {
        await transaction.rollback();
        throw new Error('Question not found');
      }

      // Xoá options trước
      await QuestionOption.destroy({
        where: { question_id: question.id },
        transaction
      });

      // Xoá question
      await Question.destroy({
        where: { id: question.id },
        transaction
      });

      await transaction.commit();

      return { message: 'Question deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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

          if (questionType === 'multiple_choice' && options.length > 0) {
            htmlContent += '<div class="options">';
            options.forEach((option) => {
              htmlContent += `<div class="option"><span class="checkbox"></span> ${option.option_text}</div>`;
            });
            htmlContent += '</div>';
          } else if (questionType === 'checkbox' && options.length > 0) {
            htmlContent += '<div class="options">';
            options.forEach((option) => {
              htmlContent += `<div class="option"><span class="checkbox"></span> ${option.option_text}</div>`;
            });
            htmlContent += '</div>';
          } else if (questionType === 'dropdown' && options.length > 0) {
            htmlContent += '<div class="options"><strong>Tùy chọn:</strong><br>';
            options.forEach((option) => {
              htmlContent += `<div class="option">• ${option.option_text}</div>`;
            });
            htmlContent += '</div>';
          } else if (questionType === 'yes_no') {
            htmlContent += `
              <div class="options">
                <div class="option"><span class="checkbox"></span> Có</div>
                <div class="option"><span class="checkbox"></span> Không</div>
              </div>
            `;
          } else if (questionType === 'likert_scale' || questionType === 'rating') {
            htmlContent += `
              <div class="rating">
                Đánh giá từ 1 đến 5: 
                <span class="rating-box">1</span>
                <span class="rating-box">2</span>
                <span class="rating-box">3</span>
                <span class="rating-box">4</span>
                <span class="rating-box">5</span>
              </div>
            `;
          } else {
            htmlContent += '<div class="text-answer"></div><div class="text-answer"></div><div class="text-answer"></div>';
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
