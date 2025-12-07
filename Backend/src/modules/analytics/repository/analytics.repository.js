// src/modules/analytics/repository/analytics.repository.js
const sequelize = require('../../../config/database');
const logger = require('../../../utils/logger');

/**
 * Get survey with responses for analytics
 */
const getSurveyWithResponses = async (surveyId) => {
  try {
    // Get survey details
    const surveyQuery = `
      SELECT s.*, 
             COUNT(DISTINCT sr.id) as total_responses,
             COUNT(DISTINCT CASE WHEN sr.status = 'completed' THEN sr.id END) as completed_responses
      FROM surveys s
      LEFT JOIN survey_responses sr ON s.id = sr.survey_id
      WHERE s.id = ?
      GROUP BY s.id
    `;
    
    const [surveyRows] = await sequelize.query(surveyQuery, {
      replacements: [surveyId]
    });
    
    if (surveyRows.length === 0) {
      return null;
    }
    
    const survey = surveyRows[0];
    
    // Get survey questions
    const questionsQuery = `
      SELECT id, question_text, question_type, order_index
      FROM questions
      WHERE survey_id = ?
      ORDER BY order_index
    `;
    
    const [questions] = await sequelize.query(questionsQuery, {
      replacements: [surveyId]
    });
    
    // Get survey responses
    const responsesQuery = `
      SELECT id, respondent_id, status, time_spent, created_at, updated_at
      FROM survey_responses
      WHERE survey_id = ?
    `;
    
    const [responses] = await sequelize.query(responsesQuery, {
      replacements: [surveyId]
    });
    
    return {
      ...survey,
      questions,
      responses
    };
  } catch (error) {
    logger.error('Error getting survey with responses:', error);
    throw error;
  }
};

/**
 * Get cross-tabulation data
 */
const getCrossTabData = async (surveyId, breakdownQuestionId, targetQuestionId) => {
  try {
    // Get breakdown question details
    const breakdownQuery = `
      SELECT q.id, q.question_text, q.question_type,
             qo.id as option_id, qo.option_text
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.id = ? AND q.survey_id = ?
      ORDER BY qo.order_index
    `;
    
    const [breakdownRows] = await db.execute(breakdownQuery, [breakdownQuestionId, surveyId]);
    
    // Get target question details
    const targetQuery = `
      SELECT q.id, q.question_text, q.question_type,
             qo.id as option_id, qo.option_text
      FROM questions q
      LEFT JOIN question_options qo ON q.id = qo.question_id
      WHERE q.id = ? AND q.survey_id = ?
      ORDER BY qo.order_index
    `;
    
    const [targetRows] = await db.execute(targetQuery, [targetQuestionId, surveyId]);
    
    if (breakdownRows.length === 0 || targetRows.length === 0) {
      throw new Error('One or both questions not found');
    }
    
    // Get cross-tabulation results
    const crossTabQuery = `
      SELECT 
        ba.selected_option_id as breakdown_option_id,
        ta.selected_option_id as target_option_id,
        COUNT(*) as count
      FROM survey_responses sr
      JOIN response_answers ba ON sr.id = ba.response_id
      JOIN response_answers ta ON sr.id = ta.response_id
      WHERE sr.survey_id = ?
        AND ba.question_id = ?
        AND ta.question_id = ?
        AND sr.status = 'completed'
      GROUP BY ba.selected_option_id, ta.selected_option_id
    `;
    
    const [crossTabResults] = await db.execute(crossTabQuery, [surveyId, breakdownQuestionId, targetQuestionId]);
    
    // Get total responses for percentage calculations
    const totalQuery = `
      SELECT COUNT(DISTINCT sr.id) as total
      FROM survey_responses sr
      WHERE sr.survey_id = ? AND sr.status = 'completed'
    `;
    
    const [totalRows] = await db.execute(totalQuery, [surveyId]);
    
    return {
      breakdownQuestion: {
        id: breakdownRows[0].id,
        text: breakdownRows[0].question_text,
        type: breakdownRows[0].question_type,
        options: breakdownRows.filter(row => row.option_id).map(row => ({
          id: row.option_id,
          text: row.option_text
        }))
      },
      targetQuestion: {
        id: targetRows[0].id,
        text: targetRows[0].question_text,
        type: targetRows[0].question_type,
        options: targetRows.filter(row => row.option_id).map(row => ({
          id: row.option_id,
          text: row.option_text
        }))
      },
      results: crossTabResults,
      totalResponses: totalRows[0].total
    };
  } catch (error) {
    logger.error('Error getting cross-tabulation data:', error);
    throw error;
  }
};

/**
 * Get total number of users
 */
const getTotalUsers = async () => {
  try {
    const query = 'SELECT COUNT(*) as total FROM users';
    const [rows] = await sequelize.query(query);
    return rows[0].total;
  } catch (error) {
    logger.error('Error getting total users:', error);
    throw error;
  }
};

/**
 * Get total number of surveys
 */
const getTotalSurveys = async () => {
  try {
    const query = 'SELECT COUNT(*) as total FROM surveys';
    const [rows] = await sequelize.query(query);
    return rows[0].total;
  } catch (error) {
    logger.error('Error getting total surveys:', error);
    throw error;
  }
};

/**
 * Get total number of survey responses
 */
const getTotalResponses = async () => {
  try {
    const query = 'SELECT COUNT(*) as total FROM survey_responses';
    const [rows] = await sequelize.query(query);
    return rows[0].total;
  } catch (error) {
    logger.error('Error getting total responses:', error);
    throw error;
  }
};

/**
 * Get number of active surveys
 */
