// src/api/services/llm.service.js - LLM/AI API service
import http from '../http';

const LLMService = {
  /**
   * Generate survey using AI
   */
  async generateSurvey(generationData) {
    const response = await http.post('/llm/generate', generationData);
    return response.data;
  },

  /**
   * Analyze survey responses using AI
   */
  async analyzeSurveyResponses(surveyId, analysisData = {}) {
    const response = await http.post(`/llm/analyze/${surveyId}`, analysisData);
    return response.data;
  },

  /**
   * Get all prompts
   */
  async getPrompts(params = {}) {
    const response = await http.get('/llm/prompts', { params });
    return response.data;
  },

  /**
   * Create new prompt
   */
  async createPrompt(promptData) {
    const response = await http.post('/llm/prompts', promptData);
    return response.data;
  },

  /**
   * Get prompt by ID
   */
  async getPromptById(id) {
    const response = await http.get(`/llm/prompts/${id}`);
    return response.data;
  },

  /**
   * Update prompt
   */
  async updatePrompt(id, promptData) {
    const response = await http.put(`/llm/prompts/${id}`, promptData);
    return response.data;
  },

  /**
   * Delete prompt
   */
  async deletePrompt(id) {
    const response = await http.delete(`/llm/prompts/${id}`);
    return response.data;
  },

  /**
   * Get analysis results for a survey
   */
  async getAnalysisResults(surveyId) {
    const response = await http.get(`/llm/analysis/${surveyId}`);
    return response.data;
  },

  /**
   * Test prompt with sample data
   */
  async testPrompt(promptId, testData) {
    const response = await http.post(`/llm/prompts/${promptId}/test`, testData);
    return response.data;
  },
};

export default LLMService;
