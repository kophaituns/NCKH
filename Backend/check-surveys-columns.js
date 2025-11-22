const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'root',
      password: 'password123',
      database: 'llm_survey_db'
    });
    
    const [rows] = await conn.execute('DESCRIBE surveys');
    console.log('\n=== SURVEYS TABLE STRUCTURE ===\n');
    
    let hasDeletedAt = false;
    let hasDeletedBy = false;
    
    rows.forEach(row => {
      const fullType = row.Collation ? `${row.Type} COLLATE ${row.Collation}` : row.Type;
      console.log(`${row.Field.padEnd(30)} ${fullType.padEnd(40)} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      
      if (row.Field === 'deleted_at') hasDeletedAt = true;
      if (row.Field === 'deleted_by') hasDeletedBy = true;
    });
    
    console.log('\n=== STATUS ===');
    console.log(`✅ deleted_at column: ${hasDeletedAt ? 'EXISTS ✓' : 'MISSING ✗'}`);
    console.log(`✅ deleted_by column: ${hasDeletedBy ? 'EXISTS ✓' : 'MISSING ✗'}`);
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
