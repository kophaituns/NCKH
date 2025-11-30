# 📊 Database Design Document - NCKH Survey System

**Version:** 1.0  
**Date:** 30/11/2025  
**Author:** Database Architecture Team  

---

## 🎯 Overview

Hệ thống NCKH Survey là một nền tảng khảo sát trực tuyến với tính năng AI tích hợp, hỗ trợ quản lý workspace và phân tích dữ liệu thông minh. Database được thiết kế để hỗ trợ:

- Quản lý người dùng và phân quyền đa cấp
- Tạo và quản lý khảo sát với AI hỗ trợ
- Hệ thống workspace cho team collaboration
- Thu thập và phân tích dữ liệu khảo sát
- Chat/messaging system với AI integration
- Notification và activity tracking

---

## 🏗️ Database Architecture

### Technology Stack
- **Database Engine:** MySQL 8.0+
- **ORM:** Sequelize (Node.js)
- **Connection Pool:** Yes
- **Charset:** UTF8MB4 (Unicode support)
- **Collation:** utf8mb4_unicode_ci

### Schema Overview
Database bao gồm **25 bảng chính** được chia thành 7 module:

1. **User Management (3 tables)**
2. **Survey Core (6 tables)**  
3. **Workspace System (5 tables)**
4. **Data Collection (4 tables)**
5. **Analytics & Reporting (2 tables)**
6. **Communication (3 tables)**
7. **System Management (2 tables)**

---

## 📋 Detailed Table Specifications

### 👤 1. USER MANAGEMENT MODULE

#### 1.1 Users Table
**Purpose:** Quản lý thông tin người dùng và phân quyền hệ thống

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID duy nhất |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Tên đăng nhập |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Email đăng nhập |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu đã hash (bcrypt) |
| `full_name` | VARCHAR(100) | NOT NULL | Họ và tên |
| `role` | ENUM | DEFAULT 'user' | Vai trò: admin, creator, user |
| `status` | ENUM | DEFAULT 'active' | Trạng thái: active, inactive, suspended |
| `email_verified` | BOOLEAN | DEFAULT false | Email đã xác thực |
| `profile_image` | VARCHAR(255) | NULL | URL avatar |
| `last_login_at` | TIMESTAMP | NULL | Lần đăng nhập cuối |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | Cập nhật cuối |

**Indexes:**
- PRIMARY: `id`
- UNIQUE: `email`, `username`
- INDEX: `role`, `status`, `created_at`

**Roles Definition:**
- `admin`: Quản trị hệ thống, full access
- `creator`: Tạo và quản lý khảo sát
- `user`: Tham gia khảo sát, view-only

#### 1.2 Notifications Table
**Purpose:** Hệ thống thông báo realtime

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID thông báo |
| `user_id` | INT | FOREIGN KEY → users.id | Người nhận |
| `type` | ENUM | NOT NULL | Loại: system, survey_invite, workspace, response |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề thông báo |
| `message` | TEXT | NOT NULL | Nội dung chi tiết |
| `data` | JSON | NULL | Dữ liệu bổ sung (metadata) |
| `is_read` | BOOLEAN | DEFAULT false | Đã đọc hay chưa |
| `priority` | ENUM | DEFAULT 'normal' | Độ ưu tiên: high, normal, low |
| `action_url` | VARCHAR(500) | NULL | Link hành động |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

**Indexes:**
- PRIMARY: `id`
- INDEX: `user_id`, `is_read`, `created_at`, `type`
- COMPOSITE: (`user_id`, `is_read`, `created_at`)

---

### 🎯 2. SURVEY CORE MODULE

#### 2.1 Survey Templates Table
**Purpose:** Template/mẫu khảo sát để tái sử dụng

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID template |
| `title` | VARCHAR(255) | NOT NULL | Tên template |
| `description` | TEXT | NULL | Mô tả template |
| `category` | VARCHAR(100) | NULL | Danh mục (HR, Marketing, Education...) |
| `tags` | JSON | NULL | Tags để search |
| `is_public` | BOOLEAN | DEFAULT false | Template công khai |
| `is_ai_generated` | BOOLEAN | DEFAULT false | Được tạo bởi AI |
| `usage_count` | INT | DEFAULT 0 | Số lần sử dụng |
| `created_by` | INT | FOREIGN KEY → users.id | Người tạo |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | Cập nhật cuối |

