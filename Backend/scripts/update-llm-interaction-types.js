// Script to update llm_interactions table ENUM values
const { Sequelize } = require('sequelize');

// Use the same database configuration as the Docker setup
const sequelize = new Sequelize(
  'llm_survey_db',
  'llm_survey_user', 
  'password123', // password from docker-compose.yml
  {
    host: 'localhost',
    port: 3307, // mapped port from docker-compose.yml
    dialect: 'mysql',
    logging: console.log
  }
);

async function updateLlmInteractionTypes() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Update the ENUM type
    const updateQuery = `
      ALTER TABLE llm_interactions 
      MODIFY COLUMN interaction_type ENUM(
        'survey_generation', 
        'analysis', 
        'summary', 
        'recommendation', 
        'question_generation', 
        'category_prediction'
      ) NOT NULL;
    `;

    console.log('Updating interaction_type ENUM...');
    await sequelize.query(updateQuery);
    console.log('✅ Successfully updated interaction_type ENUM values');

    // Add comment to track this change
    const commentQuery = `
      ALTER TABLE llm_interactions 
      COMMENT = 'Updated interaction_type ENUM to support Hugging Face API functions';
    `;

    await sequelize.query(commentQuery);
    console.log('✅ Added migration comment');

  } catch (error) {
    console.error('❌ Error updating database:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the migration
updateLlmInteractionTypes()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });