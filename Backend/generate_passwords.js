const bcrypt = require('bcrypt');

async function generatePasswordHashes() {
    const passwords = {
        admin: 'admin123',
        teacher: 'teacher123', 
        student: 'student123'
    };

    console.log('=== GENERATED PASSWORD HASHES ===\n');
    
    for (const [role, password] of Object.entries(passwords)) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        console.log(`${role.toUpperCase()}:`);
        console.log(`Password: ${password}`);
        console.log(`Hash: ${hash}`);
        console.log('---');
    }

    // Test verification
    console.log('\n=== TESTING VERIFICATION ===\n');
    const testPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testPassword, salt);
    const isValid = await bcrypt.compare(testPassword, hash);
    console.log(`Test password: ${testPassword}`);
    console.log(`Generated hash: ${hash}`);
    console.log(`Verification result: ${isValid}`);
}

generatePasswordHashes().catch(console.error);