#### 2.2 Question Types Table
**Purpose:** Định nghĩa các loại câu hỏi hỗ trợ

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID loại câu hỏi |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Tên: text, multiple_choice, rating, etc. |
| `display_name` | VARCHAR(100) | NOT NULL | Tên hiển thị |
| `description` | TEXT | NULL | Mô tả loại câu hỏi |
| `has_options` | BOOLEAN | DEFAULT false | Có options hay không |
| `validation_rules` | JSON | NULL | Rules validation |
| `is_active` | BOOLEAN | DEFAULT true | Còn sử dụng hay không |

#### 2.3 Questions Table
**Purpose:** Câu hỏi trong template

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID câu hỏi |
| `template_id` | INT | FOREIGN KEY → survey_templates.id | Template chứa |
| `question_type_id` | INT | FOREIGN KEY → question_types.id | Loại câu hỏi |
| `question_text` | TEXT | NOT NULL | Nội dung câu hỏi |
| `order_index` | INT | DEFAULT 0 | Thứ tự hiển thị |
| `is_required` | BOOLEAN | DEFAULT false | Bắt buộc trả lời |
| `placeholder` | VARCHAR(255) | NULL | Placeholder text |
| `validation_rules` | JSON | NULL | Rules validation riêng |
| `conditional_logic` | JSON | NULL | Logic hiển thị có điều kiện |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | Cập nhật cuối |

#### 2.4 Question Options Table
**Purpose:** Lựa chọn cho câu hỏi multiple choice, checkbox...

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID option |
| `question_id` | INT | FOREIGN KEY → questions.id | Câu hỏi chứa |
| `option_text` | TEXT | NOT NULL | Nội dung lựa chọn |
| `option_value` | VARCHAR(255) | NULL | Giá trị để xử lý |
| `order_index` | INT | DEFAULT 0 | Thứ tự hiển thị |
| `is_default` | BOOLEAN | DEFAULT false | Lựa chọn mặc định |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

#### 2.5 Surveys Table
**Purpose:** Khảo sát thực tế được tạo từ template

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID khảo sát |
| `template_id` | INT | FOREIGN KEY → survey_templates.id | Template gốc |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề khảo sát |
| `description` | TEXT | NULL | Mô tả |
| `start_date` | TIMESTAMP | NULL | Ngày bắt đầu |
| `end_date` | TIMESTAMP | NULL | Ngày kết thúc |
| `status` | ENUM | DEFAULT 'draft' | Trạng thái: draft, active, paused, completed |
| `target_audience` | VARCHAR(100) | NULL | Đối tượng khảo sát |
| `target_value` | VARCHAR(255) | NULL | Giá trị đối tượng |
| `access_type` | ENUM | DEFAULT 'public' | Loại truy cập: public, public_with_login, private, internal |
| `require_login` | BOOLEAN | DEFAULT false | Yêu cầu đăng nhập |
| `allow_anonymous` | BOOLEAN | DEFAULT true | Cho phép ẩn danh |
| `workspace_id` | INT | FOREIGN KEY → workspaces.id | Workspace chứa |
| `created_by` | INT | FOREIGN KEY → users.id | Người tạo |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | Cập nhật cuối |

#### 2.6 Survey Collectors Table
**Purpose:** Quản lý các cách thu thập dữ liệu (link, QR, email...)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID collector |
| `survey_id` | INT | FOREIGN KEY → surveys.id | Khảo sát |
| `collector_type` | ENUM | DEFAULT 'web_link' | Loại: web_link, email, qr_code, embed |
| `name` | VARCHAR(255) | NOT NULL | Tên collector |
| `token` | VARCHAR(64) | UNIQUE, NOT NULL | Token truy cập |
| `is_active` | BOOLEAN | DEFAULT true | Còn hoạt động |
| `allow_multiple_responses` | BOOLEAN | DEFAULT false | Cho phép trả lời nhiều lần |
| `response_count` | INT | DEFAULT 0 | Số lượng phản hồi |
| `settings` | JSON | NULL | Cài đặt bổ sung |
| `created_by` | INT | FOREIGN KEY → users.id | Người tạo |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

---

### 🏢 3. WORKSPACE SYSTEM MODULE

