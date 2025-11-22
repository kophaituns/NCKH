// src/modules/llm-form-agent/service/formAgent.service.js
const axios = require('axios');
const logger = require('../../../utils/logger');

const BASE_URL = process.env.FORM_AGENT_AI_BASE_URL || 'https://phamanhtuan15-form-agent-ai.hf.space';

class FormAgentService {
  /**
   * Validate keyword input
   */
  validateKeyword(keyword) {
    if (typeof keyword !== 'string' || keyword.trim().length === 0) {
      const error = new Error('Keyword must be a non-empty string');
      error.code = 'INVALID_INPUT';
      error.status = 400;
      throw error;
    }
  }

  /**
   * Predict form metadata based on keyword
   * Calls POST {BASE_URL}/predict
   */
  async predictMetadata({ keyword }) {
    try {
      this.validateKeyword(keyword);

      logger.debug('Calling Form Agent AI predict endpoint', { keyword });

      const response = await axios.post(
        `${BASE_URL}/predict`,
        { keyword },
        { timeout: 30000 }
      );

      logger.debug('Form Agent AI predict response received', {
        keyword,
        category: response.data.category
      });

      return response.data;
    } catch (error) {
      return this.handleAxiosError(error, 'predictMetadata');
    }
  }

  /**
   * Generate questions based on keyword and parameters
   * Tries POST {BASE_URL}/generate first, falls back to /predict if not available
   */
  async generateQuestions({ keyword, numQuestions = 5, category = null }) {
    try {
      this.validateKeyword(keyword);

      logger.debug('Calling Form Agent AI generate endpoint', {
        keyword,
        numQuestions,
        category
      });

      // Try to call /generate endpoint
      try {
        const response = await axios.post(
          `${BASE_URL}/generate`,
          {
            keyword,
            num_questions: numQuestions,
            ...(category && { category })
          },
          { timeout: 30000 }
        );

        logger.debug('Form Agent AI generate response received', { keyword });
        return response.data;
      } catch (generateError) {
        // If /generate is not available (404), fall back to /predict
        if (generateError.response?.status === 404) {
          logger.info('Form Agent AI /generate endpoint not available, falling back to /predict');
          return this.fallbackToPredict(keyword, numQuestions);
        }
        throw generateError;
      }
    } catch (error) {
      return this.handleAxiosError(error, 'generateQuestions');
    }
  }

  /**
   * Fallback strategy: call /predict and synthesize questions
   */
  async fallbackToPredict(keyword, numQuestions) {
    try {
      const predictResult = await this.predictMetadata({ keyword });

      // Synthesize placeholder questions based on the keyword and metadata
      const questions = this.synthesizeQuestions(
        keyword,
        numQuestions,
        predictResult
      );

      return {
        keyword,
        questions,
        raw: predictResult,
        fallback: true
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Synthesize placeholder questions based on keyword and metadata
   */
  synthesizeQuestions(keyword, numQuestions, metadata) {
    const questions = [];
    const category = metadata?.category || 'general';
    const formType = metadata?.form_type || 'standard';

    // Generate diverse question types
    const questionTemplates = [
      {
        text: `On a scale of 1-10, how relevant is this ${category} topic to you?`,
        type: 'rating',
        required: true
      },
      {
        text: `Which of the following best describes your experience with ${keyword}?`,
        type: 'single_choice',
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        required: true
      },
      {
        text: `What aspects of ${keyword} are most important to you? (Select all that apply)`,
        type: 'multiple_choice',
        options: ['Functionality', 'Ease of use', 'Cost', 'Support', 'Other'],
        required: false
      },
      {
        text: `Please describe your main goals related to ${keyword}`,
        type: 'open_ended',
        required: false
      },
      {
        text: `How frequently do you interact with ${keyword}?`,
        type: 'single_choice',
        options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'],
        required: true
      },
      {
        text: `What challenges do you face with ${keyword}?`,
        type: 'open_ended',
        required: false
      },
      {
        text: `Would you recommend ${keyword} to others?`,
        type: 'single_choice',
        options: ['Definitely yes', 'Probably yes', 'Neutral', 'Probably no', 'Definitely no'],
        required: true
      },
      {
        text: `What improvements would you suggest for ${keyword}?`,
        type: 'open_ended',
        required: false
      }
    ];

    // Select numQuestions from templates
    for (let i = 0; i < Math.min(numQuestions, questionTemplates.length); i++) {
      const template = questionTemplates[i];
      questions.push({
        text: template.text,
        type: template.type,
        required: template.required,
        ...(template.options && { options: template.options })
      });
    }

    return questions;
  }

  /**
   * Handle axios errors and normalize them
   */
  handleAxiosError(error, operation) {
    let status = 500;
    let code = 'FORM_AGENT_AI_ERROR';
    let message = 'An error occurred while calling Form Agent AI service';

    if (error.code === 'INVALID_INPUT') {
      // This is our validation error
      throw error;
    }

    if (error.response) {
      // The request was made and the server responded with a status code outside 2xx
      status = error.response.status;
      message = `Form Agent AI service returned status ${status}`;
      
      if (status >= 500) {
        code = 'FORM_AGENT_AI_UNAVAILABLE';
        message = 'Form Agent AI service is temporarily unavailable';
      } else if (status === 404) {
        message = 'Form Agent AI endpoint not found';
      } else if (status === 400) {
        message = 'Invalid request to Form Agent AI service';
      }

      logger.warn(`${operation} - HTTP error from Form Agent AI`, {
        status,
        code,
        operation
      });
    } else if (error.request) {
      // The request was made but no response was received
      status = 503;
      code = 'FORM_AGENT_AI_UNAVAILABLE';
      message = 'Form Agent AI service is unreachable';
      
      logger.error(`${operation} - No response from Form Agent AI`, {
        operation,
        errorMessage: error.message
      });
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      // Timeout
      status = 503;
      code = 'FORM_AGENT_AI_UNAVAILABLE';
      message = 'Form Agent AI service request timed out';
      
      logger.error(`${operation} - Timeout calling Form Agent AI`, { operation });
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error(`${operation} - Unexpected error calling Form Agent AI`, {
        operation,
        errorMessage: error.message
      });
    }

    const err = new Error(message);
    err.status = status;
    err.code = code;
    throw err;
  }
}

module.exports = new FormAgentService();
