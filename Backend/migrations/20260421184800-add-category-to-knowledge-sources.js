'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('knowledge_sources');
    if (tableInfo.category) {
      console.log('Column category already exists in knowledge_sources. Skipping.');
      return;
    }
    await queryInterface.addColumn('knowledge_sources', 'category', {
      type: Sequelize.STRING(50),
      defaultValue: 'general',
      allowNull: false,
      after: 'visibility'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('knowledge_sources', 'category');
  }
};
