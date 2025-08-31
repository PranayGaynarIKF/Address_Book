@echo off
echo 🚀 Setting up Address Book Combined Repository...
echo.

echo 📁 Creating backend directory...
if exist "..\Automation" (
    echo Copying Automation project to backend...
    xcopy "..\Automation" ".\backend" /E /I /H /Y
    echo ✅ Backend project copied successfully!
) else (
    echo ❌ Automation project not found at ..\Automation
    echo Please make sure the Automation project exists in the parent directory
)

echo.
echo 📁 Creating frontend directory...
if exist "..\Automation Frontend" (
    echo Copying Automation Frontend project to frontend...
    xcopy "..\Automation Frontend" ".\frontend" /E /I /H /Y
    echo ✅ Frontend project copied successfully!
) else (
    echo ❌ Automation Frontend project not found at ..\Automation Frontend
    echo Please make sure the Automation Frontend project exists in the parent directory
)

echo.
echo 🔧 Initializing git repository...
git init

echo 🔗 Adding remote origin...
git remote add origin https://github.com/PranayGaynarIKF/Address_Book.git

echo 🌿 Creating main branch...
git branch -M main

echo.
echo 📊 Current git status:
git status

echo.
echo 🎯 Next steps:
echo 1. Review the copied projects
echo 2. Add files to git: git add .
echo 3. Commit: git commit -m "Initial commit: Add NestJS backend and React frontend"
echo 4. Push: git push -u origin main

echo.
echo ✅ Repository setup complete!
pause
