@echo off
echo ================================
echo      API Connection Test
echo ================================
echo.

echo Testing Backend Server Connection...
echo.

echo 1. Testing Base URL (http://localhost:5000)
curl -s -w "Status: %%{http_code}\n" http://localhost:5000 -o nul
if %errorlevel% neq 0 (
    echo ❌ Backend server not responding on port 5000
    echo Make sure backend is running: npm start in Backend directory
    goto :end
)

echo.
echo 2. Testing API Health (http://localhost:5000/api/health)
curl -s -w "Status: %%{http_code}\n" http://localhost:5000/api/health
echo.

echo 3. Testing Auth Login Endpoint (http://localhost:5000/api/auth/login)
curl -s -w "Status: %%{http_code}\n" -X POST ^
     -H "Content-Type: application/json" ^
     -d "{\"username\":\"test\",\"password\":\"test\"}" ^
     http://localhost:5000/api/auth/login
echo.

echo 4. Testing CORS Headers
curl -s -I -X OPTIONS ^
     -H "Origin: http://localhost:3001" ^
     -H "Access-Control-Request-Method: POST" ^
     -H "Access-Control-Request-Headers: Content-Type" ^
     http://localhost:5000/api/auth/login
echo.

echo ================================
echo   Frontend Connection Test  
echo ================================
echo.

echo Testing Frontend Server (http://localhost:3001)
curl -s -w "Status: %%{http_code}\n" http://localhost:3001 -o nul
if %errorlevel% neq 0 (
    echo ❌ Frontend server not responding on port 3001
    echo Make sure frontend is running: npm start in Frontend/AGS-react directory
) else (
    echo ✅ Frontend server responding
)

:end
echo.
echo Test completed. Press any key to exit...
pause > nul