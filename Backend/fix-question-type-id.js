// Fix question_type_id constraint
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

async function fixQuestionTypeId() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Make question_type_id nullable OR add default value
    console.log('🔧 Making question_type_id nullable...');
    await sequelize.query('ALTER TABLE questions MODIFY question_type_id INT NULL');
    
    console.log('✅ Fixed question_type_id constraint');
    
    // Verify the change
    const [results] = await sequelize.query("DESCRIBE questions");
    const questionTypeIdField = results.find(r => r.Field === 'question_type_id');
    console.log('📋 question_type_id field info:', questionTypeIdField);

    console.log('🎉 Fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixQuestionTypeId();