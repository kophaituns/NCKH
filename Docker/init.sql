-- init.sql

-- Drop database if exists and create a new one
DROP DATABASE IF EXISTS NCKH;
CREATE DATABASE NCKH CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE NCKH;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student',
    student_id VARCHAR(20) NULL,
    faculty VARCHAR(100) NULL,
    class_name VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create survey_templates table
CREATE TABLE survey_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create question_types table
CREATE TABLE question_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Insert default question types
INSERT INTO question_types (type_name, description) VALUES
('multiple_choice', 'Multiple choice questions with single selection'),
('checkbox', 'Multiple choice questions with multiple selections'),
('likert_scale', 'Rating scale questions (e.g., 1-5)'),
('open_ended', 'Text response questions'),
('dropdown', 'Dropdown selection questions');

-- Create questions table
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_template_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type_id INT NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_template_id) REFERENCES survey_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (question_type_id) REFERENCES question_types(id)
);

-- Create question_options table for multiple choice, checkbox, and dropdown questions
CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    display_order INT DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Create surveys table (actual survey instances)
CREATE TABLE surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    target_audience ENUM('all_students', 'specific_faculty', 'specific_class') DEFAULT 'all_students',
    target_value VARCHAR(100) NULL, -- e.g., faculty name or class name if targeting specific groups
    created_by INT NOT NULL,
    status ENUM('draft', 'active', 'closed', 'analyzed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES survey_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create survey_responses table
CREATE TABLE survey_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    respondent_id INT NOT NULL,
    start_time DATETIME,
    completion_time DATETIME,
    status ENUM('started', 'completed', 'abandoned') DEFAULT 'started',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (respondent_id) REFERENCES users(id)
);

-- Create answer table
CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_response_id INT NOT NULL,
    question_id INT NOT NULL,
    option_id INT NULL, -- For multiple choice, checkbox, and dropdown
    text_answer TEXT NULL, -- For open-ended questions
    numeric_answer INT NULL, -- For likert scale questions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_response_id) REFERENCES survey_responses(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (option_id) REFERENCES question_options(id)
);

-- Create analysis_results table for storing LLM analysis outputs
CREATE TABLE analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    analysis_type ENUM('sentiment', 'theme_extraction', 'summary', 'comparison') NOT NULL,
    result_data JSON NOT NULL, -- Store analysis results as JSON
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

-- Create visualization table for storing visualization settings and data
CREATE TABLE visualizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    visualization_type ENUM('bar_chart', 'pie_chart', 'line_chart', 'word_cloud', 'heatmap') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    config_data JSON NOT NULL, -- Store visualization configuration as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
);

-- Create llm_prompts table for storing templates for LLM interactions
CREATE TABLE llm_prompts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prompt_name VARCHAR(100) NOT NULL,
    prompt_type ENUM('survey_generation', 'analysis', 'summary', 'recommendation') NOT NULL,
    prompt_text TEXT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create llm_interactions table to log all LLM API calls
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
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create sample admin user
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@example.com', '$2b$10$1234567890123456789012uDZ93/QFmPwVOIlP0OGOw3lhm0iWegu', 'System Administrator', 'admin');

-- Create sample teacher user
INSERT INTO users (username, email, password, full_name, role, faculty) VALUES
('teacher', 'teacher@example.com', '$2b$10$1234567890123456789012uDZ93/QFmPwVOIlP0OGOw3lhm0iWegu', 'Trần Kim Sanh', 'teacher', 'Computer Science');

-- Create sample student users
INSERT INTO users (username, email, password, full_name, role, student_id, faculty, class_name) VALUES
('student1', 'student1@example.com', '$2b$10$1234567890123456789012uDZ93/QFmPwVOIlP0OGOw3lhm0iWegu', 'Phạm Thục Anh', 'student', '28201103447', 'Computer Science', 'K28 CMU TPM'),
('student2', 'student2@example.com', '$2b$10$1234567890123456789012uDZ93/QFmPwVOIlP0OGOw3lhm0iWegu', 'Ngô Nguyễn Thùy Linh', 'student', '28201139984', 'Computer Science', 'K28 CMU TPM'),
('student3', 'student3@example.com', '$2b$10$1234567890123456789012uDZ93/QFmPwVOIlP0OGOw3lhm0iWegu', 'Nguyễn Minh Quân', 'student', '28214605702', 'Computer Science', 'K28 CMU TPM'),
('student4', 'student4@example.com', '$2b$10$1234567890123456789012uDZ93/QFmPwVOIlP0OGOw3lhm0iWegu', 'Phạm Anh Tuấn', 'student', '28211102415', 'Computer Science', 'K28 CMU TPM'),
('student5', 'student5@example.com', '$2b$10$1234567890123456789012uDZ93/QFmPwVOIlP0OGOw3lhm0iWegu', 'Trần Việt Anh', 'student', '28211144354', 'Computer Science', 'K28 CMU TPM');

