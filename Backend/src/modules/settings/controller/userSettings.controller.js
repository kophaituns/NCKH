// src/modules/settings/controller/userSettings.controller.js
const userSettingsService = require('../service/userSettings.service');
const logger = require('../../../utils/logger');
const { UserSettings } = require('../../../models');

class UserSettingsController {
  /**
   * GET /api/modules/settings/user
   * Get current user's settings
   */
  async getUserSettings(req, res) {
    console.log(">>> Controller sees UserSettings table:", UserSettings.getTableName());
    try {
      const settings = await userSettingsService.getUserSettings(req.user.id);
      
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Get user settings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching user settings'
      });
    }
  }

  /**
   * PUT /api/modules/settings/user/notifications
   * Update notification settings
   */
  async updateNotificationSettings(req, res) {
    try {
      const settings = await userSettingsService.updateNotificationSettings(
        req.user.id,
        req.body
      );
      
      res.status(200).json({
        success: true,
        data: settings,
        message: 'Notification settings updated successfully'
      });
    } catch (error) {
      logger.error('Update notification settings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating notification settings'
      });
    }
  }

  /**
   * PUT /api/modules/settings/user/privacy
   * Update privacy settings
   */
  async updatePrivacySettings(req, res) {
    try {
      const settings = await userSettingsService.updatePrivacySettings(
        req.user.id,
        req.body
      );
      
      res.status(200).json({
        success: true,
        data: settings,
        message: 'Privacy settings updated successfully'
      });
    } catch (error) {
      logger.error('Update privacy settings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating privacy settings'
      });
    }
  }



  /**
   * PUT /api/modules/settings/user/change-password
   * Change user password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'All password fields are required'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password and confirmation do not match'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      const result = await userSettingsService.changePassword(req.user.id, {
        currentPassword,
        newPassword
      });
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error changing password'
      });
    }
  }

  /**
   * DELETE /api/modules/settings/user/personal-data
   * Delete all personal data
   */
  async deletePersonalData(req, res) {
    try {
      const { confirmDelete } = req.body;

      if (!confirmDelete) {
        return res.status(400).json({
          success: false,
          message: 'Deletion confirmation required'
        });
      }

      const result = await userSettingsService.deletePersonalData(req.user.id);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Delete personal data error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting personal data'
      });
    }
  }
}

module.exports = new UserSettingsController();