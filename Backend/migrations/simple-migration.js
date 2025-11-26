// Simplified migration runner
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

async function runSimpleMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // 1. Create survey_links table
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS survey_links (
          id INT AUTO_INCREMENT PRIMARY KEY,
          survey_id INT NOT NULL,
          token VARCHAR(64) NOT NULL UNIQUE,
          expires_at DATETIME,
          is_active BOOLEAN DEFAULT TRUE,
          created_by INT NOT NULL,
          access_count INT DEFAULT 0,
          max_responses INT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_token (token),
          INDEX idx_survey_id (survey_id),
          INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB
      `);
      console.log('✅ survey_links table created/verified');
    } catch (error) {
      console.log('⚠️ survey_links table already exists or error:', error.original?.code);
    }

    // 2. Add share_settings to surveys
    try {
      await sequelize.query('ALTER TABLE surveys ADD COLUMN share_settings TEXT AFTER status');
      console.log('✅ Added share_settings column');
    } catch (error) {
      console.log('⚠️ share_settings column might already exist');
    }

    // 3. Add survey_id to questions
    try {
      await sequelize.query('ALTER TABLE questions ADD COLUMN survey_id INT AFTER template_id');
      console.log('✅ Added survey_id column');
    } catch (error) {
      console.log('⚠️ survey_id column might already exist');
    }

    // 4. Add question_type to questions
    try {
      await sequelize.query(`ALTER TABLE questions ADD COLUMN question_type ENUM('text', 'multiple_choice', 'yes_no', 'rating', 'date', 'email') DEFAULT 'text' AFTER question_text`);
      console.log('✅ Added question_type column');
    } catch (error) {
      console.log('⚠️ question_type column might already exist');
    }

    // 5. Add is_required to questions
    try {
      await sequelize.query('ALTER TABLE questions ADD COLUMN is_required BOOLEAN DEFAULT FALSE AFTER required');
      console.log('✅ Added is_required column');
    } catch (error) {
      console.log('⚠️ is_required column might already exist');
    }

    // 6. Add question_order to questions
    try {
      await sequelize.query('ALTER TABLE questions ADD COLUMN question_order INT DEFAULT 0 AFTER display_order');
      console.log('✅ Added question_order column');
    } catch (error) {
      console.log('⚠️ question_order column might already exist');
    }

    // 7. Add description to questions
    try {
      await sequelize.query('ALTER TABLE questions ADD COLUMN description TEXT AFTER question_order');
      console.log('✅ Added description column');
    } catch (error) {
      console.log('⚠️ description column might already exist');
    }

    // 8. Make template_id nullable
    try {
      await sequelize.query('ALTER TABLE questions MODIFY template_id INT NULL');
      console.log('✅ Made template_id nullable');
    } catch (error) {
      console.log('⚠️ template_id already nullable or error:', error.message);
    }

    console.log('🎉 All migrations completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runSimpleMigrations();