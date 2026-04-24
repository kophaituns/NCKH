#!/usr/bin/env node

/**
 * Reset Survey Data Script
 * Safely deletes all survey-related data while preserving system tables
 * Run: node scripts/reset-survey-data.js
 */

require('dotenv').config();

const { sequelize } = require('../src/models');
const readline = require('readline');

const FORCE_MODE = process.argv.includes('--force');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  if (FORCE_MODE) return Promise.resolve('DELETE');
  return new Promise(resolve => rl.question(question, resolve));
}

async function resetSurveyData() {
  console.log('\n========================================');
  console.log('      RESET SURVEY DATA SCRIPT');
  console.log('========================================\n');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('[OK] Database connection established\n');

    // Show current counts
    console.log('Current data counts:');
    const tables = [
      'answers',
      'survey_feedbacks',
      'survey_responses',
      'survey_collectors',
      'survey_invites',
      'survey_access',
      'analysis_results',
      'visualizations',
      'surveys',
      'question_options',
      'questions',
      'survey_templates'
    ];

    for (const table of tables) {
      try {
        const [[result]] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  - ${table}: ${result.count} rows`);
      } catch (e) {
        console.log(`  - ${table}: (table not found)`);
      }
    }

    console.log('\n[WARNING] This will DELETE ALL DATA in the above tables!');
    console.log('          Users, Workspaces, and System Settings will be preserved.\n');

    const confirm = await ask('Type "DELETE" to confirm: ');

    if (confirm !== 'DELETE') {
      console.log('\n[CANCELLED] No data was deleted.');
      rl.close();
      process.exit(0);
    }

    console.log('\n[DELETING] Starting data deletion...\n');

    // Delete in order to respect foreign keys
    const deleteOrder = [
      'answers',
      'survey_feedbacks',
      'survey_responses',
      'survey_collectors',
      'survey_invites',
      'survey_access',
      'analysis_results',
      'visualizations',
      'surveys',
      'question_options',
      'questions',
      'survey_templates'
    ];

    for (const table of deleteOrder) {
      try {
        const [, metadata] = await sequelize.query(`DELETE FROM ${table}`);
        const affectedRows = metadata.affectedRows || metadata || 0;
        console.log(`  [DELETED] ${table}: ${affectedRows} rows`);
      } catch (e) {
        if (e.message.includes('doesn\'t exist')) {
          console.log(`  [SKIP] ${table}: table not found`);
        } else {
          console.log(`  [ERROR] ${table}: ${e.message}`);
        }
      }
    }

    console.log('\n========================================');
    console.log('  [SUCCESS] All survey data deleted!');
    console.log('========================================\n');

    console.log('Next step: Run seed-professional-demo.js to create demo data\n');

  } catch (error) {
    console.error('\n[ERROR] Reset failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await sequelize.close();
  }
}

resetSurveyData();
