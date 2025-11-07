const express = require('express');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const router = express.Router();

// Create test accounts endpoint
router.post('/create-test-accounts', async (req, res) => {
  try {
    // Hash passwords
    const testPassword = 'test123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Test accounts data
    const testAccounts = [
      {
        username: 'admin',
        email: 'admin@test.com',
        password: hashedPassword,
        full_name: 'Admin User',
        role: 'admin'
      },
      {
        username: 'teacher1',
        email: 'teacher1@test.com',
        password: hashedPassword,
        full_name: 'Teacher One',
        role: 'teacher'
      },
      {
        username: 'student1',
        email: 'student1@test.com',
        password: hashedPassword,
        full_name: 'Student One',
        role: 'student',
        student_id: '123456',
        faculty: 'Computer Science',
        class_name: 'CS2024'
      }
    ];

    const results = [];

    // Create or update each account
    for (const accountData of testAccounts) {
      const existingUser = await User.findOne({
        where: { username: accountData.username }
      });

      if (existingUser) {
        // Update existing user password
        await existingUser.update({
          password: accountData.password,
          email: accountData.email,
          full_name: accountData.full_name
        });
        results.push({
          username: accountData.username,
          role: accountData.role,
          action: 'updated'
        });
      } else {
        // Create new user
        const newUser = await User.create(accountData);
        results.push({
          username: newUser.username,
          role: newUser.role,
          action: 'created'
        });
      }
    }

    res.json({
      success: true,
      message: 'Test accounts created/updated successfully!',
      results: results,
      testCredentials: {
        note: 'Use these credentials to login:',
        accounts: [
          { username: 'admin', password: 'test123', role: 'admin' },
          { username: 'teacher1', password: 'test123', role: 'teacher' },
          { username: 'student1', password: 'test123', role: 'student' }
        ]
      }
    });

  } catch (error) {
    console.error('Error creating test accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test accounts',
      error: error.message
    });
  }
});

module.exports = router;