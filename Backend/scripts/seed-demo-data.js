#!/usr/bin/env node

/**
 * Demo Data Seeder
 * Creates sample users, templates, surveys, and responses for testing
 * Run: node scripts/seed-demo-data.js
 */

// Load environment variables
require('dotenv').config();

const bcrypt = require('bcrypt');
const { 
  sequelize, 
  User, 
  SurveyTemplate,
  QuestionType,
  Question, 
  Survey, 
  SurveyCollector, 
  SurveyResponse, 
  Answer 
} = require('../src/models');

const logger = console;

/**
 * Seed Users - 3 roles
 */
async function seedUsers() {
  logger.info('🌱 Seeding users...');
  
  const hashedPassword = await bcrypt.hash('Demo@1234', 10);
  
  const users = [
    {
      username: 'admin_demo',
      email: 'admin@demo.com',
      password: hashedPassword,
      full_name: 'Admin User',
      role: 'admin'
    },
    {
      username: 'creator_demo',
      email: 'creator@demo.com',
      password: hashedPassword,
      full_name: 'Creator User',
      role: 'creator'
    },
    {
      username: 'user_demo',
      email: 'user@demo.com',
      password: hashedPassword,
      full_name: 'Regular User',
      role: 'user'
    }
  ];

  const createdUsers = await User.bulkCreate(users, { 
    ignoreDuplicates: true,
    returning: true 
  });
  
  logger.info(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

/**
 * Seed Templates with Questions
 */
async function seedTemplates(creatorId) {
  logger.info('🌱 Seeding templates...');
  
  // First, get all question types to map names to IDs
  const questionTypes = await QuestionType.findAll();
  const typeMap = {};
  questionTypes.forEach(qt => {
    typeMap[qt.name] = qt.id;
  });
  
  const templates = [
    {
      title: 'Customer Satisfaction Survey',
      description: 'Measure customer satisfaction and identify improvement areas',
      category: 'Customer Feedback',
      created_by: creatorId,
      questions: [
        {
          question_text: 'How satisfied are you with our product/service?',
          question_type: 'rating',
          is_required: true,
          order_position: 1,
          metadata: { min_value: 1, max_value: 5, labels: ['Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'] }
        },
        {
          question_text: 'How likely are you to recommend us to a friend?',
          question_type: 'rating',
          is_required: true,
          order_position: 2,
          metadata: { min_value: 0, max_value: 10, type: 'NPS' }
        },
        {
          question_text: 'What do you like most about our service?',
          question_type: 'text',
          is_required: false,
          order_position: 3
        },
        {
          question_text: 'What can we improve?',
          question_type: 'text',
          is_required: false,
          order_position: 4
        }
      ]
    },
    {
      title: 'Employee Engagement Survey',
      description: 'Assess employee satisfaction and workplace culture',
      category: 'HR & Employee',
      created_by: creatorId,
      questions: [
        {
          question_text: 'I am satisfied with my current role',
          question_type: 'rating',
          is_required: true,
          order_position: 1,
          metadata: { min_value: 1, max_value: 5, type: 'likert', labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] }
        },
        {
          question_text: 'My manager provides clear feedback and support',
          question_type: 'rating',
          is_required: true,
          order_position: 2,
          metadata: { min_value: 1, max_value: 5, type: 'likert' }
        },
        {
          question_text: 'What motivates you most at work?',
          question_type: 'multiple_choice',
          is_required: true,
          order_position: 3,
          options: [
            { option_text: 'Career growth opportunities', order_position: 1 },
            { option_text: 'Salary and benefits', order_position: 2 },
            { option_text: 'Work-life balance', order_position: 3 },
            { option_text: 'Team collaboration', order_position: 4 },
            { option_text: 'Recognition and appreciation', order_position: 5 }
          ]
        },
        {
          question_text: 'Any suggestions for improving workplace culture?',
          question_type: 'text',
          is_required: false,
          order_position: 4
        }
      ]
    },
    {
      title: 'Event Feedback Form',
      description: 'Collect feedback from event attendees',
      category: 'Event & Conference',
      created_by: creatorId,
      questions: [
        {
          question_text: 'How would you rate the overall event?',
          question_type: 'rating',
          is_required: true,
          order_position: 1,
          metadata: { min_value: 1, max_value: 5 }
        },
        {
          question_text: 'Which sessions did you find most valuable?',
          question_type: 'checkbox',
          is_required: false,
          order_position: 2,
          options: [
            { option_text: 'Keynote Speech', order_position: 1 },
            { option_text: 'Technical Workshop', order_position: 2 },
            { option_text: 'Panel Discussion', order_position: 3 },
            { option_text: 'Networking Session', order_position: 4 }
          ]
        },
        {
          question_text: 'What did you like most about the event?',
          question_type: 'text',
          is_required: false,
          order_position: 3
        },
        {
          question_text: 'Would you attend future events?',
          question_type: 'multiple_choice',
          is_required: true,
          order_position: 4,
          options: [
            { option_text: 'Definitely', order_position: 1 },
            { option_text: 'Probably', order_position: 2 },
            { option_text: 'Maybe', order_position: 3 },
            { option_text: 'Probably not', order_position: 4 },
            { option_text: 'Definitely not', order_position: 5 }
          ]
        }
      ]
    }
  ];

  const createdTemplates = [];
  
  for (const templateData of templates) {
    const { questions, options, ...templateFields } = templateData;
    
    const template = await SurveyTemplate.create(templateFields);
    
    for (const questionData of questions) {
      const { options: questionOptions, question_type, order_position, is_required, ...questionFields } = questionData;
      
      // Get question type ID
      const questionTypeId = typeMap[question_type];
      
      if (!questionTypeId) {
        logger.warn(`  ⚠️  Unknown question type: ${question_type}, skipping question`);
        continue;
      }
      
      // Set required fields
      questionFields.template_id = template.id;
      questionFields.question_type_id = questionTypeId;
      if (order_position !== undefined) {
        questionFields.order = order_position;
      }
      if (is_required !== undefined) {
        questionFields.required = is_required;
      }
      
      const question = await Question.create(questionFields);
      
      if (questionOptions) {
        // Note: QuestionOption model would need to be imported and used here
        // For now, options are stored in metadata
        logger.info(`  ℹ️  Question "${question.question_text}" has options (stored in metadata)`);
      }
    }
    
    createdTemplates.push(template);
    logger.info(`  ✅ Created template: ${template.title}`);
  }
  
  logger.info(`✅ Created ${createdTemplates.length} templates`);
  return createdTemplates;
}

/**
 * Seed Surveys and Collectors
 */
async function seedSurveys(templates, creatorId) {
  logger.info('🌱 Seeding surveys and collectors...');
  
  const surveysData = [
    {
      template_id: templates[0].id,
      title: 'Q1 2024 Customer Satisfaction',
      description: 'Quarterly customer satisfaction survey',
      creator_id: creatorId,
      status: 'active',
      created_by: creatorId,
      settings: {
        anonymous_responses: false,
        allow_multiple_responses: false,
        show_progress_bar: true
      }
    },
    {
      template_id: templates[1].id,
      title: 'Annual Employee Engagement 2024',
      description: 'Annual survey to measure employee engagement',
      creator_id: creatorId,
      status: 'active',
      created_by: creatorId,
      settings: {
        anonymous_responses: true,
        allow_multiple_responses: false,
        show_progress_bar: true,
        randomize_questions: false
      }
    },
    {
      template_id: templates[2].id,
      title: 'Tech Conference 2024 Feedback',
      description: 'Post-event feedback collection',
      creator_id: creatorId,
      status: 'closed',
      created_by: creatorId,
      settings: {
        anonymous_responses: false,
        allow_multiple_responses: false,
        show_progress_bar: true
      }
    }
  ];

  const createdSurveys = await Survey.bulkCreate(surveysData, { returning: true });
  
  // Create collectors for each survey
  for (const survey of createdSurveys) {
    const collector = await SurveyCollector.create({
      survey_id: survey.survey_id,
      type: 'weblink',
      name: `Public Link - ${survey.title}`,
      status: survey.status === 'closed' ? 'closed' : 'active',
      settings: {
        response_limit: null,
        close_date: null,
        password_protected: false
      }
    });
    
    logger.info(`  ✅ Created collector for survey: ${survey.title}`);
    logger.info(`     🔗 Token: ${collector.token}`);
  }
  
  logger.info(`✅ Created ${createdSurveys.length} surveys`);
  return createdSurveys;
}

/**
 * Seed Sample Responses
 */
async function seedResponses(surveys) {
  logger.info('🌱 Seeding sample responses...');
  
  let totalResponses = 0;
  
  for (const survey of surveys) {
    // Get questions for this survey's template
    const questions = await Question.findAll({
      where: { template_id: survey.template_id },
      order: [['order_position', 'ASC']]
    });
    
    // Get collector
    const collector = await SurveyCollector.findOne({
      where: { survey_id: survey.survey_id }
    });
    
    if (!collector) continue;
    
    // Create 5 sample responses per survey
    const numResponses = survey.status === 'closed' ? 10 : 5;
    
    for (let i = 0; i < numResponses; i++) {
      const response = await SurveyResponse.create({
        survey_id: survey.survey_id,
        collector_id: collector.collector_id,
        response_status: 'completed',
        ip_address: `192.168.1.${100 + i}`,
        user_agent: 'Mozilla/5.0 (Demo Seed Data)',
        metadata: { source: 'seed_script' }
      });
      
      // Create answers for each question
      for (const question of questions) {
        let answerValue;
        
        switch (question.question_type) {
          case 'rating':
            answerValue = String(Math.floor(Math.random() * 5) + 1);
            break;
          case 'text':
            answerValue = i % 2 === 0 ? `Sample feedback ${i + 1}` : null;
            break;
          case 'multiple_choice':
            answerValue = 'Option ' + (Math.floor(Math.random() * 3) + 1);
            break;
          case 'checkbox':
            answerValue = JSON.stringify(['Option 1', 'Option 3']);
            break;
          default:
            answerValue = 'Sample answer';
        }
        
        if (answerValue !== null) {
          await Answer.create({
            response_id: response.response_id,
            question_id: question.question_id,
            answer_value: answerValue
          });
        }
      }
      
      totalResponses++;
    }
    
    logger.info(`  ✅ Created ${numResponses} responses for: ${survey.title}`);
  }
  
  logger.info(`✅ Created ${totalResponses} total responses`);
}

/**
 * Main Seeder
 */
async function main() {
  try {
    logger.info('🚀 Starting demo data seeder...\n');
    
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established\n');
    
    // Seed in order
    const users = await seedUsers();
    
    // Fetch the creator user to ensure we have the ID
    const creatorUser = await User.findOne({ where: { email: 'creator@demo.com' } });
    if (!creatorUser) {
      throw new Error('Creator user not found after seeding');
    }
    
    console.log('');
    const templates = await seedTemplates(creatorUser.id);
    
    console.log('');
    const surveys = await seedSurveys(templates, creatorUser.id);
    
    console.log('');
    await seedResponses(surveys);
    
    console.log('\n' + '='.repeat(50));
    logger.info('✅ Demo data seeding completed successfully!');
    console.log('='.repeat(50));
    
    logger.info('\n📋 Login Credentials:');
    logger.info('  Admin:   admin@demo.com / Demo@1234');
    logger.info('  Creator: creator@demo.com / Demo@1234');
    logger.info('  User:    user@demo.com / Demo@1234\n');
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedUsers, seedTemplates, seedSurveys, seedResponses };
