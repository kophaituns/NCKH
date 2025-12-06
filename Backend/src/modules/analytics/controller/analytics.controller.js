// src/modules/analytics/controller/analytics.controller.js
const analyticsService = require('../service/analytics.service');
const logger = require('../../../utils/logger');

/**
 * Get quality score for a survey
 */
const getQualityScore = async (req, res) => {
  try {
    const { surveyId } = req.params;
    
    if (!surveyId) {
      return res.status(400).json({
        success: false,
        message: 'Survey ID is required'
      });
    }

    const qualityScore = await analyticsService.getQualityScore(surveyId);

    res.status(200).json({
      success: true,
      data: qualityScore
    });
  } catch (error) {
    logger.error('Error getting quality score:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get drop-off analysis for a survey
 */
const getDropOffAnalysis = async (req, res) => {
  try {
    const { surveyId } = req.params;
    
    if (!surveyId) {
      return res.status(400).json({
        success: false,
        message: 'Survey ID is required'
      });
    }

    const dropOffAnalysis = await analyticsService.getDropOffAnalysis(surveyId);

    res.status(200).json({
      success: true,
      data: dropOffAnalysis
    });
  } catch (error) {
    logger.error('Error getting drop-off analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get cross-tabulation analysis for a survey
 */
const getCrossTabAnalysis = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { breakdownQuestionId, targetQuestionId } = req.body;
    
    if (!surveyId) {
      return res.status(400).json({
        success: false,
        message: 'Survey ID is required'
      });
    }

    if (!breakdownQuestionId || !targetQuestionId) {
      return res.status(400).json({
        success: false,
        message: 'Both breakdownQuestionId and targetQuestionId are required'
      });
    }

    const crossTabAnalysis = await analyticsService.getCrossTabAnalysis(
      surveyId, 
      breakdownQuestionId, 
      targetQuestionId
    );

    res.status(200).json({
      success: true,
      data: crossTabAnalysis
    });
  } catch (error) {
    logger.error('Error getting cross-tab analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get admin dashboard analytics data
 */
const getAdminDashboard = async (req, res) => {
  try {
    const dashboardData = await analyticsService.getAdminDashboard();

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Error getting admin dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getQualityScore,
  getDropOffAnalysis,
  getCrossTabAnalysis,
  getAdminDashboard
};