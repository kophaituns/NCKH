// src/api/services/template.service.js - Template API service
import http from '../http';

const TemplateService = {
  /**
   * Get all templates
   */
  async getAll(params = {}) {
    try {
      const response = await http.get('/modules/templates', { params });
      // Backend returns { success: true, data: { templates: [...], pagination: {...} } }
      const data = response.data.data || response.data || {};
      return {
        templates: data.templates || [],
        pagination: data.pagination || null
      };
    } catch (error) {
      console.error('Error in TemplateService.getAll:', error);
      return { templates: [], pagination: null };
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
    try {
      const response = await http.get(`/modules/templates/${id}`);
      // Backend returns { success: true, ok: true, template: {...}, questions: [...] }
      const data = response.data;
      return {
        ok: data.ok || data.success || false,
        template: data.template || data.data?.template || null,
        questions: data.questions || data.data?.questions || []
      };
    } catch (error) {
      console.error('Error in TemplateService.getById:', error);
      throw error;
    }
  },

  // Alias for compatibility
  async getTemplateById(id) {
    return this.getById(id);
  },

  /**
   * Get questions for a template
   */
  async getQuestions(templateId) {
    try {
      const response = await http.get(`/modules/templates/${templateId}/questions`);
      const data = response.data;
      return {
        ok: data.ok || data.success || false,
        questions: data.questions || []
      };
    } catch (error) {
      console.error('Error in TemplateService.getQuestions:', error);
      return { ok: false, questions: [] };
    }
  },

  /**
   * Create new template
   */
  async create(templateData) {
    try {
      const response = await http.post('/modules/templates', templateData);
      const data = response.data;
      // Backend returns { success: true, ok: true, id: X, data: { template, template_id } }
      return {
        ok: data.ok || data.success || false,
        id: data.id || data.data?.template_id || data.data?.template?.id,
        template: data.data?.template || data.template,
        message: data.message
      };
    } catch (error) {
      console.error('Error in TemplateService.create:', error);
      throw error;
    }
  },

  // Alias for compatibility
  async createTemplate(templateData) {
    return this.create(templateData);
  },

  /**
   * Update template
   */
  async update(id, templateData) {
    const response = await http.put(`/modules/templates/${id}`, templateData);
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
    try {
      const response = await http.delete(`/modules/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete template error:', error);
      
      // Handle specific error cases
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 409) {
          throw new Error(data?.message || 'Template is being used by surveys and cannot be deleted');
        }
        
        if (status === 403) {
          throw new Error(data?.message || 'Access denied');
        }
        
        if (status === 404) {
          throw new Error(data?.message || 'Template not found');
        }
        
        // Try to extract message from response
        let errorMessage = 'Error deleting template';
        if (data && typeof data === 'object') {
          errorMessage = data.message || data.error || errorMessage;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
        
        throw new Error(errorMessage);
      }
      
      throw new Error(error.message || 'Network error occurred');
    }
  },

  /**
   * Bulk delete templates
   */
  async deleteMany(ids) {
    const response = await http.delete('/modules/templates/bulk', { data: { ids } });
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
    const response = await http.get('/modules/templates/question-types');
    return response.data;
  },

  /**
   * Add question to template
   */
  async addQuestion(templateId, questionData) {
    try {
      if (!templateId || templateId === 'undefined') {
        throw new Error('Invalid template ID');
      }
      const response = await http.post(`/modules/templates/${templateId}/questions`, questionData);
      const data = response.data;
      return {
        ok: data.ok || data.success || false,
        question: data.data?.question || data.question,
        question_id: data.data?.question_id || data.question_id,
        message: data.message
      };
    } catch (error) {
      console.error('Error in TemplateService.addQuestion:', error);
      throw error;
    }
  },

  /**
   * Update question
   */
  async updateQuestion(templateId, questionId, questionData) {
    const response = await http.put(`/modules/templates/${templateId}/questions/${questionId}`, questionData);
    return response.data;
  },

  /**
   * Delete question
   */
  async deleteQuestion(templateId, questionId) {
    const response = await http.delete(`/modules/templates/${templateId}/questions/${questionId}`);
    return response.data;
  },

  /**
   * Export template to PDF
   */
  async exportTemplatePDF(templateId) {
    try {
      const response = await http.get(`/modules/templates/${templateId}/export-pdf`, {
        responseType: 'text'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting template to PDF:', error);
      throw error;
    }
  },
};

export default TemplateService;
