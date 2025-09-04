@echo off
echo Regenerating Prisma client...
cd /d "%~dp0"
npx prisma generate
echo Prisma client regenerated successfully!
pause
