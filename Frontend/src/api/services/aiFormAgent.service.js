// src/api/services/aiFormAgent.service.js - AI Form Agent API service
import http from '../http';

const AiFormAgentService = {
  /**
   * Predict form metadata based on keyword
   * @param {string} keyword - The keyword to predict metadata for
   * @returns {Promise<Object>} Prediction result with category, form_type, complexity, etc.
   */
  async predictMetadata(keyword) {
    try {
      if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
        throw new Error('Keyword must be a non-empty string');
      }

      console.log('[AiFormAgentService.predictMetadata] Calling predict endpoint with keyword:', keyword);

      const response = await http.post('/llm/form-agent/predict', { keyword });
      
      // Backend returns { success: true, ok: true, error: false, data: {...} }
      const data = response.data;
      
      if (!data.ok && !data.success) {
        throw new Error(data.message || 'Failed to predict form metadata');
      }

      console.log('[AiFormAgentService.predictMetadata] Response received:', data.data);
      return data.data;
    } catch (error) {
      console.error('[AiFormAgentService.predictMetadata] Error:', error.message);
      
      // Extract user-friendly error message
      let errorMessage = 'Failed to predict form metadata';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Generate questions based on keyword and optional parameters
   * @param {Object} payload - { keyword: string, numQuestions?: number, category?: string }
   * @returns {Promise<Object>} Generated questions with structure: { keyword, questions, raw, fallback }
   */
  async generateQuestions(payload) {
    try {
      const { keyword, numQuestions = 5, category = undefined } = payload;

      if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
        throw new Error('Keyword must be a non-empty string');
      }

      console.log('[AiFormAgentService.generateQuestions] Calling generate endpoint with:', {
        keyword,
        numQuestions,
        category
      });

      const requestBody = {
        keyword,
        numQuestions: numQuestions || 5,
        ...(category && { category })
      };

      const response = await http.post('/llm/form-agent/generate', requestBody);
      
      // Backend returns { success: true, ok: true, error: false, data: { keyword, questions, raw, fallback } }
      const data = response.data;
      
      if (!data.ok && !data.success) {
        throw new Error(data.message || 'Failed to generate questions');
      }

      console.log('[AiFormAgentService.generateQuestions] Response received:', data.data);
      return data.data;
    } catch (error) {
      console.error('[AiFormAgentService.generateQuestions] Error:', error.message);
      
      // Extract user-friendly error message
      let errorMessage = 'Failed to generate questions. AI service is currently unavailable. Please try again later.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Keyword must be a non-empty string') {
        errorMessage = error.message;
      } else if (error.message && error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      throw new Error(errorMessage);
    }
  }
};

export default AiFormAgentService;
