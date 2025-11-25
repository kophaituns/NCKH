/**
 * Survey Service Module
 * ========================
 * 
 * FEATURE: Complete Survey Management System
 * 
 * This service handles all survey-related operations including:
 * - Survey CRUD operations (Create, Read, Update, Delete)
 * - Status lifecycle management (draft → active → closed → analyzed)
 * - Role-based access control (admin can see all, users see their own)
 * - Survey statistics and response tracking
 * - Auto-closing of expired surveys
 * - Survey publishing and closing workflows
 * 
 * Survey Lifecycle:
 *   1. Draft: Initial state after creation, not visible to respondents
 *   2. Active: Survey is published and accepting responses (between start_date and end_date)
 *   3. Closed: Survey has ended or been manually closed, no new responses accepted
 *   4. Analyzed: Survey has been analyzed and archived
 * 
 * Access Control:
 *   - Admin: Can view, edit, delete all surveys
 *   - Teachers/Users: Can only view/edit surveys they created
 *   - Students: Can only respond to active surveys they're invited to
 * 
 * Database: Surveys are stored in 'surveys' table with relationships to:
 *   - templates (SurveyTemplate) - defines questions and structure
 *   - users (User) - tracks creator/owner
 *   - responses (SurveyResponse) - stores submitted answers
 * 
 * Integration Points:
 *   - Used by: SurveyController, ResponseService, NotificationService
 *   - Emits: Socket events for status changes, new responses
 *   - Requires: User authentication, template validation
 */

// src/modules/surveys/service/survey.service.js
const { Survey, User, SurveyTemplate, SurveyResponse, Question } = require('../../../models');
const { Op } = require('sequelize');

