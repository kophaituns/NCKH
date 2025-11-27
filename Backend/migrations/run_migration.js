// Run migration to add survey_invitation enum type
require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
    console.log('Attempting to connect to database...');
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Port: ${process.env.DB_PORT || 3307}`);
    console.log(`User: ${process.env.DB_USER || 'llm_survey_user'}`);

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3307,
            user: process.env.DB_USER || 'llm_survey_user',
            password: process.env.DB_PASSWORD || 'Abc@123456',
            database: process.env.DB_NAME || 'llm_survey_db'
        });
        console.log('✅ Connected to database!');

        console.log('Running migration: Add survey_invitation to notification type enum...');

        await connection.execute(`
      ALTER TABLE notifications 
      MODIFY COLUMN type ENUM(
        'workspace_invitation',
        'workspace_member_added', 
        'survey_response',
        'survey_shared',
        'survey_invitation',
        'collector_created',
        'response_completed'
      ) NOT NULL
    `);

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused. Please check if Docker container is running and port 3307 is mapped.');
        }
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
