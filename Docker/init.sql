-- init.sql

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =========================
-- CREATE DATABASE
-- =========================
DROP DATABASE IF EXISTS llm_survey_db;
CREATE DATABASE llm_survey_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE llm_survey_db;

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'creator', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- WORKSPACES
-- =========================
CREATE TABLE workspaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id INT NOT NULL,
    visibility ENUM('public','private') NOT NULL DEFAULT 'private',
    is_personal TINYINT(1) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Thành viên workspace (mapping chi tiết)
CREATE TABLE workspace_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner','admin','member') NOT NULL DEFAULT 'member',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_workspace_member (workspace_id, user_id)
);

-- Mapping user - workspace (nếu BE dùng thêm model WorkspaceUser)
CREATE TABLE workspace_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner','admin','member','viewer') NOT NULL DEFAULT 'member',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_workspace_user (workspace_id, user_id)
);

-- Lời mời vào workspace
CREATE TABLE workspace_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    inviter_id INT NOT NULL,
    invitee_email VARCHAR(255) NOT NULL,
    invitee_id INT NULL,
    status ENUM('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
    invite_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Activity log của workspace
CREATE TABLE workspace_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50) NULL,
    entity_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_workspace_activities_workspace (workspace_id),
    INDEX idx_workspace_activities_user (user_id),
    INDEX idx_workspace_activities_type (activity_type),
    INDEX idx_workspace_activities_entity (entity_type, entity_id)
);

-- =========================
-- SURVEY TEMPLATES
-- =========================
CREATE TABLE survey_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
    is_archived TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- QUESTION TYPES
-- =========================
CREATE TABLE question_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

INSERT INTO question_types (type_name, description) VALUES
('multiple_choice', 'Multiple choice questions with single selection'),
('checkbox', 'Multiple choice questions with multiple selections'),
('likert_scale', 'Rating scale questions (e.g., 1-5)'),
('open_ended', 'Text response questions'),
('dropdown', 'Dropdown selection questions');

-- =========================
-- SURVEYS
-- =========================
CREATE TABLE surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    target_audience ENUM('all_users', 'specific_group', 'custom') DEFAULT 'all_users',

    access_type VARCHAR(50) NOT NULL DEFAULT 'public',
    require_login TINYINT(1) NOT NULL DEFAULT 0,
    allow_anonymous TINYINT(1) NOT NULL DEFAULT 1,

    target_value VARCHAR(100) NULL,
    workspace_id INT NULL,

    created_by INT NOT NULL,
    status ENUM('draft', 'active', 'closed', 'analyzed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL,
    deleted_by INT NULL,

    FOREIGN KEY (template_id) REFERENCES survey_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_survey_status (status),
    INDEX idx_survey_deleted_at (deleted_at)
);

-- =========================
-- QUESTIONS
-- =========================
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    survey_id INT NULL,
    label VARCHAR(255) NULL,
    question_text TEXT NOT NULL,
    question_type_id INT NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES survey_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (question_type_id) REFERENCES question_types(id)
);

ALTER TABLE questions
    ADD CONSTRAINT fk_questions_survey
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE;

-- =========================
-- QUESTION OPTIONS
-- =========================
CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    display_order INT DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- =========================
-- SURVEY COLLECTORS
-- =========================
CREATE TABLE survey_collectors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    collector_type ENUM('web_link', 'qr_code', 'email', 'embedded') NOT NULL DEFAULT 'web_link',
    token VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    allow_multiple_responses TINYINT(1) NOT NULL DEFAULT 0,
    response_count INT NOT NULL DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_collectors_survey (survey_id),
    INDEX idx_collectors_active (is_active),
    INDEX idx_collectors_type (collector_type)
);

