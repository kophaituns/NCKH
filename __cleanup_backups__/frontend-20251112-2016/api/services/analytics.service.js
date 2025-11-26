// src/api/services/analytics.service.js - Analytics API service
import http from '../http';

const AnalyticsService = {
  /**
   * Get dashboard statistics (overview)
   */
  async getDashboardStats() {
    const response = await http.get('/analytics/dashboard');
    return response.data;
  },

  /**
   * Get survey summary analytics
   */
  async getSurveySummary(surveyId) {
    const response = await http.get(`/analytics/surveys/${surveyId}/summary`);
    return response.data;
  },

  /**
   * Get detailed question analytics
   */
  async getQuestionAnalytics(surveyId, questionId) {
    const response = await http.get(`/analytics/surveys/${surveyId}/questions/${questionId}`);
    return response.data;
  },

  /**
   * Get all questions analytics for a survey
   */
  async getAllQuestionsAnalytics(surveyId) {
    const response = await http.get(`/analytics/surveys/${surveyId}/questions`);
    return response.data;
  },

  /**
   * Get response details with analysis
   */
  async getResponseDetails(surveyId, params = {}) {
    const response = await http.get(`/analytics/surveys/${surveyId}/responses`, { params });
    return response.data;
  },

  /**
   * Get time-series data for responses
   */
  async getResponseTimeSeries(surveyId, params = {}) {
    const response = await http.get(`/analytics/surveys/${surveyId}/time-series`, { params });
    return response.data;
  },

  /**
   * Get completion rate statistics
   */
  async getCompletionStats(surveyId) {
    const response = await http.get(`/analytics/surveys/${surveyId}/completion`);
    return response.data;
  },

  /**
   * Get survey activity trend (for dashboard)
   */
  async getSurveyActivityTrend(params = {}) {
    const response = await http.get('/analytics/survey-activity-trend', { params });
    return response.data.data || [];
  },
};

export default AnalyticsService;
