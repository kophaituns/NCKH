// src/modules/analytics/controller/landing.controller.js
const { Survey, Question, SurveyTemplate } = require('../../../models');
const logger = require('../../../utils/logger');

class LandingController {
    async getLandingData(req, res) {
        try {
            // 1. Get stats
            const totalSurveys = await Survey.count();
            const aiQuestions = await Question.count({
                where: { is_ai_generated: true }
            });

            // 2. Get featured templates (limit to 4)
            const templates = await SurveyTemplate.findAll({
                limit: 4,
                order: [['created_at', 'DESC']],
                attributes: ['id', 'title', 'description']
            });

            res.status(200).json({
                success: true,
                data: {
                    stats: {
                        totalSurveys,
                        aiQuestions
                    },
                    featuredTemplates: templates
                }
            });
        } catch (error) {
            logger.error('Error fetching landing data:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new LandingController();
