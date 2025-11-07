// src/modules/responses/service/response.service.js
const { SurveyResponse, Answer, Survey, User, Question, QuestionOption, SurveyCollector } = require('../../../models');
const { Op } = require('sequelize');
const collectorService = require('../../collectors/service/collector.service');

class ResponseService {
  /**
   * Submit survey response
   */
  async submitResponse(responseData, user) {
    const { survey_id, answers } = responseData;

    // Verify survey exists and is active
    const survey = await Survey.findByPk(survey_id);
    if (!survey) {
      throw new Error('Survey not found');
    }

    if (survey.status !== 'active') {
      throw new Error('Survey is not active');
    }

    // Check if user already responded
    const existingResponse = await SurveyResponse.findOne({
      where: {
        survey_id,
        respondent_id: user.id
      }
    });

    if (existingResponse) {
      throw new Error('You have already responded to this survey');
    }

    // Create survey response
    const surveyResponse = await SurveyResponse.create({
      survey_id,
      respondent_id: user.id,
      submitted_at: new Date()
    });

    // Create answers
    const answerPromises = answers.map(answer => {
      return Answer.create({
        survey_response_id: surveyResponse.id,
        question_id: answer.question_id,
        option_id: answer.option_id || null,
        answer_text: answer.answer_text || null
      });
    });

    await Promise.all(answerPromises);

    // Return complete response with answers
    return this.getResponseById(surveyResponse.id, user);
  }

  /**
   * Get response by ID
   */
  async getResponseById(responseId, user) {
    const response = await SurveyResponse.findByPk(responseId, {
      include: [
        {
          model: Survey,
          attributes: ['id', 'title', 'created_by']
        },
        {
          model: User,
          attributes: ['id', 'username', 'full_name']
        },
        {
          model: Answer,
          include: [
            {
              model: Question,
              attributes: ['id', 'question_text', 'question_type_id']
            },
            {
              model: QuestionOption,
              attributes: ['id', 'option_text']
            }
          ]
        }
      ]
    });

    if (!response) {
      return null;
    }

    // Check access: owner, survey creator, or admin
    const survey = response.Survey;
    const isOwner = response.respondent_id === user.id;
    const isCreator = survey.created_by === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isCreator && !isAdmin) {
      throw new Error('Access denied');
    }

    return response;
  }

  /**
   * Get all responses for a survey
   */
  async getResponsesBySurvey(surveyId, user, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // Verify survey exists and user has access
    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    // Only survey creator or admin can view all responses
    if (survey.created_by !== user.id && user.role !== 'admin') {
      throw new Error('Access denied. Only survey creator can view responses.');
    }

    const { count, rows } = await SurveyResponse.findAndCountAll({
      where: { survey_id: surveyId },
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'full_name']
        },
        {
          model: Answer,
          include: [
            {
              model: Question,
              attributes: ['id', 'question_text', 'question_type_id']
            },
            {
              model: QuestionOption,
              attributes: ['id', 'option_text']
            }
          ]
        }
      ],
      order: [['submitted_at', 'DESC']]
    });

    return {
      responses: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get user's own responses
   */
  async getUserResponses(user, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { count, rows } = await SurveyResponse.findAndCountAll({
      where: { respondent_id: user.id },
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: Survey,
          attributes: ['id', 'title', 'description', 'status'],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'full_name']
            }
          ]
        }
      ],
      order: [['submitted_at', 'DESC']]
    });

    return {
      responses: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Delete response (admin or owner only)
   */
  async deleteResponse(responseId, user) {
    const response = await SurveyResponse.findByPk(responseId);

    if (!response) {
      throw new Error('Response not found');
    }

    // Only owner or admin can delete
    if (response.respondent_id !== user.id && user.role !== 'admin') {
      throw new Error('Access denied');
    }

    await response.destroy();

    return { message: 'Response deleted successfully' };
  }

  /**
   * Submit public response via collector token (no auth required)
   */
  async submitPublicResponse(collectorToken, responseData, userIdentifier = null) {
    const { answers } = responseData;

    // Get collector and validate
    const collector = await SurveyCollector.findOne({
      where: { token: collectorToken },
      include: [Survey]
    });

    if (!collector) {
      throw new Error('Invalid collector token');
    }

    if (!collector.is_active) {
      throw new Error('This collector is no longer active');
    }

    const survey = collector.Survey;

    if (survey.status !== 'active') {
      throw new Error('This survey is not currently accepting responses');
    }

    // Check end date
    if (survey.end_date && new Date(survey.end_date) < new Date()) {
      throw new Error('This survey has ended');
    }

    // Check for duplicate responses if not allowed
    if (!collector.allow_multiple_responses && userIdentifier) {
      const existingResponse = await SurveyResponse.findOne({
        where: {
          survey_id: survey.id,
          respondent_identifier: userIdentifier
        }
      });

      if (existingResponse) {
        throw new Error('You have already responded to this survey');
      }
    }

    // Create anonymous survey response
    const surveyResponse = await SurveyResponse.create({
      survey_id: survey.id,
      respondent_id: null, // Anonymous
      respondent_identifier: userIdentifier, // Can be IP, email, or other identifier
      collector_id: collector.id,
      submitted_at: new Date(),
      status: 'completed'
    });

    // Create answers
    if (answers && Array.isArray(answers)) {
      const answerPromises = answers.map(answer => {
        return Answer.create({
          survey_response_id: surveyResponse.id,
          question_id: answer.question_id,
          option_id: answer.option_id || null,
          answer_text: answer.answer_text || null,
          numeric_answer: answer.numeric_answer || null
        });
      });

      await Promise.all(answerPromises);
    }

    // Increment collector response count
    await collectorService.incrementResponseCount(collector.id);

    return {
      response_id: surveyResponse.id,
      survey_id: survey.id,
      submitted_at: surveyResponse.submitted_at,
      message: 'Response submitted successfully'
    };
  }
}

module.exports = new ResponseService();
