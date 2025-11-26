<<<<<<< HEAD
const logger = require('../../../../src/utils/logger');
const { User, Survey, Question, QuestionOption, SurveyResponse, ResponseAnswer, SurveyLink } = require('../../../../src/models');
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
=======
// src/modules/llm/service/llm.service.js
let OpenAI;
try {
  OpenAI = require('openai').OpenAI;
} catch (error) {
  // OpenAI package not installed
  console.warn('OpenAI package not installed. LLM features will be disabled.');
}

const axios = require('axios');
const HUGGINGFACE_API_URL = process.env.HUGGINGFACE_API_URL || 'https://linhthuyhht-form-agent-ai-api.hf.space';

const { 
  LlmPrompt, 
  LlmInteraction, 
  Survey, 
  SurveyResponse,
  Answer,
  Question,
  QuestionOption,
  SurveyTemplate,
  AnalysisResult 
} = require('../../../models');
const logger = require('../../../utils/logger');

// Initialize OpenAI client
let openai = null;
try {
  if (OpenAI && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'OPENAI_API_KEY') {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    logger.warn('OpenAI API key not configured. LLM features will be disabled.');
  }
} catch (error) {
  logger.error('Failed to initialize OpenAI client:', error);
}

class LlmService {
  /**
   * Check if OpenAI is configured
   */
  isOpenAIConfigured() {
    return openai !== null;
  }

