// Fix survey template_id nullable
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'llm_survey_db',
  'llm_survey_user', 
  'password123',
  {
    host: 'localhost',
    port: 3307,
    dialect: 'mysql',
    logging: false
  }
);

async function fixSurveyTemplateId() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Make template_id nullable in surveys table
    await sequelize.query('ALTER TABLE surveys MODIFY template_id INT NULL');
    console.log('✅ Made surveys.template_id nullable');

    console.log('🎉 Survey template_id fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixSurveyTemplateId();