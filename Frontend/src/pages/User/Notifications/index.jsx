import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';

import AuthService from '../../../api/services/auth.service';
import UserService from '../../../api/services/user.service';

import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import Input from '../../../components/UI/Input';
import LanguageSwitcher from '../../../components/UI/LanguageSwitcher';
import Switch from '../../../components/UI/Switch';
import Modal from '../../../components/UI/Modal';

import styles from './Notifications.module.scss';



const LOCAL_STORAGE_KEY = 'user_settings';

const Settings = () => {
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [activeSection, setActiveSection] = useState('notifications');

  const [savingPassword, setSavingPassword] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // CHỈ DÙNG 1 STATE DUY NHẤT CHO TẤT CẢ SETTINGS
  const [userSettings, setUserSettings] = useState({
    email_notifications_enabled: true,
    email_reminders_enabled: true,
    save_survey_history: true,
    anonymous_survey_responses: false,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPersonalData, setDeletingPersonalData] = useState(false);

  // Load settings khi mở trang:
  // 1) Load nhanh từ localStorage (nếu có)
  // 2) Sau đó gọi API và merge kết quả
  useEffect(() => {
    let isMounted = true;

    // 1. Load từ localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (isMounted && saved && typeof saved === 'object') {
            setUserSettings((prev) => ({
              ...prev,
              ...saved,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load settings from localStorage:', err);
      }
    }

    // 2. Gọi API từ backend
    const fetchSettings = async () => {
      try {
        const result = await UserService.getMySettings();
        const serverSettings = result.data?.settings;
        if (serverSettings && isMounted) {
          setUserSettings((prev) => ({
            ...prev,
            ...serverSettings,
          }));

          // đồng bộ lại localStorage với dữ liệu từ server
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              LOCAL_STORAGE_KEY,
              JSON.stringify({
                ...userSettings,
                ...serverSettings,
              })
            );
          }
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
        if (isMounted) {
          showToast(t('error_loading_settings'), 'error');
        }
      } finally {
        if (isMounted) {
          setLoadingSettings(false);
        }
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [showToast, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePasswordChangeField = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleChange = (field, value) => {
    setUserSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSettingsSaving(true);
    try {
      // Gọi API lưu xuống backend (nếu backend đã hỗ trợ)
      await UserService.updateMySettings(userSettings);

      // Lưu vào localStorage để khi reload vẫn giữ trạng thái
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userSettings));
      }

      showToast(t('settings_saved'), 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(
        error.response?.data?.message || t('error_saving_settings'),
        'error'
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(t('passwords_do_not_match'), 'error');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast(t('password_too_short'), 'error');
      return;
    }

    setSavingPassword(true);

    try {
      await AuthService.changePassword({
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      showToast(t('password_changed'), 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Change password error:', error);
      showToast(
        error.response?.data?.message || 'Failed to change password',
        'error'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleConfirmDeletePersonalData = async () => {
    setDeletingPersonalData(true);
    try {
      await UserService.deletePersonalData();
      showToast(t('privacy_delete_success'), 'success');

      // Xoá luôn settings trong localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }

      await AuthService.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting personal data:', error);
      showToast(
        error.response?.data?.message || t('error_deleting_personal_data'),
        'error'
      );
    } finally {
      setDeletingPersonalData(false);
      setIsDeleteModalOpen(false);
    }
  };

  // ======================
  // RENDER CÁC SECTION
  // ======================

  const renderNotificationsSection = () => (
    <Card title={t('notifications_settings')}>
      <div className={styles.sectionHeader}>
        <h3>{t('notifications_settings')}</h3>
      </div>

      <form onSubmit={handleSaveSettings}>
        <div className={styles.toggleGroup}>
          <div className={styles.toggleRow}>
            <Switch
              checked={userSettings.email_notifications_enabled}
              onChange={(value) =>
                handleToggleChange('email_notifications_enabled', value)
              }
              disabled={loadingSettings || settingsSaving}
              label={t('notifications_email_notifications')}
            />
          </div>
          <div className={styles.toggleRow}>
            <Switch
              checked={userSettings.email_reminders_enabled}
              onChange={(value) =>
                handleToggleChange('email_reminders_enabled', value)
              }
              disabled={loadingSettings || settingsSaving}
              label={t('notifications_email_reminders')}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="submit" disabled={settingsSaving || loadingSettings}>
            {settingsSaving ? t('saving') : t('save_changes')}
          </Button>
        </div>
      </form>
    </Card>
  );

  const renderPrivacySection = () => (
    <Card title={t('privacy_settings')}>
      <div className={styles.sectionHeader}>
        <h3>{t('privacy_settings')}</h3>
      </div>

      <form onSubmit={handleSaveSettings}>
        <div className={styles.toggleGroup}>
          <div className={styles.toggleRow}>
            <Switch
              checked={userSettings.save_survey_history}
              onChange={(value) =>
                handleToggleChange('save_survey_history', value)
              }
              disabled={loadingSettings || settingsSaving}
              label={t('privacy_save_survey_history')}
            />
          </div>
          <div className={styles.toggleRow}>
            <Switch
              checked={userSettings.anonymous_survey_responses}
              onChange={(value) =>
                handleToggleChange('anonymous_survey_responses', value)
              }
              disabled={loadingSettings || settingsSaving}
              label={t('privacy_anonymous_survey_responses')}
            />
          </div>
        </div>

        <div className={styles.dangerZone}>
          <div>
            <h4>{t('privacy_delete_personal_data')}</h4>
            <p>{t('privacy_delete_personal_data_desc')}</p>
          </div>
          <Button
            type="button"
            disabled={deletingPersonalData}
            onClick={() => setIsDeleteModalOpen(true)}
          >
            {deletingPersonalData
              ? t('deleting')
              : t('privacy_delete_personal_data')}
          </Button>
        </div>

        <div className={styles.actions}>
          <Button type="submit" disabled={settingsSaving || loadingSettings}>
            {settingsSaving ? t('saving') : t('save_changes')}
          </Button>
        </div>
      </form>
    </Card>
  );

  const renderSecuritySection = () => (
    <Card title={t('security')}>
      <div className={styles.sectionHeader}>
        <h3>{t('change_password')}</h3>
        <p>{t('change_password_desc')}</p>
      </div>

      <form onSubmit={handlePasswordChange}>
        <div className={styles.formStack}>
          <Input
            type="password"
            label={t('current_password')}
            value={passwordForm.currentPassword}
            onChange={(e) =>
              handlePasswordChangeField('currentPassword', e.target.value)
            }
            placeholder={t('current_password')}
            required
          />
          <Input
            type="password"
            label={t('new_password')}
            value={passwordForm.newPassword}
            onChange={(e) =>
              handlePasswordChangeField('newPassword', e.target.value)
            }
            placeholder={t('new_password')}
            required
          />
          <Input
            type="password"
            label={t('confirm_new_password')}
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              handlePasswordChangeField('confirmPassword', e.target.value)
            }
            placeholder={t('confirm_new_password')}
            required
          />
        </div>

        <div className={styles.actions}>
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? t('updating') : t('update_password')}
          </Button>
        </div>
      </form>
    </Card>
  );

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.header}>
        <h1>{t('settings_page')}</h1>
        <p>{t('manage_account_settings')}</p>
      </div>

      {/* Language card luôn ở trên */}
      <div className={styles.languageCard}>
        <Card title={t('language')}>
          <LanguageSwitcher />
        </Card>
      </div>

      <div className={styles.settingsBody}>
        {/* Sidebar bên trái */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarTitle}>{t('settings_page')}</div>
          <div className={styles.menuList}>
            <button
              type="button"
              className={`${styles.menuItem} ${
                activeSection === 'notifications' ? styles.menuItemActive : ''
              }`}
              onClick={() => setActiveSection('notifications')}
            >
              <span>{t('notifications_settings')}</span>
            </button>

            <button
              type="button"
              className={`${styles.menuItem} ${
                activeSection === 'privacy' ? styles.menuItemActive : ''
              }`}
              onClick={() => setActiveSection('privacy')}
            >
              <span>{t('privacy_settings')}</span>
            </button>

            <button
              type="button"
              className={`${styles.menuItem} ${
                activeSection === 'security' ? styles.menuItemActive : ''
              }`}
              onClick={() => setActiveSection('security')}
            >
              <span>{t('security')}</span>
            </button>
          </div>
        </div>

        {/* Nội dung bên phải */}
        <div className={styles.content}>
          {activeSection === 'notifications' && renderNotificationsSection()}
          {activeSection === 'privacy' && renderPrivacySection()}
          {activeSection === 'security' && renderSecuritySection()}
        </div>
      </div>

      {/* Modal confirm delete personal data */}
      <Modal
        isOpen={isDeleteModalOpen}
        title={t('privacy_delete_confirmation_title')}
        onClose={() => setIsDeleteModalOpen(false)}
        actions={
          <>
            <Button
              type="button"
              disabled={deletingPersonalData}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              disabled={deletingPersonalData}
              onClick={handleConfirmDeletePersonalData}
            >
              {deletingPersonalData ? t('deleting') : t('confirm')}
            </Button>
          </>
        }
      >
        <p>{t('privacy_delete_confirmation_message')}</p>
      </Modal>
    </div>
  );
};

export default Settings;
