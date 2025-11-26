// Check questions table structure
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

async function checkQuestionsTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Describe questions table structure
    const [results] = await sequelize.query("DESCRIBE questions");
    console.log('📋 Questions table structure:');
    console.table(results);

    console.log('🎉 Check completed!');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkQuestionsTable();