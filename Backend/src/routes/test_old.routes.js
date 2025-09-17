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
      {
        username: 'teacher',
        email: 'teacher@test.com', 
        password: teacherHash,
        full_name: 'Teacher User',
        role: 'teacher',
        faculty: 'Computer Science'
      },
      {
        username: 'student1',
        email: 'student1@test.com',
        password: studentHash,
        full_name: 'Student One',
        role: 'student',
        student_id: '2021001',
        faculty: 'Computer Science',
        class_name: 'K28 CMU'
      },
      {
        username: 'student2', 
        email: 'student2@test.com',
        password: studentHash,
        full_name: 'Student Two',
        role: 'student',
        student_id: '2021002',
        faculty: 'Computer Science',
        class_name: 'K28 CMU'
      }
    ];

    await User.bulkCreate(testAccounts);

    res.json({
      success: true,
      message: 'Test accounts created successfully',
      accounts: [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'teacher', password: 'teacher123', role: 'teacher' },
        { username: 'student1', password: 'student123', role: 'student' },
        { username: 'student2', password: 'student123', role: 'student' }
      ]
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

// Test login endpoint
router.post('/test-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    res.json({
      success: true,
      username: user.username,
      passwordMatch: isValidPassword,
      storedHash: user.password.substring(0, 20) + '...',
      role: user.role
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test login failed',
      error: error.message
    });
  }
});

module.exports = router;