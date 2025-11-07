# 🚀 QUICK FIX GUIDE - Login Issues

## ✅ **PROBLEM SOLVED**

Login was failing due to invalid password hashes in database.

---

## 🔑 **CURRENT WORKING CREDENTIALS**

**Password for all accounts:** `test123`

| Username | Role | Email |
|----------|------|-------|
| `admin` | admin | admin@example.com |
| `creator1` | creator | creator@example.com |
| `user1` | user | user1@example.com |
| `user2` | user | user2@example.com |
| `user3` | user | user3@example.com |

---

## 🔧 **IF LOGIN FAILS AGAIN**

Run this command to fix all passwords:

```bash
cd Backend
node scripts/fix-passwords-direct.js
```

This will:
- ✅ Connect to MySQL database
- ✅ Hash password `test123` properly with bcrypt
- ✅ Update all user accounts
- ✅ Verify each update

---

## 🧪 **TEST LOGIN**

### Using PowerShell:
```powershell
$body = @{username='admin'; password='test123'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:5000/api/modules/auth/login' -Method POST -Body $body -ContentType 'application/json'
```

### Using Browser:
Open `test-login.html` and try:
- Username: `admin`
- Password: `test123`

---

## 📁 **IMPORTANT FILES**

- `Backend/scripts/fix-passwords-direct.js` - Password fix script
- `TAI_KHOAN_TEST.md` - Complete credentials documentation
- `LOGIN_PASSWORD_FIX.md` - Detailed fix report
- `Docker/init.sql` - Updated with correct hashes

---

**Status:** ✅ All accounts working  
**Last Updated:** November 7, 2025
