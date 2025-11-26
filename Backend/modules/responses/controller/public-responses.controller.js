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
      // Frontend sends: { questionId, value }
      // Backend needs: { question_id, option_id, text_answer, numeric_answer }
      const answerPromises = answers.map(async (answer) => {
        const questionId = answer.questionId || answer.question_id;
        const value = answer.value || answer.answer_value;

        // Determine how to store the answer based on value type
        let optionId = null;
        let textAnswer = null;
        let numericAnswer = null;

        if (Array.isArray(value)) {
          // Multiple selections (checkbox) - create multiple answer records
          if (value.length > 0) {
            return Promise.all(
              value.map(val => 
                Answer.create({
                  survey_response_id: surveyResponse.id,
                  question_id: questionId,
                  option_id: parseInt(val),
                  text_answer: null,
                  numeric_answer: null
                })
              )
            );
          }
          return null; // Skip empty arrays
        } else if (typeof value === 'number' || !isNaN(Number(value))) {
          const numVal = Number(value);
          // Check if it's likely an option ID (positive integer) or a numeric answer
          if (Number.isInteger(numVal) && numVal > 0 && numVal < 10000) {
            // Likely an option ID for single choice questions
            optionId = numVal;
          } else {
            // Likely a numeric answer (e.g., rating, age, etc.)
            numericAnswer = numVal;
          }
        } else if (typeof value === 'string') {
          if (value.trim() === '') {
            return null; // Skip empty strings
          }
          // Check if it's a stringified number that could be an option ID
          if (!isNaN(value) && value.trim() !== '') {
            optionId = parseInt(value);
          } else {
            textAnswer = value;
          }
        }

        return Answer.create({
          survey_response_id: surveyResponse.id,
          question_id: questionId,
          option_id: optionId,
          text_answer: textAnswer,
          numeric_answer: numericAnswer
        });
      });

      // Filter out null values (skipped answers) and flatten arrays
      const answerResults = await Promise.all(answerPromises);
      const flattenedAnswers = answerResults.flat().filter(Boolean);

      // Update collector response count
      await collector.increment('response_count');

      res.status(201).json({
        ok: true,
        message: 'Response submitted successfully',
        responseId: surveyResponse.id,
        submittedAt: surveyResponse.completion_time
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
