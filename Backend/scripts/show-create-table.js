const mysql = require('mysql2/promise');
require('dotenv').config();

async function showCreateTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'llm_survey_db'
    });

    console.log(`Connected to ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`);

    const [result] = await connection.execute('SHOW CREATE TABLE questions');
    console.log('CREATE TABLE statement:');
    console.log(result[0]['Create Table']);

    await connection.end();
}

showCreateTable().catch(console.error);
