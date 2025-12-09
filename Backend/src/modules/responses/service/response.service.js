const {
  SurveyResponse,
  Answer,
  Survey,
  Question,
  QuestionOption,
  User,
  SurveyCollector
} = require('../../../models');
const collectorService = require('../../collectors/service/collector.service');

class ResponseService {
  /**
   * Get response by ID
   */
  async getResponseById(id, user) {
    const response = await SurveyResponse.findByPk(id, {
      include: [
        {
          model: Survey,
          as: 'Survey',
          attributes: ['id', 'title', 'created_by']
        },
        {
          model: User,
          attributes: ['id', 'username', 'full_name', 'email']
        },
        {
          model: Answer,
          include: [
            {
              model: Question,
              attributes: ['id', 'question_text', 'label', 'question_type_id']
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
          attributes: ['id', 'username', 'full_name', 'email']
        },
        {
          model: Answer,
          include: [
            {
              model: Question,
              attributes: ['id', 'question_text', 'label', 'question_type_id']
            },
            {
              model: QuestionOption,
              attributes: ['id', 'option_text']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
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
   * Get user's own responses with enhanced filtering and search
   */
  async getUserResponses(user, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '', 
      sortBy = 'created_at',
      sortOrder = 'DESC',
      includeAnswers = false 
    } = options;
    
    const offset = (page - 1) * limit;

    // Build where clause with search and filters
    const where = { respondent_id: user.id };

    // Add survey title search
    const surveyWhere = {};
    if (search.trim()) {
      surveyWhere.title = {
        [require('sequelize').Op.like]: `%${search.trim()}%`
      };
    }

    // Add status filter 
    if (status && ['completed', 'started', 'abandoned'].includes(status)) {
      where.status = status;
    }

    // Define includes
    const includes = [
      {
        model: Survey,
        as: 'Survey',
        attributes: ['id', 'title', 'description', 'status', 'created_at'],
        where: Object.keys(surveyWhere).length > 0 ? surveyWhere : undefined,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'full_name']
          }
        ]
      }
    ];

    // Include detailed answers if requested
    if (includeAnswers) {
      includes.push({
        model: Answer,
        include: [
          {
            model: Question,
            attributes: ['id', 'question_text', 'label', 'question_type_id']
          },
          {
            model: QuestionOption,
            attributes: ['id', 'option_text'],
            required: false
          }
        ]
      });
    }

    // Validate sort options
    const validSortFields = ['created_at', 'updated_at', 'completion_time'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const { count, rows } = await SurveyResponse.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: includes,
      order: [[sortField, sortDirection]],
      distinct: true // Important when using includes to get accurate count
    });

    return {
      responses: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      filters: {
        search,
        status,
        sortBy: sortField,
        sortOrder: sortDirection
      }
    };
  }

  /**
   * Get detailed response with all answers for user (own responses only)
   */
  async getUserResponseDetail(responseId, user) {
    const response = await SurveyResponse.findOne({
      where: { 
        id: responseId,
        respondent_id: user.id // Only allow user to see their own responses
      },
      include: [
        {
          model: Survey,
          as: 'Survey',
          attributes: ['id', 'title', 'description', 'status'],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'full_name']
            }
          ]
        },
        {
          model: Answer,
          include: [
            {
              model: Question,
              attributes: ['id', 'question_text', 'label', 'question_type_id']
            },
            {
              model: QuestionOption,
              attributes: ['id', 'option_text'],
              required: false
            }
          ]
        }
      ]
    });

    if (!response) {
      throw new Error('Response not found or access denied');
    }

    return response;
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
   * Submit public response via collector token
   */
  async submitPublicResponse(collectorToken, responseData, userIdentifier = null, user = null) {
    const { answers } = responseData;

    console.log('[ResponseService] Submitting answers payload:', JSON.stringify(answers, null, 2));

    // Get collector and validate with Questions to map answer types
    const { QuestionOption } = require('../../../models');
    const collector = await SurveyCollector.findOne({
      where: { token: collectorToken },
      include: [{
        model: Survey,
        as: 'Survey',
        include: [{
          model: require('../../../models').SurveyTemplate,
          as: 'template',
          include: [{
            model: Question,
            as: 'Questions',
            include: [
              {
                model: require('../../../models').QuestionType,
                as: 'QuestionType'
              },
              {
                model: QuestionOption,
                as: 'QuestionOptions',
                attributes: ['id', 'option_text', 'display_order']
              }
            ]
          }]
        }]
      }]
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

    // Create a map of question ID to type for processing answers
    const questionTypeMap = {};
    if (survey.template && survey.template.Questions) {
      survey.template.Questions.forEach(q => {
        questionTypeMap[q.id] = q.QuestionType ? q.QuestionType.type_name : 'text';
      });
    }

    // --- Access Control Checks ---
    if (survey.access_type === 'public_with_login') {
      if (!user) {
        throw new Error('Access denied. You must be logged in to respond to this survey.');
      }
    } else if (survey.access_type === 'internal') {
      if (!user) {
        throw new Error('Access denied. You must be logged in to respond to this survey.');
      }

      // Check workspace membership
      if (survey.workspace_id) {
        const { WorkspaceMember } = require('../../../models');
        const member = await WorkspaceMember.findOne({
          where: {
            workspace_id: survey.workspace_id,
            user_id: user.id,
            is_active: true
          }
        });

        if (!member) {
          throw new Error('Access denied. You must be a member of the workspace to respond.');
        }
      }
    } else if (survey.access_type === 'private') {
      // Private surveys require valid invite token
      const inviteToken = responseData.invite_token;

      if (!inviteToken) {
        throw new Error('Access denied. This is a private survey that requires an invitation.');
      }

      // Validate invite token
      const surveyInviteService = require('../../surveys/service/surveyInvite.service');
      try {
        const invite = await surveyInviteService.validateInvite(inviteToken);

        // Verify invite is for this survey
        if (invite.survey_id !== survey.id) {
          throw new Error('Invalid invite token for this survey.');
        }

        // Store invite ID to mark as responded later
        responseData._inviteId = invite.id;
      } catch (error) {
        throw new Error(`Access denied. ${error.message}`);
      }
    }

    // Create survey response
    const surveyResponse = await SurveyResponse.create({
      survey_id: survey.id,
      respondent_id: user ? user.id : null, // Link to user if authenticated
      collector_id: collector.id,
      completion_time: new Date(),
      status: 'completed'
    });

    // Create answers
    if (answers && Array.isArray(answers)) {
      const answerPromises = [];

      for (const answer of answers) {
        // Handle both camelCase (frontend) and snake_case
        const questionId = answer.questionId || answer.question_id;
        const value = answer.value;
        const type = questionTypeMap[questionId];

        if (!questionId) continue;

        // Handle array values (e.g. checkboxes)
        if (Array.isArray(value)) {
          value.forEach(val => {
            answerPromises.push(Answer.create({
              survey_response_id: surveyResponse.id,
              question_id: questionId,
              option_id: (type === 'checkbox' || type === 'multiple_choice') ? val : null,
              text_answer: null,
              numeric_answer: null
            }));
          });
        } else {
          // Single value
          let optionId = null;
          let textAnswer = null;
          let numericAnswer = null;

          // Handle yes_no type: value might be 'yes'/'no' string or option_id
          if (type === 'yes_no') {
            // If value is 'yes' or 'no', need to find the corresponding option_id
            if (value === 'yes' || value === 'no' || value === 'Yes' || value === 'No') {
              // Find the question and its options
              const question = survey.template.Questions.find(q => q.id === questionId);
              if (question && question.QuestionOptions) {
                const optionText = value.toLowerCase();
                const option = question.QuestionOptions.find(opt => 
                  opt.option_text.toLowerCase() === optionText
                );
                if (option) {
                  optionId = option.id;
                } else {
                  // Fallback: try to parse as integer (might be option_id already)
                  const parsedId = parseInt(value);
                  if (!isNaN(parsedId)) {
                    optionId = parsedId;
                  } else {
                    textAnswer = value; // Fallback to text if can't find option
                  }
                }
              } else {
                // Fallback: try to parse as integer
                const parsedId = parseInt(value);
                if (!isNaN(parsedId)) {
                  optionId = parsedId;
                } else {
                  textAnswer = value;
                }
              }
            } else {
              // Value is already option_id (integer)
              const parsedId = parseInt(value);
              if (!isNaN(parsedId)) {
                optionId = parsedId;
              } else {
                textAnswer = value;
              }
            }
          } else if (type === 'multiple_choice' || type === 'dropdown' || type === 'checkbox') {
            // Parse option_id as integer
            const parsedId = parseInt(value);
            optionId = !isNaN(parsedId) ? parsedId : null;
          } else if (type === 'likert_scale' || type === 'rating') {
            numericAnswer = parseFloat(value) || null;
          } else {
            textAnswer = String(value);
          }

          answerPromises.push(Answer.create({
            survey_response_id: surveyResponse.id,
            question_id: questionId,
            option_id: optionId,
            text_answer: textAnswer,
            numeric_answer: numericAnswer
          }));
        }
      }

      await Promise.all(answerPromises);
    }

    // Increment collector response count
    await collectorService.incrementResponseCount(collector.id);

    // Mark invite as responded if this was a private survey with invite
    if (responseData._inviteId) {
      const surveyInviteService = require('../../surveys/service/surveyInvite.service');
      try {
        await surveyInviteService.markInviteResponded(responseData.invite_token);
      } catch (error) {
        // Log but don't fail the response submission
        console.error('Failed to mark invite as responded:', error);
      }
    }

    return {
      response_id: surveyResponse.id,
      survey_id: survey.id,
      submitted_at: surveyResponse.completion_time,
      message: 'Response submitted successfully'
    };
  }
}

module.exports = new ResponseService();
