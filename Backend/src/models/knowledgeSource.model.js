// src/models/knowledgeSource.model.js
module.exports = (sequelize, DataTypes) => {
  const KnowledgeSource = sequelize.define(
    'KnowledgeSource',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      workspace_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'workspaces',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Display name of the ingestion batch'
      },
      source_type: {
        type: DataTypes.ENUM('FILE', 'URL', 'TEXT', 'YOUTUBE'),
        defaultValue: 'FILE',
      },
      source_path: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Original file path or URL'
      },
      vector_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      quality_score: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
      },
      validation_report: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      visibility: {
        type: DataTypes.ENUM('private', 'global'),
        defaultValue: 'private',
      },
      category: {
        type: DataTypes.STRING(50),
        defaultValue: 'general',
        comment: 'Domain category (it, economics, marketing, general)'
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
      },
    },
    {
      tableName: 'knowledge_sources',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return KnowledgeSource;
};
