// src/modules/settings/controller/adminSettings.controller.js
const adminSettingsService = require('../service/adminSettings.service');
const logger = require('../../../utils/logger');

class AdminSettingsController {
  /**
   * GET /api/modules/settings/admin
   * Get admin settings (admin only)
   */
  async getAdminSettings(req, res) {
    try {
      const settings = await adminSettingsService.getAdminSettings();
      
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Get admin settings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching admin settings'
      });
    }
  }

  /**
   * PUT /api/modules/settings/admin/general
   * Update general admin settings
   */
  async updateGeneralSettings(req, res) {
    try {
      const { smtp_server } = req.body;

      // Validate SMTP config if provided
      if (smtp_server) {
        adminSettingsService.validateSmtpConfig(smtp_server);
      }

      const settings = await adminSettingsService.updateGeneralSettings(req.body);
      
      res.status(200).json({
        success: true,
        data: settings,
        message: 'General settings updated successfully'
      });
    } catch (error) {
      logger.error('Update general settings error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error updating general settings'
      });
    }
  }

  /**
   * PUT /api/modules/settings/admin/survey-limits
   * Update survey limits settings
   */
  async updateSurveyLimits(req, res) {
    try {
      const { 
        max_surveys_per_creator, 
        max_ai_questions_per_request, 
        max_responses_per_survey 
      } = req.body;

      // Validate limits
      if (max_surveys_per_creator !== undefined && max_surveys_per_creator < 1) {
        return res.status(400).json({
          success: false,
          message: 'Maximum surveys per creator must be at least 1'
        });
      }

      if (max_ai_questions_per_request !== undefined && max_ai_questions_per_request < 1) {
        return res.status(400).json({
          success: false,
          message: 'Maximum AI questions per request must be at least 1'
        });
      }

      if (max_responses_per_survey !== undefined && max_responses_per_survey < 1) {
        return res.status(400).json({
          success: false,
          message: 'Maximum responses per survey must be at least 1'
        });
      }

      const settings = await adminSettingsService.updateSurveyLimits(req.body);
      
      res.status(200).json({
        success: true,
        data: settings,
        message: 'Survey limits updated successfully'
      });
    } catch (error) {
      logger.error('Update survey limits error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error updating survey limits'
      });
    }
  }

  /**
   * PUT /api/modules/settings/admin/security
   * Update security settings
   */
  async updateSecuritySettings(req, res) {
    try {
      const { 
        max_failed_login_attempts, 
        account_lock_duration 
      } = req.body;

      // Validate security settings
      if (max_failed_login_attempts !== undefined && max_failed_login_attempts < 1) {
        return res.status(400).json({
          success: false,
          message: 'Maximum failed login attempts must be at least 1'
        });
      }

      if (account_lock_duration !== undefined && account_lock_duration < 60) {
        return res.status(400).json({
          success: false,
          message: 'Account lock duration must be at least 60 seconds'
        });
      }

      const settings = await adminSettingsService.updateSecuritySettings(req.body);
      
      res.status(200).json({
        success: true,
        data: settings,
        message: 'Security settings updated successfully'
      });
    } catch (error) {
      logger.error('Update security settings error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error updating security settings'
      });
    }
  }

  /**
   * PUT /api/modules/settings/admin
   * Update all admin settings at once
   */
  async updateAllSettings(req, res) {
    try {
      const { smtp_server } = req.body;

      // Validate SMTP config if provided
      if (smtp_server) {
        adminSettingsService.validateSmtpConfig(smtp_server);
      }

      const settings = await adminSettingsService.updateAllSettings(req.body);
      
      res.status(200).json({
        success: true,
        data: settings,
        message: 'All settings updated successfully'
      });
    } catch (error) {
      logger.error('Update all settings error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error updating settings'
      });
    }
  }

  /**
   * POST /api/modules/settings/admin/reset
   * Reset admin settings to defaults
   */
  async resetToDefaults(req, res) {
    try {
      const settings = await adminSettingsService.resetToDefaults();
      
      res.status(200).json({
        success: true,
        data: settings,
        message: 'Settings reset to defaults successfully'
      });
    } catch (error) {
      logger.error('Reset settings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error resetting settings'
      });
    }
  }
}

module.exports = new AdminSettingsController();