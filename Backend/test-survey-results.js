// Test script to verify survey results functionality
const axios = require('axios');

async function testSurveyResults() {
  try {
    console.log('🧪 Testing survey results functionality...');

    // Test with survey ID 51 (the latest created survey)
    const surveyId = 51;
    const baseURL = 'http://localhost:5001';

    console.log(`📊 Getting results for survey ${surveyId}...`);
    
    const response = await axios.get(`${baseURL}/api/modules/llm/surveys/${surveyId}/results`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // Use valid token
      }
    });

    console.log('✅ Survey results retrieved successfully!');
    console.log('📈 Response data:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error testing survey results:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testSurveyResults();