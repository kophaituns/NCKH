# System Health Check Script
# Verifies backend and frontend are properly configured

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🔍 SYSTEM HEALTH CHECK" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$issues = 0

# Check 1: Backend .env file
Write-Host "1️⃣  Checking Backend .env..." -ForegroundColor Yellow
if (Test-Path "Backend\.env") {
    $envContent = Get-Content "Backend\.env" -Raw
    $required = @("DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET", "PORT")
    
    foreach ($var in $required) {
        if ($envContent -match "$var\s*=\s*.+") {
            Write-Host "   ✅ $var found" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var missing or empty" -ForegroundColor Red
            $issues++
        }
    }
} else {
    Write-Host "   ❌ Backend\.env not found! Copy from .env.example" -ForegroundColor Red
    $issues++
}

# Check 2: Frontend .env file
Write-Host "`n2️⃣  Checking Frontend .env..." -ForegroundColor Yellow
if (Test-Path "Frontend\.env") {
    $envContent = Get-Content "Frontend\.env" -Raw
    if ($envContent -match "REACT_APP_API_URL\s*=\s*http://localhost:5000/api/modules") {
        Write-Host "   ✅ REACT_APP_API_URL correctly set to /api/modules" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  REACT_APP_API_URL may be incorrect (should be http://localhost:5000/api/modules)" -ForegroundColor Red
        $issues++
    }
} else {
    Write-Host "   ❌ Frontend\.env not found! Copy from .env.example" -ForegroundColor Red
    $issues++
}

# Check 3: Backend modules structure
Write-Host "`n3️⃣  Checking Backend modules..." -ForegroundColor Yellow
$modules = @("auth-rbac", "users", "surveys", "templates", "responses", "collectors", "analytics", "export")
foreach ($mod in $modules) {
    if (Test-Path "Backend\modules\$mod") {
        Write-Host "   ✅ $mod module exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $mod module missing" -ForegroundColor Red
        $issues++
    }
}

# Check 4: Users module completeness
Write-Host "`n4️⃣  Checking Users module structure..." -ForegroundColor Yellow
$userFiles = @(
    "Backend\modules\users\index.js",
    "Backend\modules\users\routes\user.routes.js",
    "Backend\modules\users\controller\user.controller.js",
    "Backend\modules\users\service\user.service.js",
    "Backend\modules\users\repository\user.repository.js"
)
foreach ($file in $userFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $(Split-Path -Leaf $file)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $(Split-Path -Leaf $file) missing" -ForegroundColor Red
        $issues++
    }
}

# Check 5: Critical route files
Write-Host "`n5️⃣  Checking critical route files..." -ForegroundColor Yellow
$routeContent = Get-Content "Backend\src\app.js" -Raw
if ($routeContent -match "app\.use\(['""`]/api/modules['""`]") {
    Write-Host "   ✅ Backend app.js mounts at /api/modules" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend app.js NOT mounting at /api/modules!" -ForegroundColor Red
    $issues++
}

$modulesRouteContent = Get-Content "Backend\src\routes\modules.routes.js" -Raw
if ($modulesRouteContent -match "router\.use\(['""`]/users['""`]") {
    Write-Host "   ✅ modules.routes.js mounts /users route" -ForegroundColor Green
} else {
    Write-Host "   ❌ modules.routes.js missing /users route mount" -ForegroundColor Red
    $issues++
}

# Check 6: Frontend API service
Write-Host "`n6️⃣  Checking Frontend UserService..." -ForegroundColor Yellow
$userServiceContent = Get-Content "Frontend\src\api\services\user.service.js" -Raw
$methods = @("getAll", "create", "delete", "getRoleStats")
foreach ($method in $methods) {
    if ($userServiceContent -match "$method\s*\(") {
        Write-Host "   ✅ $method() method exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $method() method missing" -ForegroundColor Red
        $issues++
    }
}

# Check 7: Node modules installed
Write-Host "`n7️⃣  Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "Backend\node_modules") {
    Write-Host "   ✅ Backend node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend node_modules not found - run 'npm install' in Backend/" -ForegroundColor Yellow
}

if (Test-Path "Frontend\node_modules") {
    Write-Host "   ✅ Frontend node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend node_modules not found - run 'npm install' in Frontend/" -ForegroundColor Yellow
}

# Check 8: Testing scripts
Write-Host "`n8️⃣  Checking test scripts..." -ForegroundColor Yellow
if (Test-Path "Backend\scripts\smoke-e2e.http") {
    Write-Host "   ✅ Smoke test script exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Smoke test script not found" -ForegroundColor Yellow
}

if (Test-Path "Backend\scripts\seed-demo-data.js") {
    Write-Host "   ✅ Seed data script exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Seed data script not found" -ForegroundColor Yellow
}

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
if ($issues -eq 0) {
    Write-Host "✅ SYSTEM HEALTH: GOOD" -ForegroundColor Green
    Write-Host "   All critical components are in place." -ForegroundColor Green
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Start servers: .\start-servers.ps1" -ForegroundColor White
    Write-Host "   2. Seed demo data: node Backend\scripts\seed-demo-data.js" -ForegroundColor White
    Write-Host "   3. Test at: http://localhost:3000" -ForegroundColor White
} else {
    Write-Host "⚠️  SYSTEM HEALTH: ISSUES FOUND ($issues)" -ForegroundColor Red
    Write-Host "   Please fix the issues above before starting servers." -ForegroundColor Red
    Write-Host "`n📋 Quick Fixes:" -ForegroundColor Cyan
    Write-Host "   - Copy .env files: cp Backend\.env.example Backend\.env" -ForegroundColor White
    Write-Host "   - Install deps: cd Backend; npm install; cd ..\Frontend; npm install" -ForegroundColor White
    Write-Host "   - Re-run: .\check-health.ps1" -ForegroundColor White
}
Write-Host "================================`n" -ForegroundColor Cyan