const getActiveSurveys = async () => {
  try {
    const query = 'SELECT COUNT(*) as total FROM surveys WHERE status = "active"';
    const [rows] = await sequelize.query(query);
    return rows[0].total;
  } catch (error) {
    logger.error('Error getting active surveys:', error);
    throw error;
  }
};

/**
 * Get user role statistics
 */
const getUserRoleStats = async () => {
  try {
    const query = `
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `;
    const [rows] = await sequelize.query(query);
    
    const roleStats = { admin: 0, creator: 0, user: 0 };
    rows.forEach(row => {
      roleStats[row.role] = row.count;
    });
    
    return roleStats;
  } catch (error) {
    logger.error('Error getting user role stats:', error);
    throw error;
  }
};

/**
 * Get responses per survey data
 */
const getResponsesPerSurvey = async () => {
  try {
    const query = `
      SELECT s.title, COUNT(sr.id) as response_count
      FROM surveys s
      LEFT JOIN survey_responses sr ON s.id = sr.survey_id
      GROUP BY s.id, s.title
      ORDER BY response_count DESC
      LIMIT 10
    `;
    const [rows] = await sequelize.query(query);
    
    return {
      labels: rows.map(row => row.title),
      data: rows.map(row => row.response_count)
    };
  } catch (error) {
    logger.error('Error getting responses per survey:', error);
    throw error;
  }
};

/**
 * Get survey activity trend data
 */
const getSurveyActivityTrend = async () => {
  try {
    const query = `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM surveys
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const [rows] = await sequelize.query(query);
    
    return {
      labels: rows.map(row => row.date),
      data: rows.map(row => row.count)
    };
  } catch (error) {
    logger.error('Error getting survey activity trend:', error);
    throw error;
  }
  
};

/**
 * Get detailed list of active surveys for analytics page
 * - If userId + role provided and role !== 'admin' -> only surveys created by that user
 * - Otherwise -> all active surveys
 */
const getActiveSurveyList = async (userId = null, role = null) => {
  try {
    let query = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.start_date,
        s.end_date,
        s.status,
        s.created_by,
        COUNT(DISTINCT sr.id) AS total_responses,
        COUNT(DISTINCT CASE WHEN sr.status = 'completed' THEN sr.id END) AS completed_responses
      FROM surveys s
      LEFT JOIN survey_responses sr ON s.id = sr.survey_id
      WHERE s.status = 'active'
        AND s.deleted_at IS NULL
    `;

    const replacements = [];

    // Only filter by creator for non-admin users AND when userId is available
    if (userId && role && role !== 'admin') {
      query += ' AND s.created_by = ?';
      replacements.push(userId);
    }

    query += `
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;

    const [rows] = await sequelize.query(query, { replacements });
    return rows;
  } catch (error) {
    logger.error('Error getting active survey list:', error);
    throw error;
  }
};

/**
 * Get top choice options for each question in a survey
 * (multiple choice / checkbox / likert_scale / dropdown)
 */
const getTopChoiceAnswersForSurvey = async (surveyId) => {
  try {
    const query = `
      SELECT
        q.id AS question_id,
        q.question_text,
        qt.type_name AS question_type,
        qo.id AS option_id,
        qo.option_text,
        COUNT(a.id) AS answer_count
      FROM survey_responses sr
      JOIN answers a
        ON a.survey_response_id = sr.id
      JOIN questions q
        ON q.id = a.question_id
      JOIN question_types qt
        ON qt.id = q.question_type_id
      LEFT JOIN question_options qo
        ON qo.id = a.option_id
      WHERE
        sr.survey_id = ?
        AND sr.status = 'completed'
        AND qt.type_name IN ('multiple_choice', 'checkbox', 'likert_scale', 'dropdown')
      GROUP BY
        q.id,
        q.question_text,
        qt.type_name,
        qo.id,
        qo.option_text
      ORDER BY
        q.display_order ASC,
        answer_count DESC
    `;

    const [rows] = await sequelize.query(query, {
      replacements: [surveyId],
    });

    return rows;
  } catch (error) {
    logger.error('Error getting top choice answers for survey:', error);
    throw error;
  }
};

/**
 * Get top open-ended answers for each question in a survey
 */
const getTopOpenEndedAnswersForSurvey = async (surveyId) => {
  try {
    const query = `
      SELECT
        q.id AS question_id,
        q.question_text,
        qt.type_name AS question_type,
        TRIM(a.text_answer) AS answer_text,
        COUNT(a.id) AS answer_count
      FROM questions q
      JOIN question_types qt ON q.question_type_id = qt.id
      JOIN answers a ON a.question_id = q.id
      JOIN survey_responses sr ON sr.id = a.survey_response_id
      WHERE q.survey_id = ?
        AND qt.type_name = 'open_ended'
        AND a.text_answer IS NOT NULL
        AND a.text_answer <> ''
        AND sr.status = 'completed'
      GROUP BY
        q.id,
        q.question_text,
        qt.type_name,
        answer_text
      ORDER BY
        q.display_order ASC,
        answer_count DESC
    `;

    const [rows] = await sequelize.query(query, {
      replacements: [surveyId]
    });

    return rows;
  } catch (error) {
    logger.error('Error getting top open-ended answers for survey:', error);
    throw error;
  }
};

module.exports = {
  getSurveyWithResponses,
  getCrossTabData,
  getTotalUsers,
  getTotalSurveys,
  getTotalResponses,
  getActiveSurveys,
  getUserRoleStats,
  getResponsesPerSurvey,
  getSurveyActivityTrend,
  getActiveSurveyList,
  getTopChoiceAnswersForSurvey,
  getTopOpenEndedAnswersForSurvey
};
