// src/api/services/response.service.js - Response API service
import http from '../http';

const ResponseService = {
  /**
   * Submit response (authenticated user)
   */
  async submitResponse(responseData) {
    const response = await http.post('/modules/responses', responseData);
    return response.data;
  },

  /**
   * Submit public response (anonymous - no auth)
   * Uses collector token instead of authentication
   */
  async submitPublicResponse(token, responseData) {
    const response = await http.post(`/modules/responses/public/${token}`, responseData);
    return response.data;
  },

  /**
   * Get survey by public token (anonymous - no auth)
   */
  async getSurveyByToken(token) {
    const response = await http.get(`/modules/collectors/token/${token}`);
    const data = response.data;
    
    // Return format that matches frontend expectations
    return {
      ok: data.success,
      data: data.data,
      message: data.message
    };
  },

  /**
   * Get user's own responses with enhanced filtering
   */
  async getUserResponses(params = {}) {
    const response = await http.get('/modules/responses/my-responses', { params });
    return response.data;
  },

  /**
   * Get detailed user response with all answers
   */
  async getUserResponseDetail(id) {
    const response = await http.get(`/modules/responses/my-responses/${id}`);
    return response.data;
  },

  /**
   * Get response by ID
   */
  async getResponseById(id) {
    const response = await http.get(`/modules/responses/${id}`);
    return response.data;
  },

  /**
   * Get all responses for a survey (creator/admin only)
   */
  async getResponsesBySurvey(surveyId, params = {}) {
    const response = await http.get(`/modules/responses/survey/${surveyId}`, { params });
    return response.data;
  },

  /**
   * Delete response
   */
  async deleteResponse(id) {
    const response = await http.delete(`/modules/responses/${id}`);
    return response.data;
  },

  /**
   * Check if user already submitted response to survey
   */
  async checkExistingResponse(surveyId) {
    const response = await http.get(`/modules/responses/check/${surveyId}`);
    return response.data;
  },
};

export default ResponseService;
