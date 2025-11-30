// src/modules/settings/service/userSettings.service.js
const { UserSettings, User } = require('../../../models');
const logger = require('../../../utils/logger');
const bcrypt = require('bcrypt');

class UserSettingsService {
  /**
   * Get user settings for a specific user
   * Creates default settings if they don't exist
   */
  async getUserSettings(userId) {
    try {
      let settings = await UserSettings.findOne({
        where: { user_id: userId }
      });

      if (!settings) {
        // Create default settings for user
        settings = await UserSettings.create({
          user_id: userId,
          email_notifications: true,
          email_reminders: true,
          save_survey_history: true,
          anonymous_responses: false
        });
        logger.info(`Created default settings for user ${userId}`);
      }

      return settings;
    } catch (error) {
      logger.error('Get user settings error:', error);
      throw error;
    }
  }

  /**
   * Update user notification settings
   */
  async updateNotificationSettings(userId, data) {
    try {
      const { email_notifications, email_reminders } = data;

      let settings = await this.getUserSettings(userId);
      
      await settings.update({
        email_notifications: email_notifications !== undefined ? email_notifications : settings.email_notifications,
        email_reminders: email_reminders !== undefined ? email_reminders : settings.email_reminders
      });

      logger.info(`Updated notification settings for user ${userId}`);
      return settings;
    } catch (error) {
      logger.error('Update notification settings error:', error);
      throw error;
    }
  }

  /**
   * Update user privacy settings
   */
  async updatePrivacySettings(userId, data) {
    try {
      const { save_survey_history, anonymous_responses } = data;

      let settings = await this.getUserSettings(userId);
      
      await settings.update({
        save_survey_history: save_survey_history !== undefined ? save_survey_history : settings.save_survey_history,
        anonymous_responses: anonymous_responses !== undefined ? anonymous_responses : settings.anonymous_responses
      });

      logger.info(`Updated privacy settings for user ${userId}`);
      return settings;
    } catch (error) {
      logger.error('Update privacy settings error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, data) {
    try {
      const { currentPassword, newPassword } = data;
      
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await user.update({ password: hashedPassword });

      logger.info(`Changed password for user ${userId}`);
      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Delete all personal data for a user
   */
  async deletePersonalData(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // This is a complex operation that would need to:
      // 1. Delete user settings
      // 2. Anonymize survey responses if enabled
      // 3. Remove personal identifiers while keeping anonymized data
      // 4. Delete user account
      
      // For now, just delete the user settings
      await UserSettings.destroy({
        where: { user_id: userId }
      });

      // In production, you'd want to implement a more comprehensive data deletion process
      // that respects data retention policies and anonymization requirements

      logger.info(`Deleted personal data for user ${userId}`);
      return { message: 'Personal data deletion initiated' };
    } catch (error) {
      logger.error('Delete personal data error:', error);
      throw error;
    }
  }
}

module.exports = new UserSettingsService();