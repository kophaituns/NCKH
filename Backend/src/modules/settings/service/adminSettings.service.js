// src/modules/settings/service/adminSettings.service.js
const { AdminSettings } = require('../../../models');
const logger = require('../../../utils/logger');

class AdminSettingsService {
  /**
   * Get admin settings (singleton pattern)
   */
  async getAdminSettings() {
    try {
      let settings = await AdminSettings.findOne();
      
      if (!settings) {
        // Create default admin settings
        settings = await AdminSettings.create({
          system_name: 'Survey System',
          system_logo_url: null,
          smtp_server: null,
          session_timeout: 3600,
          max_surveys_per_creator: 100,
          max_ai_questions_per_request: 10,
          max_responses_per_survey: 10000,
          two_factor_auth_admin: false,
          anonymous_mode_enabled: true,
          auto_lock_failed_logins: true,
          max_failed_login_attempts: 5,
          account_lock_duration: 1800
        });
        logger.info('Created default admin settings');
      }

      return settings;
    } catch (error) {
      logger.error('Get admin settings error:', error);
      throw error;
    }
  }

  /**
   * Update general admin settings
   */
  async updateGeneralSettings(data) {
    try {
      const { system_name, system_logo_url, smtp_server, session_timeout } = data;
      
      let settings = await this.getAdminSettings();
      
      const updateData = {};
      if (system_name !== undefined) updateData.system_name = system_name;
      if (system_logo_url !== undefined) updateData.system_logo_url = system_logo_url;
      if (smtp_server !== undefined) updateData.smtp_server = smtp_server;
      if (session_timeout !== undefined) updateData.session_timeout = session_timeout;

      await settings.update(updateData);

      logger.info('Updated general admin settings');
      return settings;
    } catch (error) {
      logger.error('Update general settings error:', error);
      throw error;
    }
  }

  /**
   * Update survey limits settings
   */
  async updateSurveyLimits(data) {
    try {
      const { 
        max_surveys_per_creator, 
        max_ai_questions_per_request, 
        max_responses_per_survey 
      } = data;
      
      let settings = await this.getAdminSettings();
      
      const updateData = {};
      if (max_surveys_per_creator !== undefined) updateData.max_surveys_per_creator = max_surveys_per_creator;
      if (max_ai_questions_per_request !== undefined) updateData.max_ai_questions_per_request = max_ai_questions_per_request;
      if (max_responses_per_survey !== undefined) updateData.max_responses_per_survey = max_responses_per_survey;

      await settings.update(updateData);

      logger.info('Updated survey limits settings');
      return settings;
    } catch (error) {
      logger.error('Update survey limits error:', error);
      throw error;
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(data) {
    try {
      const { 
        two_factor_auth_admin, 
        anonymous_mode_enabled, 
        auto_lock_failed_logins,
        max_failed_login_attempts,
        account_lock_duration
      } = data;
      
      let settings = await this.getAdminSettings();
      
      const updateData = {};
      if (two_factor_auth_admin !== undefined) updateData.two_factor_auth_admin = two_factor_auth_admin;
      if (anonymous_mode_enabled !== undefined) updateData.anonymous_mode_enabled = anonymous_mode_enabled;
      if (auto_lock_failed_logins !== undefined) updateData.auto_lock_failed_logins = auto_lock_failed_logins;
      if (max_failed_login_attempts !== undefined) updateData.max_failed_login_attempts = max_failed_login_attempts;
      if (account_lock_duration !== undefined) updateData.account_lock_duration = account_lock_duration;

      await settings.update(updateData);

      logger.info('Updated security settings');
      return settings;
    } catch (error) {
      logger.error('Update security settings error:', error);
      throw error;
    }
  }

  /**
   * Update all admin settings at once
   */
  async updateAllSettings(data) {
    try {
      let settings = await this.getAdminSettings();
      
      await settings.update(data);

      logger.info('Updated all admin settings');
      return settings;
    } catch (error) {
      logger.error('Update all admin settings error:', error);
      throw error;
    }
  }

  /**
   * Reset admin settings to defaults
   */
  async resetToDefaults() {
    try {
      let settings = await this.getAdminSettings();
      
      await settings.update({
        system_name: 'Survey System',
        system_logo_url: null,
        smtp_server: null,
        session_timeout: 3600,
        max_surveys_per_creator: 100,
        max_ai_questions_per_request: 10,
        max_responses_per_survey: 10000,
        two_factor_auth_admin: false,
        anonymous_mode_enabled: true,
        auto_lock_failed_logins: true,
        max_failed_login_attempts: 5,
        account_lock_duration: 1800
      });

      logger.info('Reset admin settings to defaults');
      return settings;
    } catch (error) {
      logger.error('Reset admin settings error:', error);
      throw error;
    }
  }

  /**
   * Validate SMTP configuration
   */
  validateSmtpConfig(smtpConfig) {
    if (!smtpConfig) return true; // null is valid
    
    const required = ['host', 'port', 'secure', 'auth'];
    const authRequired = ['user', 'pass'];
    
    for (const field of required) {
      if (smtpConfig[field] === undefined) {
        throw new Error(`SMTP configuration missing required field: ${field}`);
      }
    }
    
    if (smtpConfig.auth) {
      for (const field of authRequired) {
        if (!smtpConfig.auth[field]) {
          throw new Error(`SMTP auth configuration missing required field: ${field}`);
        }
      }
    }
    
    return true;
  }
}

module.exports = new AdminSettingsService();