  /**
   * Generate survey using LLM
   */
  async generateSurvey(userId, { prompt, prompt_id, description, target_audience, course_name, audience_level }) {
    if (!this.isOpenAIConfigured()) {
      throw new Error('LLM service is not available. OpenAI API key not configured.');
    }

    // If a prompt ID is provided, use that prompt
    let promptText = prompt;
    
    if (prompt_id) {
      const savedPrompt = await LlmPrompt.findByPk(prompt_id);
      if (savedPrompt) {
        promptText = savedPrompt.prompt_text;
        
        // Replace placeholders with values
        if (course_name) promptText = promptText.replace('{{course_name}}', course_name);
        if (audience_level) promptText = promptText.replace('{{user_level}}', audience_level);
      }
    }

    // Prepare context for the LLM
    const context = `
    You are an expert in educational survey design. 
    Design a comprehensive survey ${description ? `about: ${description}` : ''} 
    ${target_audience ? `for audience: ${target_audience}` : ''}.
    
    Please format your response as a JSON object with the following structure:
    {
      "title": "Survey title",
      "description": "Survey description",
      "questions": [
        {
          "question_text": "Question text",
          "question_type": "multiple_choice | checkbox | likert_scale | open_ended | dropdown",
          "required": true/false,
          "options": ["Option 1", "Option 2"] // Only for multiple_choice, checkbox, dropdown
        },
        // More questions...
      ]
    }
    
    Include a mix of question types, and ensure the survey provides valuable insights.
    IMPORTANT: Return ONLY the JSON object with no additional text or explanations.
    `;

    const fullPrompt = `${context}\n\nUser request: ${promptText}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are an expert in educational survey design." },
        { role: "user", content: fullPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Get response text
    const responseText = completion.choices[0].message.content;
    
    // Parse JSON from the response
    let surveyData;
    try {
      // Try to extract JSON if it's wrapped in backticks
      const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/) || 
                         responseText.match(/```\n([\s\S]*)\n```/);
                         
      if (jsonMatch && jsonMatch[1]) {
        surveyData = JSON.parse(jsonMatch[1]);
      } else {
        surveyData = JSON.parse(responseText);
      }
    } catch (error) {
      logger.error('Error parsing JSON from LLM response:', error);
      throw new Error('Could not parse survey data from LLM response');
    }

    // Log the interaction
    await LlmInteraction.create({
      custom_prompt: prompt_id ? null : promptText,
      prompt_id: prompt_id || null,
      response: responseText,
      tokens_used: completion.usage.total_tokens,
      model_used: process.env.OPENAI_MODEL || "gpt-4-turbo",
      user_id: userId,
      interaction_type: 'survey_generation'
    });

    return surveyData;
  }

  /**
   * Analyze survey responses using LLM
   */
  async analyzeSurveyResponses(userId, surveyId, analysisType) {
    if (!this.isOpenAIConfigured()) {
      throw new Error('LLM service is not available. OpenAI API key not configured.');
    }

    // Validate analysis type
    if (!['sentiment', 'theme_extraction', 'summary', 'comparison'].includes(analysisType)) {
      throw new Error('Invalid analysis type');
    }

    // Check if survey exists
    const survey = await Survey.findByPk(surveyId, {
      include: [
        {
          model: SurveyTemplate,
          include: [
            {
              model: Question
            }
          ]
        }
      ]
    });
    
    if (!survey) {
      throw new Error('Survey not found');
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.findAll({
      where: {
        survey_id: surveyId,
        status: 'completed'
      },
      include: [
        {
          model: Answer,
          include: [
            {
              model: Question
            },
            {
              model: QuestionOption
            }
          ]
        }
      ]
    });

    if (responses.length === 0) {
      throw new Error('No responses found for this survey');
    }

    // Format responses for analysis
    const formattedResponses = this._formatResponsesForAnalysis(responses);

    // Prepare analysis prompt based on type
    const analysisPrompt = this._getAnalysisPrompt(analysisType);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are an expert in survey analysis and educational assessment." },
        { 
          role: "user", 
          content: `
          ${analysisPrompt}
          
          Here are the survey responses to analyze:
          ${JSON.stringify(formattedResponses, null, 2)}
          
          IMPORTANT: Return ONLY the JSON object with no additional text or explanations.
          `
        }
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    // Get response text
    const responseText = completion.choices[0].message.content;
    
    // Parse JSON from the response
    let analysisData;
    try {
      // Try to extract JSON if it's wrapped in backticks
      const jsonMatch = responseText.match(/```json\n([\s\S]*)\n```/) || 
                         responseText.match(/```\n([\s\S]*)\n```/);
                         
      if (jsonMatch && jsonMatch[1]) {
        analysisData = JSON.parse(jsonMatch[1]);
      } else {
        analysisData = JSON.parse(responseText);
      }
    } catch (error) {
      logger.error('Error parsing JSON from LLM response:', error);
      throw new Error('Could not parse analysis data from LLM response');
    }

    // Save analysis result
    const analysisResult = await AnalysisResult.create({
      survey_id: surveyId,
      analysis_type: analysisType,
      result_data: analysisData
    });

    // Log the interaction
    await LlmInteraction.create({
      custom_prompt: analysisPrompt,
      response: responseText,
      tokens_used: completion.usage.total_tokens,
      model_used: process.env.OPENAI_MODEL || "gpt-4-turbo",
      user_id: userId,
      interaction_type: 'analysis'
    });

    return {
      analysis_id: analysisResult.id,
      analysis_type: analysisType,
      result: analysisData,
      survey
    };
  }

  /**
   * Format responses for LLM analysis
   */
  _formatResponsesForAnalysis(responses) {
    return responses.map(response => {
      const answersFormatted = {};
      
      response.Answers.forEach(answer => {
        const questionText = answer.Question.question_text;
        
        // Format answer based on question type
        let answerValue;
        
        switch (answer.Question.question_type_id) {
          // Multiple choice or dropdown
          case 1:
          case 5:
            answerValue = answer.QuestionOption ? answer.QuestionOption.option_text : null;
            break;
          
          // Checkbox - might need special handling since one respondent can have multiple answers
          case 2:
            if (!answersFormatted[questionText]) {
              answersFormatted[questionText] = [];
            }
            if (answer.QuestionOption) {
              answersFormatted[questionText].push(answer.QuestionOption.option_text);
            }
            return; // Skip the normal assignment
          
          // Likert scale
          case 3:
            answerValue = answer.numeric_answer ? `Rating: ${answer.numeric_answer}/5` : null;
            break;
          
          // Open-ended
          case 4:
            answerValue = answer.text_answer;
            break;
        }
        
        answersFormatted[questionText] = answerValue;
      });
      
      return answersFormatted;
    });
  }

  /**
   * Get analysis prompt based on type
   */
  _getAnalysisPrompt(analysisType) {
    const prompts = {
      sentiment: `
        Analyze the sentiment of the following survey responses. 
        Identify overall sentiment (positive, negative, neutral) and provide specific insights on:
        - Questions with the most positive responses
        - Questions with the most negative responses
        - Any patterns in sentiment across different questions
        - Suggestions based on sentiment analysis
        
        Format your response as a JSON object with the following structure:
        {
          "overall_sentiment": "positive/negative/neutral",
          "sentiment_score": 0-100 (higher is more positive),
          "positive_highlights": ["Point 1", "Point 2"],
          "negative_highlights": ["Point 1", "Point 2"],
          "neutral_observations": ["Point 1", "Point 2"],
          "recommendations": ["Recommendation 1", "Recommendation 2"]
        }
      `,
      
      theme_extraction: `
        Extract the main themes from these survey responses. 
        Identify recurring topics, concerns, and suggestions across all responses.
        
        Format your response as a JSON object with the following structure:
        {
          "major_themes": [
            {
              "theme": "Theme name",
              "frequency": "high/medium/low",
              "description": "Brief description",
              "supporting_quotes": ["Quote 1", "Quote 2"]
            }
          ],
          "minor_themes": [
            {
              "theme": "Theme name",
              "description": "Brief description"
            }
          ],
          "unique_insights": ["Insight 1", "Insight 2"]
        }
      `,
      
      summary: `
        Provide a comprehensive summary of these survey responses.
        Highlight key findings, overall trends, and actionable insights.
        
        Format your response as a JSON object with the following structure:
        {
          "executive_summary": "Brief overall summary (2-3 sentences)",
          "key_findings": ["Finding 1", "Finding 2"],
          "strengths_identified": ["Strength 1", "Strength 2"],
          "areas_for_improvement": ["Area 1", "Area 2"],
          "actionable_recommendations": ["Recommendation 1", "Recommendation 2"]
        }
      `,
      
      comparison: `
        Compare and contrast responses across different questions and respondent groups.
        Identify any significant differences or correlations between responses.
        
        Format your response as a JSON object with the following structure:
        {
          "significant_correlations": [
            {
              "description": "Description of correlation",
              "strength": "strong/moderate/weak",
              "supporting_evidence": "Evidence from the data"
            }
          ],
          "contradictions": ["Contradiction 1", "Contradiction 2"],
          "consensus_areas": ["Area 1", "Area 2"],
          "divergent_opinions": ["Opinion 1", "Opinion 2"]
        }
      `
    };

    return prompts[analysisType] || '';
  }

  /**
   * Get all LLM prompts
   */
  async getLlmPrompts(promptType = null) {
    const whereClause = {};
    if (promptType) {
      whereClause.prompt_type = promptType;
    }

    return await LlmPrompt.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Create new LLM prompt
   */
  async createLlmPrompt(userId, { prompt_name, prompt_type, prompt_text }) {
    // Validate prompt type
    if (!['survey_generation', 'analysis', 'summary', 'recommendation'].includes(prompt_type)) {
      throw new Error('Invalid prompt type');
    }

    return await LlmPrompt.create({
      prompt_name,
      prompt_type,
      prompt_text,
      created_by: userId
    });
  }

  /**
   * Get analysis results for a survey
   */
  async getAnalysisResults(surveyId) {
    // Check if survey exists
    const survey = await Survey.findByPk(surveyId);
    
    if (!survey) {
      throw new Error('Survey not found');
    }

    // Get analysis results
    const analysisResults = await AnalysisResult.findAll({
      where: { survey_id: surveyId },
      order: [['generated_at', 'DESC']]
    });

    return { survey, analysisResults };
  }

  /**
   * Check if user has permission to analyze survey
   */
  canAnalyzeSurvey(user, survey) {
    return user.role === 'admin' || survey.created_by === user.id;
  }

  /**
   * Get all prompts (optionally filtered by type)
   */
  async getPrompts(userId, promptType = null, userRole = 'user') {
    const where = {};

    // Filter by type if provided
    if (promptType) {
      where.prompt_type = promptType;
    }

    // Non-admin users can only see their own prompts
    if (userRole !== 'admin') {
      where.created_by = userId;
    }

    const prompts = await LlmPrompt.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    return prompts;
  }

  /**
   * Get prompt by ID
   */
  async getPromptById(promptId, userId, userRole = 'user') {
    const prompt = await LlmPrompt.findByPk(promptId);

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Non-admin users can only view their own prompts
    if (userRole !== 'admin' && prompt.created_by !== userId) {
      throw new Error('Access denied');
    }

    return prompt;
  }

  /**
   * Update prompt
   */
  async updatePrompt(promptId, updateData, userId, userRole = 'user') {
    const prompt = await LlmPrompt.findByPk(promptId);

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Non-admin users can only update their own prompts
    if (userRole !== 'admin' && prompt.created_by !== userId) {
      throw new Error('Access denied');
    }

    // Update allowed fields
    const allowedFields = ['prompt_name', 'prompt_text'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        prompt[field] = updateData[field];
      }
    });

    await prompt.save();

    return prompt;
  }

  /**
   * Delete prompt
   */
  async deletePrompt(promptId, userId, userRole = 'user') {
    const prompt = await LlmPrompt.findByPk(promptId);

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Non-admin users can only delete their own prompts
    if (userRole !== 'admin' && prompt.created_by !== userId) {
      throw new Error('Access denied');
    }

    await prompt.destroy();

    return { message: 'Prompt deleted successfully' };
  }

  /**
   * Generate questions using Hugging Face API
   */
  async generateQuestions(userId, { keyword, category, count = 5 }) {
    try {
      logger.info(`Generating ${count} questions for keyword: ${keyword}${category ? ` in category: ${category}` : ''}`);
      
      const requestData = {
        keyword,
        num_questions: parseInt(count), // Use num_questions parameter như Hugging Face API expect
        category_hint: category || null
      };

      logger.debug('Request data to Hugging Face API:', requestData);

      // Call local Node.js API
      const response = await axios.post(`${HUGGINGFACE_API_URL}/api/questions/generate`, requestData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      logger.debug('Response from Hugging Face API:', response.data);

      // Process response from Hugging Face API
      const apiResponse = response.data;
      const questions = apiResponse.questions || [];
      
      if (questions.length < count) {
        logger.warn(`Requested ${count} questions but only received ${questions.length} from Hugging Face API`);
      }

      // Format response to match frontend expectations
      const formattedResponse = {
        questions: questions.map(q => ({
          question: q.question,
          category: q.category || apiResponse.category,
          confidence: q.confidence || apiResponse.confidence || 0.8
        })),
        category: apiResponse.category,
        confidence: apiResponse.confidence,
        total_generated: questions.length,
        keyword: keyword
      };

      // Log the interaction
      await LlmInteraction.create({
        custom_prompt: `Generate ${count} questions for keyword: ${keyword}${category ? ` in category: ${category}` : ''}`,
        response: JSON.stringify(formattedResponse),
        tokens_used: 0, // HuggingFace doesn't provide token count
        model_used: 'huggingface-form-agent-ai',
        user_id: userId,
        interaction_type: 'question_generation'
      });

      return formattedResponse;
    } catch (error) {
      logger.error('Error generating questions from Hugging Face:', error.message);
      
      if (error.response) {
        logger.error('Hugging Face API Error Response:', error.response.data);
        throw new Error(`Hugging Face API Error: ${error.response.data?.detail || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Cannot connect to Hugging Face API. Please check your internet connection.');
      } else {
        throw new Error(`Failed to generate questions: ${error.message}`);
      }
>>>>>>> linh2
    }
  }

  /**
<<<<<<< HEAD
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
    const models = require('../../../models');
    const { GeneratedQuestion } = models;
    
    console.log('🔍 generateQuestions called with:', data);
    console.log('🔍 GeneratedQuestion model:', !!GeneratedQuestion);
    
    try {
      const { topic, count = 5, category = 'general', userId } = data;
      
      this.logger.info(`🤖 User ${userId || 'unknown'} generating ${count} questions for topic: ${topic}`);
      
      // Use TrainedModelService
      const TrainedModelService = require('./trained-model.service');
      const trainedModel = new TrainedModelService();
      
      const result = await trainedModel.generateQuestions(topic, count, category);
      
      if (result.success && result.questions) {
        // Save generated questions to database
        const savedQuestions = [];
        
        for (const q of result.questions) {
          const questionData = {
            question_text: q.question || q.text || q,
            question_type: q.type || this._getQuestionType(q.question || q.text || q),
            options: q.options || null, // Store options for multiple choice questions
            keyword: topic,
            category: category,
            source_model: 'trained_model',
            generated_by: userId,
            quality_score: q.confidence ? (q.confidence / 100 * 5) : null // Convert to 5-point scale
          };

          try {
            console.log('🔍 Attempting to save question to database:', questionData);
            const savedQuestion = await GeneratedQuestion.create(questionData);
            console.log('✅ Question saved successfully:', savedQuestion.toJSON());
            
            savedQuestions.push({
              id: savedQuestion.id,
              question: savedQuestion.question_text,
              type: savedQuestion.question_type,
              options: savedQuestion.options,
              source: 'AI Model',
              confidence: q.confidence || 85,
              created_at: savedQuestion.created_at
            });
          } catch (saveError) {
            console.error('❌ Failed to save question to database:', saveError);
            this.logger.warn(`Failed to save question to database: ${saveError.message}`);
            // Still include in response even if save fails
            savedQuestions.push({
              question: questionData.question_text,
              type: questionData.question_type,
              source: 'AI Model',
              confidence: q.confidence || 85
            });
          }
        }
        
        this.logger.info(`✅ Generated ${savedQuestions.length} questions successfully`);
        return {
          success: true,
          questions: savedQuestions
        };
      } else {
        this.logger.warn('⚠️ Trained model failed, using fallback');
        return this._generateSimpleFallbackQuestions(topic, count, category, result.error || 'Model unavailable', userId);
      }
      
    } catch (error) {
      this.logger.error('❌ Error in generateQuestions:', error.message);
      return this._generateSimpleFallbackQuestions(data.topic, data.count, data.category, error.message, data.userId);
    }
  }

  /**
   * Predict category using your trained model
   */
  async predictCategory(data) {
    try {
      if (!data || !data.keyword) {
        throw new Error('Keyword is required for category prediction');
      }
      
      const { keyword } = data;
      
      // Check if trained model service is available
      const TrainedModelService = require('./trained-model.service');
      const trainedModel = new TrainedModelService();
      
      const isAvailable = await trainedModel.isAvailable();
      if (!isAvailable) {
        return this._fallbackPredictCategory(keyword);
      }

      const result = await trainedModel.predictCategory(keyword);
      
      if (result.success) {
        return {
          category: result.category,
          confidence: result.confidence || 0.8
        };
      } else {
        this.logger.error('Category prediction failed:', result.error);
        return this._fallbackPredictCategory(keyword);
      }
    } catch (error) {
      this.logger.error('Error predicting category:', error);
      return this._fallbackPredictCategory(data?.keyword || '');
    }
  }

  /**
   * Fallback question generation when model is not available
   */
  // Gọi trained model để generate questions
  async generateQuestionsFromTrainedModel(topic, count = 5, category = 'general', userId = null) {
    const models = require('../../../models');
    const { GeneratedQuestion } = models;
    
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

        // Save questions to database if userId is provided
        const savedQuestions = [];
        if (userId && GeneratedQuestion) {
          for (const q of questions) {
            try {
              const savedQuestion = await GeneratedQuestion.create({
                question_text: q.question,
                question_type: q.type,
                options: q.options ? JSON.stringify(q.options) : null,
                keyword: topic,
                category: category,
                source_model: 'trained_model',
                generated_by: userId,
                quality_score: 4.0 // High score for trained model questions
              });
              
              savedQuestions.push({
                id: savedQuestion.id,
                question: savedQuestion.question_text,
                type: savedQuestion.question_type,
                options: savedQuestion.options ? JSON.parse(savedQuestion.options) : null,
                source: 'AI Model',
                confidence: 95,
                created_at: savedQuestion.created_at
              });
            } catch (saveError) {
              this.logger.warn(`Failed to save trained model question: ${saveError.message}`);
              savedQuestions.push({
                question: q.question,
                type: q.type,
                options: q.options,
                source: 'AI Model',
                confidence: 95
              });
            }
          }
        } else {
          savedQuestions.push(...questions);
        }

        this.logger.info(`✅ Generated ${savedQuestions.length} questions successfully`);
        
        return {
          questions: savedQuestions,
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
      console.log('🔍 Using fallback, userId:', userId);
      return await this._generateSimpleFallbackQuestions(topic, count, category, error.message, userId);
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
  async _generateSimpleFallbackQuestions(topic, count = 5, category = 'general', errorMessage = '', userId = null) {
    const models = require('../../../models');
    const { GeneratedQuestion } = models;
    
    this.logger.warn(`🔄 Using simple fallback for topic: ${topic}`);
    
    const questions = [];
    const savedQuestions = [];
    
    for (let i = 1; i <= count; i++) {
      const questionText = `What is your opinion about ${topic}? (Question ${i})`;
      const questionData = {
        id: i,
        question: questionText,
        type: 'text',
        required: true
      };
      questions.push(questionData);

        // Save to database
        if (userId) {
          try {
            console.log('🔍 Attempting to save fallback question:', {
              question_text: questionText,
              question_type: 'text',
              options: null,
              keyword: topic,
              category: category,
              source_model: 'simple_fallback',
              generated_by: userId,
              quality_score: 2.5
            });
            
            const savedQuestion = await GeneratedQuestion.create({
              question_text: questionText,
              question_type: 'text',
              options: null,
              keyword: topic,
              category: category,
              source_model: 'simple_fallback',
              generated_by: userId,
              quality_score: 2.5 // Average score for fallback questions
            });
            
            console.log('✅ Fallback question saved successfully:', savedQuestion.toJSON());          savedQuestions.push({
            id: savedQuestion.id,
            question: savedQuestion.question_text,
            type: savedQuestion.question_type,
            source: 'Fallback',
            confidence: 60,
            created_at: savedQuestion.created_at
          });
        } catch (saveError) {
          this.logger.warn(`Failed to save fallback question: ${saveError.message}`);
          savedQuestions.push({
            question: questionText,
            type: 'text',
            source: 'Fallback',
            confidence: 60
          });
        }
      } else {
        savedQuestions.push({
          question: questionText,
          type: 'text',
          source: 'Fallback',
          confidence: 60
        });
      }
    }

    return {
      success: true,
      questions: savedQuestions,
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
  async generateSimpleFallbackQuestions(topic, count = 5, category = 'general', errorMessage = '', userId = null) {
    return await this._generateSimpleFallbackQuestions(topic, count, category, errorMessage, userId);
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

  /**
   * Helper method to get question type ID from type name
   */
  _getQuestionTypeId(typeName) {
    const typeMapping = {
      'multiple_choice': 1,
      'checkbox': 2,
      'likert_scale': 3,
      'open_ended': 4,
      'dropdown': 5,
      'text': 4, // map text to open_ended
      'yes_no': 1, // map yes_no to multiple_choice
      'rating': 3, // map rating to likert_scale
      'email': 4, // map email to open_ended
      'date': 4 // map date to open_ended
    };
    
    return typeMapping[typeName] || 4; // default to open_ended
  }

  /**
   * Create survey from generated questions
   */
  async createSurveyFromQuestions(userId, surveyData) {
    const { Survey, Question, QuestionOption } = require('../../../models');
    
    try {
      // Create the survey
      const now = new Date();
      const defaultEndDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
      
      const survey = await Survey.create({
        title: surveyData.title,
        description: surveyData.description || '',
        target_audience: surveyData.targetAudience || 'all_users',
        target_value: surveyData.targetValue || null,
        start_date: surveyData.startDate ? new Date(surveyData.startDate) : now,
        end_date: surveyData.endDate ? new Date(surveyData.endDate) : defaultEndDate,
        created_by: userId,
        status: 'draft',
        share_settings: JSON.stringify(surveyData.shareSettings || {
          isPublic: false,
          allowAnonymous: true,
          requireLogin: false
        })
      });

      // Process selected questions
      let questionOrder = 1;
      const createdQuestions = [];

      // Add selected questions from generation
      for (const selectedQ of surveyData.selectedQuestions) {
        const questionType = this._getQuestionType(selectedQ);
        const questionTypeId = this._getQuestionTypeId(questionType);
        
        const question = await Question.create({
          survey_id: survey.id,
          question_text: selectedQ.question || selectedQ.text,
          question_type: questionType,
          question_type_id: questionTypeId,
          question_order: questionOrder++,
          is_required: selectedQ.required || false,
          description: selectedQ.description || ''
        });

        // Add options for multiple choice questions
        if (questionType === 'multiple_choice' && selectedQ.options) {
          for (let i = 0; i < selectedQ.options.length; i++) {
            await QuestionOption.create({
              question_id: question.id,
              option_text: selectedQ.options[i],
              option_order: i + 1
            });
          }
        }

        createdQuestions.push(question);
      }

      // Add custom questions
      if (surveyData.customQuestions && surveyData.customQuestions.length > 0) {
        for (const customQ of surveyData.customQuestions) {
          const questionType = customQ.question_type || 'text';
          const questionTypeId = this._getQuestionTypeId(questionType);
          
          const question = await Question.create({
            survey_id: survey.id,
            question_text: customQ.question_text,
            question_type: questionType,
            question_type_id: questionTypeId,
            question_order: questionOrder++,
            is_required: customQ.is_required || false,
            description: customQ.description || ''
          });

          // Add options for multiple choice questions
          if (customQ.question_type === 'multiple_choice' && customQ.options) {
            for (let i = 0; i < customQ.options.length; i++) {
              await QuestionOption.create({
                question_id: question.id,
                option_text: customQ.options[i],
                option_order: i + 1
              });
            }
          }

          createdQuestions.push(question);
        }
      }

      return {
        survey,
        questions: createdQuestions,
        totalQuestions: createdQuestions.length
      };

    } catch (error) {
      this.logger.error('Error creating survey from questions:', error);
      throw new Error(`Failed to create survey: ${error.message}`);
    }
  }

  /**
   * Export survey to PDF
   */
  async exportSurveyToPDF(surveyId, userId) {
    const { Survey, Question, QuestionOption } = require('../../../models');
    
    try {
      // Get survey with questions - use alias 'questions' instead of direct model
      const survey = await Survey.findByPk(surveyId, {
        include: [
          {
            model: Question,
            as: 'questions',  // Use alias explicitly
            attributes: ['id', 'question_text', 'question_type', 'question_order', 'is_required'],
            include: [
              {
                model: QuestionOption,
                as: 'options',  // Use alias for options if needed
                attributes: ['id', 'option_text', 'display_order']
              }
            ]
          }
        ],
        order: [
          [{ model: Question, as: 'questions' }, 'question_order', 'ASC'],
          [{ model: Question, as: 'questions' }, { model: QuestionOption, as: 'options' }, 'display_order', 'ASC']
        ]
      });

      if (!survey) {
        throw new Error('Survey not found');
      }

      // Check if user has access
      if (survey.created_by !== userId) {
        throw new Error('Access denied');
      }

      // Create HTML content for PDF
      let htmlContent = `
        <div class="header">
          <div class="title">${survey.title}</div>
          <div class="description">${survey.description || 'Không có mô tả'}</div>
          <div class="meta">Ngày tạo: ${new Date(survey.created_at).toLocaleDateString('vi-VN')}</div>
        </div>
      `;

      // Add questions - use the alias 'questions'
      const questions = survey.questions || [];
      
      if (questions.length === 0) {
        htmlContent += `
          <div class="no-questions">
            <p><strong>Chưa có câu hỏi nào trong khảo sát này.</strong></p>
            <p>Vui lòng thêm câu hỏi vào khảo sát trước khi xuất PDF.</p>
          </div>
        `;
      } else {
        questions.forEach((question, index) => {
          htmlContent += `
            <div class="question">
              <div class="question-number">${index + 1}. ${question.question_text}</div>
              <div class="question-type">[${question.question_type}]</div>
          `;

          const options = question.options || [];
          
          if (question.question_type === 'multiple_choice' && options.length > 0) {
            htmlContent += '<div class="options">';
            options.forEach((option) => {
              htmlContent += `<div class="option"><span class="checkbox"></span> ${option.option_text}</div>`;
            });
            htmlContent += '</div>';
          } else if (question.question_type === 'checkbox' && options.length > 0) {
            htmlContent += '<div class="options">';
            options.forEach((option) => {
              htmlContent += `<div class="option"><span class="checkbox"></span> ${option.option_text}</div>`;
            });
            htmlContent += '</div>';
          } else if (question.question_type === 'dropdown' && options.length > 0) {
            htmlContent += '<div class="options"><strong>Tùy chọn:</strong><br>';
            options.forEach((option) => {
              htmlContent += `<div class="option">• ${option.option_text}</div>`;
            });
            htmlContent += '</div>';
          } else if (question.question_type === 'likert_scale') {
            htmlContent += `
              <div class="rating">
                Đánh giá từ 1 đến 5: 
                <span class="rating-box">1</span>
                <span class="rating-box">2</span>
                <span class="rating-box">3</span>
                <span class="rating-box">4</span>
                <span class="rating-box">5</span>
              </div>
            `;
          } else {
            htmlContent += '<div class="text-answer"></div><div class="text-answer"></div><div class="text-answer"></div>';
          }

          htmlContent += '</div>';
        });
      }

      return {
        htmlContent,
        survey: {
          title: survey.title,
          questionCount: questions.length
        }
      };

    } catch (error) {
      this.logger.error('Error exporting survey to PDF:', error);
      throw new Error(`Failed to export PDF: ${error.message}`);
    }
  }

  /**
   * Generate public link for survey
   */
  async generatePublicLink(surveyId, userId, expiryDays = 30) {
    const { Survey, SurveyLink } = require('../../../models');
    const crypto = require('crypto');
    
    try {
      // Verify survey ownership
      const survey = await Survey.findOne({
        where: { id: surveyId, created_by: userId }
      });

      if (!survey) {
        throw new Error('Survey not found or access denied');
      }

      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      // Create or update survey link (assuming you have a SurveyLink model)
      const surveyLink = await SurveyLink.create({
        survey_id: surveyId,
        token,
        expires_at: expiryDate,
        is_active: true,
        created_by: userId
      });

      const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/survey/public/${token}`;

      return {
        link: publicUrl,
        token,
        expiresAt: expiryDate,
        surveyId,
        isActive: true
      };

    } catch (error) {
      this.logger.error('Error generating public link:', error);
      throw new Error(`Failed to generate public link: ${error.message}`);
    }
  }

  /**
   * Get survey by public link token
   */
  async getSurveyByPublicLink(token) {
    const { Survey, Question, QuestionOption, SurveyLink } = require('../../../models');
    
    try {
      // Find survey link
      const surveyLink = await SurveyLink.findOne({
        where: { 
          token,
          is_active: true
        }
      });

      if (!surveyLink) {
        throw new Error('Survey link not found or expired');
      }

      // Check if link is expired
      if (surveyLink.expires_at && new Date() > surveyLink.expires_at) {
        throw new Error('Survey link has expired');
      }

      // Get survey with questions
      const survey = await Survey.findOne({
        where: { id: surveyLink.survey_id },
        include: [{
          model: Question,
          as: 'questions',
          include: [{ model: QuestionOption, as: 'options' }],
          order: [['question_order', 'ASC']]
        }]
      });

      if (!survey) {
        throw new Error('Survey not found');
      }

      return {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        questions: survey.questions.map(q => ({
          id: q.id,
          text: q.question_text,
          type: q.question_type,
          required: q.is_required,
          order: q.question_order,
          options: q.options ? q.options.map(opt => ({
            id: opt.id,
            text: opt.option_text,
            order: opt.option_order
          })) : []
        })),
        settings: JSON.parse(survey.share_settings || '{}')
      };

    } catch (error) {
      console.error('Get survey by public link error:', error);
      throw new Error(`Failed to get survey: ${error.message}`);
    }
  }

  /**
   * Submit survey response
   */
  async submitSurveyResponse(token, responseData) {
    const models = require('../../../models');
    const { Survey, Question, SurveyResponse, ResponseAnswer, SurveyLink } = models;
    
    this.logger.info('🔍 Models loaded:', {
      Survey: !!Survey,
      Question: !!Question, 
      SurveyResponse: !!SurveyResponse,
      ResponseAnswer: !!ResponseAnswer,
      SurveyLink: !!SurveyLink
    });
    
    this.logger.info('🔍 Response data received:', responseData);
    
    try {
      // Verify survey link
      const surveyLink = await SurveyLink.findOne({
        where: { 
          token,
          is_active: true
        }
      });

      if (!surveyLink) {
        throw new Error('Survey link not found or expired');
      }

      // Create survey response with anonymous respondent
      const surveyResponse = await SurveyResponse.create({
        survey_id: surveyLink.survey_id,
        respondent_id: null, // Allow anonymous responses
        start_time: new Date(),
        completion_time: new Date(),
        status: 'completed'
      });

      // Create response answers
      if (responseData.answers && responseData.answers.length > 0) {
        for (const answer of responseData.answers) {
          await ResponseAnswer.create({
            response_id: surveyResponse.id,
            question_id: answer.questionId || answer.question_id,
            answer_text: answer.value || answer.answer_text || null,
            selected_option_id: answer.selected_option_id || null
          });
        }
      }

      return {
        success: true,
        responseId: surveyResponse.id,
        message: 'Survey response submitted successfully'
      };

    } catch (error) {
      console.error('Submit survey response error:', error);
      throw new Error(`Failed to submit response: ${error.message}`);
    }
  }

  /**
   * Get survey responses and analytics
   */
  async getSurveyResponses(surveyId, userId) {
    try {
      // Verify survey exists and user has access
      const survey = await Survey.findByPk(surveyId, {
        attributes: ['id', 'title', 'description', 'created_by', 'status', 'created_at'],
        include: [
          {
            model: Question,
            as: 'questions',
            attributes: ['id', 'question_text', 'question_type', 'question_order'],
            include: [
              {
                model: QuestionOption,
                as: 'options',
                attributes: ['id', 'option_text', 'display_order'],
                required: false
              }
            ]
          }
        ],
        order: [['questions', 'question_order', 'ASC']]
      });

      if (!survey) {
        throw new Error('Survey not found');
      }

      // Allow survey creator or admin to view results (relaxed for demo)
      if (survey.created_by !== userId && userId !== 1) {
        this.logger.warn(`Access denied for user ${userId} to survey ${surveyId}. Creator: ${survey.created_by}`);
        // Allow all users to view results for demo purposes
        this.logger.info(`Allowing access to survey ${surveyId} for demo purposes`);
      }

      // Get all responses for this survey
      const responses = await SurveyResponse.findAll({
        where: { survey_id: surveyId },
        include: [
          {
            model: ResponseAnswer,
            as: 'responseAnswers',
            attributes: ['question_id', 'answer_text', 'selected_option_id'],
            include: [
              {
                model: Question,
                as: 'question',
                attributes: ['id', 'question_text', 'question_type'],
                required: false
              },
              {
                model: QuestionOption,
                as: 'selectedOption',
                attributes: ['id', 'option_text'],
                required: false
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Calculate summary statistics
      const totalResponses = responses.length;
      const completedResponses = responses.filter(r => r.status === 'completed').length;
      const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

      // Group responses by question for analytics
      const questionAnalytics = {};
      
      if (survey.questions) {
        survey.questions.forEach(question => {
          questionAnalytics[question.id] = {
            id: question.id,
            question: question.question_text,
            type: question.question_type,
            totalAnswers: 0,
            answers: {},
            textAnswers: []
          };

          if (question.question_type === 'multiple_choice' && question.options) {
            // Initialize option counts
            question.options.forEach(option => {
              questionAnalytics[question.id].answers[option.option_text] = 0;
            });
          }
        });
      }

      // Process each response
      responses.forEach(response => {
        if (response.responseAnswers) {
          response.responseAnswers.forEach(answer => {
            const questionId = answer.question_id;
            if (questionAnalytics[questionId]) {
              questionAnalytics[questionId].totalAnswers++;

              if (answer.answer_text) {
                // For text answers or when option_text is stored as answer_text
                const question = questionAnalytics[questionId];
                if (question.type === 'multiple_choice' || question.type === 'yes_no' || question.type === 'rating') {
                  // For choice questions, count the answer text
                  if (!question.answers[answer.answer_text]) {
                    question.answers[answer.answer_text] = 0;
                  }
                  question.answers[answer.answer_text]++;
                } else {
                  // For text questions, store individual answers
                  question.textAnswers.push(answer.answer_text);
                }
              }
            }
          });
=======
   * Predict category using Hugging Face API
   */
  async predictCategory(userId, { keyword }) {
    try {
      logger.info(`Predicting category for keyword: ${keyword}`);

      const response = await axios.post(`${HUGGINGFACE_API_URL}/api/predict/category`, {
        keyword: keyword.trim()
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      logger.debug('Category prediction response:', response.data);

      const result = {
        keyword: keyword,
        predicted_category: response.data.predicted_category,
        confidence: response.data.confidence,
        all_probabilities: response.data.all_probabilities || {}
      };

      // Log the interaction
      await LlmInteraction.create({
        custom_prompt: `Predict category for keyword: ${keyword}`,
        response: JSON.stringify(result),
        tokens_used: 0,
        model_used: 'huggingface-form-agent-ai',
        user_id: userId,
        interaction_type: 'category_prediction'
      });

      return result;
    } catch (error) {
      logger.error('Error predicting category from Hugging Face:', error.message);
      
      if (error.response) {
        logger.error('Hugging Face API Error Response:', error.response.data);
        throw new Error(`Hugging Face API Error: ${error.response.data?.detail || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Cannot connect to Hugging Face API. Please check your internet connection.');
      } else {
        throw new Error(`Failed to predict category: ${error.message}`);
      }
    }
  }

  /**
   * Get available categories from Hugging Face API
   */
  async getCategories() {
    try {
      const response = await axios.get(`${HUGGINGFACE_API_URL}/api/model/categories`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
>>>>>>> linh2
        }
      });

      return {
<<<<<<< HEAD
        survey: {
          id: survey.id,
          title: survey.title,
          description: survey.description,
          status: survey.status,
          created_at: survey.created_at
        },
        summary: {
          totalResponses,
          completedResponses,
          completionRate: Math.round(completionRate * 100) / 100,
          lastResponseAt: totalResponses > 0 ? responses[0].created_at : null
        },
        questions: Object.values(questionAnalytics),
        recentResponses: responses.slice(0, 10).map(r => ({
          id: r.id,
          created_at: r.created_at,
          status: r.status
        }))
      };

    } catch (error) {
      console.error('Get survey responses error:', error);
      throw new Error(`Failed to get survey responses: ${error.message}`);
    }
  }

  /**
   * Update survey settings
   */
  async updateSurveySettings(surveyId, userId, updateData) {
    const { Survey, Question, QuestionOption } = require('../../../models');
    try {
      console.log(`Updating survey ${surveyId} settings by user ${userId}`);

      // Verify user owns the survey
      const survey = await Survey.findOne({
        where: { id: surveyId },
        include: [{
          model: Question,
          as: 'questions',
          include: [{ model: QuestionOption, as: 'options' }]
        }]
      });

      if (!survey) {
        throw new Error('Survey not found');
      }

      if (survey.created_by !== userId) {
        throw new Error('Access denied. Only survey creator can edit.');
      }

      // Update survey basic info
      const updatedSurvey = await survey.update({
        title: updateData.title || survey.title,
        description: updateData.description || survey.description,
        status: updateData.status || survey.status,
        start_date: updateData.start_date || survey.start_date,
        end_date: updateData.end_date || survey.end_date,
        target_audience: updateData.target_audience || survey.target_audience
      });

      return {
        success: true,
        survey: updatedSurvey,
        message: 'Survey settings updated successfully'
      };

    } catch (error) {
      console.error('Update survey settings error:', error);
      throw new Error(`Failed to update survey settings: ${error.message}`);
=======
        categories: response.data.categories || ['it', 'marketing', 'economics']
      };
    } catch (error) {
      logger.error('Error getting categories from Hugging Face:', error.message);
      // Return default categories if API fails
      return {
        categories: ['it', 'marketing', 'economics']
      };
>>>>>>> linh2
    }
  }

  /**
<<<<<<< HEAD
   * Update survey question
   */
  async updateSurveyQuestion(surveyId, questionId, userId, questionData) {
    const { Survey, Question, QuestionOption } = require('../../../models');
    try {
      console.log(`Updating question ${questionId} in survey ${surveyId}`);

      // Verify user owns the survey
      const survey = await Survey.findOne({
        where: { id: surveyId },
        include: [{ model: Question, where: { id: questionId } }]
      });

      if (!survey) {
        throw new Error('Survey or question not found');
      }

      if (survey.created_by !== userId) {
        throw new Error('Access denied. Only survey creator can edit questions.');
      }

      const question = survey.questions[0];
      if (!question) {
        throw new Error('Question not found');
      }

      // Update question
      const updatedQuestion = await question.update({
        question_text: questionData.question_text || question.question_text,
        question_type: questionData.question_type || question.question_type,
        is_required: questionData.is_required !== undefined ? questionData.is_required : question.is_required,
        description: questionData.description || question.description
      });

      // Update question options if provided
      if (questionData.options && Array.isArray(questionData.options)) {
        // Delete existing options
        await QuestionOption.destroy({ where: { question_id: questionId } });
        
        // Create new options
        for (let i = 0; i < questionData.options.length; i++) {
          await QuestionOption.create({
            question_id: questionId,
            option_text: questionData.options[i],
            display_order: i + 1
          });
        }
      }

      // Fetch updated question with options
      const finalQuestion = await Question.findOne({
        where: { id: questionId },
        include: [{ model: QuestionOption, as: 'options' }]
      });

      return {
        success: true,
        question: finalQuestion,
        message: 'Question updated successfully'
      };

    } catch (error) {
      console.error('Update survey question error:', error);
      throw new Error(`Failed to update question: ${error.message}`);
    }
  }

  /**
   * Delete survey question
   */
  async deleteSurveyQuestion(surveyId, questionId, userId) {
    const { Survey, Question, QuestionOption } = require('../../../models');
    try {
      console.log(`Deleting question ${questionId} from survey ${surveyId}`);

      // Verify user owns the survey
      const survey = await Survey.findOne({
        where: { id: surveyId },
        include: [{ model: Question, where: { id: questionId } }]
      });

      if (!survey) {
        throw new Error('Survey or question not found');
      }

      if (survey.created_by !== userId) {
        throw new Error('Access denied. Only survey creator can delete questions.');
      }

      // Delete question options first
      await QuestionOption.destroy({ where: { question_id: questionId } });
      
      // Delete question
      await Question.destroy({ where: { id: questionId, survey_id: surveyId } });

      return {
        success: true,
        message: 'Question deleted successfully'
      };

    } catch (error) {
      console.error('Delete survey question error:', error);
      throw new Error(`Failed to delete question: ${error.message}`);
    }
  }

  /**
   * Add new question to survey
   */
  async addSurveyQuestion(surveyId, userId, questionData) {
    const { Survey, Question, QuestionOption } = require('../../../models');
    try {
      console.log(`Adding new question to survey ${surveyId}`);

      // Verify user owns the survey
      const survey = await Survey.findByPk(surveyId);
      if (!survey) {
        throw new Error('Survey not found');
      }

      if (survey.created_by !== userId) {
        throw new Error('Access denied. Only survey creator can add questions.');
      }

      // Get next question order
      const lastQuestion = await Question.findOne({
        where: { survey_id: surveyId },
        order: [['question_order', 'DESC']],
        limit: 1
      });

      const nextOrder = lastQuestion ? lastQuestion.question_order + 1 : 1;

      // Create new question
      const newQuestion = await Question.create({
        survey_id: surveyId,
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        is_required: questionData.is_required || false,
        question_order: nextOrder,
        description: questionData.description || ''
      });

      // Add question options if provided
      if (questionData.options && Array.isArray(questionData.options)) {
        for (let i = 0; i < questionData.options.length; i++) {
          await QuestionOption.create({
            question_id: newQuestion.id,
            option_text: questionData.options[i],
            display_order: i + 1
          });
        }
      }

      // Fetch created question with options
      const finalQuestion = await Question.findOne({
        where: { id: newQuestion.id },
        include: [{ model: QuestionOption, as: 'options' }]
      });

      return {
        success: true,
        question: finalQuestion,
        message: 'Question added successfully'
      };

    } catch (error) {
      console.error('Add survey question error:', error);
      throw new Error(`Failed to add question: ${error.message}`);
    }
  }

  /**
   * Get survey for editing
   */
  async getSurveyForEditing(surveyId, userId) {
    const { Survey, Question, QuestionOption } = require('../../../models');
    try {
      console.log(`Getting survey ${surveyId} for editing by user ${userId}`);

      if (!userId) {
        throw new Error('User ID is required for editing survey');
      }

      const survey = await Survey.findOne({
        where: { id: surveyId },
        include: [
          {
            model: Question,
            as: 'questions',
            include: [{ model: QuestionOption, as: 'options' }],
            order: [['question_order', 'ASC']]
          }
        ],
        order: [
          [{ model: Question, as: 'questions' }, 'question_order', 'ASC']
        ]
      });

      if (!survey) {
        throw new Error('Survey not found');
      }

      if (survey.created_by !== userId) {
        throw new Error('Access denied. Only survey creator can edit.');
      }

      return {
        success: true,
        survey: survey
      };

    } catch (error) {
      console.error('Get survey for editing error:', error);
      throw new Error(`Failed to get survey for editing: ${error.message}`);
    }
  }

  // Generate PDF HTML for survey
  async generateSurveyPDF(surveyId, userId) {
    const { Survey, Question, QuestionOption } = require('../../../models');
    try {
      // Get survey with questions - remove user restriction for PDF export
      const survey = await Survey.findOne({
        where: { 
          id: surveyId
        }
      });

      if (!survey) {
        throw new Error('Survey not found');
      }

      // Get questions for this survey
      const questions = await Question.findAll({
        where: { survey_id: surveyId },
        include: [{
          model: QuestionOption,
          as: 'options'
        }],
        order: [['question_order', 'ASC']]
      });

      // Generate HTML with proper formatting for each question type
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Survey: ${survey.title}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 40px; 
              line-height: 1.6;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 2px solid #4CAF50;
              padding-bottom: 20px;
            }
            .title { 
              font-size: 28px; 
              font-weight: bold; 
              color: #2c3e50;
              margin-bottom: 10px;
            }
            .description { 
              font-size: 16px; 
              color: #7f8c8d;
              margin-bottom: 10px;
            }
            .meta-info {
              font-size: 14px;
              color: #95a5a6;
            }
            .question-block { 
              margin: 30px 0; 
              padding: 20px; 
              border: 1px solid #ecf0f1;
              border-radius: 8px;
              background-color: #fafafa;
            }
            .question-number {
              font-weight: bold;
              color: #3498db;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .question-text { 
              font-size: 18px; 
              font-weight: 600; 
              margin-bottom: 15px;
              color: #2c3e50;
            }
            .question-type {
              font-size: 12px;
              color: #7f8c8d;
              margin-bottom: 15px;
              font-style: italic;
            }
            .answer-options { 
              margin: 15px 0; 
            }
            .option { 
              margin: 8px 0;
              padding: 8px 0;
              display: flex;
              align-items: center;
            }
            .option-checkbox, .option-radio {
              width: 16px;
              height: 16px;
              border: 2px solid #bdc3c7;
              margin-right: 10px;
              display: inline-block;
              flex-shrink: 0;
            }
            .option-radio {
              border-radius: 50%;
            }
            .option-text {
              flex: 1;
            }
            .text-answer {
              border: 1px solid #bdc3c7;
              padding: 12px;
              min-height: 80px;
              background-color: white;
              border-radius: 4px;
            }
            .rating-scale {
              display: flex;
              gap: 10px;
              margin: 10px 0;
            }
            .rating-box {
              width: 40px;
              height: 40px;
              border: 2px solid #bdc3c7;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              border-radius: 4px;
            }
            .dropdown-select {
              border: 1px solid #bdc3c7;
              padding: 10px;
              width: 100%;
              background-color: white;
              border-radius: 4px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 12px;
              color: #95a5a6;
              border-top: 1px solid #ecf0f1;
              padding-top: 20px;
            }
            @media print {
              body { margin: 20px; }
              .question-block { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${survey.title}</div>
            ${survey.description ? `<div class="description">${survey.description}</div>` : ''}
            <div class="meta-info">
              Survey ID: ${survey.id} | 
              Created: ${new Date(survey.created_at).toLocaleDateString()} |
              Questions: ${questions.length}
            </div>
          </div>

          <div class="content">
            ${questions.map((question, index) => this.formatQuestionForPDF(question, index + 1)).join('')}
          </div>

          <div class="footer">
            <p>Generated by LLM Survey System - ${new Date().toLocaleString()}</p>
            <p>This is a preview format. Users can fill this survey and submit responses.</p>
          </div>
        </body>
        </html>
      `;

      return html;
    } catch (error) {
      console.error('Generate survey PDF error:', error);
      throw new Error(`Failed to generate survey PDF: ${error.message}`);
    }
  }

  // Format question for PDF based on question type
  formatQuestionForPDF(question, questionNumber) {
    const requiredMark = question.required ? '<span style="color: red;">*</span>' : '';
    
    let answerSection = '';
    
    switch (question.question_type) {
      case 'text':
      case 'open_ended':
        answerSection = `
          <div class="text-answer">
            <div style="height: 60px; border: none; background: white;"></div>
          </div>
        `;
        break;
        
      case 'yes_no':
        answerSection = `
          <div class="answer-options">
            <div class="option">
              <span class="option-radio"></span>
              <span class="option-text">Yes</span>
            </div>
            <div class="option">
              <span class="option-radio"></span>
              <span class="option-text">No</span>
            </div>
          </div>
        `;
        break;
        
      case 'multiple_choice':
        answerSection = `
          <div class="answer-options">
            ${(question.options || []).map(option => `
              <div class="option">
                <span class="option-radio"></span>
                <span class="option-text">${option.option_text}</span>
              </div>
            `).join('')}
          </div>
        `;
        break;
        
      case 'checkbox':
        answerSection = `
          <div class="answer-options">
            ${(question.options || []).map(option => `
              <div class="option">
                <span class="option-checkbox"></span>
                <span class="option-text">${option.option_text}</span>
              </div>
            `).join('')}
          </div>
        `;
        break;
        
      case 'dropdown':
        answerSection = `
          <select class="dropdown-select" disabled>
            <option>-- Select an option --</option>
            ${(question.options || []).map(option => `
              <option>${option.option_text}</option>
            `).join('')}
          </select>
        `;
        break;
        
      case 'likert_scale':
      case 'rating':
        answerSection = `
          <div class="rating-scale">
            ${[1, 2, 3, 4, 5].map(rating => `
              <div class="rating-box">${rating}</div>
            `).join('')}
          </div>
          <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">
            1 = Strongly Disagree, 5 = Strongly Agree
          </div>
        `;
        break;
        
      default:
        answerSection = `
          <div class="text-answer">
            <em>Answer field for ${question.question_type} question type</em>
          </div>
        `;
    }
    
    return `
      <div class="question-block">
        <div class="question-number">Question ${questionNumber}</div>
        <div class="question-text">
          ${question.question_text} ${requiredMark}
        </div>
        <div class="question-type">
          Type: ${question.question_type} ${question.description ? `| ${question.description}` : ''}
        </div>
        ${answerSection}
      </div>
    `;
  }
}

module.exports = new LLMService();

=======
   * Check Hugging Face API health
   */
  async checkHuggingFaceHealth() {
    try {
      const response = await axios.get(`${HUGGINGFACE_API_URL}/health`, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      return {
        status: 'healthy',
        api_status: response.data.status,
        model_loaded: response.data.model_loaded,
        timestamp: response.data.timestamp,
        response_time: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      logger.error('Hugging Face API health check failed:', error.message);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new LlmService();
>>>>>>> linh2
