'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column exists
    const tableInfo = await queryInterface.describeTable('questions');
    if (tableInfo.question_type_id) {
      console.log('Column question_type_id already exists. Skipping.');
    } else {
      await queryInterface.addColumn('questions', 'question_type_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
      console.log('✅ Column question_type_id added successfully!');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('questions', 'question_type_id');
  }
};
