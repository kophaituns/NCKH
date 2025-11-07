# 🚀 HƯỚNG DẪN NHANH - KHỞI ĐỘNG HỆ THỐNG

## ✅ Tài Khoản Đã Tạo

Đã tạo thành công **8 tài khoản test** với mật khẩu: `pass123`

### 👥 Danh Sách Tài Khoản

| Username | Role | Full Name | Email |
|----------|------|-----------|-------|
| **admin1** | admin | Admin User | admin1@example.com |
| **admin2** | admin | Admin Two | admin2@example.com |
| **creator1** ⭐ | creator | Creator One | creator1@example.com |
| **creator2** | creator | Creator Two | creator2@example.com |
| **creator3** | creator | Creator Three | creator3@example.com |
| **user1** | user | User One | user1@example.com |
| **user2** | user | User Two | user2@example.com |
| **user3** | user | User Three | user3@example.com |

**Password cho tất cả:** `pass123`

---

## 🚀 Khởi Động Hệ Thống

### 1️⃣ Khởi động Backend

Mở terminal mới và chạy:

```powershell
cd d:\NCKH\Backend
npm start
```

Đợi thông báo:
```
✔ Server is running on port 5000
✔ Database: Connected
```

---

### 2️⃣ Khởi động Frontend

Mở terminal khác và chạy:

```powershell
cd d:\NCKH\Frontend
npm start
```

Trình duyệt sẽ tự động mở: `http://localhost:3000`

---

## 🔐 Đăng Nhập

1. Truy cập: http://localhost:3000
2. Click "Login" hoặc vào: http://localhost:3000/auth/login
3. Nhập thông tin:
   - **Username:** `creator1`
   - **Password:** `pass123`
4. Click "Login"

---

## 🧪 Test API Trực Tiếp (Optional)

### Kiểm tra Backend đang chạy:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/health"
```

### Test Login:
```powershell
$body = @{ username = "creator1"; password = "pass123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
```

---

## 📝 Quyền Hạn Theo Role

### 🔴 Admin
- Toàn quyền quản trị hệ thống
- Quản lý users
- Xem tất cả surveys

### 🟡 Creator
- Tạo và quản lý surveys
- Tạo templates
- Xem responses
- Export data

### 🟢 User
- Trả lời surveys
- Xem surveys được giao
- Xem kết quả của mình

---

## 🔄 Reset Tài Khoản (Nếu Cần)

Nếu cần xóa và tạo lại tài khoản:

```powershell
cd d:\NCKH\Backend
node reset-test-users.js
```

---

## ⚠️ Troubleshooting

### Lỗi: Backend không khởi động
```powershell
# Kiểm tra MySQL đang chạy
Get-Service | Where-Object {$_.Name -like "*mysql*"}

# Kiểm tra .env file
cat d:\NCKH\Backend\.env
```

### Lỗi: Frontend không build
```powershell
cd d:\NCKH\Frontend
npm install
npm start
```

### Lỗi: "Invalid credentials"
- Chắc chắn đã chạy `reset-test-users.js`
- Kiểm tra username và password (không có khoảng trắng)
- Password phải là: `pass123`

---

## 📌 Quick Start (Copy & Paste)

```powershell
# Terminal 1 - Backend
cd d:\NCKH\Backend
npm start

# Terminal 2 - Frontend (mở terminal mới)
cd d:\NCKH\Frontend
npm start

# Sau đó login với: creator1 / pass123
```

---

**🎉 Chúc bạn test thành công!**
