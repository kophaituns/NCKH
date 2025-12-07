import http from '../http';

const AnalyticsService = {
    getQualityScore: (surveyId) => {
        return http.get(`/modules/analytics/survey/${surveyId}/quality`);
    },

    getDropOffAnalysis: (surveyId) => {
        return http.get(`/modules/analytics/survey/${surveyId}/drop-off`);
    },

    getCrossTabAnalysis: (surveyId, breakdownQuestionId, targetQuestionId) => {
        return http.post(`/modules/analytics/survey/${surveyId}/cross-tab`, {
            breakdownQuestionId,
            targetQuestionId
        });
    },

    getAdminDashboard: () => {
        return http.get('/modules/analytics/admin/dashboard');
    },

    // list active surveys
    getActiveSurveys: () => {
        return http.get('/modules/analytics/active-surveys');
    },

    // top answers for a survey
    getSurveyTopAnswers: (surveyId) => {
        return http.get(`/modules/analytics/survey/${surveyId}/top-answers`);
    }
};

export default AnalyticsService;
