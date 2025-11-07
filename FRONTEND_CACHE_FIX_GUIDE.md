# 🔧 FRONTEND BUILD & CACHE FIX GUIDE

## ⚠️ Current Issue

Webpack hot-reload is not picking up the API service changes. The browser is still using the old cached JavaScript bundle.

---

## ✅ SOLUTION: Clear Cache & Restart

### Option 1: Quick Fix (Recommended)

1. **Stop the Frontend Dev Server**
   - Press `Ctrl + C` in the terminal running the frontend

2. **Clear Browser Cache**
   - **Chrome/Edge:**
     - Press `F12` to open DevTools
     - Right-click the refresh button
     - Select "Empty Cache and Hard Reload"
   - **OR** Press `Ctrl + Shift + Delete` → Clear "Cached images and files"

3. **Restart Frontend Server**
   ```powershell
   cd d:\NCKH\Frontend
   npm start
   ```

4. **Hard Refresh Browser**
   - Press `Ctrl + Shift + R` (Windows)
   - Or `Cmd + Shift + R` (Mac)

---

### Option 2: Complete Rebuild

If Option 1 doesn't work, do a complete rebuild:

```powershell
cd d:\NCKH\Frontend

# Stop the dev server (Ctrl+C if running)

# Remove node_modules and build cache
Remove-Item -Recurse -Force node_modules, .cache, build -ErrorAction SilentlyContinue

# Reinstall dependencies
npm install

# Start fresh
npm start
```

---

### Option 3: Use the Restart Script

```powershell
cd d:\NCKH
.\restart-frontend.ps1
```

This script will:
- Stop any process on port 3000
- Restart the dev server cleanly

---

## 🧪 VERIFY THE FIX

After restarting, open the browser console and check for these logs:

```
Survey API response: {success: true, data: {...}}
Extracted surveys: Array(...)
Template API response: {success: true, data: {...}}
Extracted templates: Array(...)
```

If you see these logs, the new code is loaded! ✅

---

## 🐛 Backend Errors (400/500)

You're also seeing backend errors:

### 500 Error on `/templates/13`
- **Cause:** Template ID 13 doesn't exist in database
- **Fix:** Don't navigate to non-existent templates
- **Available IDs:** 11, 14-22 (see template list)

### 400 Error on POST `/templates` and `/surveys`
- **Cause:** Missing required fields or authentication
- **Check:** Ensure you're logged in and forms have all required fields

---

## 📋 CHECKLIST

- [ ] Stop frontend dev server
- [ ] Clear browser cache (Hard reload)
- [ ] Restart dev server
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check console for new logs
- [ ] Verify `getMySurveys` is available
- [ ] Verify `templates.map` works

---

## 🚀 If Everything Else Fails

1. **Check if backend is running**
   ```powershell
   curl http://localhost:5000/api/modules/health
   ```

2. **Check if frontend is running**
   ```powershell
   curl http://localhost:3000
   ```

3. **Restart BOTH servers**
   ```powershell
   # Terminal 1: Backend
   cd d:\NCKH\Backend
   npm start

   # Terminal 2: Frontend  
   cd d:\NCKH\Frontend
   npm start
   ```

---

**Remember:** Webpack hot-reload doesn't always catch all changes, especially in exported modules. A full restart is often needed! 🔄
