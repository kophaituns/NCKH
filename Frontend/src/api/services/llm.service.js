// src/api/services/llm.service.js - LLM/AI API service
import http from '../http';

const LLMService = {
  /**
   * Generate survey using AI
   */
  async generateSurvey(generationData) {
    const response = await http.post('/llm/generate-survey', generationData);
    return response.data;
  },

  /**
   * Analyze survey responses using AI
   */
  async analyzeSurveyResponses(surveyId, analysisData = {}) {
    const response = await http.post(`/llm/analyze-responses`, { survey_id: surveyId, ...analysisData });
    return response.data;
  },

  /**
   * Get all prompts
   */
  async getLlmPrompts(type = null) {
    const response = await http.get('/llm/prompts', { params: { type } });
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
   * Generate questions using AI
   */
  async generateQuestions(data) {
    const response = await http.post('/llm/generate-questions', data);
    return response.data;
  },

  /**
   * Predict category for keyword
   */
  async predictCategory(data) {
    const response = await http.post('/llm/predict-category', data);
    return response.data;
  },

  /**
   * Get available categories
   */
  async getCategories() {
    const response = await http.get('/llm/categories');
    return response.data;
  },

  /**
   * Check Hugging Face API health
   */
  async checkHuggingFaceHealth() {
    const response = await http.get('/llm/health');
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
