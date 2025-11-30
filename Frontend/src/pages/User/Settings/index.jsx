// src/pages/User/Settings/index.jsx
import React, { useState, useEffect } from 'react';
import { SettingsService } from '../../../api/services';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Settings.module.scss';

const UserSettings = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const { showToast } = useToast();
  const { state } = useAuth();

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    email_reminders: true
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    save_survey_history: true,
    anonymous_responses: false
  });

  // Password Settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await SettingsService.getUserSettings();
      if (result.ok && result.data) {
        setSettings(result.data);
        setNotificationSettings({
          email_notifications: result.data.email_notifications,
          email_reminders: result.data.email_reminders
        });
        setPrivacySettings({
          save_survey_history: result.data.save_survey_history,
          anonymous_responses: result.data.anonymous_responses
        });
      }
    } catch (error) {
      showToast('Error loading settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setSaving(true);
    try {
      const result = await SettingsService.updateNotificationSettings(notificationSettings);
      if (result.ok) {
        showToast(result.message || 'Notification settings updated', 'success');
      } else {
        showToast(result.message || 'Error updating notification settings', 'error');
      }
    } catch (error) {
      showToast('Error updating notification settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setSaving(true);
    try {
      const result = await SettingsService.updatePrivacySettings(privacySettings);
      if (result.ok) {
        showToast(result.message || 'Privacy settings updated', 'success');
      } else {
        showToast(result.message || 'Error updating privacy settings', 'error');
      }
    } catch (error) {
      showToast('Error updating privacy settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New password and confirmation do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await SettingsService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      
      if (result.ok) {
        showToast(result.message || 'Password changed successfully', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showToast(result.message || 'Error changing password', 'error');
      }
    } catch (error) {
      showToast('Error changing password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePersonalData = async () => {
    if (!window.confirm('Are you sure you want to delete all personal data? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const result = await SettingsService.deletePersonalData();
      if (result.ok) {
        showToast(result.message || 'Personal data deletion initiated', 'success');
      } else {
        showToast(result.message || 'Error deleting personal data', 'error');
      }
    } catch (error) {
      showToast('Error deleting personal data', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1>User Settings</h1>
        <p>Manage your account preferences and privacy settings</p>
      </div>

      <div className={styles.settingsContainer}>
        <div className={styles.sidebar}>
          <nav className={styles.tabNav}>
            <button
              className={`${styles.tabButton} ${activeTab === 'notifications' ? styles.active : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'privacy' ? styles.active : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              Privacy
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'password' ? styles.active : ''}`}
              onClick={() => setActiveTab('password')}
            >
              Password
            </button>
          </nav>
        </div>

        <div className={styles.content}>
          {activeTab === 'notifications' && (
            <div className={styles.section}>
              <h2>Notifications</h2>
              <div className={styles.settingGroup}>
                <div className={styles.setting}>
                  <div className={styles.settingInfo}>
                    <h3>Email Notifications</h3>
                    <p>Toggle to enable or disable email notifications when new surveys are posted.</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_notifications}
                      onChange={(e) =>
                        setNotificationSettings(prev => ({
                          ...prev,
                          email_notifications: e.target.checked
                        }))
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.setting}>
                  <div className={styles.settingInfo}>
                    <h3>Email Reminders</h3>
                    <p>Toggle to enable or disable email reminders for uncompleted surveys.</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.email_reminders}
                      onChange={(e) =>
                        setNotificationSettings(prev => ({
                          ...prev,
                          email_reminders: e.target.checked
                        }))
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.saveButton}
                    onClick={handleNotificationUpdate}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Notification Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className={styles.section}>
              <h2>Privacy</h2>
              <div className={styles.settingGroup}>
                <div className={styles.setting}>
                  <div className={styles.settingInfo}>
                    <h3>Save Survey History</h3>
                    <p>Toggle to enable or disable saving user survey history.</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={privacySettings.save_survey_history}
                      onChange={(e) =>
                        setPrivacySettings(prev => ({
                          ...prev,
                          save_survey_history: e.target.checked
                        }))
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.setting}>
                  <div className={styles.settingInfo}>
                    <h3>Anonymous Survey Responses</h3>
                    <p>Toggle to enable or disable anonymous survey responses.</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={privacySettings.anonymous_responses}
                      onChange={(e) =>
                        setPrivacySettings(prev => ({
                          ...prev,
                          anonymous_responses: e.target.checked
                        }))
                      }
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.saveButton}
                    onClick={handlePrivacyUpdate}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Privacy Settings'}
                  </button>
                </div>

                <div className={styles.dangerZone}>
                  <h3>Delete Personal Data</h3>
                  <p>Button to delete all personal data from the system.</p>
                  <button
                    className={styles.deleteButton}
                    onClick={handleDeletePersonalData}
                    disabled={saving}
                  >
                    {saving ? 'Processing...' : 'Delete All Personal Data'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className={styles.section}>
              <h2>Change Password</h2>
              <p>Update your account password for security.</p>
              
              <div className={styles.settingGroup}>
                <div className={styles.formGroup}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData(prev => ({
                        ...prev,
                        currentPassword: e.target.value
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData(prev => ({
                        ...prev,
                        newPassword: e.target.value
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData(prev => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))
                    }
                    className={styles.input}
                  />
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.changePasswordButton}
                    onClick={handlePasswordChange}
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword}
                  >
                    {saving ? 'Changing...' : 'Change Password'}
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

export default UserSettings;