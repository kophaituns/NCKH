import http from '../http';
import axios from 'axios';

const AI_SERVER_URL = 'http://localhost:8003/api';

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
   * @param {Object} data - Request data
   * @param {string} data.keyword - The keyword/topic to generate questions for
   * @param {number} [data.num_questions=5] - Number of questions to generate
   * @param {string} [data.category_hint=null] - Category hint
   * @param {number} [data.offset=0] - Offset for regenerate functionality (0 = first batch)
   * @returns {Promise<Object>} Response with questions, metadata, and confidence
   */
  async generateQuestions(data) {
    try {
      const response = await http.post('/llm/generate-questions', {
        keyword: data.keyword || (data.keywords ? data.keywords.join(', ') : data.topic),
        num_questions: data.num_questions || data.count || 5,
        count: data.num_questions || data.count || 5,
        category: data.category_hint || data.category || null,
        category_hint: data.category_hint || data.category || null,
        offset: data.offset || 0,
        form_type: data.form_type || 'survey',
        fine_tune_note: data.fine_tune_note || null,
        workspaceId: data.workspaceId || null,
        visibility_scope: data.visibility_scope || (data.workspaceId ? 'private' : 'all')
      }, {
        timeout: 60000 // 60 seconds for AI processing
      });
      return response.data;
    } catch (error) {
      console.error('Generate questions error:', error);
      throw error;
    }
  },

  /**
   * Regenerate questions (get different questions for same keyword)
   * @param {string} keyword - The keyword/topic
   * @param {number} num_questions - Number of questions
   * @param {number} currentOffset - Current offset, will be incremented by count
   * @returns {Promise<Object>} Response with new questions
   */
  async regenerateQuestions(keyword, num_questions = 5, currentOffset = 0) {
    return this.generateQuestions({
      keyword,
      num_questions,
      offset: currentOffset + num_questions  // Skip to next batch
    });
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

  /**
   * Create survey from generated questions
   */
  async createSurveyFromQuestions(surveyData) {
    const response = await http.post('/llm/create-survey', surveyData);
    return response.data;
  },

  /**
   * Export survey as PDF
   */
  async exportSurveyPDF(surveyId) {
    const response = await http.get(`/llm/export-pdf/${surveyId}`, {
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
    const response = await http.post(`/llm/generate-link/${surveyId}`, { expiryDays });
    return response.data;
  },

  /**
   * Get survey results and analytics
   */
  async getSurveyResults(surveyId) {
    const response = await http.get(`/llm/surveys/${surveyId}/results`);
    return response.data;
  },

  /**
   * Get survey for editing
   */
  async getSurveyForEditing(surveyId) {
    const response = await http.get(`/llm/surveys/${surveyId}/edit`);
    return response.data;
  },

  /**
   * Update survey settings
   */
  async updateSurveySettings(surveyId, settingsData) {
    const response = await http.put(`/llm/surveys/${surveyId}/settings`, settingsData);
    return response.data;
  },

  /**
   * Update survey question
   */
  async updateSurveyQuestion(surveyId, questionId, questionData) {
    const response = await http.put(`/llm/surveys/${surveyId}/questions/${questionId}`, questionData);
    return response.data;
  },

  /**
   * Delete survey question
   */
  async deleteSurveyQuestion(surveyId, questionId) {
    const response = await http.delete(`/llm/surveys/${surveyId}/questions/${questionId}`);
    return response.data;
  },

  /**
   * Add new question to survey
   */
  async addSurveyQuestion(surveyId, questionData) {
    const response = await http.post(`/llm/surveys/${surveyId}/questions`, questionData);
    return response.data;
  },

  /**
   * Ingest documents into the Knowledge Base (U-Ingestor)
   * @param {FileList|File[]} files - Files to upload
   */
  async ingestDocuments(files, workspaceId, category = 'general') {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('workspaceId', workspaceId);
    if (Array.isArray(files)) {
      files.forEach(file => formData.append('files', file));
    } else {
      // Assuming FileList
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
    }

    const response = await http.post('/llm/ingest', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // Ingestion can take longer
    });
    return response.data;
  },

  /**
   * Get knowledge base status
   */
  async getKnowledgeStatus() {
    const response = await axios.get(`${AI_SERVER_URL}/health`);
    return response.data;
  },

  /**
   * Send human-refined questions to AI Memory
   */
  async learnFromFeedback(questions) {
    const response = await axios.post(`${AI_SERVER_URL}/learn`, { questions });
    return response.data;
  },

  /**
   * Trigger semantic ingestion
   */
  async triggerIngestion(category = 'general') {
    const response = await http.post('/llm/ingest', { category });
    return response.data;
  },

  /**
   * Reset priority memory (caution!)
   */
  async resetMemory() {
    const response = await axios.delete(`${AI_SERVER_URL}/memory`);
    return response.data;
  },

  /**
   * PROJECT OMEGA: Ingest knowledge from a URL
   */
  async ingestUrl(url, workspaceId, promoteToGlobal = false, category = 'general') {
    const response = await http.post('/llm/ingest/url', {
      url,
      workspaceId,
      category,
      promoteToGlobal
    });
    return response.data;
  },

  /**
   * PROJECT OMEGA: Ingest knowledge from raw text
   */
  async ingestText(title, text, workspaceId, promoteToGlobal = false, category = 'general') {
    const response = await http.post('/llm/ingest/text', {
      title,
      text,
      workspaceId,
      category,
      promoteToGlobal
    });
    return response.data;
  },

  /**
   * PROJECT OMEGA: Ingest knowledge from a YouTube video
   */
  async ingestYoutube(url, workspaceId, promoteToGlobal = false, category = 'general') {
    const response = await http.post('/llm/ingest/youtube', {
      url,
      workspaceId,
      category,
      promoteToGlobal
    });
    return response.data;
  },

  /**
   * Get historical ingestion batches for a workspace
   */
  async getKnowledgeSources(workspaceId) {
    const response = await http.get(`/llm/knowledge-sources/${workspaceId}`);
    return response.data;
  },

  /**
   * Rename a knowledge source
   */
  async updateKnowledgeSource(id, data) {
    const response = await http.put(`/llm/knowledge-sources/${id}`, data);
    return response.data;
  },

  /**
   * Delete a knowledge source
   */
  async deleteKnowledgeSource(id) {
    const response = await http.delete(`/llm/knowledge-sources/${id}`);
    return response.data;
  }
};

export default LLMService;
