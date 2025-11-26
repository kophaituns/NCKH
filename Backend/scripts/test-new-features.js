#!/usr/bin/env node

const axios = require('axios');

const BACKEND_URL = 'http://localhost:5001';
let authToken = null;

async function login() {
  try {
    console.log('🔑 Logging in to get authentication token...');
    
    const response = await axios.post(`${BACKEND_URL}/api/modules/auth/login`, {
      username: 'admin',
      password: 'test123'
    });
    
    authToken = response.data.data.token;
    console.log('✅ Login successful, token acquired');
    return true;
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

function getAuthHeaders() {
  return authToken ? {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
}

async function testGenerateQuestions() {
  try {
    console.log('🧪 Testing generateQuestions with database storage...');
    
    const response = await axios.post(`${BACKEND_URL}/api/modules/llm/generate-questions`, {
      topic: 'Customer Service Quality',
      count: 3,
      category: 'business',
      userId: 1 // Test with user ID 1
    }, {
      headers: getAuthHeaders()
    });
    
    console.log('✅ Response received:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const questions = response.data.data?.questions || response.data.questions || [];
    
    if (questions && questions.length > 0) {
      console.log(`✅ Generated ${questions.length} questions successfully!`);
      
      // Check if questions have database IDs (indicating they were saved)
      const hasDbIds = questions.some(q => q.id && typeof q.id === 'number');
      if (hasDbIds) {
        console.log('✅ Questions appear to be saved to database (have IDs)');
      } else {
        console.log('⚠️ Questions may not have been saved to database (no IDs found)');
      }
    } else {
      console.log('❌ No questions received in response');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

async function testSubmitSurveyResponse() {
  try {
    console.log('🧪 Testing survey response submission...');
    
    // Create a test survey with questions first
    console.log('📝 Creating test survey with questions...');
    
    const surveyData = {
      template_id: null,
      title: 'Test Survey for Response Submission',
      description: 'A test survey to check response submission functionality',
      target_audience: 'all_users',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const createSurveyResponse = await axios.post(`${BACKEND_URL}/api/modules/surveys`, surveyData, {
      headers: getAuthHeaders()
    });
    
    if (!createSurveyResponse.data.success) {
      console.log('❌ Failed to create test survey');
      return;
    }
    
    const surveyId = createSurveyResponse.data.data?.survey?.id || createSurveyResponse.data.survey?.id;
    console.log(`✅ Created test survey with ID: ${surveyId}`);
    
    // Add questions to the survey
    const questionTemplates = [
      {
        survey_id: surveyId,
        question_text: 'What is your favorite color?',
        question_type: 'multiple_choice',
        options: JSON.stringify(['Red', 'Blue', 'Green', 'Yellow']),
        required: true,
        order_index: 1
      },
      {
        survey_id: surveyId,
        question_text: 'Please rate our service',
        question_type: 'rating',
        required: true,
        order_index: 2
      }
    ];
    
    // Add questions one by one
    const addedQuestions = [];
    for (const questionData of questionTemplates) {
      try {
        const addQuestionResponse = await axios.post(`${BACKEND_URL}/api/modules/surveys/${surveyId}/questions`, questionData, {
          headers: getAuthHeaders()
        });
        
        if (addQuestionResponse.data.success) {
          const question = addQuestionResponse.data.data?.question || addQuestionResponse.data.question;
          addedQuestions.push(question);
          console.log(`✅ Added question: ${question.id}`);
        }
      } catch (addError) {
        console.log(`⚠️ Failed to add question: ${addError.message}`);
      }
    }
    
    // Get survey details to get question IDs
    const surveyDetailsResponse = await axios.get(`${BACKEND_URL}/api/modules/surveys/${surveyId}`, {
      headers: getAuthHeaders()
    });
    
    const surveyQuestions = surveyDetailsResponse.data.data?.survey?.questions || 
                            surveyDetailsResponse.data.survey?.questions || 
                            surveyDetailsResponse.data.data?.questions || 
                            surveyDetailsResponse.data.questions || [];
    
    if (surveyQuestions.length === 0) {
      // Use the questions we added manually
      if (addedQuestions.length > 0) {
        console.log(`📋 Using ${addedQuestions.length} manually added questions`);
        
        // Create test responses
        const responses = addedQuestions.map(q => ({
          questionId: q.id,
          value: q.question_type === 'multiple_choice' ? 'Blue' : 
                 q.question_type === 'rating' ? '5' : 
                 'Test answer'
        }));
        
        const submitResponse = await axios.post(`${BACKEND_URL}/api/modules/llm/submit-survey-response`, {
          surveyId: surveyId,
          responses: responses
        }, {
          headers: getAuthHeaders()
        });
        
        console.log('✅ Response submission result:');
        console.log(JSON.stringify(submitResponse.data, null, 2));
      } else {
        console.log('⚠️ Test survey has no questions');
        return;
      }
    } else {
      console.log(`📋 Found ${surveyQuestions.length} questions in test survey`);
      
      // Create test responses
      const responses = surveyQuestions.map(q => ({
        questionId: q.id,
        value: q.question_type === 'multiple_choice' ? 'Blue' : 
               q.question_type === 'rating' ? '5' : 
               'Test answer'
      }));
      
      const submitResponse = await axios.post(`${BACKEND_URL}/api/modules/llm/submit-survey-response`, {
        surveyId: surveyId,
        responses: responses
      }, {
        headers: getAuthHeaders()
      });
      
      console.log('✅ Response submission result:');
      console.log(JSON.stringify(submitResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Response submission test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive system tests...\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot run tests without authentication');
    return;
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  await testGenerateQuestions();
  console.log('\n' + '='.repeat(60) + '\n');
  
  await testSubmitSurveyResponse();
  
  console.log('\n🎉 All tests completed!');
}

runAllTests();