-- =========================
-- SURVEY RESPONSES
-- =========================
CREATE TABLE survey_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    respondent_id INT NULL,
    respondent_email VARCHAR(255) NULL,
    respondent_name VARCHAR(255) NULL,
    collector_id INT NULL,
    is_anonymous TINYINT(1) NOT NULL DEFAULT 0,

    start_time DATETIME,
    completion_time DATETIME,
    status ENUM('started', 'completed', 'abandoned') DEFAULT 'started',

    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    language VARCHAR(10) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (respondent_id) REFERENCES users(id),
    FOREIGN KEY (collector_id) REFERENCES survey_collectors(id) ON DELETE SET NULL,

    INDEX idx_response_survey (survey_id),
    INDEX idx_response_status (status),
    INDEX idx_response_started_at (started_at),
    INDEX idx_response_last_activity (last_activity_at),
    INDEX idx_response_completed_at (completed_at)
);

-- =========================
-- ANSWERS
-- =========================
CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_response_id INT NOT NULL,
    question_id INT NOT NULL,
    option_id INT NULL,
    text_answer TEXT NULL,
    numeric_answer INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_response_id) REFERENCES survey_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (option_id) REFERENCES question_options(id),
    INDEX idx_answers_response (survey_response_id),
    INDEX idx_answers_question (question_id)
);

-- =========================
-- ANALYSIS RESULTS
-- =========================
CREATE TABLE analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    analysis_type ENUM('sentiment', 'theme_extraction', 'summary', 'comparison') NOT NULL,
    result_data JSON NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    INDEX idx_analysis_survey (survey_id),
    INDEX idx_analysis_type (analysis_type)
);

-- =========================
-- VISUALIZATIONS
-- =========================
CREATE TABLE visualizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    visualization_type ENUM('bar_chart', 'pie_chart', 'line_chart', 'word_cloud', 'heatmap') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    config_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    INDEX idx_visualizations_survey (survey_id),
    INDEX idx_visualizations_type (visualization_type)
);

-- =========================
-- SURVEY ACCESS
-- =========================
CREATE TABLE survey_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    user_id INT NOT NULL,
    access_type ENUM('full', 'view', 'respond') NOT NULL DEFAULT 'full' COMMENT 'full: full edit/manage, view: can view results, respond: can only respond',
    granted_by INT NOT NULL COMMENT 'User ID who granted this access',
    expires_at DATETIME NULL COMMENT 'Access expiration date (null = no expiration)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT NULL COMMENT 'Additional notes about this access grant',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_survey_user_access (survey_id, user_id),
    KEY idx_survey_access_survey_id (survey_id),
    KEY idx_survey_access_user_id (user_id),
    KEY idx_survey_access_type (access_type),

    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================
-- COLLECTOR PERMISSIONS
-- =========================
CREATE TABLE collector_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collector_id INT NOT NULL,
    user_id INT NOT NULL,
    invite_token VARCHAR(255) UNIQUE NOT NULL COMMENT 'Token for accepting invitation',
    status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME NULL,
    expires_at DATETIME NULL COMMENT 'Invitation expires after this time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (collector_id) REFERENCES survey_collectors(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_permission (collector_id, user_id),
    INDEX idx_status (status),
    INDEX idx_invite_token (invite_token),
    INDEX idx_user_id (user_id),
    INDEX idx_invited_at (invited_at)
);

-- =========================
-- SURVEY COLLABORATORS
-- =========================
CREATE TABLE survey_collaborators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner','editor','viewer') NOT NULL DEFAULT 'editor',
    invited_by INT NOT NULL,
    status ENUM('active','removed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE KEY uq_survey_collaborator (survey_id, user_id),
    INDEX idx_survey_collab_survey (survey_id),
    INDEX idx_survey_collab_user (user_id)
);

-- =========================
-- SURVEY INVITES
-- =========================
CREATE TABLE survey_invites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    invite_token VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('pending','accepted','bounced','unsubscribed','expired') NOT NULL DEFAULT 'pending',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    INDEX idx_invites_survey (survey_id),
    INDEX idx_invites_status (status),
    INDEX idx_invites_email (email)
);

