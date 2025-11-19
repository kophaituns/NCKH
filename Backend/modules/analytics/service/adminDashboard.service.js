// Backend/modules/analytics/services/adminDashboard.service.js
const { sequelize, User, Survey, SurveyResponse } = require('../../../src/models');
const { fn, col, literal } = require('sequelize');

async function getAdminDashboard() {
  // chạy song song 
  const [
    totalUsers,
    totalSurveys,
    totalResponses,
    activeSurveys,
    roleRows,
    responsesRows,
    activityRows,
  ] = await Promise.all([
    User.count(),
    Survey.count(),
    SurveyResponse.count(),
    // status 'active' tùy bạn đặt trong Survey
    Survey.count({ where: { status: 'active' } }),
    User.findAll({
      attributes: ['role', [fn('COUNT', col('id')), 'count']],
      group: ['role'],
    }),
    Survey.findAll({
      attributes: [
        'id',
        'title',
        [fn('COUNT', col('SurveyResponses.id')), 'responseCount'],
      ],
      include: [
        {
          model: SurveyResponse,
          attributes: [],
        },
      ],
      group: ['Survey.id'],
      order: [[literal('responseCount'), 'DESC']],
      limit: 10,
      subQuery: false,
    }),
    SurveyResponse.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', '*'), 'count'],
      ],
      group: [literal('DATE(`createdAt`)')],
      order: [[literal('date'), 'ASC']],
      limit: 30,
    }),
  ]);

  // map role -> admin / creator / user
  const roleStats = { admin: 0, creator: 0, user: 0 };
  roleRows.forEach((row) => {
    const role = row.role;
    const count = Number(row.get('count')) || 0;
    if (roleStats[role] !== undefined) {
      roleStats[role] = count;
    }
  });

  const responsesPerSurvey = {
    labels: responsesRows.map(
      (s, idx) => s.title || s.name || `Survey ${idx + 1}`
    ),
    data: responsesRows.map((s) => Number(s.get('responseCount')) || 0),
  };

  const surveyActivity = {
    labels: activityRows.map((r) => r.get('date')),
    data: activityRows.map((r) => Number(r.get('count')) || 0),
  };

  return {
    totals: {
      totalUsers,
      totalSurveys,
      totalResponses,
      activeSurveys,
    },
    roleStats,
    responsesPerSurvey,
    surveyActivity,
  };
}

module.exports = {
  getAdminDashboard,
};
