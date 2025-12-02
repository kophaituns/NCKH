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


};

export default AnalyticsService;