-- =========================
-- NOTIFICATIONS (event-based)
-- =========================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM(
        'workspace_invitation',
        'workspace_member_added',
        'survey_response',
        'survey_shared',
        'survey_invitation',
        'collector_created',
        'response_completed'
    ) NOT NULL,
    related_type VARCHAR(50) NULL,
    related_id INT NULL,
    data JSON NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_read (is_read)
);

-- =========================
-- CHAT ASSISTANT TABLES (đồng bộ với backend)
-- =========================
CREATE TABLE chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    status ENUM('active','archived','deleted') NOT NULL DEFAULT 'active',
    last_message_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_chat_conv_user (user_id),
    INDEX idx_chat_conv_status (status),
    INDEX idx_chat_conv_created_at (created_at)
);

CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_type ENUM('user','ai') NOT NULL,
    message TEXT NOT NULL,
    api_provider ENUM('super_dev','gemini') NULL COMMENT 'API provider used for AI responses',
    response_time INT NULL COMMENT 'Response time in milliseconds',
    tokens_used INT NULL COMMENT 'Number of tokens used for AI response',
    status ENUM('sent','delivered','error') NOT NULL DEFAULT 'sent',
    error_message TEXT NULL,
    metadata JSON NULL COMMENT 'Additional metadata for the message',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_chat_msg_conv (conversation_id),
    INDEX idx_chat_msg_sender_type (sender_type),
    INDEX idx_chat_msg_created_at (created_at),
    INDEX idx_chat_msg_api_provider (api_provider)
);

-- =========================
-- LLM PROMPTS
-- =========================
CREATE TABLE llm_prompts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prompt_name VARCHAR(100) NOT NULL,
    prompt_type ENUM('survey_generation', 'analysis', 'summary', 'recommendation') NOT NULL,
    prompt_text TEXT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_llm_prompts_type (prompt_type)
);

-- =========================
-- LLM INTERACTIONS
-- =========================
CREATE TABLE llm_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prompt_id INT NULL,
    custom_prompt TEXT NULL,
    response TEXT NOT NULL,
    tokens_used INT NULL,
    model_used VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    interaction_type ENUM('survey_generation', 'analysis', 'summary', 'recommendation') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES llm_prompts(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_llm_interactions_user (user_id),
    INDEX idx_llm_interactions_type (interaction_type)
);

-- =========================
-- AUDIT LOGS
-- =========================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL COMMENT 'survey, collector, response, user, etc',
    entity_id INT NOT NULL COMMENT 'ID of the entity being changed',
    action VARCHAR(100) NOT NULL COMMENT 'create, update, delete, invite, etc',
    performed_by INT NOT NULL,
    old_values JSON COMMENT 'Previous state of entity',
    new_values JSON COMMENT 'New state of entity',
    description TEXT COMMENT 'Human readable description',
    ip_address VARCHAR(45) COMMENT 'IPv4 or IPv6',
    user_agent TEXT COMMENT 'Browser/client info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_performed_by (performed_by),
    INDEX idx_audit_created_at (created_at)
);

-- =========================
-- SAMPLE DATA
-- =========================

-- Sample users (password: test123)
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin',    'admin@example.com',
 '$2b$10$d8g.i.ye5T6ZUZor0V3keu83m9hA/HMPCbNK8ZDkl34sx4XTgxsKy',
 'System Administrator', 'admin');

INSERT INTO users (username, email, password, full_name, role) VALUES
('creator1', 'creator@example.com',
 '$2b$10$CKXLQeA/OVWPNXDi6SIyS.74eS5oGNHbGYfHt3UhNrXKw.BpkuGZC',
 'Trần Kim Sanh', 'creator');

INSERT INTO users (username, email, password, full_name, role) VALUES
('user1', 'user1@example.com',
 '$2b$10$hHuUseL4///HhyRmO41YiuIVXi9Ulciq.J1H1FGRue/Ndva/WBePq',
 'Phạm Thục Anh', 'user'),
('user2', 'user2@example.com',
 '$2b$10$71pimim/U3Ru7YthwGz5W.lB7HJL9qGjkn1JwYvt6PMzQIHYb2cFW',
 'Ngô Nguyễn Thùy Linh', 'user'),
