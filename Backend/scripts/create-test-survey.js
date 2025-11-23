#!/usr/bin/env node

// Create a test survey with questions for testing
const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestSurvey() {
  const BACKEND_URL = 'http://localhost:5001';
  
  try {
    console.log('🧪 Creating Test Survey with Questions...\n');
    
    // Login
    const loginResponse = await axios.post(`${BACKEND_URL}/api/modules/auth/login`, {
      username: 'admin',
      password: 'test123'
    });
    
    const authToken = loginResponse.data.data.token;
    const headers = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };
    
    console.log('✅ Login successful');
    
    // Direct database insert for survey with questions
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'survey_system'
    });
    
    console.log('💾 Creating survey in database...');
    
    // Create survey
    const [surveyResult] = await connection.execute(`
      INSERT INTO surveys (title, description, start_date, end_date, target_audience, created_by, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      'Response Testing Survey',
      'A survey created specifically for testing response submission',
      new Date().toISOString().slice(0, 19).replace('T', ' '),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
      'all_users',
      1,
      'active'
    ]);
    
    const surveyId = surveyResult.insertId;
    console.log(`✅ Survey created with ID: ${surveyId}`);
    
    // Add questions
    const questions = [
      {
        question_text: 'What is your overall satisfaction with our service?',
        question_type: 'rating',
        required: true,
        question_order: 1
      },
      {
        question_text: 'Which features do you use most frequently?',
        question_type: 'multiple_choice',
        required: true,
        question_order: 2
      },
      {
        question_text: 'Please provide any additional feedback',
        question_type: 'text',
        required: false,
        question_order: 3
      }
    ];
    
    const questionIds = [];
    for (const q of questions) {
      const [questionResult] = await connection.execute(`
        INSERT INTO questions (survey_id, question_text, question_type, required, question_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        surveyId,
        q.question_text,
        q.question_type,
        q.required,
        q.question_order
      ]);
      
      questionIds.push(questionResult.insertId);
      console.log(`✅ Question added: "${q.question_text}" (ID: ${questionResult.insertId})`);
    }
    
    console.log(`\n🎉 Test survey created successfully!`);
    console.log(`   Survey ID: ${surveyId}`);
    console.log(`   Questions: ${questionIds.length}`);
    console.log(`   Question IDs: ${questionIds.join(', ')}`);
    
    // Now test response submission
    console.log('\n💾 Testing response submission...');
    
    // Create survey link manually in database
    const surveyToken = 'test-token-' + Date.now();
    await connection.execute(`
      INSERT INTO survey_links (survey_id, token, expires_at, is_active, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [surveyId, surveyToken, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 1, 1]);
    
    console.log(`🔗 Survey link created with token: ${surveyToken}`);
    
    // Close database connection
    await connection.end();
    
    const responses = [
      { questionId: questionIds[0], value: '5' },  // rating
      { questionId: questionIds[1], value: 'Feature A' },  // multiple choice
      { questionId: questionIds[2], value: 'This is a test feedback message' }  // text
    ];
    
    const submitResponse = await axios.post(`${BACKEND_URL}/api/modules/llm/public/${surveyToken}/submit`, {
      answers: responses
    });
    
    console.log('✅ Response submission successful!');
    console.log('📊 Result:', JSON.stringify(submitResponse.data, null, 2));
    
    // Test survey results
    console.log('\n📈 Testing survey results...');
    
    try {
      const resultsResponse = await axios.get(`${BACKEND_URL}/api/modules/llm/survey-results/${surveyId}`, { headers });
      console.log('✅ Survey results retrieved!');
      
      const data = resultsResponse.data.data;
      console.log('📊 Summary:', {
        totalResponses: data?.summary?.totalResponses || 0,
        completionRate: `${data?.summary?.completionRate || 0}%`,
        avgResponseTime: data?.summary?.avgResponseTime || 'N/A'
      });
      
      console.log('📋 Questions analyzed:', data?.questions?.length || 0);
      
    } catch (resultsError) {
      console.log('⚠️ Survey results failed:', resultsError.response?.data?.message || resultsError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

createTestSurvey();