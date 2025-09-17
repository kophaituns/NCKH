# BẢNG THIẾT KẾ VẬT LÝ DATABASE - LLM SURVEY SYSTEM

## 📊 ENTITY RELATIONSHIP DIAGRAM (ERD)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     USERS       │     │ SURVEY_TEMPLATES│     │ QUESTION_TYPES  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────→│ created_by (FK) │     │ id (PK)         │
│ username        │     │ id (PK)         │     │ type_name       │
│ email           │     │ title           │     │ description     │
│ password        │     │ description     │     └─────────────────┘
│ full_name       │     │ status          │              │
│ role            │     │ created_at      │              │
│ student_id      │     │ updated_at      │              │
│ faculty         │     └─────────────────┘              │
│ class_name      │              │                       │
│ created_at      │              │                       │
│ updated_at      │              ▼                       │
└─────────────────┘     ┌─────────────────┐              │
         │               │   QUESTIONS     │              │
         │               ├─────────────────┤              │
         │               │ id (PK)         │              │
         │               │ survey_template_│◄─────────────┘
         │               │   _id (FK)      │
         │               │ question_text   │
         │               │ question_type_  │
         │               │   id (FK)       │
         │               │ required        │
         │               │ display_order   │
         │               │ created_at      │
         │               │ updated_at      │
         │               └─────────────────┘
         │                        │
         │                        ▼
         │               ┌─────────────────┐
         │               │QUESTION_OPTIONS │
         │               ├─────────────────┤
         │               │ id (PK)         │
         │               │ question_id (FK)│
         │               │ option_text     │
         │               │ display_order   │
         │               └─────────────────┘
         │                        │
         │                        │
         ▼                        │
┌─────────────────┐              │
│    SURVEYS      │              │
├─────────────────┤              │
│ id (PK)         │              │
│ template_id (FK)│              │
│ title           │              │
│ description     │              │
│ start_date      │              │
│ end_date        │              │
│ target_audience │              │
│ target_value    │              │
│ created_by (FK) │              │
│ status          │              │
│ created_at      │              │
│ updated_at      │              │
└─────────────────┘              │
         │                       │
         ▼                       │
┌─────────────────┐              │
│SURVEY_RESPONSES │              │
├─────────────────┤              │
│ id (PK)         │              │
│ survey_id (FK)  │              │
│ respondent_id   │              │
│   (FK)          │              │
│ start_time      │              │
│ completion_time │              │
│ status          │              │
│ created_at      │              │
│ updated_at      │              │
└─────────────────┘              │
         │                       │
         ▼                       │
┌─────────────────┐              │
│    ANSWERS      │              │
├─────────────────┤              │
│ id (PK)         │              │
│ survey_response_│              │
│   _id (FK)      │              │
│ question_id (FK)│◄─────────────┘
│ option_id (FK)  │
│ text_answer     │
│ numeric_answer  │
│ created_at      │
└─────────────────┘
```

## 🗄️ CHI TIẾT CÁC BẢNG

### 1. **USERS** - Quản lý người dùng
```sql
TABLE: users
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── username          VARCHAR(50) NOT NULL UNIQUE
├── email             VARCHAR(100) NOT NULL UNIQUE
├── password          VARCHAR(255) NOT NULL
├── full_name         VARCHAR(100) NOT NULL
├── role              ENUM('admin', 'teacher', 'student') DEFAULT 'student'
├── student_id        VARCHAR(20) NULL
├── faculty           VARCHAR(100) NULL
├── class_name        VARCHAR(50) NULL
├── created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
└── updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

INDEXES:
- PRIMARY KEY (id)
- UNIQUE KEY (username)
- UNIQUE KEY (email)
- INDEX (role)
- INDEX (faculty)
```

### 2. **SURVEY_TEMPLATES** - Mẫu khảo sát
```sql
TABLE: survey_templates
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── title             VARCHAR(255) NOT NULL
├── description       TEXT NULL
├── created_by        INT NOT NULL
├── status            ENUM('draft', 'active', 'archived') DEFAULT 'draft'
├── created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
└── updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

FOREIGN KEYS:
- created_by → users(id) ON DELETE CASCADE

