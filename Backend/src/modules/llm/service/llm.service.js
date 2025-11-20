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
    }
  }

  /**
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
        }
      });

      return {
        categories: response.data.categories || ['it', 'marketing', 'economics']
      };
    } catch (error) {
      logger.error('Error getting categories from Hugging Face:', error.message);
      // Return default categories if API fails
      return {
        categories: ['it', 'marketing', 'economics']
      };
    }
  }

  /**
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