class SurveyService {
  /**
   * FEATURE: Get all surveys with advanced filtering and pagination
   * 
   * Purpose: Retrieve a paginated list of surveys with optional filters
   * 
   * Parameters:
   *   - options.page: Page number (default: 1)
   *   - options.limit: Items per page (default: 10)
   *   - options.status: Filter by status (draft|active|closed|analyzed)
   *   - options.target_audience: Filter by target audience (all_users|students|teachers)
   *   - options.search: Search by title or description (text search)
   * 
   * Access Control:
   *   - Admins: See all surveys
   *   - Other roles: See only surveys they created
   * 
   * Returns: Object with:
   *   - surveys[]: Array of survey objects with question count
   *   - pagination: Object with total, page, limit, totalPages
   * 
   * Throws: Database errors
   */
  async getAllSurveys(options = {}, user) {
    const {
      page = 1,
      limit = 10,
      status,
      target_audience,
      search
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    // Role-based filtering
    if (user.role !== 'admin') {
      where.created_by = user.id;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Target audience filter
    if (target_audience) {
      where.target_audience = target_audience;
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Survey.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name', 'email']
        },
        {
          model: SurveyTemplate,
          as: 'template',
          attributes: ['id', 'title', 'description'],
          include: [
            {
              model: Question,
              as: 'Questions',
              attributes: ['id']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Map surveys to include questionCount
    const surveysWithCount = rows.map(survey => {
      const surveyData = survey.toJSON();
      const templateQuestions = surveyData.template?.Questions || [];
      surveyData.questionCount = templateQuestions.length;
      return surveyData;
    });

    return {
      surveys: surveysWithCount,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get survey by ID
   */
  async getSurveyById(surveyId, user) {
    const where = { id: surveyId };

    // Non-admin users can only see their own surveys
    if (user.role !== 'admin') {
      where.created_by = user.id;
    }

    const survey = await Survey.findOne({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name', 'email']
        },
        {
          model: SurveyTemplate,
          as: 'template',
          attributes: ['id', 'title', 'description'],
          include: [
            {
              model: Question,
              as: 'Questions',
              attributes: ['id']
            }
          ]
        }
      ]
    });

    if (!survey) {
      return null;
    }

    // Add questionCount to the survey
    const surveyData = survey.toJSON();
    const templateQuestions = surveyData.template?.Questions || [];
    surveyData.questionCount = templateQuestions.length;

    return surveyData;
  }

  /**
   * Create new survey
   */
  async createSurvey(surveyData, user) {
    const {
      template_id,
      title,
      description,
      start_date,
      end_date,
      target_audience,
      target_value
    } = surveyData;

    // Verify template exists
    const template = await SurveyTemplate.findByPk(template_id);
    if (!template) {
      throw new Error('Survey template not found');
    }

    const survey = await Survey.create({
      template_id,
      title,
      description,
      start_date,
      end_date,
      target_audience: target_audience || 'all_users',
      target_value,
      created_by: user.id,
      status: 'draft'
    });

    return this.getSurveyById(survey.id, user);
  }

  /**
   * Update survey
   */
  async updateSurvey(surveyId, updateData, user) {
    const survey = await Survey.findByPk(surveyId);

    if (!survey) {
      throw new Error('Survey not found');
    }

    // Check ownership
    if (user.role !== 'admin' && survey.created_by !== user.id) {
      throw new Error('Access denied. You do not own this survey.');
    }

    // Update allowed fields
    const allowedFields = [
      'title',
      'description',
      'start_date',
      'end_date',
      'target_audience',
      'target_value',
      'status'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        survey[field] = updateData[field];
      }
    });

    await survey.save();

    return this.getSurveyById(surveyId, user);
  }

  /**
   * Delete survey
   */
  async deleteSurvey(surveyId, user) {
    const survey = await Survey.findByPk(surveyId);

    if (!survey) {
      throw new Error('Survey not found');
    }

    // Check ownership
    if (user.role !== 'admin' && survey.created_by !== user.id) {
      throw new Error('Access denied. You do not own this survey.');
    }

    await survey.destroy();

    return { message: 'Survey deleted successfully' };
  }

  /**
   * Get survey statistics
   */
  async getSurveyStats(surveyId, user) {
    const survey = await this.getSurveyById(surveyId, user);

    if (!survey) {
      throw new Error('Survey not found');
    }

    const responseCount = await SurveyResponse.count({
      where: { survey_id: surveyId }
    });

    return {
      survey_id: surveyId,
      title: survey.title,
      status: survey.status,
      response_count: responseCount,
      start_date: survey.start_date,
      end_date: survey.end_date,
      target_audience: survey.target_audience
    };
  }

  /**
   * Publish survey (change status from draft to active)
   */
  async publishSurvey(surveyId, user) {
    const survey = await Survey.findByPk(surveyId);

    if (!survey) {
      throw new Error('Survey not found');
    }

    // Check ownership
    if (user.role !== 'admin' && survey.created_by !== user.id) {
      throw new Error('Access denied. You do not own this survey.');
    }

    // Validate status transition
    if (survey.status !== 'draft') {
      throw new Error(`Cannot publish survey. Current status: ${survey.status}. Only draft surveys can be published.`);
    }

    // Validate dates
    const now = new Date();
    const startDate = new Date(survey.start_date);
    const endDate = new Date(survey.end_date);

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    if (endDate <= now) {
      throw new Error('End date must be in the future');
    }

    // Update status to active
    survey.status = 'active';
    await survey.save();

    return this.getSurveyById(surveyId, user);
  }

  /**
   * Close survey (change status from active to closed)
   */
  async closeSurvey(surveyId, user) {
    const survey = await Survey.findByPk(surveyId);

    if (!survey) {
      throw new Error('Survey not found');
    }

    // Check ownership
    if (user.role !== 'admin' && survey.created_by !== user.id) {
      throw new Error('Access denied. You do not own this survey.');
    }

    // Validate status transition
    if (survey.status !== 'active') {
      throw new Error(`Cannot close survey. Current status: ${survey.status}. Only active surveys can be closed.`);
    }

    // Update status to closed
    survey.status = 'closed';
    await survey.save();

    return this.getSurveyById(surveyId, user);
  }

  /**
   * Update survey status (flexible status change with validation)
   */
  async updateSurveyStatus(surveyId, newStatus, user) {
    const survey = await Survey.findByPk(surveyId);

    if (!survey) {
      throw new Error('Survey not found');
    }

    // Check ownership
    if (user.role !== 'admin' && survey.created_by !== user.id) {
      throw new Error('Access denied. You do not own this survey.');
    }

    const validStatuses = ['draft', 'active', 'closed', 'analyzed'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Valid statuses: ${validStatuses.join(', ')}`);
    }

    // Validate status transitions
    const currentStatus = survey.status;

    // Define valid transitions
    const validTransitions = {
      draft: ['active'],
      active: ['closed'],
      closed: ['analyzed'],
      analyzed: [] // Final state
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}. Valid next states: ${validTransitions[currentStatus].join(', ') || 'none (final state)'}`);
    }

    // Update status
    survey.status = newStatus;
    await survey.save();

    return this.getSurveyById(surveyId, user);
  }

  /**
   * Auto-close expired surveys (for cron job)
   */
  async autoCloseExpiredSurveys() {
    const now = new Date();
    
    // Find all active surveys past their end_date
    const expiredSurveys = await Survey.findAll({
      where: {
        status: 'active',
        end_date: { [Op.lt]: now }
      }
    });

    // Close each expired survey
    const results = [];
    for (const survey of expiredSurveys) {
      survey.status = 'closed';
      await survey.save();
      results.push({
        survey_id: survey.id,
        title: survey.title,
        closed_at: new Date()
      });
    }

    return {
      closed_count: results.length,
      surveys: results
    };
  }
}

module.exports = new SurveyService();