('user3', 'user3@example.com',
 '$2b$10$sk.DjGKVJJcUMLWb1niIp.tPqHL3KzuMF3ZtAhus.2M45o5VNoBa6',
 'Nguyễn Minh Quân', 'user');

-- Sample LLM prompts
INSERT INTO llm_prompts (prompt_name, prompt_type, prompt_text, created_by) VALUES
('Generate Survey', 'survey_generation', 'Generate a comprehensive survey to evaluate effectiveness for the following topic: {{course_name}}. Include questions about methods, materials, and overall satisfaction. The questions should be appropriate for {{user_level}} audience.', 1),
('Analyze Open Feedback', 'analysis', 'Analyze the following respondent feedback responses and identify common themes, sentiment, and actionable suggestions: {{feedback_text}}', 1),
('Summarize Survey Results', 'summary', 'Provide a concise summary of the following survey results, highlighting key findings, areas of strength, and opportunities for improvement: {{survey_results}}', 1),
('Generate Improvement Recommendations', 'recommendation', 'Based on the following survey analysis, provide specific recommendations for improving: {{analysis_results}}', 1);

-- Sample survey template
INSERT INTO survey_templates (title, description, created_by, status) VALUES
('Đánh giá chất lượng giảng dạy', 'Mẫu khảo sát đánh giá chất lượng giảng dạy của giảng viên', 1, 'active');

-- Sample questions
INSERT INTO questions (template_id, question_text, question_type_id, required, display_order) VALUES
(1, 'Giảng viên truyền đạt kiến thức rõ ràng và dễ hiểu?', 3, TRUE, 1),
(1, 'Giảng viên chuẩn bị bài giảng đầy đủ và chất lượng?', 3, TRUE, 2),
(1, 'Giảng viên khuyến khích sự tham gia và thảo luận của người trả lời?', 3, TRUE, 3),
(1, 'Tài liệu học tập được cung cấp có hữu ích và đầy đủ không?', 3, TRUE, 4),
(1, 'Bạn đánh giá cao điểm nào trong phương pháp giảng dạy của giảng viên?', 4, FALSE, 5),
(1, 'Những khía cạnh nào của môn học cần được cải thiện?', 4, FALSE, 6),
(1, 'Bạn muốn đề xuất điều gì để cải thiện chất lượng giảng dạy?', 4, FALSE, 7);

-- Sample options
INSERT INTO question_options (question_id, option_text, display_order) VALUES
(1, '1 - Strongly disagree', 1),
(1, '2 - Disagree', 2),
(1, '3 - Neutral', 3),
(1, '4 - Agree', 4),
(1, '5 - Strongly agree', 5),
(2, '1 - Strongly disagree', 1),
(2, '2 - Disagree', 2),
(2, '3 - Neutral', 3),
(2, '4 - Agree', 4),
(2, '5 - Strongly agree', 5),
(3, '1 - Strongly disagree', 1),
(3, '2 - Disagree', 2),
(3, '3 - Neutral', 3),
(3, '4 - Agree', 4),
(3, '5 - Strongly agree', 5),
(4, '1 - Strongly disagree', 1),
(4, '2 - Disagree', 2),
(4, '3 - Neutral', 3),
(4, '4 - Agree', 4),
(4, '5 - Strongly agree', 5);

-- Sample active survey
INSERT INTO surveys (
    template_id,
    title,
    description,
    start_date,
    end_date,
    target_audience,
    access_type,
    target_value,
    workspace_id,
    created_by,
    status
) VALUES (
    1,
    'Khảo sát đánh giá chất lượng giảng dạy Học kỳ 1/2025-2026',
    'Khảo sát này nhằm thu thập ý kiến của người trả lời về chất lượng giảng dạy của giảng viên trong học kỳ 1 năm học 2025-2026',
    '2025-07-19 00:00:00',
    '2025-12-29 23:59:59',
    'custom',
    'public',
    'K28 CMU TPM',
    NULL,
    1,
    'active'
);
