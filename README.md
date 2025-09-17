# ALLMTAGS - AI-Powered Survey Generation System

## 🎯 Tổng quan
ALLMTAGS (Applying Large Language Models to Automatically Generate Surveys) là hệ thống khảo sát thông minh sử dụng AI để tự động tạo và phân tích các cuộc khảo sát trong lĩnh vực giáo dục.

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 18.3.1** - UI Framework
- **TypeScript 5.5.3** - Type safety
- **Bootstrap 5.3.3** - CSS Framework
- **SCSS/Sass 1.79.4** - CSS Preprocessing
- **FontAwesome 6.6.0** - Icons
- **React Router 6** - Navigation

### Backend
- **Node.js** - Server Runtime
- **Express.js** - Web Framework
- **MySQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **bcrypt** - Password Hashing

## 🚀 Hướng dẫn cài đặt

### 1. Chuẩn bị
- Node.js (v16 trở lên)
- MySQL Server
- Git

### 2. Cài đặt Backend
```bash
cd d:\NCKH\Backend
npm install
node src/index.js
```

### 3. Cài đặt Frontend
```bash
cd d:\NCKH\Frontend\hms-react
npm install
npm start
```

### 4. Cài đặt Database
```bash
# Sử dụng Docker
cd d:\NCKH\Docker
docker-compose up -d

# Hoặc import trực tiếp vào MySQL
mysql -u root -p < init.sql
```

## 👥 Tài khoản mẫu

### Admin
- **Username:** admin
- **Password:** 123456
- **Role:** Administrator (Quản lý toàn bộ hệ thống)

### Teacher
- **Username:** teacher
- **Password:** 123456
- **Role:** Teacher (Tạo và quản lý khảo sát)

### Students
- **Username:** student1, student2, student3, student4, student5
- **Password:** 123456 (cho tất cả)
- **Role:** Student (Tham gia khảo sát)

## 🌟 Tính năng chính

### 1. Quản lý người dùng
- Đăng ký/Đăng nhập
- Phân quyền theo vai trò (Admin, Teacher, Student)
- Quản lý thông tin cá nhân

### 2. Tạo khảo sát với AI
- Sử dụng LLM để tạo câu hỏi tự động
- Nhiều loại câu hỏi: Trắc nghiệm, Likert Scale, Tự luận
- Tùy chỉnh và chỉnh sửa câu hỏi

### 3. Quản lý khảo sát
- Tạo mẫu khảo sát
- Lên lịch khảo sát
- Phân phối theo nhóm đối tượng

### 4. Phân tích kết quả
- Phân tích sentiment với AI
- Trích xuất chủ đề chính
- Báo cáo và khuyến nghị cải thiện

### 5. Trực quan hóa dữ liệu
- Biểu đồ tròn, cột, đường
- Word cloud
- Heatmap

## 📱 Giao diện
- **Responsive Design** - Tương thích mọi thiết bị
- **Modern UI** - Sử dụng Bootstrap 5
- **Dark/Light Theme** - Hỗ trợ chế độ tối/sáng
- **Professional Look** - Thiết kế chuyên nghiệp

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/logout` - Đăng xuất

### Surveys
- `GET /api/surveys` - Lấy danh sách khảo sát
- `POST /api/surveys` - Tạo khảo sát mới
- `PUT /api/surveys/:id` - Cập nhật khảo sát
- `DELETE /api/surveys/:id` - Xóa khảo sát

### LLM Integration
- `POST /api/llm/generate-questions` - Tạo câu hỏi với AI
- `POST /api/llm/analyze-responses` - Phân tích phản hồi

## 📊 Database Schema
Hệ thống sử dụng MySQL với các bảng chính:
- `users` - Thông tin người dùng
- `surveys` - Thông tin khảo sát
- `questions` - Câu hỏi
- `survey_responses` - Phản hồi khảo sát
- `llm_interactions` - Lịch sử tương tác AI

## 🔧 Cấu hình

### Environment Variables
```env
# Backend (.env)
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=llm_survey_db
JWT_SECRET=your_jwt_secret
```

## 📝 Hướng dẫn sử dụng

1. **Đăng nhập** với tài khoản admin/teacher/student
2. **Dashboard** - Xem tổng quan hệ thống
3. **Tạo khảo sát** - Sử dụng AI để tự động tạo câu hỏi
4. **Quản lý khảo sát** - Lên lịch và phân phối
5. **Xem kết quả** - Phân tích và trực quan hóa dữ liệu

## 🚀 Triển khai Production

### Docker
```bash
cd d:\NCKH
docker-compose up --build
```

### Manual Deploy
1. Build Frontend: `npm run build`
2. Configure nginx cho static files
3. Setup PM2 cho Backend
4. Configure MySQL với backup

## 🤝 Đóng góp
1. Fork project
2. Tạo feature branch
3. Commit changes
4. Create Pull Request

## 📄 License
MIT License - Xem file LICENSE để biết thêm chi tiết

## 👨‍💻 Nhóm phát triển
- **Team:** Nhóm Nghiên cứu ALLMTAGS
- **Email:** contact@allmtags.edu.vn

---

🌟 **Hệ thống ALLMTAGS - Cách mạng hóa khảo sát giáo dục với AI!** 🌟