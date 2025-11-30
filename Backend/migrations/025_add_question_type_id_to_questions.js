require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
    console.log('Attempting to connect to database...');

    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'allmtags_survey_db'
    };

    if (process.env.DB_PORT) {
        config.port = parseInt(process.env.DB_PORT);
    }

    console.log('Config:', { ...config, password: '****' });

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to database!');

        console.log('Running migration: Add question_type_id to questions table...');

        // Check if column exists
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'question_type_id'
        `, [config.database]);

        if (columns.length > 0) {
            console.log('Column question_type_id already exists. Skipping.');
        } else {
            await connection.execute(`
                ALTER TABLE questions 
                ADD COLUMN question_type_id INT NULL
            `);
            console.log('✅ Column question_type_id added successfully!');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();
