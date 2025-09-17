// src/controllers/response.controller.js
const { 
  SurveyResponse, 
  Answer, 
  Survey, 
  Question, 
  QuestionOption,
  sequelize
} = require('../models');
const logger = require('../utils/logger');

/**
 * Submit a survey response
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.submitResponse = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { survey_id, answers } = req.body;
    
    // Check if survey exists and is active
    const survey = await Survey.findOne({
      where: { 
        id: survey_id,
        status: 'active',
        start_date: { [sequelize.Op.lte]: new Date() },
        end_date: { [sequelize.Op.gte]: new Date() }
      }
    });

    if (!survey) {
      return res.status(404).json({
        error: true,
        message: 'Survey not found or not active'
      });
    }

    // Check if user is allowed to respond to this survey
    if (req.user.role === 'student') {
      const isTargeted = 
        survey.target_audience === 'all_students' || 
        (survey.target_audience === 'specific_faculty' && survey.target_value === req.user.faculty) ||
        (survey.target_audience === 'specific_class' && survey.target_value === req.user.class_name);
      
      if (!isTargeted) {
        return res.status(403).json({
          error: true,
          message: 'You are not allowed to respond to this survey'
        });
      }
    }

    // Check if user has already responded to this survey
    const existingResponse = await SurveyResponse.findOne({
      where: {
        survey_id,
        respondent_id: req.user.id
      }
    });

    if (existingResponse) {
      return res.status(400).json({
        error: true,
        message: 'You have already responded to this survey'
      });
    }

    // Create survey response
    const response = await SurveyResponse.create({
      survey_id,
      respondent_id: req.user.id,
      start_time: new Date(),
      completion_time: new Date(),
      status: 'completed'
    }, { transaction });

    // Get all questions for this survey to validate required fields
    const surveyQuestions = await Question.findAll({
      where: { 
        survey_template_id: survey.template_id 
      },
      include: [
        {
          model: QuestionOption
        }
      ]
    });

    // Check if all required questions are answered
    const requiredQuestions = surveyQuestions.filter(q => q.required);
    const answeredQuestionIds = answers.map(a => a.question_id);

    for (const requiredQuestion of requiredQuestions) {
      if (!answeredQuestionIds.includes(requiredQuestion.id)) {
        await transaction.rollback();
        return res.status(400).json({
          error: true,
          message: `Required question "${requiredQuestion.question_text}" must be answered`
        });
      }
    }

    // Save answers
    for (const answer of answers) {
      const question = surveyQuestions.find(q => q.id === answer.question_id);
      
      if (!question) {
        await transaction.rollback();
        return res.status(400).json({
          error: true,
          message: `Question with ID ${answer.question_id} not found in this survey`
        });
      }

      // Validate answer based on question type
      switch (question.question_type_id) {
        // Multiple choice (single selection)
        case 1:
          if (!answer.option_id) {
            await transaction.rollback();
            return res.status(400).json({
              error: true,
              message: `An option must be selected for question "${question.question_text}"`
            });
          }
          // Check if option belongs to this question
          const validOption = question.QuestionOptions.some(opt => opt.id === answer.option_id);
          if (!validOption) {
            await transaction.rollback();
            return res.status(400).json({
              error: true,
              message: `Invalid option for question "${question.question_text}"`
            });
          }
          break;
        
        // Checkbox (multiple selection)
        case 2:
          if (!answer.option_ids || !Array.isArray(answer.option_ids) || answer.option_ids.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
              error: true,
              message: `At least one option must be selected for question "${question.question_text}"`
            });
          }
          // For checkboxes, create multiple answer entries
          for (const optionId of answer.option_ids) {
            const validOption = question.QuestionOptions.some(opt => opt.id === optionId);
            if (!validOption) {
              await transaction.rollback();
              return res.status(400).json({
                error: true,
                message: `Invalid option for question "${question.question_text}"`
              });
            }
            
            await Answer.create({
              survey_response_id: response.id,
              question_id: question.id,
              option_id: optionId
            }, { transaction });
          }
          continue; // Skip the general answer creation for checkboxes
        
        // Likert scale
        case 3:
          if (!answer.numeric_answer || answer.numeric_answer < 1 || answer.numeric_answer > 5) {
            await transaction.rollback();
            return res.status(400).json({
              error: true,
              message: `A rating between 1 and 5 must be provided for question "${question.question_text}"`
            });
          }
          break;
        
        // Open-ended
        case 4:
          if (!answer.text_answer) {
            await transaction.rollback();
            return res.status(400).json({
              error: true,
              message: `A text response must be provided for question "${question.question_text}"`
            });
          }
          break;
        
        // Dropdown
        case 5:
          if (!answer.option_id) {
            await transaction.rollback();
            return res.status(400).json({
              error: true,
              message: `An option must be selected for question "${question.question_text}"`
            });
          }
          // Check if option belongs to this question
          const validDropdownOption = question.QuestionOptions.some(opt => opt.id === answer.option_id);
          if (!validDropdownOption) {
            await transaction.rollback();
            return res.status(400).json({
              error: true,
              message: `Invalid option for question "${question.question_text}"`
            });
          }
          break;
      }

      // Create answer (except for checkboxes which were handled above)
      if (question.question_type_id !== 2) {
        await Answer.create({
          survey_response_id: response.id,
          question_id: question.id,
          option_id: answer.option_id || null,
          text_answer: answer.text_answer || null,
          numeric_answer: answer.numeric_answer || null
        }, { transaction });
      }
    }

    await transaction.commit();

    return res.status(201).json({
      error: false,
      message: 'Survey response submitted successfully',
      data: { response_id: response.id }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error submitting survey response:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while submitting survey response'
    });
  }
};

/**
 * Get responses for a survey (admins and survey creators only)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getResponsesBySurvey = async (req, res) => {
  try {
    const { survey_id } = req.params;
    
    // Check if survey exists
    const survey = await Survey.findByPk(survey_id);
    
    if (!survey) {
      return res.status(404).json({
        error: true,
        message: 'Survey not found'
      });
    }

    // Check if user has permission to view responses
    if (req.user.role !== 'admin' && survey.created_by !== req.user.id) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to view responses for this survey'
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get responses
    const { count, rows: responses } = await SurveyResponse.findAndCountAll({
      where: { survey_id },
      include: [
        {
          model: User,
          as: 'respondent',
          attributes: ['id', 'username', 'full_name', 'student_id', 'faculty', 'class_name']
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      error: false,
      data: {
        responses,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error(`Error fetching responses for survey ID ${req.params.survey_id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching survey responses'
    });
  }
};

/**
 * Get response details including answers
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getResponseDetails = async (req, res) => {
  try {
    const { response_id } = req.params;
    
    // Get response with answers
    const response = await SurveyResponse.findByPk(response_id, {
      include: [
        {
          model: Answer,
          include: [
            {
              model: Question,
              include: [
                {
                  model: QuestionOption
                }
              ]
            },
            {
              model: QuestionOption
            }
          ]
        },
        {
          model: User,
          as: 'respondent',
          attributes: ['id', 'username', 'full_name', 'student_id', 'faculty', 'class_name']
        },
        {
          model: Survey
        }
      ]
    });

    if (!response) {
      return res.status(404).json({
        error: true,
        message: 'Survey response not found'
      });
    }

    // Check if user has permission to view this response
    if (req.user.role !== 'admin' && response.Survey.created_by !== req.user.id && response.respondent_id !== req.user.id) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to view this response'
      });
    }

    return res.status(200).json({
      error: false,
      data: { response }
    });
  } catch (error) {
    logger.error(`Error fetching response details for ID ${req.params.response_id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching response details'
    });
  }
};

/**
 * Get response summary statistics for a survey
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getResponseSummary = async (req, res) => {
  try {
    const { survey_id } = req.params;
    
    // Check if survey exists
    const survey = await Survey.findByPk(survey_id, {
      include: [
        {
          model: SurveyTemplate,
          include: [
            {
              model: Question,
              include: [
                {
                  model: QuestionOption
                }
              ]
            }
          ]
        }
      ]
    });
    
    if (!survey) {
      return res.status(404).json({
        error: true,
        message: 'Survey not found'
      });
    }

    // Check if user has permission to view response summary
    if (req.user.role !== 'admin' && survey.created_by !== req.user.id) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to view response summary for this survey'
      });
    }

    // Get total response count
    const totalResponses = await SurveyResponse.count({
      where: { survey_id, status: 'completed' }
    });

    // Get statistics for each question
    const questions = survey.SurveyTemplate.Questions;
    const questionStats = [];

    for (const question of questions) {
      // Get all answers for this question
      const answers = await Answer.findAll({
        include: [
          {
            model: SurveyResponse,
            where: { survey_id, status: 'completed' }
          }
        ],
        where: { question_id: question.id }
      });

      // Build statistics based on question type
      let stats = {
        question_id: question.id,
        question_text: question.question_text,
        question_type_id: question.question_type_id,
        total_responses: answers.length
      };

      switch (question.question_type_id) {
        // Multiple choice or dropdown
        case 1:
        case 5:
          const optionCounts = {};
          question.QuestionOptions.forEach(opt => {
            optionCounts[opt.id] = {
              option_id: opt.id,
              option_text: opt.option_text,
              count: 0,
              percentage: 0
            };
          });

          answers.forEach(answer => {
            if (answer.option_id && optionCounts[answer.option_id]) {
              optionCounts[answer.option_id].count++;
            }
          });

          // Calculate percentages
          Object.keys(optionCounts).forEach(optId => {
            if (answers.length > 0) {
              optionCounts[optId].percentage = (optionCounts[optId].count / answers.length) * 100;
            }
          });

          stats.option_counts = Object.values(optionCounts);
          break;
        
        // Checkbox (multiple selection)
        case 2:
          const checkboxCounts = {};
          question.QuestionOptions.forEach(opt => {
            checkboxCounts[opt.id] = {
              option_id: opt.id,
              option_text: opt.option_text,
              count: 0,
              percentage: 0
            };
          });

          // For checkboxes, one response might have multiple answers
          answers.forEach(answer => {
            if (answer.option_id && checkboxCounts[answer.option_id]) {
              checkboxCounts[answer.option_id].count++;
            }
          });

          // Calculate percentages based on total responses (not total answers)
          Object.keys(checkboxCounts).forEach(optId => {
            if (totalResponses > 0) {
              checkboxCounts[optId].percentage = (checkboxCounts[optId].count / totalResponses) * 100;
            }
          });

          stats.option_counts = Object.values(checkboxCounts);
          break;
        
        // Likert scale
        case 3:
          const ratings = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
          let sum = 0;
          
          answers.forEach(answer => {
            if (answer.numeric_answer >= 1 && answer.numeric_answer <= 5) {
              ratings[answer.numeric_answer]++;
              sum += answer.numeric_answer;
            }
          });

          const average = answers.length > 0 ? sum / answers.length : 0;
          
          // Convert to array for easier use in frontend
          const ratingsArray = Object.keys(ratings).map(rating => ({
            rating: parseInt(rating),
            count: ratings[rating],
            percentage: answers.length > 0 ? (ratings[rating] / answers.length) * 100 : 0
          }));

          stats.ratings = ratingsArray;
          stats.average_rating = average;
          break;
        
        // Open-ended
        case 4:
          // Just provide the text answers for open-ended questions
          stats.text_answers = answers.map(a => a.text_answer).filter(Boolean);
          break;
      }

      questionStats.push(stats);
    }

    return res.status(200).json({
      error: false,
      data: {
        survey_id,
        title: survey.title,
        total_responses: totalResponses,
        question_stats: questionStats
      }
    });
  } catch (error) {
    logger.error(`Error generating response summary for survey ID ${req.params.survey_id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while generating response summary'
    });
  }
};
