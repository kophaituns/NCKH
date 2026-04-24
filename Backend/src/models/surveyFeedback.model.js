// d:\NCKH\Backend\src\models\surveyFeedback.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SurveyFeedback = sequelize.define('SurveyFeedback', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        survey_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'surveys',
                key: 'id'
            }
        },
        response_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'survey_responses',
                key: 'id'
            },
            comment: 'Reference to the survey response if provided'
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            },
            comment: 'Star rating from 1 to 5'
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Optional text feedback'
        },
        source: {
            type: DataTypes.ENUM('respondent', 'internal'),
            defaultValue: 'respondent'
        },
        is_processed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'survey_feedbacks',
        timestamps: true,
        underscored: true
    });

    return SurveyFeedback;
};