#### 3.1 Workspaces Table
**Purpose:** Không gian làm việc nhóm

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID workspace |
| `name` | VARCHAR(255) | NOT NULL | Tên workspace |
| `description` | TEXT | NULL | Mô tả |
| `slug` | VARCHAR(100) | UNIQUE | URL slug |
| `owner_id` | INT | FOREIGN KEY → users.id | Chủ sở hữu |
| `settings` | JSON | NULL | Cài đặt workspace |
| `is_active` | BOOLEAN | DEFAULT true | Còn hoạt động |
| `member_count` | INT | DEFAULT 1 | Số lượng thành viên |
| `survey_count` | INT | DEFAULT 0 | Số lượng khảo sát |
| `storage_used` | BIGINT | DEFAULT 0 | Dung lượng sử dụng (bytes) |
| `storage_limit` | BIGINT | DEFAULT 1073741824 | Giới hạn lưu trữ (1GB) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | Cập nhật cuối |

#### 3.2 Workspace Members Table
**Purpose:** Thành viên workspace (legacy)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID membership |
| `workspace_id` | INT | FOREIGN KEY → workspaces.id | Workspace |
| `user_id` | INT | FOREIGN KEY → users.id | Thành viên |
| `role` | ENUM | DEFAULT 'member' | Vai trò: owner, admin, member, viewer |
| `permissions` | JSON | NULL | Quyền hạn chi tiết |
| `joined_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tham gia |
| `status` | ENUM | DEFAULT 'active' | Trạng thái: active, inactive |

#### 3.3 Workspace Users Table
**Purpose:** Hệ thống phân quyền workspace mới

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID |
| `workspace_id` | INT | FOREIGN KEY → workspaces.id | Workspace |
| `user_id` | INT | FOREIGN KEY → users.id | User |
| `role` | ENUM | DEFAULT 'member' | Vai trò |
| `access_level` | ENUM | DEFAULT 'read' | Mức truy cập: read, write, admin |
| `invited_by` | INT | FOREIGN KEY → users.id | Người mời |
| `joined_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tham gia |
| `is_active` | BOOLEAN | DEFAULT true | Còn hoạt động |

#### 3.4 Workspace Invitations Table
**Purpose:** Lời mời tham gia workspace

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID lời mời |
| `workspace_id` | INT | FOREIGN KEY → workspaces.id | Workspace |
| `email` | VARCHAR(100) | NOT NULL | Email được mời |
| `inviter_id` | INT | FOREIGN KEY → users.id | Người gửi lời mời |
| `role` | ENUM | DEFAULT 'member' | Vai trò dự kiến |
| `token` | VARCHAR(64) | UNIQUE, NOT NULL | Token xác thực |
| `status` | ENUM | DEFAULT 'pending' | Trạng thái: pending, accepted, declined, expired |
| `message` | TEXT | NULL | Tin nhắn kèm theo |
| `expires_at` | TIMESTAMP | NULL | Thời gian hết hạn |
| `responded_at` | TIMESTAMP | NULL | Thời gian phản hồi |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

#### 3.5 Workspace Activities Table
**Purpose:** Lịch sử hoạt động trong workspace

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID activity |
| `workspace_id` | INT | FOREIGN KEY → workspaces.id | Workspace |
| `user_id` | INT | FOREIGN KEY → users.id | Người thực hiện |
| `action_type` | VARCHAR(50) | NOT NULL | Loại hành động |
| `action_description` | TEXT | NOT NULL | Mô tả hành động |
| `target_type` | VARCHAR(50) | NULL | Loại đối tượng |
| `target_id` | INT | NULL | ID đối tượng |
| `metadata` | JSON | NULL | Dữ liệu bổ sung |
| `ip_address` | VARCHAR(45) | NULL | IP thực hiện |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian |

---

### 📝 4. DATA COLLECTION MODULE

#### 4.1 Survey Responses Table
**Purpose:** Phản hồi khảo sát từ người dùng

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID phản hồi |
| `survey_id` | INT | FOREIGN KEY → surveys.id | Khảo sát |
| `collector_id` | INT | FOREIGN KEY → survey_collectors.id | Collector |
| `respondent_id` | INT | FOREIGN KEY → users.id | Người trả lời (nếu có) |
| `session_id` | VARCHAR(100) | NULL | Session ID |
| `ip_address` | VARCHAR(45) | NULL | IP address |
| `user_agent` | TEXT | NULL | Browser info |
| `status` | ENUM | DEFAULT 'in_progress' | Trạng thái: in_progress, completed, abandoned |
| `start_time` | TIMESTAMP | DEFAULT NOW() | Thời gian bắt đầu |
| `completion_time` | TIMESTAMP | NULL | Thời gian hoàn thành |
| `time_spent` | INT | NULL | Thời gian làm (seconds) |
| `is_test_response` | BOOLEAN | DEFAULT false | Phản hồi test |
| `metadata` | JSON | NULL | Thông tin bổ sung |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

