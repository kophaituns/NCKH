// Create survey responses tables
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

async function createResponseTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Create survey_responses table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS survey_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        survey_id INT NOT NULL,
        respondent_name VARCHAR(255),
        respondent_email VARCHAR(255),
        session_token VARCHAR(255),
        is_completed BOOLEAN DEFAULT false,
        submitted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created survey_responses table');

    // Create response_answers table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS response_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        response_id INT NOT NULL,
        question_id INT NOT NULL,
        answer_text TEXT,
        selected_option_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (response_id) REFERENCES survey_responses(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Created response_answers table');

    console.log('🎉 Response tables created successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

createResponseTables();