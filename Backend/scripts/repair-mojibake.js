// Script to repair existing mojibake data in database
// CAUTION: This attempts to fix double-encoded UTF-8 data
// Only run this if you have confirmed mojibake exists (e.g., "Pháº¡m Thá»¥c Anh")
// Backup your database before running!

process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3307';
process.env.DB_NAME = 'llm_survey_db';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'rootpassword';

const sequelize = require('../src/config/database');

async function repairMojibake() {
  try {
    console.log('⚠️  WARNING: This script will attempt to repair mojibake data!');
    console.log('⚠️  Make sure you have a database backup before proceeding!\n');
    
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully\n');

    // Define tables and columns to repair
    const repairTargets = [
      { table: 'users', columns: ['username', 'full_name', 'email'] },
      { table: 'survey_templates', columns: ['title', 'description'] },
      { table: 'surveys', columns: ['title', 'description', 'target_value'] },
      { table: 'questions', columns: ['question_text'] },
      { table: 'question_options', columns: ['option_text'] },
      { table: 'answers', columns: ['text_answer'] }
    ];

    console.log('Scanning for mojibake patterns...\n');

    for (const target of repairTargets) {
      console.log(`Checking ${target.table}...`);
      
      for (const column of target.columns) {
        try {
          // Check if column has mojibake patterns
          const [rows] = await sequelize.query(`
            SELECT id, ${column}
            FROM ${target.table}
            WHERE ${column} IS NOT NULL
              AND (${column} LIKE '%Ã%' 
                   OR ${column} LIKE '%á%' 
                   OR ${column} LIKE '%â%'
                   OR ${column} LIKE '%Ã%')
            LIMIT 5;
          `);

          if (rows.length > 0) {
            console.log(`  ⚠️  Found ${rows.length} rows with potential mojibake in ${column}:`);
            rows.forEach(row => {
              console.log(`    ID ${row.id}: "${row[column]}"`);
            });

            // Count total affected rows
            const [countResult] = await sequelize.query(`
              SELECT COUNT(*) as count
              FROM ${target.table}
              WHERE ${column} IS NOT NULL
                AND (${column} LIKE '%Ã%' 
                     OR ${column} LIKE '%á%' 
                     OR ${column} LIKE '%â%'
                     OR ${column} LIKE '%Ã%');
            `);

            const totalCount = countResult[0].count;
            console.log(`    Total affected: ${totalCount} rows\n`);

            // Uncomment the following lines to actually repair the data:
            /*
            console.log(`  🔧 Repairing ${target.table}.${column}...`);
            await sequelize.query(`
              UPDATE ${target.table}
              SET ${column} = CONVERT(CAST(CONVERT(${column} USING latin1) AS BINARY) USING utf8mb4)
              WHERE ${column} IS NOT NULL
                AND (${column} LIKE '%Ã%' 
                     OR ${column} LIKE '%á%' 
                     OR ${column} LIKE '%â%'
                     OR ${column} LIKE '%Ã%');
            `);
            console.log(`  ✅ Repaired ${totalCount} rows in ${column}\n`);
            */
          } else {
            console.log(`  ✅ ${column} - No mojibake detected`);
          }
        } catch (error) {
          console.error(`  ❌ Error checking ${column}: ${error.message}`);
        }
      }
      console.log('');
    }

    console.log('\n📋 Scan complete!');
    console.log('To actually repair the data, uncomment the UPDATE section in the script.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

repairMojibake();