#### 4.2 Answers Table
**Purpose:** Câu trả lời chi tiết cho từng câu hỏi

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID câu trả lời |
| `survey_response_id` | INT | FOREIGN KEY → survey_responses.id | Phản hồi |
| `question_id` | INT | FOREIGN KEY → questions.id | Câu hỏi |
| `option_id` | INT | FOREIGN KEY → question_options.id | Option (nếu có) |
| `answer_text` | TEXT | NULL | Nội dung trả lời |
| `answer_numeric` | DECIMAL(10,2) | NULL | Giá trị số |
| `answer_json` | JSON | NULL | Dữ liệu phức tạp |
| `time_spent` | INT | NULL | Thời gian trả lời (seconds) |
| `is_skipped` | BOOLEAN | DEFAULT false | Bỏ qua câu hỏi |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

#### 4.3 Survey Invites Table
**Purpose:** Lời mời tham gia khảo sát cụ thể

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID lời mời |
| `survey_id` | INT | FOREIGN KEY → surveys.id | Khảo sát |
| `email` | VARCHAR(100) | NOT NULL | Email được mời |
| `token` | VARCHAR(64) | UNIQUE, NOT NULL | Token truy cập |
| `status` | ENUM | DEFAULT 'pending' | Trạng thái: pending, opened, completed |
| `sent_at` | TIMESTAMP | DEFAULT NOW() | Thời gian gửi |
| `opened_at` | TIMESTAMP | NULL | Thời gian mở |
| `completed_at` | TIMESTAMP | NULL | Thời gian hoàn thành |
| `reminder_count` | INT | DEFAULT 0 | Số lần nhắc nhở |
| `created_by` | INT | FOREIGN KEY → users.id | Người gửi |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

#### 4.4 Survey Access Table (Legacy)
**Purpose:** Hệ thống phân quyền khảo sát cũ

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID phân quyền |
| `survey_id` | INT | FOREIGN KEY → surveys.id | Khảo sát |
| `user_id` | INT | FOREIGN KEY → users.id | User được cấp quyền |
| `access_type` | ENUM | NOT NULL | Loại quyền: view, respond, manage |
| `granted_by` | INT | FOREIGN KEY → users.id | Người cấp quyền |
| `granted_at` | TIMESTAMP | DEFAULT NOW() | Thời gian cấp |
| `expires_at` | TIMESTAMP | NULL | Thời gian hết hạn |
| `is_active` | BOOLEAN | DEFAULT true | Còn hiệu lực |

---

### 📊 5. ANALYTICS & REPORTING MODULE

#### 5.1 Analysis Results Table
**Purpose:** Kết quả phân tích dữ liệu khảo sát

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID kết quả |
| `survey_id` | INT | FOREIGN KEY → surveys.id | Khảo sát |
| `analysis_type` | VARCHAR(50) | NOT NULL | Loại phân tích |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề báo cáo |
| `summary` | TEXT | NULL | Tóm tắt kết quả |
| `data` | JSON | NOT NULL | Dữ liệu chi tiết |
| `insights` | JSON | NULL | Insights từ AI |
| `charts_config` | JSON | NULL | Cấu hình biểu đồ |
| `generated_by` | ENUM | DEFAULT 'system' | Tạo bởi: system, ai, user |
| `is_public` | BOOLEAN | DEFAULT false | Công khai kết quả |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | Cập nhật cuối |

#### 5.2 Visualizations Table
**Purpose:** Cấu hình biểu đồ và visualization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID visualization |
| `survey_id` | INT | FOREIGN KEY → surveys.id | Khảo sát |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề biểu đồ |
| `chart_type` | VARCHAR(50) | NOT NULL | Loại biểu đồ: bar, pie, line, scatter |
| `config` | JSON | NOT NULL | Cấu hình biểu đồ |
| `data_query` | JSON | NULL | Query để lấy dữ liệu |
| `filters` | JSON | NULL | Bộ lọc |
| `order_index` | INT | DEFAULT 0 | Thứ tự hiển thị |
| `is_public` | BOOLEAN | DEFAULT false | Công khai |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | Cập nhật cuối |

---

### 💬 6. COMMUNICATION MODULE

