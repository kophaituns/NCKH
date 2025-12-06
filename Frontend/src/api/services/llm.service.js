// src/api/services/llm.service.js - LLM/AI API service
import http from '../http';

const LLMService = {
  /**
   * Generate survey using AI
   */
  async generateSurvey(generationData) {
    const response = await http.post('/modules/llm/generate-survey', generationData);
    return response.data;
  },

  /**
   * Analyze survey responses using AI
   */
  async analyzeSurveyResponses(surveyId, analysisData = {}) {
    const response = await http.post(`/modules/llm/analyze-responses`, { survey_id: surveyId, ...analysisData });
    return response.data;
  },

  /**
   * Get all prompts
   */
  async getLlmPrompts(type = null) {
    const response = await http.get('/modules/llm/prompts', { params: { type } });
    return response.data;
  },

  /**
   * Create new prompt
   */
  async createPrompt(promptData) {
    const response = await http.post('/modules/llm/prompts', promptData);
    return response.data;
  },

  /**
   * Get prompt by ID
   */
  async getPromptById(id) {
    const response = await http.get(`/modules/llm/prompts/${id}`);
    return response.data;
  },

  /**
   * Update prompt
   */
  async updatePrompt(id, promptData) {
    const response = await http.put(`/modules/llm/prompts/${id}`, promptData);
    return response.data;
  },

  /**
   * Delete prompt
   */
  async deletePrompt(id) {
    const response = await http.delete(`/modules/llm/prompts/${id}`);
    return response.data;
  },

  /**
   * Get analysis results for a survey
   */
  async getAnalysisResults(surveyId) {
    const response = await http.get(`/modules/llm/analysis/${surveyId}`);
    return response.data;
  },

  /**
   * Generate questions using AI
   */
  async generateQuestions(data) {
    const response = await http.post('/modules/llm/generate-questions', data);
    return response.data;
  },

  /**
   * Predict category for keyword
   */
  async predictCategory(data) {
    const response = await http.post('/modules/llm/predict-category', data);
    return response.data;
  },

  /**
   * Get available categories
   */
  async getCategories() {
    const response = await http.get('/modules/llm/categories');
    return response.data;
  },

  /**
   * Check Hugging Face API health
   */
  async checkHuggingFaceHealth() {
    const response = await http.get('/modules/llm/health');
    return response.data;
  },

  /**
   * Test prompt with sample data
   */
  async testPrompt(promptId, testData) {
    const response = await http.post(`/modules/llm/prompts/${promptId}/test`, testData);
    return response.data;
  },

  /**
   * Create survey from generated questions
   */
  async createSurveyFromQuestions(surveyData) {
    const response = await http.post('/modules/llm/create-survey', surveyData);
    return response.data;
  },

  /**
   * Export survey as PDF
   */
  async exportSurveyPDF(surveyId) {
    const response = await http.get(`/modules/llm/export-pdf/${surveyId}`, {
      responseType: 'text'
    });
    
    // Create a new window with the HTML content for PDF printing
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(response.data);
      newWindow.document.close();
      
      // Auto-trigger print dialog after content loads
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print();
        }, 500);
      };
    }
    
    return { success: true, message: 'PDF đã mở để in. Chọn "Save as PDF" trong hộp thoại in để tải xuống.' };
  },

  /**
   * Generate public link for survey
   */
  async generatePublicLink(surveyId, expiryDays = 30) {
    const response = await http.post(`/modules/llm/generate-link/${surveyId}`, { expiryDays });
    return response.data;
  },

  /**
   * Get survey results and analytics
   */
  async getSurveyResults(surveyId) {
    const response = await http.get(`/modules/llm/surveys/${surveyId}/results`);
    return response.data;
  },

  /**
   * Get survey for editing
   */
  async getSurveyForEditing(surveyId) {
    const response = await http.get(`/modules/llm/surveys/${surveyId}/edit`);
    return response.data;
  },

  /**
   * Update survey settings
   */
  async updateSurveySettings(surveyId, settingsData) {
    const response = await http.put(`/modules/llm/surveys/${surveyId}/settings`, settingsData);
    return response.data;
  },

  /**
   * Update survey question
   */
  async updateSurveyQuestion(surveyId, questionId, questionData) {
    const response = await http.put(`/modules/llm/surveys/${surveyId}/questions/${questionId}`, questionData);
    return response.data;
  },

  /**
   * Delete survey question
   */
  async deleteSurveyQuestion(surveyId, questionId) {
    const response = await http.delete(`/modules/llm/surveys/${surveyId}/questions/${questionId}`);
    return response.data;
  },

  /**
   * Add new question to survey
   */
  async addSurveyQuestion(surveyId, questionData) {
    const response = await http.post(`/modules/llm/surveys/${surveyId}/questions`, questionData);
    return response.data;
  },
};

export default LLMService;
