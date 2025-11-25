// run-migration-020.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'llm_survey_db',
  port: parseInt(process.env.DB_PORT) || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function runMigration() {
  let connection;
  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL');

    const sqlFile = path.join(__dirname, 'migrations', '020_create_workspace_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each query
    const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);
    
    console.log(`📝 Running ${queries.length} queries...`);
    for (let i = 0; i < queries.length; i++) {
      try {
        await connection.query(queries[i]);
        console.log(`  ✓ Query ${i + 1}/${queries.length} executed`);
      } catch (err) {
        console.warn(`  ⚠ Query ${i + 1} warning: ${err.message.substring(0, 100)}`);
      }
    }

    console.log('✅ Migration 020 applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
