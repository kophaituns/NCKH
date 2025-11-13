# Frontend Structure Cleanup — Implementation Commands

**Status:** Ready to Execute  
**Backup Required:** YES (created in previous cleanup)  
**Build Validation:** After each phase

---

## PHASE 1: DELETE ORPHANED FILES

These files are NOT imported anywhere and can be safely deleted:

### Step 1.1: Delete Orphaned Component Pages
```powershell
# Delete unused component pages (4 files)
Remove-Item "D:\NCKH\Frontend\src\components\pages\AnalyticsPage.jsx" -Force
Remove-Item "D:\NCKH\Frontend\src\components\pages\SurveyManagement.jsx" -Force
Remove-Item "D:\NCKH\Frontend\src\components\pages\SurveyResponsePage.jsx" -Force
Remove-Item "D:\NCKH\Frontend\src\components\pages\LandingPage.scss" -Force  # Associated styles

# Verify deletion
Get-ChildItem "D:\NCKH\Frontend\src\components\pages\*.jsx" | ForEach-Object { $_.Name }
```

### Step 1.2: Delete Orphaned Service
```powershell
# Delete unused validation service
Remove-Item "D:\NCKH\Frontend\src\services\validationService.js" -Force

# Verify it's gone
Get-ChildItem "D:\NCKH\Frontend\src\services"
```

### Step 1.3: Clean Up Exports in components/index.js
Remove these 4 exports:
```javascript
// REMOVE these lines:
export { default as AnalyticsPage } from './pages/AnalyticsPage';
export { default as SurveyManagement } from './pages/SurveyManagement';
export { default as SurveyResponsePage } from './pages/SurveyResponsePage';
```

**Result:** components/index.js should now have only:
- CreateSurveyPage
- LandingPage
- ManageUsersPage

### Step 1.4: Verify Build Still Works
```powershell
cd "D:\NCKH\Frontend"
npm run build 2>&1 | Select-String -Pattern "Compiled|errors|warnings"
```

**Expected Output:**
```
Compiled with warnings (or without warnings)
```

---

## PHASE 2: MOVE SERVICES TO UTILS

These files are used but in the wrong location (old service pattern).

### Step 2.1: Move tokenService and securityService
```powershell
# Move tokenService.js
Move-Item "D:\NCKH\Frontend\src\services\tokenService.js" "D:\NCKH\Frontend\src\utils\tokenService.js" -Force

# Move securityService.js
Move-Item "D:\NCKH\Frontend\src\services\securityService.js" "D:\NCKH\Frontend\src\utils\securityService.js" -Force

# Verify move
Get-ChildItem "D:\NCKH\Frontend\src\utils\"
```

### Step 2.2: Delete services folder (now empty)
```powershell
# Check if services folder is empty
$items = Get-ChildItem "D:\NCKH\Frontend\src\services\" -ErrorAction SilentlyContinue
if ($items.Count -eq 0) {
    Remove-Item "D:\NCKH\Frontend\src\services" -Force
    Write-Host "services/ folder deleted (was empty)"
} else {
    Write-Host "services/ folder NOT empty. Contents:"
    $items | ForEach-Object { Write-Host "  - $($_.Name)" }
}
```

### Step 2.3: Update AuthContext.jsx Import
**File:** `D:\NCKH\Frontend\src\contexts\AuthContext.jsx`

Find and replace:
```javascript
// OLD:
import { TokenService } from '../services/tokenService.js';

// NEW:
import { TokenService } from '../utils/tokenService.js';
```

### Step 2.4: Verify No Other Imports from services/
```powershell
cd "D:\NCKH\Frontend\src"
Select-String -Pattern "from.*services/|from '.*services" -Path *.jsx, *.js -Recurse | Select-Object -Unique Path
```

**Expected Result:** No matches (or only comments)

### Step 2.5: Verify Build Again
```powershell
cd "D:\NCKH\Frontend"
npm run build 2>&1 | Select-String -Pattern "Compiled|error" -Context 0, 2
```

**Expected Output:**
```
Compiled with warnings (or without warnings)
```

---

## PHASE 3: VERIFY FINAL STRUCTURE

### Step 3.1: List Final Frontend/src Structure
```powershell
cd "D:\NCKH\Frontend\src"
Get-ChildItem -Directory | Sort-Object | ForEach-Object { "✓ $_" }
```

**Expected Output:**
```
✓ api
✓ components
✓ constants
✓ contexts
✓ hooks
✓ pages
✓ routes
✓ styles
✓ utils
```

### Step 3.2: Verify Orphaned Files Deleted
```powershell
# These should NOT exist:
$deleted = @(
    "D:\NCKH\Frontend\src\components\pages\AnalyticsPage.jsx",
    "D:\NCKH\Frontend\src\components\pages\SurveyManagement.jsx",
    "D:\NCKH\Frontend\src\components\pages\SurveyResponsePage.jsx",
    "D:\NCKH\Frontend\src\services\validationService.js",
    "D:\NCKH\Frontend\src\services"
)

foreach ($file in $deleted) {
    if (Test-Path $file) {
        Write-Host "❌ STILL EXISTS: $file"
    } else {
        Write-Host "✅ DELETED: $file"
    }
}
```