INDEXES:
- PRIMARY KEY (id)
- INDEX (created_by)
- INDEX (status)
```

### 3. **QUESTION_TYPES** - Loại câu hỏi
```sql
TABLE: question_types
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── type_name         VARCHAR(50) NOT NULL UNIQUE
└── description       TEXT NULL

DATA:
1. 'multiple_choice' - Multiple choice questions with single selection
2. 'checkbox' - Multiple choice questions with multiple selections  
3. 'likert_scale' - Rating scale questions (e.g., 1-5)
4. 'open_ended' - Text response questions
5. 'dropdown' - Dropdown selection questions

INDEXES:
- PRIMARY KEY (id)
- UNIQUE KEY (type_name)
```

### 4. **QUESTIONS** - Câu hỏi trong mẫu
```sql
TABLE: questions
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── survey_template_id INT NOT NULL
├── question_text     TEXT NOT NULL
├── question_type_id  INT NOT NULL
├── required          BOOLEAN DEFAULT FALSE
├── display_order     INT DEFAULT 0
├── created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
└── updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

FOREIGN KEYS:
- survey_template_id → survey_templates(id) ON DELETE CASCADE
- question_type_id → question_types(id)

INDEXES:
- PRIMARY KEY (id)
- INDEX (survey_template_id)
- INDEX (question_type_id)
- INDEX (display_order)
```

### 5. **QUESTION_OPTIONS** - Các lựa chọn cho câu hỏi
```sql
TABLE: question_options
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── question_id       INT NOT NULL
├── option_text       TEXT NOT NULL
└── display_order     INT DEFAULT 0

FOREIGN KEYS:
- question_id → questions(id) ON DELETE CASCADE

INDEXES:
- PRIMARY KEY (id)
- INDEX (question_id)
- INDEX (display_order)
```

### 6. **SURVEYS** - Khảo sát thực tế
```sql
TABLE: surveys
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── template_id       INT NOT NULL
├── title             VARCHAR(255) NOT NULL
├── description       TEXT NULL
├── start_date        DATETIME NOT NULL
├── end_date          DATETIME NOT NULL
├── target_audience   ENUM('all_students', 'specific_faculty', 'specific_class') DEFAULT 'all_students'
├── target_value      VARCHAR(100) NULL
├── created_by        INT NOT NULL
├── status            ENUM('draft', 'active', 'closed', 'analyzed') DEFAULT 'draft'
├── created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
└── updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

FOREIGN KEYS:
- template_id → survey_templates(id)
- created_by → users(id)

INDEXES:
- PRIMARY KEY (id)
- INDEX (template_id)
- INDEX (created_by)
- INDEX (status)
- INDEX (start_date, end_date)
- INDEX (target_audience)
```

### 7. **SURVEY_RESPONSES** - Phản hồi khảo sát
```sql
TABLE: survey_responses
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── survey_id         INT NOT NULL
├── respondent_id     INT NOT NULL
├── start_time        DATETIME NULL
├── completion_time   DATETIME NULL
├── status            ENUM('started', 'completed', 'abandoned') DEFAULT 'started'
├── created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
└── updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

FOREIGN KEYS:
- survey_id → surveys(id) ON DELETE CASCADE
- respondent_id → users(id)

INDEXES:
- PRIMARY KEY (id)
- INDEX (survey_id)
- INDEX (respondent_id)
- INDEX (status)
- UNIQUE KEY (survey_id, respondent_id)
```

### 8. **ANSWERS** - Câu trả lời chi tiết
```sql
TABLE: answers
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── survey_response_id INT NOT NULL
├── question_id       INT NOT NULL
├── option_id         INT NULL              -- For multiple choice, checkbox, dropdown
├── text_answer       TEXT NULL             -- For open-ended questions
├── numeric_answer    INT NULL              -- For likert scale questions
└── created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP

FOREIGN KEYS:
- survey_response_id → survey_responses(id) ON DELETE CASCADE
- question_id → questions(id)
- option_id → question_options(id)

INDEXES:
- PRIMARY KEY (id)
- INDEX (survey_response_id)
- INDEX (question_id)
- INDEX (option_id)
```

## 🤖 AI/LLM RELATED TABLES

### 9. **ANALYSIS_RESULTS** - Kết quả phân tích AI
```sql
TABLE: analysis_results
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── survey_id         INT NOT NULL
├── analysis_type     ENUM('sentiment', 'theme_extraction', 'summary', 'comparison') NOT NULL
├── result_data       JSON NOT NULL         -- Store analysis results as JSON
└── generated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP

