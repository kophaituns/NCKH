'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const tableInfo = await queryInterface.describeTable('notifications');

        // Add new columns if they don't exist
        const columnsToAdd = {
            'related_survey_id': {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'surveys', key: 'id' },
                onDelete: 'CASCADE'
            },
            'related_workspace_id': {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'workspaces', key: 'id' },
                onDelete: 'CASCADE'
            },
            'related_response_id': { type: Sequelize.INTEGER, allowNull: true },
            'related_user_id': { type: Sequelize.INTEGER, allowNull: true },
            'action_url': { type: Sequelize.STRING(500), allowNull: true },
            'actor_id': {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onDelete: 'SET NULL'
            },
            'actor_name': { type: Sequelize.STRING, allowNull: true },
            'actor_avatar': { type: Sequelize.STRING(500), allowNull: true },
            'is_archived': { type: Sequelize.BOOLEAN, defaultValue: false },
            'priority': {
                type: Sequelize.ENUM('low', 'normal', 'high', 'urgent', 'critical'),
                defaultValue: 'normal'
            },
            'category': { type: Sequelize.STRING(50), allowNull: true },
            'metadata': { type: Sequelize.JSON, allowNull: true }
        };

        for (const [col, spec] of Object.entries(columnsToAdd)) {
            if (!tableInfo[col]) {
                await queryInterface.addColumn('notifications', col, spec);
            }
        }

        // Add indexes if they don't exist
        // Note: queryInterface.addIndex doesn't easily allow checking, so we wrap in try-catch
        try {
            await queryInterface.addIndex('notifications', ['user_id', 'is_read', 'created_at'], { name: 'idx_user_unread' });
        } catch (e) {}
        try {
            await queryInterface.addIndex('notifications', ['user_id', 'category'], { name: 'idx_user_category' });
        } catch (e) {}
        try {
            await queryInterface.addIndex('notifications', ['created_at'], { name: 'idx_created_at' });
        } catch (e) {}

        // Update type enum
        try {
            await queryInterface.changeColumn('notifications', 'type', {
                type: Sequelize.ENUM(
                    'survey_created', 'survey_shared', 'survey_response', 'workspace_invite',
                    'workspace_survey_added', 'workspace_invitation', 'workspace_member_added',
                    'survey_invitation', 'collector_created', 'response_completed', 'mention',
                    'comment', 'deadline_reminder', 'role_change_request', 'role_change_approved',
                    'role_upgraded', 'upgrade_rejected', 'analysis_completed', 'role_mismatch_alert',
                    'system_alert'
                ),
                allowNull: false
            });
        } catch (e) {
            console.warn('Failed to update notifications.type enum, possibly already updated or has incompatible data:', e.message);
        }
    },

    down: async (queryInterface, Sequelize) => {
        // Remove indexes
        await queryInterface.removeIndex('notifications', 'idx_user_unread');
        await queryInterface.removeIndex('notifications', 'idx_user_category');
        await queryInterface.removeIndex('notifications', 'idx_created_at');

        // Remove columns
        await queryInterface.removeColumn('notifications', 'related_survey_id');
        await queryInterface.removeColumn('notifications', 'related_workspace_id');
        await queryInterface.removeColumn('notifications', 'related_response_id');
        await queryInterface.removeColumn('notifications', 'related_user_id');
        await queryInterface.removeColumn('notifications', 'action_url');
        await queryInterface.removeColumn('notifications', 'actor_id');
        await queryInterface.removeColumn('notifications', 'actor_name');
        await queryInterface.removeColumn('notifications', 'actor_avatar');
        await queryInterface.removeColumn('notifications', 'is_archived');
        await queryInterface.removeColumn('notifications', 'priority');
        await queryInterface.removeColumn('notifications', 'category');
        await queryInterface.removeColumn('notifications', 'metadata');
    }
};
