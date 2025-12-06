// src/modules/analytics/service/analytics.service.js
const analyticsRepository = require('../repository/analytics.repository');
const logger = require('../../../utils/logger');

/**
 * Get quality score for a survey
 */
const getQualityScore = async (surveyId) => {
  try {
    logger.info(`Getting quality score for survey ${surveyId}`);
    
    // Get survey data and responses
    const surveyData = await analyticsRepository.getSurveyWithResponses(surveyId);
    
    if (!surveyData) {
      throw new Error('Survey not found');
    }

    // Calculate quality metrics
    const qualityMetrics = {
      responseRate: calculateResponseRate(surveyData),
      completionRate: calculateCompletionRate(surveyData),
      averageTimeSpent: calculateAverageTimeSpent(surveyData),
      dropOffRate: calculateDropOffRate(surveyData),
      score: 0
    };

    // Calculate overall quality score (0-100)
    qualityMetrics.score = Math.round(
      (qualityMetrics.responseRate * 0.3) +
      (qualityMetrics.completionRate * 0.4) +
      ((100 - qualityMetrics.dropOffRate) * 0.3)
    );

    return qualityMetrics;
  } catch (error) {
    logger.error('Error calculating quality score:', error);
    throw error;
  }
};

/**
 * Get drop-off analysis for a survey
 */
const getDropOffAnalysis = async (surveyId) => {
  try {
    logger.info(`Getting drop-off analysis for survey ${surveyId}`);
    
    const surveyData = await analyticsRepository.getSurveyWithResponses(surveyId);
    
    if (!surveyData) {
      throw new Error('Survey not found');
    }

    // Calculate drop-off by question
    const dropOffByQuestion = calculateDropOffByQuestion(surveyData);
    
    return {
      totalStarted: surveyData.responses.length,
      totalCompleted: surveyData.responses.filter(r => r.status === 'completed').length,
      overallDropOffRate: calculateDropOffRate(surveyData),
      questionDropOff: dropOffByQuestion
    };
  } catch (error) {
    logger.error('Error getting drop-off analysis:', error);
    throw error;
  }
};

/**
 * Get cross-tabulation analysis for a survey
 */
const getCrossTabAnalysis = async (surveyId, breakdownQuestionId, targetQuestionId) => {
  try {
    logger.info(`Getting cross-tab analysis for survey ${surveyId}`);
    
    const crossTabData = await analyticsRepository.getCrossTabData(
      surveyId, 
      breakdownQuestionId, 
      targetQuestionId
    );
    
    if (!crossTabData) {
      throw new Error('Unable to get cross-tabulation data');
    }

    // Process cross-tabulation data
    const processedData = processCrossTabData(crossTabData);
    
    return processedData;
  } catch (error) {
    logger.error('Error getting cross-tab analysis:', error);
    throw error;
  }
};

// Helper functions
const calculateResponseRate = (surveyData) => {
  // This would typically compare invited vs responded
  // For now, return a placeholder
  return surveyData.responses.length > 0 ? 75 : 0;
};

const calculateCompletionRate = (surveyData) => {
  if (surveyData.responses.length === 0) return 0;
  
  const completedResponses = surveyData.responses.filter(r => r.status === 'completed');
  return Math.round((completedResponses.length / surveyData.responses.length) * 100);
};

const calculateAverageTimeSpent = (surveyData) => {
  if (surveyData.responses.length === 0) return 0;
  
  const timesSpent = surveyData.responses
    .filter(r => r.time_spent)
    .map(r => r.time_spent);
  
  if (timesSpent.length === 0) return 0;
  
  const total = timesSpent.reduce((sum, time) => sum + time, 0);
  return Math.round(total / timesSpent.length);
};

const calculateDropOffRate = (surveyData) => {
  if (surveyData.responses.length === 0) return 0;
  
  const incompletedResponses = surveyData.responses.filter(r => r.status !== 'completed');
  return Math.round((incompletedResponses.length / surveyData.responses.length) * 100);
};

/**
 * Get admin dashboard analytics data
 */
const getAdminDashboard = async () => {
  try {
    logger.info('Getting admin dashboard analytics data');

    // Get all the required data for the dashboard
    const [
      totalUsers,
      totalSurveys,
      totalResponses,
      activeSurveys,
      roleStats,
      responsesPerSurvey,
      surveyActivity
    ] = await Promise.all([
      analyticsRepository.getTotalUsers(),
      analyticsRepository.getTotalSurveys(),
      analyticsRepository.getTotalResponses(),
      analyticsRepository.getActiveSurveys(),
      analyticsRepository.getUserRoleStats(),
      analyticsRepository.getResponsesPerSurvey(),
      analyticsRepository.getSurveyActivityTrend()
    ]);

    return {
      totals: {
        totalUsers,
        totalSurveys,
        totalResponses,
        activeSurveys
      },
      roleStats,
      responsesPerSurvey,
      surveyActivity
    };
  } catch (error) {
    logger.error('Error getting admin dashboard data:', error);
    throw error;
  }
};

const calculateDropOffByQuestion = (surveyData) => {
  // Placeholder implementation
  // This would analyze at which questions users typically drop off
  return surveyData.questions?.map((question, index) => ({
    questionId: question.id,
    questionText: question.question_text,
    position: index + 1,
    dropOffCount: Math.floor(Math.random() * 10), // Placeholder
    dropOffPercentage: Math.floor(Math.random() * 20) // Placeholder
  })) || [];
};

const processCrossTabData = (crossTabData) => {
  // Placeholder implementation for processing cross-tabulation data
  return {
    breakdownQuestion: crossTabData.breakdownQuestion,
    targetQuestion: crossTabData.targetQuestion,
    results: crossTabData.results || [],
    totalResponses: crossTabData.totalResponses || 0
  };
};

module.exports = {
  getQualityScore,
  getDropOffAnalysis,
  getCrossTabAnalysis,
  getAdminDashboard
};