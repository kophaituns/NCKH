// src/api/services/survey.service.js - Survey API service
import http from '../http';

const SurveyService = {
  /**
   * Get all surveys with filters
   */
  async getAll(params = {}) {
    try {
      const response = await http.get('/surveys', { params });
      console.log('Survey API response:', response.data);
      // Backend returns { success: true, data: { surveys: [...], pagination: {...} } }
      const surveys = response.data.data?.surveys || response.data?.surveys || [];
      console.log('Extracted surveys:', surveys);
      return Array.isArray(surveys) ? surveys : [];
    } catch (error) {
      console.error('Error in SurveyService.getAll:', error);
      return [];
    }
  },

  async getAllSurveys(params = {}) {
    return this.getAll(params);
  },

  /**
   * Get survey by ID
   */
  async getById(id) {
    const response = await http.get(`/surveys/${id}`);
    // Backend returns { success: true, data: { survey: {...} } }
    return response.data.data?.survey || null;
  },

  async getSurveyById(id) {
    return this.getById(id);
  },

  /**
   * Create new survey
   */
  async create(surveyData) {
    const response = await http.post('/surveys', surveyData);
    return response.data.data;
  },

  async createSurvey(surveyData) {
    return this.create(surveyData);
  },

  /**
   * Update survey
   */
  async update(id, surveyData) {
    const response = await http.put(`/surveys/${id}`, surveyData);
    return response.data.data;
  },

  async updateSurvey(id, surveyData) {
    return this.update(id, surveyData);
  },

  /**
   * Delete survey
   */
  async delete(id) {
    const response = await http.delete(`/surveys/${id}`);
    return response.data;
  },

  async deleteSurvey(id) {
    return this.delete(id);
  },

  /**
   * Publish survey (draft -> active)
   */
  async publishSurvey(id) {
    const response = await http.post(`/surveys/${id}/publish`);
    return response.data;
  },

  /**
   * Close survey (active -> closed)
   */
  async closeSurvey(id) {
    const response = await http.post(`/surveys/${id}/close`);
    return response.data;
  },

  /**
   * Update survey status
   */
  async updateStatus(id, status) {
    const response = await http.patch(`/surveys/${id}/status`, { status });
    return response.data;
  },

  /**
   * Get survey statistics
   */
  async getSurveyStats(id) {
    const response = await http.get(`/surveys/${id}/stats`);
    return response.data;
  },

  /**
   * Get current user's surveys (for creator dashboard)
   */
  async getMySurveys(params = {}) {
    return this.getAll(params);
  },
};

export default SurveyService;
