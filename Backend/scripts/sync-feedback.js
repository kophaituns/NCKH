// d:\NCKH\Backend\scripts\sync-feedback.js
require('dotenv').config();
const { sequelize, SurveyFeedback } = require('../src/models');

async function sync() {
    try {
        console.log('Attempting to sync SurveyFeedback model...');
        await SurveyFeedback.sync({ alter: true });
        console.log('Success: survey_feedbacks table is now synchronized.');
        process.exit(0);
    } catch (err) {
        console.error('Error syncing SurveyFeedback:', err);
        process.exit(1);
    }
}

sync();
