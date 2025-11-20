const logger = require('../../../src/utils/logger');
const { User } = require('../../../src/models');
const axios = require('axios');

// LLM Service using your trained model
class LLMService {
  constructor() {
    this.logger = logger;
    // Cấu hình cho trained model API
    this.trainedModelConfig = {
      baseURL: process.env.TRAINED_MODEL_API_URL || 'http://localhost:8001',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  // Helper method to call trained model API
  async callTrainedModel(endpoint, method = 'GET', data = null) {
    const url = `${this.trainedModelConfig.baseURL}${endpoint}`;
    const config = {
      method,
      url,
      timeout: this.trainedModelConfig.timeout,
      headers: this.trainedModelConfig.headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    try {
      this.logger.info(`🔗 Calling ${method} ${url}`);
      if (data) {
        this.logger.info(`📤 Request data:`, JSON.stringify(data));
      }
      
      const response = await axios(config);
      this.logger.info(`✅ Response status: ${response.status}`);
      return response;
    } catch (error) {
      this.logger.error(`❌ API call failed: ${method} ${url}`);
      this.logger.error(`❌ Error details:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Get available categories from your trained model
   */
  async getCategories() {
    try {
      // Gọi API từ trained model để lấy categories
      const url = `${this.trainedModelConfig.baseURL}/api/model/categories`;
      this.logger.info(`🔗 Calling categories API: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 5000
      });
      
      if (response.data && response.data.success) {
        const categories = response.data.categories || ['general', 'it', 'marketing', 'economics'];
        return categories.map(cat => {
          const categoryInfo = {
            it: { name: 'Information Technology', description: 'Technology, programming, and IT-related topics' },
            marketing: { name: 'Marketing', description: 'Marketing, advertising, and business promotion' },
            economics: { name: 'Economics', description: 'Economics, finance, and business analysis' },
            general: { name: 'General', description: 'General topics and miscellaneous subjects' }
          };

          return {
            id: cat,
            name: categoryInfo[cat]?.name || cat.toUpperCase(),
            description: categoryInfo[cat]?.description || `${cat} related surveys`
          };
        });
      }
      
      throw new Error('Invalid response from trained model');
    } catch (error) {
      this.logger.error('Error getting categories:', error);
      // Return default categories if model is not available
      return [
        { id: 'it', name: 'Information Technology', description: 'IT related surveys' },
        { id: 'marketing', name: 'Marketing', description: 'Marketing and business surveys' },
        { id: 'economics', name: 'Economics', description: 'Economic and financial surveys' },
        { id: 'general', name: 'General', description: 'General purpose surveys' }
      ];
    }
  }
  /**
   * Get prompts - sử dụng thông tin từ trained model thay vì templates cố định
   */
  async getPrompts(type = null) {
    try {
      // Lấy thông tin từ trained model
      const modelInfo = await this.getTrainedModelInfo();
      const categories = modelInfo.categories || ['general', 'it', 'marketing', 'economics'];
      
      const allPrompts = categories.map((category, index) => ({
        id: index + 1,
        name: `${category.toUpperCase()} AI Question Generator`,
        type: 'question_generation',
        description: `AI-powered ${category} survey question generation using trained model with real data`,
        category: category,
        model_info: modelInfo,
        created_at: new Date()
      }));

      if (type) {
        return allPrompts.filter(prompt => prompt.type === type);
      }
      
      return allPrompts;
    } catch (error) {
      this.logger.error(`❌ Error getting prompts: ${error.message}`);
      // Return basic prompts if model is not available
      return [
        {
          id: 1,
          name: 'AI Question Generator',
          type: 'question_generation',
          description: 'Generate survey questions using AI model',
          category: 'general',
          created_at: new Date()
        }
      ];
    }
  }

  /**
   * Generate questions using your trained AI model
   */
  async generateQuestions(data) {
    try {
      const { topic, count = 5, category = 'general' } = data;
      
      this.logger.info(`🤖 User ${data.userId || 'unknown'} generating ${count} questions for topic: ${topic}`);
      
      // Call the trained model directly
      return await this.generateQuestionsFromTrainedModel(topic, count, category);
      
    } catch (error) {
      this.logger.error('❌ Error in generateQuestions:', error.message);
      return this.generateSimpleFallbackQuestions(data.topic, data.count, data.category, error.message);
    }
  }

  /**
   * Predict category using your trained model
   */
  async predictCategory(data) {
    try {
      const { text } = data;
      
      const isAvailable = await this.trainedModel.isAvailable();
      if (!isAvailable) {
        return this.fallbackPredictCategory(text);
      }

      const result = await this.trainedModel.predictCategory(text);
      
      if (result.success) {
        return {
          category: result.category,
          confidence: result.confidence || 0.8
        };
      } else {
        logger.error('Category prediction failed:', result.error);
        return this._fallbackPredictCategory(text);
      }
    } catch (error) {
      logger.error('Error predicting category:', error);
      const fallbackCategory = this._fallbackPredictCategory(data.text);
    }
  }

  /**
   * Fallback question generation when model is not available
   */
  // Gọi trained model để generate questions
  async generateQuestionsFromTrainedModel(topic, count = 5, category = 'general') {
    try {
      this.logger.info(`🤖 Calling trained model for topic: "${topic}", category: ${category}, count: ${count}`);
      
      const requestData = {
        keyword: topic,
        num_questions: count,
        category: category || 'general'
      };
      
      const response = await this.callTrainedModel('/api/questions/generate', 'POST', requestData);

      if (response.data && response.data.success) {
        const questions = response.data.questions.map((q, index) => ({
          id: index + 1,
          question: q.question || q,
          type: this._getQuestionType(q, index),
          options: this._getQuestionOptions(q, index),
          required: true
        }));

        this.logger.info(`✅ Generated ${questions.length} questions successfully`);
        
        return {
          questions,
          metadata: {
            topic,
            category,
            generated_at: new Date(),
            model: 'trained-data-model',
            model_info: response.data.model_info || {},
            execution_time: response.data.execution_time,
            note: 'Generated using trained AI model with real data'
          }
        };
      } else {
        throw new Error(`Invalid response from trained model: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error calling trained model: ${error.message}`);
      
      // Fallback to simple questions if trained model fails
      return this._generateSimpleFallbackQuestions(topic, count, category, error.message);
    }
  }

  /**
   * Fallback category prediction
   */
  _fallbackPredictCategory(text) {
    const keywords = {
      it: ['computer', 'software', 'technology', 'programming', 'digital', 'tech', 'IT', 'system', 'data', 'AI', 'algorithm'],
      marketing: ['market', 'business', 'customer', 'brand', 'advertising', 'promotion', 'sales', 'consumer', 'campaign'],
      economics: ['money', 'economic', 'finance', 'investment', 'budget', 'cost', 'profit', 'revenue', 'financial', 'economy']
    };

    const textLower = text.toLowerCase();
    let maxScore = 0;
    let predictedCategory = 'general';

    for (const [category, words] of Object.entries(keywords)) {
      const score = words.reduce((acc, word) => {
        return acc + (textLower.includes(word.toLowerCase()) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        predictedCategory = category;
      }
    }

    return {
      category: predictedCategory,
      confidence: maxScore > 0 ? Math.min(0.9, 0.5 + (maxScore * 0.1)) : 0.6
    };
  }

  // ... rest of the methods remain the same
  async createPrompt(promptData, user) {
    return {
      id: Date.now(),
      ...promptData,
      created_by: user.id,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  async getPrompt(id) {
    return {
      id: parseInt(id),
      name: 'AI Question Generator',
      type: 'question_generation',
      template: 'Generate questions about {topic}',
      description: 'Uses trained AI model to generate relevant survey questions',
      category: 'general',
      created_at: new Date()
    };
  }

  async updatePrompt(id, updateData, user) {
    return {
      id: parseInt(id),
      ...updateData,
      updated_by: user.id,
      updated_at: new Date()
    };
  }

  async deletePrompt(id, user) {
    return true;
  }

  async generateSurvey(data) {
    const { topic, sections = ['Introduction', 'Main Questions', 'Demographics'] } = data;
    
    // Generate questions for each section using your trained model
    const sectionsWithQuestions = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const questionsResult = await this.generateQuestions({
        topic: `${topic} - ${section}`,
        count: 3,
        category: 'general'
      });

      sectionsWithQuestions.push({
        title: section,
        order: i + 1,
        questions: questionsResult.questions
      });
    }
    
    return {
      title: `AI-Generated Survey: ${topic}`,
      description: `This survey was automatically generated using trained AI models to explore various aspects of ${topic}`,
      sections: sectionsWithQuestions,
      metadata: {
        generated_at: new Date(),
        model: 'trained-ai-model',
        estimated_time: `${sectionsWithQuestions.length * 2}-${sectionsWithQuestions.length * 3} minutes`
      }
    };
  }

  async testPrompt(promptId, testData) {
    try {
      // Test the question generation with sample data
      const result = await this.generateQuestions({
        topic: testData.topic || 'sample topic',
        count: 3,
        category: testData.category || 'general'
      });

      return {
        prompt_id: parseInt(promptId),
        input: testData,
        output: {
          result: 'Test completed successfully',
          generated_content: result.questions,
          execution_time: result.metadata?.execution_time || 'N/A',
          model: result.metadata?.model || 'trained-ai-model'
        },
        tested_at: new Date()
      };
    } catch (error) {
      return {
        prompt_id: parseInt(promptId),
        input: testData,
        output: {
          result: 'Test failed',
          error: error.message
        },
        tested_at: new Date()
      };
    }
  }

  // Lấy thông tin từ trained model
  async getTrainedModelInfo() {
    try {
      const response = await axios.get(`${this.trainedModelConfig.baseURL}/api/model/info`, {
        timeout: 5000
      });
      
      if (response.data && response.data.success) {
        return response.data;
      }
      
      return { categories: ['general', 'it', 'marketing', 'economics'] };
    } catch (error) {
      this.logger.warn(`⚠️ Could not get model info: ${error.message}`);
      return { categories: ['general', 'it', 'marketing', 'economics'] };
    }
  }

  // Helper method for question options
  getQuestionOptions(questionData, index) {
    return this._getQuestionOptions(questionData, index);
  }

  _getQuestionOptions(questionData, index) {
    if (typeof questionData === 'object' && questionData.options) {
      return questionData.options;
    }

    const questionText = (typeof questionData === 'string' ? questionData : questionData.question || '').toLowerCase();
    const questionType = this.getQuestionType(questionData, index);

    if (questionType === 'multiple_choice') {
      if (questionText.includes('experience level')) {
        return ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      } else if (questionText.includes('frequency') || questionText.includes('how often')) {
        return ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'];
      } else if (questionText.includes('satisfaction') || questionText.includes('opinion')) {
        return ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'];
      } else {
        return ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'];
      }
    } else if (questionType === 'rating') {
      return null; // Rating questions don't need predefined options
    } else if (questionType === 'yes_no') {
      return ['Yes', 'No'];
    }

    return null;
  }

  // Simple fallback nếu trained model không khả dụng
  _generateSimpleFallbackQuestions(topic, count = 5, category = 'general', errorMessage = '') {
    this.logger.warn(`🔄 Using simple fallback for topic: ${topic}`);
    
    const questions = [];
    for (let i = 1; i <= count; i++) {
      questions.push({
        id: i,
        question: `What is your opinion about ${topic}? (Question ${i})`,
        type: 'text',
        required: true
      });
    }

    return {
      questions,
      metadata: {
        topic,
        category,
        generated_at: new Date(),
        model: 'simple-fallback',
        error: errorMessage,
        note: 'Simple fallback questions (trained model unavailable)'
      }
    };
  }

  // Lấy thông tin từ trained model
  async getTrainedModelInfo() {
    try {
      const response = await this.callTrainedModel('/api/model/info', 'GET');
      return response.data;
    } catch (error) {
      this.logger.error(`❌ Error getting trained model info: ${error.message}`);
      return {
        name: 'Trained AI Model',
        version: '1.0.0',
        categories: ['general', 'it', 'marketing', 'economics'],
        status: 'error',
        error: error.message
      };
    }
  }

  // Wrapper method để tương thích với code cũ
  generateSimpleFallbackQuestions(topic, count = 5, category = 'general', errorMessage = '') {
    return this._generateSimpleFallbackQuestions(topic, count, category, errorMessage);
  }

  // Determine question type based on content
  getQuestionType(questionData, index = 0) {
    return this._getQuestionType(questionData, index);
  }

  // Internal method to determine question type
  _getQuestionType(questionData, index = 0) {
    if (typeof questionData === 'object' && questionData.type) {
      return questionData.type;
    }
    
    // Smart type assignment based on content
    const questionText = (typeof questionData === 'string' ? questionData : questionData.question || '').toLowerCase();
    
    if (questionText.includes('rate') || questionText.includes('scale') || questionText.includes('how much')) {
      return 'rating';
    } else if (questionText.includes('choose') || questionText.includes('select') || questionText.includes('experience level')) {
      return 'multiple_choice';
    } else if (questionText.includes('yes') || questionText.includes('no') || questionText.includes('do you')) {
      return 'yes_no';
    } else {
      return 'text';
    }
  }
}

module.exports = new LLMService();