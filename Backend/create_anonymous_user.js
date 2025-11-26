const mysql = require('mysql2/promise');

async function createAnonymousUser() {
    try {
        console.log('Connecting to database at localhost:3307...');
        
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3307,
            user: 'llm_survey_user',
            password: 'password123',
            database: 'llm_survey_db'
        });

        console.log('Connected to database successfully!');

        // Check if anonymous user already exists
        const [existing] = await connection.execute(
            'SELECT * FROM users WHERE id = 1'
        );

        if (existing.length > 0) {
            console.log('Anonymous user already exists:', existing[0]);
        } else {
            // Create anonymous user
            const [result] = await connection.execute(
                `INSERT INTO users (id, name, email, role) VALUES (1, 'Anonymous', 'anonymous@system.local', 'user')`
            );
            console.log('Anonymous user created successfully:', result);
        }

        await connection.end();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createAnonymousUser();