#### 6.1 Chat Conversations Table
**Purpose:** Cuộc hội thoại với AI

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID cuộc hội thoại |
| `user_id` | INT | FOREIGN KEY → users.id | User |
| `title` | VARCHAR(255) | NULL | Tiêu đề hội thoại |
| `context` | ENUM | DEFAULT 'general' | Bối cảnh: general, survey_creation, analysis |
| `ai_model` | VARCHAR(50) | DEFAULT 'gemini' | Model AI: gemini, gpt, claude |
| `status` | ENUM | DEFAULT 'active' | Trạng thái: active, archived, deleted |
| `metadata` | JSON | NULL | Thông tin bổ sung |
| `message_count` | INT | DEFAULT 0 | Số tin nhắn |
| `last_message_at` | TIMESTAMP | NULL | Tin nhắn cuối |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | Cập nhật cuối |

#### 6.2 Chat Messages Table
**Purpose:** Tin nhắn trong cuộc hội thoại

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | ID tin nhắn |
| `conversation_id` | INT | FOREIGN KEY → chat_conversations.id | Cuộc hội thoại |
| `sender_type` | ENUM | NOT NULL | Người gửi: user, ai |
| `message` | TEXT | NOT NULL | Nội dung tin nhắn |
| `message_type` | ENUM | DEFAULT 'text' | Loại: text, image, file, survey |
| `attachments` | JSON | NULL | File đính kèm |
| `ai_metadata` | JSON | NULL | Metadata từ AI |
| `tokens_used` | INT | NULL | Số token sử dụng |
| `response_time` | INT | NULL | Thời gian phản hồi (ms) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian tạo |

---

### ⚙️ 7. SYSTEM MANAGEMENT MODULE

#### 7.1 Audit Logs Table (Future)
**Purpose:** Audit trail cho hệ thống

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID log |
| `user_id` | INT | FOREIGN KEY → users.id | User thực hiện |
| `action` | VARCHAR(100) | NOT NULL | Hành động |
| `resource_type` | VARCHAR(50) | NOT NULL | Loại resource |
| `resource_id` | VARCHAR(50) | NULL | ID resource |
| `ip_address` | VARCHAR(45) | NULL | IP address |
| `user_agent` | TEXT | NULL | User agent |
| `details` | JSON | NULL | Chi tiết |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian |

#### 7.2 System Settings Table (Future)
**Purpose:** Cài đặt hệ thống

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | VARCHAR(100) | PRIMARY KEY | Khóa setting |
| `value` | TEXT | NOT NULL | Giá trị |
| `type` | ENUM | DEFAULT 'string' | Kiểu dữ liệu: string, number, boolean, json |
| `description` | TEXT | NULL | Mô tả |
| `is_public` | BOOLEAN | DEFAULT false | Public setting |
| `updated_by` | INT | FOREIGN KEY → users.id | Người cập nhật |
| `updated_at` | TIMESTAMP | ON UPDATE NOW() | Thời gian cập nhật |

---

## 🔗 Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Users    │────│ Workspaces  │────│   Surveys   │
│             │    │             │    │             │
│ • id (PK)   │    │ • id (PK)   │    │ • id (PK)   │
│ • username  │    │ • name      │    │ • title     │
│ • email     │    │ • owner_id  │    │ • template_id│
│ • role      │    │   (FK)      │    │ • workspace_│
│             │    │             │    │   id (FK)   │
└─────────────┘    └─────────────┘    └─────────────┘
        │                  │                  │
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Notifications│    │Workspace    │    │Survey       │
│             │    │Members      │    │Responses    │
│ • user_id   │    │             │    │             │
│   (FK)      │    │ • user_id   │    │ • survey_id │
│             │    │   (FK)      │    │   (FK)      │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Key Relationships:

1. **User → Multiple Entities** (1:N)
   - Users have many Surveys, Workspaces, Notifications
   - Users belong to many Workspaces (through WorkspaceMembers)

2. **Survey Hierarchy** (1:N)
   - SurveyTemplate → Questions → QuestionOptions
   - Survey → SurveyResponses → Answers

3. **Workspace System** (1:N)
   - Workspace → Members, Activities, Surveys
   - WorkspaceInvitation → WorkspaceMember (lifecycle)

4. **Data Collection Chain**
   - Survey → SurveyCollector → SurveyResponse → Answer

---

## 🔒 Security & Access Control

### Data Security
- **Password Hashing:** bcrypt with salt rounds ≥ 12
- **Token Security:** 64-character random tokens for sensitive operations
- **Data Encryption:** Sensitive JSON fields encrypted at application level
- **SQL Injection:** Prevented through Sequelize ORM
- **XSS Protection:** Input sanitization and output encoding

