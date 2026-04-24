'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('knowledge_sources')) {
      console.log('Table knowledge_sources already exists. Skipping.');
      return;
    }
    await queryInterface.createTable('knowledge_sources', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      workspace_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'workspaces',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      source_type: {
        type: Sequelize.ENUM('FILE', 'URL', 'TEXT'),
        defaultValue: 'FILE'
      },
      source_path: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      vector_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      quality_score: {
        type: Sequelize.FLOAT,
        defaultValue: 0.0
      },
      validation_report: {
        type: Sequelize.JSON,
        allowNull: true
      },
      visibility: {
        type: Sequelize.ENUM('private', 'global'),
        defaultValue: 'private'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('knowledge_sources', ['workspace_id']);
    await queryInterface.addIndex('knowledge_sources', ['visibility']);
    await queryInterface.addIndex('knowledge_sources', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('knowledge_sources');
  }
};
