/**
 * Form Agent Service
 * Integrates with HuggingFace Form Agent API for metadata prediction and question generation
 * API Endpoint: https://phamanhtuan15-form-agent-ai.hf.space
 */

const axios = require('axios');

const HF_SPACES_URL = 'https://phamanhtuan15-form-agent-ai.hf.space';
const PREDICT_ENDPOINT = `${HF_SPACES_URL}/predict`;
const GENERATE_ENDPOINT = `${HF_SPACES_URL}/generate`;

/**
 * Predict survey metadata based on keyword/description
 * @param {string} keyword - Survey description or keyword
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function predictMetadata(keyword) {
  try {
    if (!keyword || typeof keyword !== 'string') {
      return {
        success: false,
        error: 'Keyword must be a non-empty string'
      };
    }

    const response = await axios.post(PREDICT_ENDPOINT, {
      keyword: keyword.trim(),
      max_tokens: 512
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data) {
      return {
        success: true,
        data: {
          prediction: response.data.prediction || response.data,
          keyword: keyword,
          timestamp: new Date().toISOString()
        }
      };
    }

    return {
      success: false,
      error: 'Unexpected response format from AI service'
    };
  } catch (error) {
    console.error('Form Agent predictMetadata error:', error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to predict metadata'
    };
  }
}

/**
 * Generate questions based on parameters
 * @param {Object} params - Generation parameters
 * @param {string} params.keyword - Survey topic/keyword
 * @param {number} params.numQuestions - Number of questions to generate (default: 5)
 * @param {string} params.category - Question category (default: 'general')
 * @returns {Promise<{success: boolean, data?: object[], error?: string}>}
 */
async function generateQuestions(params = {}) {
  try {
    const {
      keyword = '',
      numQuestions = 5,
      category = 'general'
    } = params;

    if (!keyword || typeof keyword !== 'string') {
      return {
        success: false,
        error: 'Keyword must be a non-empty string'
      };
    }

    if (!Number.isInteger(numQuestions) || numQuestions < 1 || numQuestions > 20) {
      return {
        success: false,
        error: 'Number of questions must be between 1 and 20'
      };
    }

    const response = await axios.post(GENERATE_ENDPOINT, {
      keyword: keyword.trim(),
      num_questions: numQuestions,
      category: category.trim() || 'general'
    }, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data) {
      let questions = [];
      
      // Handle different response formats from HF API
      if (Array.isArray(response.data)) {
        questions = response.data;
      } else if (response.data.questions && Array.isArray(response.data.questions)) {
        questions = response.data.questions;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        questions = response.data.data;
      } else if (typeof response.data === 'object') {
        // Try to extract questions from object format
        questions = [response.data];
      }

      // Normalize questions to standard format
      const normalizedQuestions = questions.map((q, idx) => {
        if (typeof q === 'string') {
          return {
            text: q,
            category: category,
            type: 'short_answer',
            order_index: idx,
            required: false,
            label: `Q${idx + 1}`
          };
        }
        return {
          text: q.text || q.question || '',
          category: q.category || category,
          type: q.type || 'short_answer',
          order_index: idx,
          required: q.required || false,
          label: q.label || `Q${idx + 1}`,
          options: q.options || []
        };
      });

      return {
        success: true,
        data: normalizedQuestions,
        metadata: {
          keyword: keyword,
          generated_count: normalizedQuestions.length,
          category: category,
          timestamp: new Date().toISOString()
        }
      };
    }

    return {
      success: false,
      error: 'Unexpected response format from AI service'
    };
  } catch (error) {
    console.error('Form Agent generateQuestions error:', error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to generate questions'
    };
  }
}

/**
 * Health check for AI service availability
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
  try {
    const response = await axios.get(`${HF_SPACES_URL}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.warn('Form Agent health check failed:', error.message);
    return false;
  }
}

module.exports = {
  predictMetadata,
  generateQuestions,
  healthCheck
};
