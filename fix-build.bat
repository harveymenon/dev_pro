@echo off
REM Fix script for Tailwind CSS native binding issue (Windows version)
REM This script resolves the "Cannot find native binding" error

echo 🔧 Fixing Tailwind CSS native binding issue...

REM Step 1: Remove node_modules and package-lock.json
echo 📦 Removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f package-lock.json

REM Step 2: Clear npm cache
echo 🧹 Clearing npm cache...
call npm cache clean --force

REM Step 3: Install dependencies fresh
echo 📥 Installing dependencies...
call npm install

REM Step 4: Verify build works
echo 🔨 Testing build...
call npm run build

if %errorlevel% equ 0 (
    echo ✅ Fix successful! Build completed.
    echo.
    echo Next steps:
    echo 1. Commit the new package-lock.json:
    echo    git add package-lock.json
    echo    git commit -m "Fix: Regenerate package-lock.json for cross-platform compatibility"
    echo    git push origin main
    echo.
    echo 2. The GitHub Actions workflow should now work correctly.
) else (
    echo ❌ Build failed. Please check the error messages above.
    exit /b 1
)
