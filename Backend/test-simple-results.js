// Simple test script to check database and API
const axios = require('axios');

async function testWithoutAuth() {
  try {
    console.log('🧪 Testing survey results via public endpoint...');
    
    // Test with survey ID 52 (latest created survey)
    const surveyId = 52;
    const baseURL = 'http://localhost:5001';

    console.log(`📊 Getting results for survey ${surveyId}...`);
    
    // Try to call the public API endpoint
    const response = await axios.get(`${baseURL}/api/modules/llm/public/results/${surveyId}`);
    
    console.log('✅ Survey results retrieved successfully!');
    console.log('📈 Response status:', response.status);
    console.log('📈 Full response data:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error testing survey results:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data);
      console.error('Error details:', error.response.data.stack || error.response.data.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testWithoutAuth();