FOREIGN KEYS:
- survey_id → surveys(id) ON DELETE CASCADE

INDEXES:
- PRIMARY KEY (id)
- INDEX (survey_id)
- INDEX (analysis_type)
```

### 10. **VISUALIZATIONS** - Cấu hình biểu đồ
```sql
TABLE: visualizations
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── survey_id         INT NOT NULL
├── visualization_type ENUM('bar_chart', 'pie_chart', 'line_chart', 'word_cloud', 'heatmap') NOT NULL
├── title             VARCHAR(255) NOT NULL
├── description       TEXT NULL
├── config_data       JSON NOT NULL         -- Store visualization configuration as JSON
├── created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
└── updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

FOREIGN KEYS:
- survey_id → surveys(id) ON DELETE CASCADE

INDEXES:
- PRIMARY KEY (id)
- INDEX (survey_id)
- INDEX (visualization_type)
```

### 11. **LLM_PROMPTS** - Mẫu prompt cho LLM
```sql
TABLE: llm_prompts
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── prompt_name       VARCHAR(100) NOT NULL
├── prompt_type       ENUM('survey_generation', 'analysis', 'summary', 'recommendation') NOT NULL
├── prompt_text       TEXT NOT NULL
├── created_by        INT NOT NULL
├── created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
└── updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

FOREIGN KEYS:
- created_by → users(id)

INDEXES:
- PRIMARY KEY (id)
- INDEX (prompt_type)
- INDEX (created_by)
```

### 12. **LLM_INTERACTIONS** - Lịch sử tương tác LLM
```sql
TABLE: llm_interactions
├── id                INT AUTO_INCREMENT PRIMARY KEY
├── prompt_id         INT NULL
├── custom_prompt     TEXT NULL
├── response          TEXT NOT NULL
├── tokens_used       INT NULL
├── model_used        VARCHAR(50) NOT NULL
├── user_id           INT NOT NULL
├── interaction_type  ENUM('survey_generation', 'analysis', 'summary', 'recommendation') NOT NULL
└── created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP

FOREIGN KEYS:
- prompt_id → llm_prompts(id)
- user_id → users(id)

INDEXES:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (interaction_type)
- INDEX (model_used)
- INDEX (created_at)
```

## 🔐 BẢO MẬT VÀ RÀNG BUỘC

### **Constraints & Rules:**
1. **User Authentication**: Password được hash bằng bcrypt
2. **Role-based Access**: Admin > Teacher > Student hierarchy
3. **Survey Targeting**: Students chỉ thấy surveys phù hợp với faculty/class
4. **Response Integrity**: Mỗi user chỉ trả lời 1 lần cho 1 survey
5. **Cascading Deletes**: Xóa parent record sẽ xóa related records
6. **Data Validation**: Email format, required fields, enum values

### **Performance Optimizations:**
1. **Proper Indexing**: Tất cả foreign keys đều có index
2. **Composite Indexes**: survey_id + respondent_id cho fast lookup
3. **JSON Storage**: Flexible data storage cho analysis results
4. **Timestamp Tracking**: Audit trail cho tất cả operations

## 📈 WORKFLOW DATA FLOW

```
1. ADMIN/TEACHER tạo SURVEY_TEMPLATE với QUESTIONS
2. ADMIN/TEACHER tạo SURVEY từ TEMPLATE
3. STUDENTS trả lời SURVEY → tạo SURVEY_RESPONSE + ANSWERS
4. LLM phân tích ANSWERS → tạo ANALYSIS_RESULTS
5. System tạo VISUALIZATIONS từ data
6. LLM_INTERACTIONS log tất cả AI calls
```

## 🎯 KẾT LUẬN

Database được thiết kế với:
- ✅ **Normalized Structure**: Loại bỏ data redundancy
- ✅ **Scalability**: Support millions of responses
- ✅ **Flexibility**: JSON fields cho complex data
- ✅ **Performance**: Optimized indexes
- ✅ **Security**: Role-based access control
- ✅ **AI Integration**: Built-in LLM interaction tracking
- ✅ **Analytics Ready**: Support cho multiple analysis types