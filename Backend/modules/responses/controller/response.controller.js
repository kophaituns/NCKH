// modules/responses/controller/response.controller.js
const responseService = require('../service/response.service');
const logger = require('../../../src/utils/logger');

class ResponseController {
  /**
   * Submit survey response
   */
  async submitResponse(req, res) {
    try {
      const { survey_id, answers } = req.body;

      // Validation
      if (!survey_id || !answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Survey ID and answers array are required'
        });
      }

      const response = await responseService.submitResponse(req.body, req.user);

      res.status(201).json({
        success: true,
        message: 'Response submitted successfully',
        data: { response }
      });
    } catch (error) {
      logger.error('Submit response error:', error);

      if (error.message.includes('not found') || error.message.includes('not active')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('already responded')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error submitting response'
      });
    }
  }

  /**
   * Get response by ID
   */
  async getResponseById(req, res) {
    try {
      const { id } = req.params;

      const response = await responseService.getResponseById(id, req.user);

      if (!response) {
        return res.status(404).json({
          success: false,
          message: 'Response not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { response }
      });
    } catch (error) {
      logger.error('Get response error:', error);

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching response'
      });
    }
  }

  /**
   * Get all responses for a survey
   */
  async getResponsesBySurvey(req, res) {
    try {
      const surveyId = parseInt(req.params.surveyId, 10);
      
      // Validate surveyId
      if (!surveyId || isNaN(surveyId)) {
        console.error('[getResponsesBySurvey] Invalid surveyId:', req.params.surveyId);
        return res.status(400).json({
          ok: false,
          message: 'Invalid surveyId'
        });
      }

      console.log('[getResponsesBySurvey] Fetching responses for survey:', surveyId);

      const { page, limit } = req.query;

      const result = await responseService.getResponsesBySurvey(
        surveyId,
        req.user,
        { page, limit }
      );

      console.log('[getResponsesBySurvey] Service returned:', {
        responseCount: result.responses?.length || 0,
        total: result.pagination?.total
      });

      // Format responses to match frontend expectations
      const formattedResponses = (result.responses || []).map(response => {
        // Convert Answer associations to simple answer array
        const answers = (response.Answers || response.answers || []).map(answer => {
          let value;
          const questionTypeId = answer.Question?.question_type_id;
          
          // Question types with options: 1=multiple_choice, 2=checkbox, 3=likert_scale, 5=dropdown
          const hasOptions = [1, 2, 3, 5].includes(questionTypeId);
          
          // Likert scale fallback labels (English)
          const likertLabels = [
            "Strongly disagree",
            "Disagree",
            "Neutral",
            "Agree",
            "Strongly agree"
          ];
          
          // Determine value based on answer type
          if (hasOptions && answer.QuestionOption) {
            // Use option text for questions with options
            value = answer.QuestionOption.option_text;
            
            // For Likert scale (type 3), ensure clean English labels
            if (questionTypeId === 3) {
              // If option_text looks corrupted or is not in English, use fallback
              const optionText = answer.QuestionOption.option_text || '';
              
              // Check if it's already in "N - Label" format
              const match = optionText.match(/^(\d+)\s*-\s*(.+)$/);
              if (match) {
                const score = parseInt(match[1]);
                const label = match[2];
                
                // If label contains non-ASCII characters or looks corrupted, use fallback
                if (!/^[a-zA-Z\s]+$/.test(label) || label.includes('Ã') || label.includes('º')) {
                  const fallbackLabel = likertLabels[score - 1] || likertLabels[2];
                  value = `${score} - ${fallbackLabel}`;
                } else {
                  value = optionText;
                }
              } else {
                // Not in expected format, try to extract numeric value
                const numericValue = parseInt(optionText);
                if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
                  value = `${numericValue} - ${likertLabels[numericValue - 1]}`;
                } else {
                  value = optionText;
                }
              }
            }
          } else if (questionTypeId === 3 && (answer.numeric_answer || answer.option_id)) {
            // Likert question without QuestionOption - use numeric value with label
            const score = answer.numeric_answer || answer.option_id;
            if (score >= 1 && score <= 5) {
              value = `${score} - ${likertLabels[score - 1]}`;
            } else {
              value = score;
            }
          } else if (answer.option_id && answer.QuestionOption) {
            // Fallback for option-based answers
            value = answer.QuestionOption.option_text;
          } else if (answer.numeric_answer !== null && answer.numeric_answer !== undefined) {
            value = answer.numeric_answer;
          } else if (answer.text_answer !== null && answer.text_answer !== undefined) {
            value = answer.text_answer;
          } else if (answer.option_text) {
            value = answer.option_text;
          } else if (answer.answer_value !== null && answer.answer_value !== undefined) {
            value = answer.answer_value;
          } else if (answer.value !== null && answer.value !== undefined) {
            value = answer.value;
          } else if (answer.option_id) {
            // Last resort: use option_id if we couldn't get text
            value = answer.option_id;
          }

          return {
            questionId: answer.question_id,
            questionLabel: answer.Question?.question_text || `Question ${answer.question_id}`,
            label: answer.Question?.question_text || `Question ${answer.question_id}`, // Add 'label' for consistency
            value: value
          };
        });

        return {
          id: response.id,
          survey_id: response.survey_id,
          collector_id: response.collector_id,
          created_at: response.created_at || response.createdAt,
          answers: answers
        };
      });

      console.log('[getResponsesBySurvey] Completed successfully, returning', formattedResponses.length, 'responses');

      res.status(200).json({
        ok: true,
        surveyId: surveyId,
        total: result.pagination?.total || formattedResponses.length,
        responses: formattedResponses
      });
    } catch (error) {
      console.error('[getResponsesBySurvey] ERROR:', error);
      logger.error('Get survey responses error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          ok: false,
          message: error.message
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          ok: false,
          message: error.message
        });
      }

      res.status(500).json({
        ok: false,
        message: error.message || 'Failed to load survey responses'
      });
    }
  }

  /**
   * Get user's own responses
   */
  async getUserResponses(req, res) {
    try {
      const { page, limit } = req.query;

      const result = await responseService.getUserResponses(req.user, { page, limit });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get user responses error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching user responses'
      });
    }
  }

  /**
   * Delete response
   */
  async deleteResponse(req, res) {
    try {
      const { id } = req.params;

      await responseService.deleteResponse(id, req.user);

      res.status(200).json({
        success: true,
        message: 'Response deleted successfully'
      });
    } catch (error) {
      logger.error('Delete response error:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting response'
      });
    }
  }
}

module.exports = new ResponseController();
