// Run database migrations for survey links
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Use the same database configuration
const sequelize = new Sequelize(
  'llm_survey_db',
  'llm_survey_user', 
  'password123',
  {
    host: 'localhost',
    port: 3307,
    dialect: 'mysql',
    logging: console.log
  }
);

async function runMigrations() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Read and execute migration file
    const migrationPath = path.join(__dirname, 'create-survey-links-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await sequelize.query(statement);
        console.log('✅ Statement executed successfully');
      } catch (error) {
        if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️ Column already exists, skipping...');
        } else if (error.original && error.original.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⚠️ Table already exists, skipping...');
        } else {
          console.error('❌ Error executing statement:', error.message);
        }
      }
    }

    console.log('🎉 All migrations completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the migration
runMigrations()
  .then(() => {
    console.log('✅ Migration process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  });