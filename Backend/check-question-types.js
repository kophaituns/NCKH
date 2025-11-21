// Check question_types table
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

async function checkQuestionTypes() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if question_types table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'question_types'");
    
    if (tables.length > 0) {
      console.log('📋 Question Types table exists');
      
      // Get question types data
      const [types] = await sequelize.query("SELECT * FROM question_types");
      console.log('🔍 Available question types:');
      console.table(types);
    } else {
      console.log('❌ Question Types table does NOT exist');
      console.log('🔧 Creating question_types table...');
      
      await sequelize.query(`
        CREATE TABLE question_types (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type_name VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default question types
      await sequelize.query(`
        INSERT INTO question_types (type_name, description) VALUES
        ('text', 'Text input question'),
        ('multiple_choice', 'Multiple choice question'),
        ('yes_no', 'Yes/No question'),
        ('rating', 'Rating scale question'),
        ('date', 'Date picker question'),
        ('email', 'Email input question')
      `);
      
      console.log('✅ Question types table created and populated');
      
      // Show the created data
      const [newTypes] = await sequelize.query("SELECT * FROM question_types");
      console.table(newTypes);
    }

    console.log('🎉 Check completed!');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkQuestionTypes();