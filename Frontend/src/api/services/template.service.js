// src/api/services/template.service.js - Template API service
import http from '../http';

const TemplateService = {
  /**
   * Get all templates
   */
  async getAll(params = {}) {
    try {
      const response = await http.get('/templates', { params });
      console.log('Template API response:', response.data);
      // Backend returns { success: true, data: { templates: [...], pagination: {...} } }
      const templates = response.data.data?.templates || response.data?.templates || [];
      console.log('Extracted templates:', templates);
      return Array.isArray(templates) ? templates : [];
    } catch (error) {
      console.error('Error in TemplateService.getAll:', error);
      return [];
    }
  },

  // Alias for compatibility
  async getAllTemplates(params = {}) {
    return this.getAll(params);
  },

  /**
   * Get template by ID
   */
  async getById(id) {
    const response = await http.get(`/templates/${id}`);
    // Backend returns { success: true, data: { template: {...} } }
    return response.data.data?.template || null;
  },

  // Alias for compatibility
  async getTemplateById(id) {
    return this.getById(id);
  },

  /**
   * Get questions for a template
   */
  async getQuestions(templateId) {
    const response = await http.get(`/templates/${templateId}/questions`);
    return response.data;
  },

  /**
   * Create new template
   */
  async create(templateData) {
    const response = await http.post('/templates', templateData);
    return response.data.data;
  },

  // Alias for compatibility
  async createTemplate(templateData) {
    return this.create(templateData);
  },

  /**
   * Update template
   */
  async update(id, templateData) {
    const response = await http.put(`/templates/${id}`, templateData);
    return response.data.data;
  },

  // Alias for compatibility
  async updateTemplate(id, templateData) {
    return this.update(id, templateData);
  },

  /**
   * Delete template
   */
  async delete(id) {
    const response = await http.delete(`/templates/${id}`);
    return response.data;
  },

  // Alias for compatibility
  async deleteTemplate(id) {
    return this.delete(id);
  },

  /**
   * Get question types
   */
  async getQuestionTypes() {
    const response = await http.get('/templates/question-types');
    return response.data;
  },

  /**
   * Add question to template
   */
  async addQuestion(templateId, questionData) {
    const response = await http.post(`/templates/${templateId}/questions`, questionData);
    return response.data;
  },

  /**
   * Update question
   */
  async updateQuestion(templateId, questionId, questionData) {
    const response = await http.put(`/templates/${templateId}/questions/${questionId}`, questionData);
    return response.data;
  },

  /**
   * Delete question
   */
  async deleteQuestion(templateId, questionId) {
    const response = await http.delete(`/templates/${templateId}/questions/${questionId}`);
    return response.data;
  },
};

export default TemplateService;
