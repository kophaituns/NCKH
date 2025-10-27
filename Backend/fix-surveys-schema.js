// Fix surveys table schema - Add missing columns
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'NCKH',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'root_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log
  }
);

async function fixSchema() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Connected to MySQL');

    // Check current columns
    console.log('\nChecking current surveys table structure...');
    const [columns] = await sequelize.query('DESCRIBE surveys');
    console.log('Current columns:', columns.map(c => c.Field).join(', '));

    const columnNames = columns.map(c => c.Field);

    // Add missing columns
    const alterations = [];

    if (!columnNames.includes('target_audience')) {
      console.log('\n→ Adding target_audience column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN target_audience ENUM('all_students', 'specific_faculty', 'specific_class') 
        DEFAULT 'all_students' 
        AFTER end_date
      `);
      console.log('✓ Added target_audience');
      alterations.push('target_audience');
    }

    if (!columnNames.includes('target_value')) {
      console.log('\n→ Adding target_value column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN target_value VARCHAR(100) NULL 
        AFTER target_audience
      `);
      console.log('✓ Added target_value');
      alterations.push('target_value');
    }

    if (!columnNames.includes('created_by')) {
      console.log('\n→ Adding created_by column...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD COLUMN created_by INT NOT NULL DEFAULT 1 
        AFTER target_value
      `);
      console.log('✓ Added created_by');
      
      // Add foreign key constraint
      console.log('\n→ Adding foreign key constraint...');
      await sequelize.query(`
        ALTER TABLE surveys 
        ADD CONSTRAINT fk_surveys_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id)
      `);
      console.log('✓ Added foreign key constraint');
      alterations.push('created_by');
    }

    // Verify final structure
    console.log('\n\nVerifying final structure...');
    const [finalColumns] = await sequelize.query('DESCRIBE surveys');
    console.log('\nFinal columns:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? '[' + col.Key + ']' : ''}`);
    });

    if (alterations.length > 0) {
      console.log(`\n✓ Successfully added ${alterations.length} column(s): ${alterations.join(', ')}`);
    } else {
      console.log('\n✓ All columns already exist. Schema is correct.');
    }

    console.log('\n✓ Schema fix completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Error fixing schema:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixSchema();
