// Script to repair mojibake in users.full_name ONLY
// Purpose: Fix UTF-8 encoding issues for user names
// CAUTION: This modifies data - verify results carefully!

// Set environment variables for database connection
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3307';
process.env.DB_NAME = 'llm_survey_db';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'rootpassword';

const sequelize = require('../src/config/database');

async function repairUserNames() {
  try {
    console.log('⚠️  WARNING: This script will repair mojibake in users.full_name!');
    console.log('⚠️  Make sure you have a database backup before proceeding!\n');
    
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully\n');

    // STEP 1: Show current corrupted names
    console.log('STEP 1: Current corrupted names in users table:\n');
    const [corruptedUsers] = await sequelize.query(`
      SELECT id, username, full_name
      FROM users
      WHERE full_name LIKE '%á%'
         OR full_name LIKE '%â%'
         OR full_name LIKE '%Ã%'
         OR full_name LIKE '%»%'
         OR full_name LIKE '%º%'
      ORDER BY id;
    `);
    
    if (corruptedUsers.length === 0) {
      console.log('✅ No corrupted names found!\n');
      return;
    }
    
    console.log('Found corrupted names:');
    corruptedUsers.forEach(user => {
      console.log(`  ID ${user.id}: ${user.username} = "${user.full_name}"`);
    });
    console.log('');

    // STEP 2: Repair the data
    console.log('STEP 2: Repairing mojibake using CONVERT technique...\n');
    
    const [updateResult] = await sequelize.query(`
      UPDATE users
      SET full_name = CONVERT(
        CAST(CONVERT(full_name USING latin1) AS BINARY)
        USING utf8mb4
      )
      WHERE full_name LIKE '%á%'
         OR full_name LIKE '%â%'
         OR full_name LIKE '%Ã%'
         OR full_name LIKE '%»%'
         OR full_name LIKE '%º%';
    `);
    
    console.log(`✅ Updated ${updateResult.affectedRows} rows\n`);

    // STEP 3: Verify repair
    console.log('STEP 3: Verifying repair - showing updated names:\n');
    const [repairedUsers] = await sequelize.query(`
      SELECT id, username, full_name
      FROM users
      WHERE id IN (${corruptedUsers.map(u => u.id).join(',')})
      ORDER BY id;
    `);
    
    console.log('Repaired names:');
    repairedUsers.forEach(user => {
      console.log(`  ID ${user.id}: ${user.username} = "${user.full_name}"`);
    });
    console.log('');

    // STEP 4: Check for remaining mojibake
    const [remainingCorrupted] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE full_name LIKE '%á%'
         OR full_name LIKE '%â%'
         OR full_name LIKE '%Ã%'
         OR full_name LIKE '%»%'
         OR full_name LIKE '%º%';
    `);
    
    if (remainingCorrupted[0].count > 0) {
      console.log(`⚠️  Warning: ${remainingCorrupted[0].count} names still show mojibake patterns`);
      console.log('   This might be normal if names actually contain these characters.\n');
    } else {
      console.log('✅ No remaining mojibake patterns detected!\n');
    }

    console.log('✅ Repair completed successfully!');
    console.log('   Please verify names look correct in the application.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

repairUserNames();
