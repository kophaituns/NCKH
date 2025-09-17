# ALLMTAGS Survey System - Test Accounts

## 🎯 Tài khoản đã được tạo thành công!

### 👨‍💼 ADMIN ACCOUNTS
```
Username: admin
Email: admin@example.com  
Password: admin123
Role: Administrator
Full Name: System Administrator
```

### 👨‍🏫 TEACHER ACCOUNTS

#### Teacher 1
```
Username: teacher1
Email: teacher1@example.com
Password: teacher123
Role: Teacher
Full Name: Nguyễn Văn A
Faculty: Công nghệ thông tin
```

#### Teacher 2
```
Username: teacher2
Email: teacher2@example.com
Password: teacher123
Role: Teacher
Full Name: Trần Thị B
Faculty: Kỹ thuật phần mềm
```

### 🎓 STUDENT ACCOUNTS

#### Student 1
```
Username: student1
Email: student1@example.com
Password: student123
Role: Student
Full Name: Lê Văn C
Student ID: SV001
Faculty: Công nghệ thông tin
Class: IT01
```

#### Student 2
```
Username: student2
Email: student2@example.com
Password: student123
Role: Student
Full Name: Phạm Thị D
Student ID: SV002
Faculty: Kỹ thuật phần mềm
Class: SE01
```

#### Student 3
```
Username: student3
Email: student3@example.com
Password: student123
Role: Student
Full Name: Hoàng Văn E
Student ID: SV003
Faculty: Công nghệ thông tin
Class: IT02
```

## 🚀 Cách sử dụng:

1. **Đăng nhập bằng EMAIL hoặc USERNAME:**
   - Frontend có thể nhận cả email và username
   - Backend sẽ tìm kiếm theo cả hai

2. **Test các role khác nhau:**
   - Admin: Toàn quyền quản lý hệ thống
   - Teacher: Tạo và quản lý survey, xem kết quả
   - Student: Tham gia làm survey

3. **Ví dụ đăng nhập:**
   ```
   Email/Username: admin@example.com hoặc admin
   Password: admin123
   ```

## 🔧 Commands để tạo lại accounts:

```bash
cd d:\NCKH\Backend
node create-test-accounts.js
```

**Lưu ý:** Script sẽ skip tài khoản nếu đã tồn tại, không tạo duplicate.