-- Create sample LLM prompts
INSERT INTO llm_prompts (prompt_name, prompt_type, prompt_text, created_by) VALUES
('Generate Teaching Survey', 'survey_generation', 'Generate a comprehensive survey to evaluate teaching effectiveness for the following course: {{course_name}}. Include questions about teaching methods, materials, and instructor effectiveness. The questions should be appropriate for {{student_level}} students.', 1),
('Analyze Open Feedback', 'analysis', 'Analyze the following student feedback responses and identify common themes, sentiment, and actionable suggestions: {{feedback_text}}', 1),
('Summarize Survey Results', 'summary', 'Provide a concise summary of the following survey results, highlighting key findings, areas of strength, and opportunities for improvement: {{survey_results}}', 1),
('Generate Improvement Recommendations', 'recommendation', 'Based on the following survey analysis, provide specific recommendations for improving: {{analysis_results}}', 1);

-- Create sample survey template
INSERT INTO survey_templates (title, description, created_by, status) VALUES
('Đánh giá chất lượng giảng dạy', 'Mẫu khảo sát đánh giá chất lượng giảng dạy của giảng viên', 1, 'active');

-- Add sample questions to the template
INSERT INTO questions (survey_template_id, question_text, question_type_id, required, display_order) VALUES
(1, 'Giảng viên truyền đạt kiến thức rõ ràng và dễ hiểu?', 3, TRUE, 1),
(1, 'Giảng viên chuẩn bị bài giảng đầy đủ và chất lượng?', 3, TRUE, 2),
(1, 'Giảng viên khuyến khích sự tham gia và thảo luận của sinh viên?', 3, TRUE, 3),
(1, 'Tài liệu học tập được cung cấp có hữu ích và đầy đủ không?', 3, TRUE, 4),
(1, 'Bạn đánh giá cao điểm nào trong phương pháp giảng dạy của giảng viên?', 4, FALSE, 5),
(1, 'Những khía cạnh nào của môn học cần được cải thiện?', 4, FALSE, 6),
(1, 'Bạn muốn đề xuất điều gì để cải thiện chất lượng giảng dạy?', 4, FALSE, 7);

-- Add options for Likert scale questions
INSERT INTO question_options (question_id, option_text, display_order) VALUES
(1, '1 - Rất không hài lòng', 1),
(1, '2 - Không hài lòng', 2),
(1, '3 - Bình thường', 3),
(1, '4 - Hài lòng', 4),
(1, '5 - Rất hài lòng', 5),
(2, '1 - Rất không hài lòng', 1),
(2, '2 - Không hài lòng', 2),
(2, '3 - Bình thường', 3),
(2, '4 - Hài lòng', 4),
(2, '5 - Rất hài lòng', 5),
(3, '1 - Rất không hài lòng', 1),
(3, '2 - Không hài lòng', 2),
(3, '3 - Bình thường', 3),
(3, '4 - Hài lòng', 4),
(3, '5 - Rất hài lòng', 5),
(4, '1 - Rất không hài lòng', 1),
(4, '2 - Không hài lòng', 2),
(4, '3 - Bình thường', 3),
(4, '4 - Hài lòng', 4),
(4, '5 - Rất hài lòng', 5);

-- Create a sample active survey
INSERT INTO surveys (template_id, title, description, start_date, end_date, target_audience, created_by, status) VALUES
(1, 'Khảo sát đánh giá chất lượng giảng dạy Học kỳ 1/2025-2026', 'Khảo sát này nhằm thu thập ý kiến của sinh viên về chất lượng giảng dạy của giảng viên trong học kỳ 1 năm học 2025-2026', '2025-07-19 00:00:00', '2025-12-29 23:59:59', 'specific_class', 'K28 CMU TPM', 1, 'active');
