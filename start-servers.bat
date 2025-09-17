@echo off
echo ================================
echo   ALLMTAGS Survey System Startup  
echo ================================
echo.

echo 🔧 Configuration Check:
echo Backend Port: 5000
echo Frontend Port: 3001
echo Database: MySQL on localhost:3306
echo.

echo 📋 Startup Steps:
echo 1. Starting Backend Server...

cd /d "D:\NCKH\Backend"
start "Backend Server" cmd /k "set DB_USER=root && set DB_PASSWORD=Tuanpham@781 && set DB_NAME=NCKH && set DB_HOST=127.0.0.1 && set PORT=5000 && set JWT_SECRET=super-secret-jwt-key && npm start"

timeout /t 3 /nobreak > nul

echo 2. Starting Frontend Server...
cd /d "D:\NCKH\Frontend\AGS-react"
start "Frontend Server" cmd /k "npm start"

timeout /t 2 /nobreak > nul

echo.
echo ✅ Both servers starting...
echo 🌐 Frontend: http://localhost:3001
echo 🔧 Backend: http://localhost:5000
echo 📊 API Base: http://localhost:5000/api
echo.
echo 🧪 Test Accounts:
echo   Username: admin     Password: test123
echo   Username: teacher1  Password: test123  
echo   Username: student1  Password: test123
echo.
echo 💡 Tip: Wait 10-15 seconds for both servers to fully start
echo Press any key to exit this window...
pause > nul