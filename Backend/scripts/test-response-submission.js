#!/usr/bin/env node

// Simple test for survey response submission
const axios = require('axios');

async function testResponseSubmission() {
  const BACKEND_URL = 'http://localhost:5001';
  
  try {
    console.log('🧪 Testing Survey Response Submission...\n');
    
    // Login
    const loginResponse = await axios.post(`${BACKEND_URL}/api/modules/auth/login`, {
      username: 'admin',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    
    console.log('✅ Login successful');
    
    // Get a survey to test with
    const surveysResponse = await axios.get(`${BACKEND_URL}/api/modules/surveys?limit=1`, { headers });
    const surveys = surveysResponse.data.data?.surveys || surveysResponse.data.surveys || [];
    
    if (!surveys || surveys.length === 0) {
      console.log('⚠️ No surveys available to test with');
      return;
    }
    
    const survey = surveys[0];
    console.log(`📝 Testing with survey: "${survey.title}" (ID: ${survey.id})`);
    
    // Get survey details
    const detailsResponse = await axios.get(`${BACKEND_URL}/api/modules/surveys/${survey.id}`, { headers });
    const questions = detailsResponse.data.data?.survey?.questions || 
                     detailsResponse.data.survey?.questions || [];
    
    console.log(`📋 Survey has ${questions.length} questions`);
    
    if (questions.length === 0) {
      console.log('⚠️ Survey has no questions, cannot test response submission');
      return;
    }
    
    // Create sample responses
    const responses = questions.slice(0, 2).map(q => ({
      questionId: q.id,
      value: q.question_type === 'multiple_choice' ? 'Sample Option' : 
             q.question_type === 'rating' ? '4' : 
             `Test answer for question ${q.id}`
    }));
    
    console.log(`💾 Submitting ${responses.length} responses...`);
    
    // Submit responses
    const submitResponse = await axios.post(`${BACKEND_URL}/api/modules/llm/submit-survey-response`, {
      surveyId: survey.id,
      responses: responses
    }, { headers });
    
    console.log('✅ Response submission successful!');
    console.log('📊 Result:', JSON.stringify(submitResponse.data, null, 2));
    
    // Test survey results endpoint
    console.log('\n📈 Testing survey results endpoint...');
    
    try {
      const resultsResponse = await axios.get(`${BACKEND_URL}/api/modules/llm/survey-results/${survey.id}`, { headers });
      console.log('✅ Survey results retrieved successfully!');
      console.log('📊 Results summary:', {
        totalResponses: resultsResponse.data.data?.summary?.totalResponses || 0,
        completionRate: resultsResponse.data.data?.summary?.completionRate || 0,
        questionsCount: resultsResponse.data.data?.questions?.length || 0
      });
    } catch (resultsError) {
      console.log('⚠️ Survey results endpoint test failed:', resultsError.response?.data?.message || resultsError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testResponseSubmission();