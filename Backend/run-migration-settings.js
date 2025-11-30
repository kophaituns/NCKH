// run-migration-settings.js
// Script to run the settings migration

// Set environment variables first
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3307';
process.env.DB_USER = 'llm_survey_user';
process.env.DB_PASSWORD = 'password123';
process.env.DB_NAME = 'llm_survey_db';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runSettingsMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('🔄 Running settings migration...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '022_create_settings_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await connection.execute(statement);
      }
    }

    console.log('✅ Settings migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️ Tables already exist - this is normal');
    }
  } finally {
    await connection.end();
  }
}

// Run the migration
runSettingsMigration().catch(console.error);