### Step 3.3: Verify New Service Location
```powershell
# These SHOULD exist:
$moved = @(
    "D:\NCKH\Frontend\src\utils\tokenService.js",
    "D:\NCKH\Frontend\src\utils\securityService.js"
)

foreach ($file in $moved) {
    if (Test-Path $file) {
        Write-Host "✅ MOVED: $file"
    } else {
        Write-Host "❌ MISSING: $file"
    }
}
```

### Step 3.4: Count Component Pages Remaining
```powershell
$remaining = Get-ChildItem "D:\NCKH\Frontend\src\components\pages\*.jsx" 2>$null
Write-Host "Remaining component pages: $($remaining.Count)"
$remaining | ForEach-Object { Write-Host "  - $($_.Name)" }
```

**Expected Result:** Only 2 files remain:
- `CreateSurveyPage.jsx` (used by pages/Surveys/Create - legacy)
- `LandingPage.jsx` (used by pages/Landing)
- `ManageUsersPage.jsx` (used by pages/Admin/ManageUsers - legacy)

---

## PHASE 4: FINAL VALIDATION

### Step 4.1: Run Full Build
```powershell
cd "D:\NCKH\Frontend"
npm run build

# Count output size
$buildSize = (Get-ChildItem "build/static" -Recurse | Measure-Object -Property Length -Sum).Sum / 1024 / 1024
Write-Host "Build size: $([math]::Round($buildSize, 2)) MB"
```

### Step 4.2: Check for Build Errors
```powershell
cd "D:\NCKH\Frontend"
$build = npm run build 2>&1
if ($build -match "error") {
    Write-Host "❌ BUILD ERRORS FOUND:"
    $build | Select-String "error" -Context 3, 3
} else {
    Write-Host "✅ BUILD SUCCESSFUL"
}
```

### Step 4.3: Verify No Dead Imports
```powershell
cd "D:\NCKH\Frontend\src"
$deadImports = Select-String -Pattern "AnalyticsPage|SurveyManagement|SurveyResponsePage|validationService|from.*services/" `
    -Path (Get-ChildItem -Include "*.jsx", "*.js" -Recurse).FullName `
    -ErrorAction SilentlyContinue

if ($deadImports) {
    Write-Host "⚠️  DEAD IMPORTS FOUND:"
    $deadImports | Select-Object Path, LineNumber, Line | Format-Table
} else {
    Write-Host "✅ NO DEAD IMPORTS"
}
```

---

## SUMMARY CHECKLIST

| Task | Command | Expected Result |
|------|---------|-----------------|
| **Delete Orphaned Pages** | `Remove-Item components/pages/Analytics*` | 4 files deleted |
| **Delete validationService** | `Remove-Item services/validationService.js` | 1 file deleted |
| **Move tokenService** | `Move-Item services/tokenService → utils/` | File moved |
| **Move securityService** | `Move-Item services/securityService → utils/` | File moved |
| **Delete services/ folder** | `Remove-Item services/` | Folder deleted |
| **Update AuthContext imports** | Find/replace in AuthContext.jsx | 1 import updated |
| **Remove exports** | Edit components/index.js | 3 exports removed |
| **Final build** | `npm run build` | Build succeeds |

---

## ROLLBACK PLAN (If Issues Arise)

If anything breaks, restore from backup:

```powershell
# Restore all from backup
$backupPath = "D:\NCKH\__cleanup_backups__\frontend-20251112-2016"

# Restore pages (if needed)
if (Test-Path "$backupPath\pages") {
    Copy-Item "$backupPath\pages" "D:\NCKH\Frontend\src\pages" -Recurse -Force
    Write-Host "✓ Pages restored"
}

# Restore components
if (Test-Path "$backupPath\components") {
    Copy-Item "$backupPath\components" "D:\NCKH\Frontend\src\components" -Recurse -Force
    Write-Host "✓ Components restored"
}

# Restore routes
if (Test-Path "$backupPath\routes") {
    Copy-Item "$backupPath\routes" "D:\NCKH\Frontend\src\routes" -Recurse -Force
    Write-Host "✓ Routes restored"
}

Write-Host "✅ Backup restored successfully"
```

---

## GIT COMMANDS (Alternative - Safer)

If using Git, prefer `git mv` for safe moves:

```bash
# Move with git (preserves history)
git mv src/services/tokenService.js src/utils/tokenService.js
git mv src/services/securityService.js src/utils/securityService.js

# Delete with git
git rm src/components/pages/AnalyticsPage.jsx
git rm src/components/pages/SurveyManagement.jsx
git rm src/components/pages/SurveyResponsePage.jsx
git rm src/services/validationService.js

# Commit
git commit -m "refactor: cleanup unused components and consolidate services"
```

---

## NOTES

- ✅ All changes are **low-risk** (only orphaned files and service consolidation)
- ✅ **No business logic changes** - only reorganization
- ✅ **Build-validated** after each phase
- ✅ **Rollback available** via backup restoration
- ⏸️ **Phase 3 (wrapper consolidation)** deferred to next pass (more complex)

**Estimated Time:** ~15 minutes for all 4 phases + validation
