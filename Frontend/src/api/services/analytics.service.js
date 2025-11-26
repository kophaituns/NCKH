// src/api/services/analytics.service.js - Analytics API service
import http from '../http';

const AnalyticsService = {
  /**
   * Get dashboard statistics (overview cho creator/general)
   */
  async getDashboardStats() {
    const response = await http.get('/analytics/dashboard');
    // BE trả dạng { success, data: {...} }
    return response.data.data || response.data;
  },

  /**
   * Get **ADMIN** dashboard statistics
   * (Total Users, Total Surveys, Total Responses, Active Surveys, role stats, charts)
   */
  async getAdminDashboard() {
    const response = await http.get('/analytics/dashboard');
    // Trả thẳng object stats để FE dùng cho tiện
    return response.data.data || response.data;
  },

  /**
   * Get survey summary analytics
   * Backend: /analytics/survey/:survey_id/summary
   */
  async getSurveySummary(surveyId) {
    const response = await http.get(`/analytics/survey/${surveyId}/summary`);
    return response.data.data || response.data;
  },

  /**
   * Get detailed question analytics for ONE question
   * (nếu bạn dùng endpoint này)
   * Backend (nếu có): /analytics/survey/:survey_id/questions/:question_id
   */
  async getQuestionAnalytics(surveyId, questionId) {
    const response = await http.get(
      `/analytics/survey/${surveyId}/questions/${questionId}`
    );
    return response.data.data || response.data;
  },

  /**
   * Get ALL questions analytics for a survey
   * Backend: /analytics/survey/:survey_id/questions
   */
  async getAllQuestionsAnalytics(surveyId) {
    const response = await http.get(`/analytics/survey/${surveyId}/questions`);
    return response.data.data || response.data;
  },

  /**
   * Get response details with analysis
   * Backend: /analytics/survey/:survey_id/responses
   */
  async getResponseDetails(surveyId, params = {}) {
    const response = await http.get(
      `/analytics/survey/${surveyId}/responses`,
      { params }
    );
    return response.data.data || response.data;
  },

  /**
   * Get time-series data for responses
   * (nếu bạn có route /analytics/survey/:id/time-series)
   */
  async getResponseTimeSeries(surveyId, params = {}) {
    const response = await http.get(
      `/analytics/survey/${surveyId}/time-series`,
      { params }
    );
    return response.data.data || response.data;
  },

  /**
   * Get completion rate statistics
   * (nếu bạn có route /analytics/survey/:id/completion)
   */
  async getCompletionStats(surveyId) {
    const response = await http.get(
      `/analytics/survey/${surveyId}/completion`
    );
    return response.data.data || response.data;
  },

  /**
   * Get survey activity trend (for dashboard)
   * Backend: /analytics/survey-activity-trend (nếu bạn đã khai báo)
   */
  async getSurveyActivityTrend(params = {}) {
    const response = await http.get('/analytics/survey-activity-trend', {
      params,
    });
    return response.data.data || [];
  },
};

export default AnalyticsService;