### Access Control Levels

#### System Level
- `admin`: Full system access
- `creator`: Survey creation and management
- `user`: Survey participation only

#### Workspace Level
- `owner`: Full workspace control
- `admin`: Management except ownership transfer
- `member`: Standard access
- `viewer`: Read-only access

#### Survey Level
- `public`: Anyone can access
- `public_with_login`: Requires login
- `private`: Invite-only
- `internal`: Workspace members only

### Data Privacy
- **GDPR Compliance:** User data deletion and export capabilities
- **Anonymous Responses:** IP masking and session isolation
- **Data Retention:** Configurable retention policies
- **Audit Trail:** Complete action logging for compliance

---

## 🚀 Performance Optimization

### Database Indexing Strategy

#### Primary Indexes
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_status ON users(role, status);

-- Survey performance  
CREATE INDEX idx_surveys_status_dates ON surveys(status, start_date, end_date);
CREATE INDEX idx_surveys_workspace ON surveys(workspace_id, status);
CREATE INDEX idx_surveys_creator ON surveys(created_by, status);

-- Response analytics
CREATE INDEX idx_responses_survey_status ON survey_responses(survey_id, status);
CREATE INDEX idx_responses_completion ON survey_responses(completion_time, status);
CREATE INDEX idx_answers_question ON answers(question_id, survey_response_id);

-- Workspace performance
CREATE INDEX idx_workspace_members_active ON workspace_members(workspace_id, status);
CREATE INDEX idx_workspace_activities_recent ON workspace_activities(workspace_id, created_at);

-- Notification performance
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
```

#### Composite Indexes
```sql
-- Complex queries optimization
CREATE INDEX idx_survey_response_analytics ON survey_responses(survey_id, status, completion_time);
CREATE INDEX idx_user_workspace_access ON workspace_members(user_id, workspace_id, status);
CREATE INDEX idx_question_template_order ON questions(template_id, order_index);
```

### Query Optimization
- **Pagination:** LIMIT/OFFSET with cursor-based pagination for large datasets
- **Eager Loading:** Optimized Sequelize includes to prevent N+1 queries
- **Connection Pooling:** Min 5, Max 20 connections per environment
- **Query Caching:** Redis cache for frequently accessed data

### Scaling Strategies
- **Read Replicas:** For analytics and reporting queries
- **Horizontal Partitioning:** Survey responses by date ranges
- **Archive Strategy:** Old responses moved to archive tables
- **CDN Integration:** Static assets and file uploads

---

## 📈 Monitoring & Maintenance

### Key Metrics
- **Response Time:** < 200ms for 95% of queries
- **Throughput:** 1000+ concurrent survey responses
- **Storage Growth:** ~10GB per 100k responses
- **Connection Pool:** Monitor usage patterns

### Maintenance Tasks
- **Daily:** Backup, log rotation, index optimization
- **Weekly:** Statistics update, cleanup expired tokens
- **Monthly:** Archive old data, performance review
- **Quarterly:** Full database optimization, capacity planning

### Backup Strategy
- **Full Backup:** Daily at 2 AM
- **Incremental:** Every 4 hours
- **Point-in-Time Recovery:** 1-minute granularity
- **Retention:** 30 days full, 1 year incremental
- **Cross-Region:** Backup replication for disaster recovery

---

## 🛠️ Migration & Deployment

### Database Versioning
- **Migration Files:** Sequelize migrations with rollback capability
- **Environment Sync:** Dev → Staging → Production pipeline
- **Schema Validation:** Automated checks before deployment
- **Zero Downtime:** Online schema changes when possible

### Deployment Checklist
1. **Pre-deployment:** Backup, migration dry-run, rollback plan
2. **Migration:** Execute in maintenance window
3. **Validation:** Data integrity checks, performance verification  
4. **Post-deployment:** Monitor logs, metrics, user feedback
5. **Rollback Plan:** Ready within 15 minutes if needed

---

## 📚 Additional Resources

### Documentation Links
- [API Documentation](./api-docs.md)
- [Migration Guide](./migration-guide.md)
- [Performance Tuning](./performance-tuning.md)
- [Security Guidelines](./security-guidelines.md)

### Contact Information
- **Database Team:** db-team@nckh.vn
- **DevOps Team:** devops@nckh.vn
- **Emergency:** +84-xxx-xxx-xxxx (24/7)

---

*Document Version: 1.0 | Last Updated: 30/11/2025 | Next Review: 30/01/2026*