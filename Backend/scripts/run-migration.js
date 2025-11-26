#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration(migrationFile) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'survey_system',
    multipleStatements: true
  });

  try {
    console.log(`🔄 Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove comments and split by semicolons
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n')
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log('✅ Statement executed successfully');
      }
    }
    
    console.log(`✅ Migration ${migrationFile} completed successfully!`);
    
  } catch (error) {
    console.error(`❌ Migration failed:`, error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Usage: node run-migration.js <migration-file>');
  console.log('📝 Example: node run-migration.js 009_create_generated_questions.sql');
  process.exit(1);
}

runMigration(migrationFile)
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });