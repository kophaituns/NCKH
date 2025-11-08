// modules/responses/controller/public-responses.controller.js
const { SurveyCollector, Survey, SurveyTemplate, Question, QuestionType, QuestionOption, SurveyResponse, Answer } = require('../../../src/models');
const logger = require('../../../src/utils/logger');

class PublicResponsesController {
  /**
   * Get survey by public token
   * @route GET /api/modules/responses/public/:token
   */
  async getSurveyByToken(req, res) {
    try {
      const { token } = req.params;

      // Find collector by token
      const collector = await SurveyCollector.findOne({
        where: { token, is_active: true },
        include: [{
          model: Survey,
          as: 'Survey',
          include: [{
            model: SurveyTemplate,
            as: 'template',
            include: [{
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
                  attributes: ['id', 'option_text', 'display_order'],
                  order: [['display_order', 'ASC']]
                }
              ]
            }]
          }]
        }]
      });

      if (!collector) {
        return res.status(404).json({
          ok: false,
          message: 'Invalid or inactive token'
        });
      }

      // Check if survey is active
      if (collector.Survey.status !== 'active') {
        return res.status(400).json({
          ok: false,
          message: 'Survey is not currently active'
        });
      }

      // Format response
      const surveyData = {
        id: collector.Survey.id,
        title: collector.Survey.title,
        description: collector.Survey.description,
        questions: collector.Survey.template.Questions.map(q => ({
          id: q.id,
          label: q.question_text,
          type: q.QuestionType.type_name,
          required: q.required,
          display_order: q.display_order,
          options: (q.QuestionOptions || []).map(opt => ({
            id: opt.id,
            text: opt.option_text,
            display_order: opt.display_order
          }))
        }))
      };

      res.status(200).json({
        ok: true,
        data: {
          survey: surveyData,
          collector_id: collector.id
        }
      });
    } catch (error) {
      logger.error('Get survey by token error:', error);
      res.status(500).json({
        ok: false,
        message: error.message || 'Error retrieving survey'
      });
    }
  }

  /**
   * Submit public response
   * @route POST /api/modules/responses/public/:token
   */
  async submitResponse(req, res) {
    try {
      const { token } = req.params;
      const { answers } = req.body;

      // Validate request body
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'Answers array is required'
        });
      }

      // Find collector by token
      const collector = await SurveyCollector.findOne({
        where: { token, is_active: true },
        include: [{
          model: Survey,
          as: 'Survey'
        }]
      });

      if (!collector) {
        return res.status(404).json({
          ok: false,
          message: 'Invalid or inactive token'
        });
      }

      // Check if survey is active
      if (collector.Survey.status !== 'active') {
        return res.status(400).json({
          ok: false,
          message: 'Survey is not currently active'
        });
      }

      // Create survey response
      // Use a default respondent_id (e.g., anonymous user ID 1) or make it nullable
      const surveyResponse = await SurveyResponse.create({
        survey_id: collector.Survey.id,
        respondent_id: 1, // Anonymous/default user
        collector_id: collector.id,
        start_time: new Date(),
        completion_time: new Date(),
        status: 'completed'
      });

      // Save individual answers
      const answerPromises = answers.map(async (answer) => {
        const { question_id, answer_value, option_id } = answer;

        return Answer.create({
          survey_response_id: surveyResponse.id,
          question_id: question_id,
          option_id: option_id || null,
          text_answer: typeof answer_value === 'string' ? answer_value : null,
          numeric_answer: typeof answer_value === 'number' ? answer_value : null
        });
      });

      await Promise.all(answerPromises);

      // Update collector response count
      await collector.increment('response_count');

      res.status(201).json({
        ok: true,
        message: 'Response submitted successfully',
        data: {
          response_id: surveyResponse.id
        }
      });
    } catch (error) {
      logger.error('Submit response error:', error);
      res.status(500).json({
        ok: false,
        message: error.message || 'Error submitting response'
      });
    }
  }
}

module.exports = new PublicResponsesController();
