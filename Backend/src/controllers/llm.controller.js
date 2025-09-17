// src/controllers/llm.controller.js
const { OpenAI } = require('openai');
const { 
  LlmPrompt, 
  LlmInteraction, 
  Survey, 
  SurveyResponse,
  AnalysisResult 
} = require('../models');
const logger = require('../utils/logger');

// Initialize OpenAI client
let openai = null;
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'OPENAI_API_KEY') {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    logger.warn('OpenAI API key not configured. LLM features will be disabled.');
  }
} catch (error) {
  logger.error('Failed to initialize OpenAI client:', error);
}

/**
 * Generate a survey based on a prompt
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.generateSurvey = async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: true,
        message: 'LLM service is not available. OpenAI API key not configured.',
      });
    }

    const { prompt, description, target_audience, course_name, student_level } = req.body;

    // If a prompt ID is provided, use that prompt
    let promptText = prompt;
    
    if (req.body.prompt_id) {
      const savedPrompt = await LlmPrompt.findByPk(req.body.prompt_id);
      if (savedPrompt) {
        promptText = savedPrompt.prompt_text;
        
        // Replace placeholders with values
        if (course_name) promptText = promptText.replace('{{course_name}}', course_name);
        if (student_level) promptText = promptText.replace('{{student_level}}', student_level);
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
      return res.status(500).json({
        error: true,
        message: 'Could not parse survey data from LLM response',
        raw_response: responseText
      });
    }

    // Log the interaction
    await LlmInteraction.create({
      custom_prompt: req.body.prompt_id ? null : promptText,
      prompt_id: req.body.prompt_id || null,
      response: responseText,
      tokens_used: completion.usage.total_tokens,
      model_used: process.env.OPENAI_MODEL || "gpt-4-turbo",
      user_id: req.user.id,
      interaction_type: 'survey_generation'
    });

    return res.status(200).json({
      error: false,
      message: 'Survey generated successfully',
      data: surveyData
    });
  } catch (error) {
    logger.error('Error generating survey:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while generating survey'
    });
  }
};

/**
 * Analyze survey responses
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.analyzeSurveyResponses = async (req, res) => {
  try {
    const { survey_id, analysis_type } = req.body;

    // Validate analysis type
    if (!['sentiment', 'theme_extraction', 'summary', 'comparison'].includes(analysis_type)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid analysis type'
      });
    }

    // Check if survey exists
    const survey = await Survey.findByPk(survey_id, {
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
      return res.status(404).json({
        error: true,
        message: 'Survey not found'
      });
    }

    // Check if user has permission to analyze this survey
    if (req.user.role !== 'admin' && survey.created_by !== req.user.id) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to analyze this survey'
      });
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.findAll({
      where: {
        survey_id,
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
      return res.status(400).json({
        error: true,
        message: 'No responses found for this survey'
      });
    }

    // Format responses for analysis
    const formattedResponses = responses.map(response => {
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

    // Prepare analysis prompt based on type
    let analysisPrompt = '';
    
    switch (analysis_type) {
      case 'sentiment':
        analysisPrompt = `
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
        `;
        break;
      
      case 'theme_extraction':
        analysisPrompt = `
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
        `;
        break;
      
      case 'summary':
        analysisPrompt = `
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
        `;
        break;
      
      case 'comparison':
        analysisPrompt = `
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
        `;
        break;
    }

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
      return res.status(500).json({
        error: true,
        message: 'Could not parse analysis data from LLM response',
        raw_response: responseText
      });
    }

    // Save analysis result
    const analysisResult = await AnalysisResult.create({
      survey_id,
      analysis_type,
      result_data: analysisData
    });

    // Log the interaction
    await LlmInteraction.create({
      custom_prompt: analysisPrompt,
      response: responseText,
      tokens_used: completion.usage.total_tokens,
      model_used: process.env.OPENAI_MODEL || "gpt-4-turbo",
      user_id: req.user.id,
      interaction_type: 'analysis'
    });

    return res.status(200).json({
      error: false,
      message: 'Survey responses analyzed successfully',
      data: {
        analysis_id: analysisResult.id,
        analysis_type,
        result: analysisData
      }
    });
  } catch (error) {
    logger.error('Error analyzing survey responses:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while analyzing survey responses'
    });
  }
};

/**
 * Get all saved LLM prompts
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getLlmPrompts = async (req, res) => {
  try {
    // Filter by prompt type if provided
    const whereClause = {};
    if (req.query.type) {
      whereClause.prompt_type = req.query.type;
    }

    const prompts = await LlmPrompt.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      error: false,
      data: { prompts }
    });
  } catch (error) {
    logger.error('Error fetching LLM prompts:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching LLM prompts'
    });
  }
};

/**
 * Create a new LLM prompt
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.createLlmPrompt = async (req, res) => {
  try {
    const { prompt_name, prompt_type, prompt_text } = req.body;

    // Validate prompt type
    if (!['survey_generation', 'analysis', 'summary', 'recommendation'].includes(prompt_type)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid prompt type'
      });
    }

    // Create prompt
    const prompt = await LlmPrompt.create({
      prompt_name,
      prompt_type,
      prompt_text,
      created_by: req.user.id
    });

    return res.status(201).json({
      error: false,
      message: 'LLM prompt created successfully',
      data: { prompt }
    });
  } catch (error) {
    logger.error('Error creating LLM prompt:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while creating LLM prompt'
    });
  }
};

/**
 * Get analysis results for a survey
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getAnalysisResults = async (req, res) => {
  try {
    const { survey_id } = req.params;

    // Check if survey exists
    const survey = await Survey.findByPk(survey_id);
    
    if (!survey) {
      return res.status(404).json({
        error: true,
        message: 'Survey not found'
      });
    }

    // Check if user has permission to view analysis results
    if (req.user.role !== 'admin' && survey.created_by !== req.user.id) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to view analysis results for this survey'
      });
    }

    // Get analysis results
    const analysisResults = await AnalysisResult.findAll({
      where: { survey_id },
      order: [['generated_at', 'DESC']]
    });

    return res.status(200).json({
      error: false,
      data: { analysisResults }
    });
  } catch (error) {
    logger.error(`Error fetching analysis results for survey ID ${req.params.survey_id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching analysis results'
    });
  }
};
