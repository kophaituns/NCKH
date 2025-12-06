// src/modules/options/service/option.service.js
const { QuestionOption, Question, SurveyTemplate } = require('../../../models');
const logger = require('../../../utils/logger');

class OptionService {
  /**
   * Update option
   */
  async updateOption(optionId, optionData, userId) {
    try {
      const option = await QuestionOption.findByPk(optionId, {
        include: [{
          model: Question,
          include: [SurveyTemplate]
        }]
      });

      if (!option) {
        throw new Error('Option not found');
      }

      // Check if user has permission to update this option
      if (option.Question.SurveyTemplate.created_by !== userId) {
        throw new Error('Access denied');
      }

      const updatedOption = await option.update(optionData);
      return updatedOption;
    } catch (error) {
      logger.error('Error in updateOption:', error);
      throw error;
    }
  }

  /**
   * Delete option
   */
  async deleteOption(optionId, userId) {
    try {
      const option = await QuestionOption.findByPk(optionId, {
        include: [{
          model: Question,
          include: [SurveyTemplate]
        }]
      });

      if (!option) {
        throw new Error('Option not found');
      }

      // Check if user has permission to delete this option
      if (option.Question.SurveyTemplate.created_by !== userId) {
        throw new Error('Access denied');
      }

      await option.destroy();
      return true;
    } catch (error) {
      logger.error('Error in deleteOption:', error);
      throw error;
    }
  }

  /**
   * Add option to question
   */
  async addOption(optionData, userId) {
    try {
      const { question_id, option_text, display_order } = optionData;

      // Verify user has permission to modify this question
      const question = await Question.findByPk(question_id, {
        include: [{
          model: SurveyTemplate,
          as: 'template'
        }]
      });

      if (!question) {
        throw new Error('Question not found');
      }

      if (question.template.created_by !== userId) {
        throw new Error('Access denied');
      }

      const newOption = await QuestionOption.create({
        question_id,
        option_text,
        display_order: display_order || 1
      });

      return newOption;
    } catch (error) {
      logger.error('Error in addOption:', error);
      throw error;
    }
  }
}

module.exports = new OptionService();