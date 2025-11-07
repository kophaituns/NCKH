// scripts/test-template-questions.js
// Quick test for template/question API

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/modules';

let authToken = '';
let createdTemplateId = null;
let createdQuestionId = null;

async function login() {
  console.log('🔐 Logging in...');
  const response = await axios.post(`${API_BASE}/auth/login`, {
    username: 'admin',
    password: 'test123'
  });
  
  authToken = response.data.data.token;
  console.log('✅ Logged in successfully\n');
}

async function createTemplate() {
  console.log('📝 Creating template...');
  const response = await axios.post(
    `${API_BASE}/templates`,
    {
      title: 'Test Template - ' + Date.now(),
      description: 'Test template for question API'
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  
  createdTemplateId = response.data.data.template.id;
  console.log(`✅ Template created: ID ${createdTemplateId}\n`);
  return createdTemplateId;
}

async function addQuestion(templateId) {
  console.log(`📋 Adding question to template ${templateId}...`);
  const response = await axios.post(
    `${API_BASE}/templates/${templateId}/questions`,
    {
      question_type_id: 1,
      question_text: 'Test question?',
      required: true,
      display_order: 1
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  
  createdQuestionId = response.data.data.question.id;
  console.log(`✅ Question added: ID ${createdQuestionId}\n`);
  return createdQuestionId;
}

async function getTemplate(templateId) {
  console.log(`🔍 Fetching template ${templateId}...`);
  const response = await axios.get(
    `${API_BASE}/templates/${templateId}`,
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  
  const template = response.data.data.template;
  console.log(`✅ Template fetched: "${template.title}"`);
  console.log(`   Questions found: ${template.Questions?.length || 0}`);
  
  if (template.Questions && template.Questions.length > 0) {
    console.log(`   First question: "${template.Questions[0].question_text}"`);
  }
  
  return template;
}

async function runTest() {
  try {
    console.log('🚀 Starting Template/Question API Test\n');
    console.log('=' .repeat(50) + '\n');
    
    await login();
    const templateId = await createTemplate();
    await addQuestion(templateId);
    const template = await getTemplate(templateId);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS PASSED!');
    
    if (template.Questions && template.Questions.length > 0) {
      console.log('✅ Question correctly associated with template');
    } else {
      throw new Error('Question not found in template!');
    }
    
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ TEST FAILED!');
    console.error('Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

runTest();
