// src/controllers/survey.controller.js
const { Survey, SurveyTemplate, Question, QuestionOption, User, sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * Create a new survey
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.createSurvey = async (req, res) => {
  try {
    const { 
      template_id, 
      title, 
      description, 
      start_date, 
      end_date, 
      target_audience, 
      target_value 
    } = req.body;

    // Check if template exists
    const template = await SurveyTemplate.findByPk(template_id);
    if (!template) {
      return res.status(404).json({
        error: true,
        message: 'Survey template not found'
      });
    }

    // Create survey
    const survey = await Survey.create({
      template_id,
      title,
      description,
      start_date,
      end_date,
      target_audience,
      target_value,
      created_by: req.user.id,
      status: 'draft'
    });

    return res.status(201).json({
      error: false,
      message: 'Survey created successfully',
      data: { survey }
    });
  } catch (error) {
    logger.error('Error creating survey:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while creating survey'
    });
  }
};

/**
 * Get all surveys (with filters and pagination)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getAllSurveys = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filters
    const { status, target_audience } = req.query;
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (target_audience) whereClause.target_audience = target_audience;

    // For students, only show surveys that target them
    if (req.user.role === 'student') {
      whereClause.status = 'active';
      whereClause[sequelize.Op.or] = [
        { target_audience: 'all_students' },
        { 
          target_audience: 'specific_faculty',
          target_value: req.user.faculty
        },
        { 
          target_audience: 'specific_class',
          target_value: req.user.class_name
        }
      ];
    }

    // Get surveys with creator info
    const { count, rows: surveys } = await Survey.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: SurveyTemplate,
          as: 'template',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name']
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      error: false,
      data: {
        surveys,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching surveys:', error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching surveys'
    });
  }
};

/**
 * Get survey by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get survey with template, questions and options
    const survey = await Survey.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name', 'role']
        },
        {
          model: SurveyTemplate,
          as: 'template',
          include: [
            {
              model: Question,
              include: [
                {
                  model: QuestionOption
                }
              ]
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

    // Check access rights for students
    if (req.user.role === 'student') {
      const isTargeted = 
        survey.status === 'active' && 
        (survey.target_audience === 'all_students' || 
         (survey.target_audience === 'specific_faculty' && survey.target_value === req.user.faculty) ||
         (survey.target_audience === 'specific_class' && survey.target_value === req.user.class_name));
      
      if (!isTargeted) {
        return res.status(403).json({
          error: true,
          message: 'You do not have permission to view this survey'
        });
      }
    }

    return res.status(200).json({
      error: false,
      data: { survey }
    });
  } catch (error) {
    logger.error(`Error fetching survey with ID ${req.params.id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while fetching survey'
    });
  }
};

/**
 * Update survey
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.updateSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      start_date, 
      end_date, 
      target_audience, 
      target_value,
      status 
    } = req.body;

    // Find survey
    const survey = await Survey.findByPk(id);

    if (!survey) {
      return res.status(404).json({
        error: true,
        message: 'Survey not found'
      });
    }

    // Check if user has permission to update this survey
    if (req.user.role === 'student' || (req.user.role === 'teacher' && survey.created_by !== req.user.id)) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to update this survey'
      });
    }

    // Prevent updates to active surveys with responses
    if (survey.status === 'active' && status !== 'closed') {
      const hasResponses = await SurveyResponse.count({
        where: { survey_id: id }
      });

      if (hasResponses > 0) {
        return res.status(400).json({
          error: true,
          message: 'Cannot update a survey that already has responses'
        });
      }
    }

    // Update survey
    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(start_date && { start_date }),
      ...(end_date && { end_date }),
      ...(target_audience && { target_audience }),
      ...(target_value && { target_value }),
      ...(status && { status })
    };

    await survey.update(updateData);

    return res.status(200).json({
      error: false,
      message: 'Survey updated successfully',
      data: { survey }
    });
  } catch (error) {
    logger.error(`Error updating survey with ID ${req.params.id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while updating survey'
    });
  }
};

/**
 * Delete survey
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.deleteSurvey = async (req, res) => {
  try {
    const { id } = req.params;

    // Find survey
    const survey = await Survey.findByPk(id);

    if (!survey) {
      return res.status(404).json({
        error: true,
        message: 'Survey not found'
      });
    }

    // Check if user has permission to delete this survey
    if (req.user.role === 'student' || (req.user.role === 'teacher' && survey.created_by !== req.user.id)) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to delete this survey'
      });
    }

    // Prevent deletion of active surveys with responses
    if (survey.status === 'active') {
      const hasResponses = await SurveyResponse.count({
        where: { survey_id: id }
      });

      if (hasResponses > 0) {
        return res.status(400).json({
          error: true,
          message: 'Cannot delete a survey that already has responses'
        });
      }
    }

    // Delete survey
    await survey.destroy();

    return res.status(200).json({
      error: false,
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting survey with ID ${req.params.id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while deleting survey'
    });
  }
};

/**
 * Update survey status
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} JSON response
 */
exports.updateSurveyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'active', 'closed', 'analyzed'].includes(status)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid status value'
      });
    }

    // Find survey
    const survey = await Survey.findByPk(id);

    if (!survey) {
      return res.status(404).json({
        error: true,
        message: 'Survey not found'
      });
    }

    // Check if user has permission to update this survey
    if (req.user.role === 'student' || (req.user.role === 'teacher' && survey.created_by !== req.user.id)) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to update this survey'
      });
    }

    // Update status
    await survey.update({ status });

    return res.status(200).json({
      error: false,
      message: 'Survey status updated successfully',
      data: { survey }
    });
  } catch (error) {
    logger.error(`Error updating status for survey with ID ${req.params.id}:`, error);
    return res.status(500).json({
      error: true,
      message: 'An error occurred while updating survey status'
    });
  }
};
