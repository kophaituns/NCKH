// src/api/services/settings.service.js
import http from '../http';

class SettingsService {
  // User Settings Methods
  
  /**
   * Get current user's settings
   */
  async getUserSettings() {
    try {
      const response = await http.get('/modules/settings/user');
      return {
        ok: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('[SettingsService.getUserSettings] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(data) {
    try {
      const response = await http.put('/modules/settings/user/notifications', data);
      return {
        ok: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('[SettingsService.updateNotificationSettings] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(data) {
    try {
      const response = await http.put('/modules/settings/user/privacy', data);
      return {
        ok: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('[SettingsService.updatePrivacySettings] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(data) {
    try {
      const response = await http.put('/modules/settings/user/change-password', data);
      return {
        ok: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('[SettingsService.changePassword] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Delete all personal data
   */
  async deletePersonalData() {
    try {
      const response = await http.delete('/modules/settings/user/personal-data', {
        confirmDelete: true
      });
      return {
        ok: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('[SettingsService.deletePersonalData] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  // Admin Settings Methods

  /**
   * Get admin settings (admin only)
   */
  async getAdminSettings() {
    try {
      const response = await http.get('/modules/settings/admin');
      return {
        ok: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('[SettingsService.getAdminSettings] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Update general admin settings
   */
  async updateGeneralSettings(data) {
    try {
      const response = await http.put('/modules/settings/admin/general', data);
      return {
        ok: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('[SettingsService.updateGeneralSettings] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Update survey limits settings
   */
  async updateSurveyLimits(data) {
    try {
      const response = await http.put('/modules/settings/admin/survey-limits', data);
      return {
        ok: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('[SettingsService.updateSurveyLimits] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(data) {
    try {
      const response = await http.put('/modules/settings/admin/security', data);
      return {
        ok: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('[SettingsService.updateSecuritySettings] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Update all admin settings
   */
  async updateAllAdminSettings(data) {
    try {
      const response = await http.put('/modules/settings/admin', data);
      return {
        ok: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('[SettingsService.updateAllAdminSettings] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Reset admin settings to defaults
   */
  async resetAdminSettingsToDefaults() {
    try {
      const response = await http.post('/modules/settings/admin/reset');
      return {
        ok: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('[SettingsService.resetAdminSettingsToDefaults] ERROR:', error);
      return {
        ok: false,
        message: error.response?.data?.message || error.message
      };
    }
  }
}

export default new SettingsService();