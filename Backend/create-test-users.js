// create-test-users.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const { User, sequelize } = require('./src/models');

async function createTestUsers() {
  try {
    console.log('🔄 Connecting to database...');
    console.log('Database config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync database (create tables if they don't exist)
    await sequelize.sync();
    console.log('✅ Database synced');

    const testUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        full_name: 'System Administrator',
        role: 'admin',
        student_id: null,
        faculty: null,
        class_name: null
      },
      {
        username: 'teacher1',
        email: 'teacher1@example.com',
        password: 'teacher123',
        full_name: 'Nguyễn Văn A',
        role: 'teacher',
        student_id: null,
        faculty: 'Công nghệ thông tin',
        class_name: null
      },
      {
        username: 'teacher2',
        email: 'teacher2@example.com',
        password: 'teacher123',
        full_name: 'Trần Thị B',
        role: 'teacher',
        student_id: null,
        faculty: 'Kỹ thuật phần mềm',
        class_name: null
      },
      {
        username: 'student1',
        email: 'student1@example.com',
        password: 'student123',
        full_name: 'Lê Văn C',
        role: 'student',
        student_id: 'SV001',
        faculty: 'Công nghệ thông tin',
        class_name: 'IT01'
      },
      {
        username: 'student2',
        email: 'student2@example.com',
        password: 'student123',
        full_name: 'Phạm Thị D',
        role: 'student',
        student_id: 'SV002',
        faculty: 'Kỹ thuật phần mềm',
        class_name: 'SE01'
      },
      {
        username: 'student3',
        email: 'student3@example.com',
        password: 'student123',
        full_name: 'Hoàng Văn E',
        role: 'student',
        student_id: 'SV003',
        faculty: 'Công nghệ thông tin',
        class_name: 'IT02'
      }
    ];

    console.log('🔄 Creating test users...');

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          where: {
            [sequelize.Op.or]: [
              { username: userData.username },
              { email: userData.email }
            ]
          }
        });

        if (existingUser) {
          console.log(`⚠️  User ${userData.username} already exists, skipping...`);
          continue;
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        // Create user
        const newUser = await User.create({
          ...userData,
          password: hashedPassword
        });

        console.log(`✅ Created user: ${userData.username} (${userData.role})`);

      } catch (error) {
        console.error(`❌ Error creating user ${userData.username}:`, error.message);
      }
    }

    console.log('\n🎉 Test users creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}
        full_name: 'Administrator',
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

    // Delete existing test users
    await User.destroy({
      where: {
        username: ['admin', 'teacher1', 'student1']
      }
    });

    // Create new users
    for (const userData of testUsers) {
      const user = await User.create(userData);
      console.log(`Created user: ${user.username} (${user.role})`);
    }

    console.log('\n=== TEST ACCOUNTS ===');
    console.log('Username: admin, Password: test123 (Role: admin)');
    console.log('Username: teacher1, Password: test123 (Role: teacher)');
    console.log('Username: student1, Password: test123 (Role: student)');
    console.log('====================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();