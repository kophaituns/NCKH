// src/pages/Admin/Settings/index.jsx
import React, { useState, useEffect } from 'react';
import { SettingsService } from '../../../api/services';
import { useToast } from '../../../contexts/ToastContext';
import styles from './AdminSettings.module.scss';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const { showToast } = useToast();

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    system_name: '',
    system_logo_url: '',
    smtp_server: null,
    session_timeout: 3600
  });

  // Survey Limits
  const [surveyLimits, setSurveyLimits] = useState({
    max_surveys_per_creator: 100,
    max_ai_questions_per_request: 10,
    max_responses_per_survey: 10000
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_auth_admin: false,
    anonymous_mode_enabled: true,
    auto_lock_failed_logins: true,
    max_failed_login_attempts: 5,
    account_lock_duration: 1800
  });

  // SMTP Form State
  const [smtpForm, setSmtpForm] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await SettingsService.getAdminSettings();
      if (result.ok && result.data) {
        const data = result.data;
        setSettings(data);
        
        setGeneralSettings({
          system_name: data.system_name || '',
          system_logo_url: data.system_logo_url || '',
          smtp_server: data.smtp_server,
          session_timeout: data.session_timeout || 3600
        });

        setSurveyLimits({
          max_surveys_per_creator: data.max_surveys_per_creator || 100,
          max_ai_questions_per_request: data.max_ai_questions_per_request || 10,
          max_responses_per_survey: data.max_responses_per_survey || 10000
        });

        setSecuritySettings({
          two_factor_auth_admin: data.two_factor_auth_admin || false,
          anonymous_mode_enabled: data.anonymous_mode_enabled !== undefined ? data.anonymous_mode_enabled : true,
          auto_lock_failed_logins: data.auto_lock_failed_logins !== undefined ? data.auto_lock_failed_logins : true,
          max_failed_login_attempts: data.max_failed_login_attempts || 5,
          account_lock_duration: data.account_lock_duration || 1800
        });

        // Set SMTP form if SMTP server exists
        if (data.smtp_server) {
          setSmtpForm({
            host: data.smtp_server.host || '',
            port: data.smtp_server.port || 587,
            secure: data.smtp_server.secure || false,
            user: data.smtp_server.auth?.user || '',
            pass: data.smtp_server.auth?.pass || ''
          });
        }
      }
    } catch (error) {
      showToast('Error loading admin settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralUpdate = async () => {
    setSaving(true);
    try {
      // Prepare SMTP server config
      let smtp_server = null;
      if (smtpForm.host && smtpForm.user) {
        smtp_server = {
          host: smtpForm.host,
          port: parseInt(smtpForm.port),
          secure: smtpForm.secure,
          auth: {
            user: smtpForm.user,
            pass: smtpForm.pass
          }
        };
      }

      const updateData = {
        ...generalSettings,
        smtp_server
      };

      const result = await SettingsService.updateGeneralSettings(updateData);
      if (result.ok) {
        showToast(result.message || 'General settings updated', 'success');
        setSettings(prev => ({ ...prev, ...result.data }));
      } else {
        showToast(result.message || 'Error updating general settings', 'error');
      }
    } catch (error) {
      showToast('Error updating general settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSurveyLimitsUpdate = async () => {
    setSaving(true);
    try {
      const result = await SettingsService.updateSurveyLimits(surveyLimits);
      if (result.ok) {
        showToast(result.message || 'Survey limits updated', 'success');
        setSettings(prev => ({ ...prev, ...result.data }));
      } else {
        showToast(result.message || 'Error updating survey limits', 'error');
      }
    } catch (error) {
      showToast('Error updating survey limits', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityUpdate = async () => {
    setSaving(true);
    try {
      const result = await SettingsService.updateSecuritySettings(securitySettings);
      if (result.ok) {
        showToast(result.message || 'Security settings updated', 'success');
        setSettings(prev => ({ ...prev, ...result.data }));
      } else {
        showToast(result.message || 'Error updating security settings', 'error');
      }
    } catch (error) {
      showToast('Error updating security settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const result = await SettingsService.resetAdminSettingsToDefaults();
      if (result.ok) {
        showToast(result.message || 'Settings reset to defaults', 'success');
        loadSettings(); // Reload all settings
      } else {
        showToast(result.message || 'Error resetting settings', 'error');
      }
    } catch (error) {
      showToast('Error resetting settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading admin settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminSettingsPage}>
      <div className={styles.header}>
        <h1>Admin Settings</h1>
        <p>Manage system configuration, limits, and security settings</p>
      </div>

      <div className={styles.settingsContainer}>
        <div className={styles.sidebar}>
          <nav className={styles.tabNav}>
            <button
              className={`${styles.tabButton} ${activeTab === 'general' ? styles.active : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General Settings
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'survey-limits' ? styles.active : ''}`}
              onClick={() => setActiveTab('survey-limits')}
            >
              Survey Limits
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'security' ? styles.active : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </nav>

          <div className={styles.resetSection}>
            <button
              className={styles.resetButton}
              onClick={handleResetToDefaults}
              disabled={saving}
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {activeTab === 'general' && (
            <div className={styles.section}>
              <h2>General Settings</h2>
              <div className={styles.settingGroup}>
                <div className={styles.formGroup}>
                  <label>System Display Name</label>
                  <p className={styles.description}>Field to configure the system display name.</p>
                  <input
                    type="text"
                    placeholder="Enter system name"
                    value={generalSettings.system_name}
                    onChange={(e) =>
                      setGeneralSettings(prev => ({
                        ...prev,
                        system_name: e.target.value
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>System Logo URL</label>
                  <p className={styles.description}>Field to update the system logo using a URL.</p>
                  <input
                    type="url"
                    placeholder="Enter logo URL"
                    value={generalSettings.system_logo_url}
                    onChange={(e) =>
                      setGeneralSettings(prev => ({
                        ...prev,
                        system_logo_url: e.target.value
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Session Timeout (seconds)</label>
                  <p className={styles.description}>Field to set session timeout for inactive users.</p>
                  <input
                    type="number"
                    min="300"
                    max="86400"
                    value={generalSettings.session_timeout}
                    onChange={(e) =>
                      setGeneralSettings(prev => ({
                        ...prev,
                        session_timeout: parseInt(e.target.value) || 3600
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.smtpSection}>
                  <h3>SMTP Server Configuration</h3>
                  <p className={styles.description}>Field to configure SMTP server to send system emails.</p>
                  
                  <div className={styles.smtpGrid}>
                    <div className={styles.formGroup}>
                      <label>Host</label>
                      <input
                        type="text"
                        placeholder="smtp.example.com"
                        value={smtpForm.host}
                        onChange={(e) =>
                          setSmtpForm(prev => ({
                            ...prev,
                            host: e.target.value
                          }))
                        }
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Port</label>
                      <input
                        type="number"
                        placeholder="587"
                        value={smtpForm.port}
                        onChange={(e) =>
                          setSmtpForm(prev => ({
                            ...prev,
                            port: parseInt(e.target.value) || 587
                          }))
                        }
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Username</label>
                      <input
                        type="text"
                        placeholder="Enter SMTP username"
                        value={smtpForm.user}
                        onChange={(e) =>
                          setSmtpForm(prev => ({
                            ...prev,
                            user: e.target.value
                          }))
                        }
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Password</label>
                      <input
                        type="password"
                        placeholder="Enter SMTP password"
                        value={smtpForm.pass}
                        onChange={(e) =>
                          setSmtpForm(prev => ({
                            ...prev,
                            pass: e.target.value
                          }))
                        }
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={smtpForm.secure}
                        onChange={(e) =>
                          setSmtpForm(prev => ({
                            ...prev,
                            secure: e.target.checked
                          }))
                        }
                      />
                      <span>Use SSL/TLS</span>
                    </label>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.saveButton}
                    onClick={handleGeneralUpdate}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save General Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'survey-limits' && (
            <div className={styles.section}>
              <h2>Survey Limits</h2>
              <div className={styles.settingGroup}>
                <div className={styles.formGroup}>
                  <label>Maximum Surveys per Creator</label>
                  <p className={styles.description}>Field to determine the maximum number of surveys each creator can create.</p>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={surveyLimits.max_surveys_per_creator}
                    onChange={(e) =>
                      setSurveyLimits(prev => ({
                        ...prev,
                        max_surveys_per_creator: parseInt(e.target.value) || 100
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Maximum AI Questions per Request</label>
                  <p className={styles.description}>Field to limit the maximum number of AI-generated questions per request.</p>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={surveyLimits.max_ai_questions_per_request}
                    onChange={(e) =>
                      setSurveyLimits(prev => ({
                        ...prev,
                        max_ai_questions_per_request: parseInt(e.target.value) || 10
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Maximum Responses per Survey</label>
                  <p className={styles.description}>Field to set the maximum number of responses allowed per survey.</p>
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={surveyLimits.max_responses_per_survey}
                    onChange={(e) =>
                      setSurveyLimits(prev => ({
                        ...prev,
                        max_responses_per_survey: parseInt(e.target.value) || 10000
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.saveButton}
                    onClick={handleSurveyLimitsUpdate}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Survey Limits'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className={styles.section}>
              <h2>Security</h2>
              <div className={styles.settingGroup}>
                <div className={styles.setting}>
                  <div className={styles.settingInfo}>
                    <h3>Two-Factor Authentication for Admin</h3>
                    <p>Toggle to enable or disable two-factor authentication for admin accounts.</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={securitySettings.two_factor_auth_admin}
                      onChange={(e) =>
                        setSecuritySettings(prev => ({
                          ...prev,
                          two_factor_auth_admin: e.target.checked
                        }))
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.setting}>
                  <div className={styles.settingInfo}>
                    <h3>Anonymous Mode for Survey Takers</h3>
                    <p>Toggle to enable or disable anonymous mode for survey takers.</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={securitySettings.anonymous_mode_enabled}
                      onChange={(e) =>
                        setSecuritySettings(prev => ({
                          ...prev,
                          anonymous_mode_enabled: e.target.checked
                        }))
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.setting}>
                  <div className={styles.settingInfo}>
                    <h3>Auto-lock Failed Login Attempts</h3>
                    <p>Toggle to automatically lock user accounts after multiple failed login attempts.</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={securitySettings.auto_lock_failed_logins}
                      onChange={(e) =>
                        setSecuritySettings(prev => ({
                          ...prev,
                          auto_lock_failed_logins: e.target.checked
                        }))
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                {securitySettings.auto_lock_failed_logins && (
                  <>
                    <div className={styles.formGroup}>
                      <label>Maximum Failed Login Attempts</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={securitySettings.max_failed_login_attempts}
                        onChange={(e) =>
                          setSecuritySettings(prev => ({
                            ...prev,
                            max_failed_login_attempts: parseInt(e.target.value) || 5
                          }))
                        }
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Account Lock Duration (seconds)</label>
                      <input
                        type="number"
                        min="60"
                        max="86400"
                        value={securitySettings.account_lock_duration}
                        onChange={(e) =>
                          setSecuritySettings(prev => ({
                            ...prev,
                            account_lock_duration: parseInt(e.target.value) || 1800
                          }))
                        }
                        className={styles.input}
                      />
                    </div>
                  </>
                )}

                <div className={styles.actions}>
                  <button
                    className={styles.saveButton}
                    onClick={handleSecurityUpdate}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Security Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;