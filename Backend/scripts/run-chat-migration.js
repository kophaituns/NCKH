<<<<<<< HEAD
// scripts/run-chat-migration.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/database');

const runMigration = async () => {
  try {
    console.log('Running chat migration...');
    
    // Read and execute migration SQL
    const migrationPath = path.join(__dirname, '../migrations/008_create_chat_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        await sequelize.query(statement);
      }
    }
    
    console.log('✅ Chat migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
=======
// Quick script to run chat migration
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runChatMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'llm_survey_db'
    });

    try {
        console.log('🔗 Connected to database...');
        
        // Create chat_conversations table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS chat_conversations (
                id int NOT NULL AUTO_INCREMENT,
                user_id int NOT NULL,
                title varchar(255) NOT NULL DEFAULT 'New Chat',
                status enum('active','archived','deleted') NOT NULL DEFAULT 'active',
                last_message_at timestamp NULL,
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_chat_conversations_user_id (user_id),
                INDEX idx_chat_conversations_status (status),
                INDEX idx_chat_conversations_created_at (created_at),
                CONSTRAINT fk_chat_conversations_user_id 
                    FOREIGN KEY (user_id) REFERENCES users (id) 
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Created chat_conversations table');
        
        // Create chat_messages table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id int NOT NULL AUTO_INCREMENT,
                conversation_id int NOT NULL,
                sender_type enum('user','ai') NOT NULL,
                message text NOT NULL,
                api_provider enum('super_dev','gemini') NULL,
                response_time int NULL,
                tokens_used int NULL,
                status enum('sent','delivered','error') NOT NULL DEFAULT 'sent',
                error_message text NULL,
                metadata json NULL,
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                INDEX idx_chat_messages_conversation_id (conversation_id),
                INDEX idx_chat_messages_sender_type (sender_type),
                INDEX idx_chat_messages_created_at (created_at),
                INDEX idx_chat_messages_api_provider (api_provider),
                CONSTRAINT fk_chat_messages_conversation_id 
                    FOREIGN KEY (conversation_id) REFERENCES chat_conversations (id) 
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Created chat_messages table');
        
        // Check if tables were created
        const [tables] = await connection.execute("SHOW TABLES LIKE 'chat_%'");
        console.log('📊 Chat tables found:', tables.map(row => Object.values(row)[0]));
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

runChatMigration();
>>>>>>> linh2
