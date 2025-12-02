-- Migration: Create user_settings and admin_settings tables
-- Created: 2024-11-30

-- Create user_settings table
CREATE TABLE user_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE COMMENT 'Toggle to enable or disable email notifications when new surveys are posted',
  email_reminders BOOLEAN DEFAULT TRUE COMMENT 'Toggle to enable or disable email reminders for uncompleted surveys',
  save_survey_history BOOLEAN DEFAULT TRUE COMMENT 'Toggle to enable or disable saving user survey history',
  anonymous_responses BOOLEAN DEFAULT FALSE COMMENT 'Toggle to enable or disable anonymous survey responses',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Create admin_settings table
CREATE TABLE admin_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  system_name VARCHAR(100) DEFAULT 'Survey System' COMMENT 'Field to configure the system display name',
  system_logo_url TEXT NULL COMMENT 'Field to update the system logo using a URL',
  smtp_server JSON NULL COMMENT 'Field to configure SMTP server to send system emails',
  session_timeout INT DEFAULT 3600 COMMENT 'Field to set session timeout for inactive users (in seconds)',
  max_surveys_per_creator INT DEFAULT 100 COMMENT 'Field to determine the maximum number of surveys each creator can create',
  max_ai_questions_per_request INT DEFAULT 10 COMMENT 'Field to limit the maximum number of AI-generated questions per request',
  max_responses_per_survey INT DEFAULT 10000 COMMENT 'Field to set the maximum number of responses allowed per survey',
  two_factor_auth_admin BOOLEAN DEFAULT FALSE COMMENT 'Toggle to enable or disable two-factor authentication for admin accounts',
  anonymous_mode_enabled BOOLEAN DEFAULT TRUE COMMENT 'Toggle to enable or disable anonymous mode for survey takers',
  auto_lock_failed_logins BOOLEAN DEFAULT TRUE COMMENT 'Toggle to automatically lock user accounts after multiple failed login attempts',
  max_failed_login_attempts INT DEFAULT 5 COMMENT 'Maximum number of failed login attempts before account lock',
  account_lock_duration INT DEFAULT 1800 COMMENT 'Duration to lock account after failed login attempts (in seconds)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin settings
INSERT INTO admin_settings (id) VALUES (1);