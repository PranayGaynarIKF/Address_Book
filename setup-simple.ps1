# Address Book Repository Setup Script
Write-Host "Setting up Address Book Combined Repository..." -ForegroundColor Green

# Check current directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Yellow

# Create backend directory and copy Automation project
Write-Host "Creating backend directory..." -ForegroundColor Cyan
if (Test-Path "..\Automation") {
    Write-Host "Copying Automation project to backend..." -ForegroundColor Yellow
    Copy-Item -Path "..\Automation" -Destination ".\backend" -Recurse -Force
    Write-Host "Backend project copied successfully!" -ForegroundColor Green
} else {
    Write-Host "Automation project not found at ..\Automation" -ForegroundColor Red
    Write-Host "Please make sure the Automation project exists in the parent directory" -ForegroundColor Yellow
}

# Create frontend directory and copy Automation Frontend project
Write-Host "Creating frontend directory..." -ForegroundColor Cyan
if (Test-Path "..\Automation Frontend") {
    Write-Host "Copying Automation Frontend project to frontend..." -ForegroundColor Yellow
    Copy-Item -Path "..\Automation Frontend" -Destination ".\frontend" -Recurse -Force
    Write-Host "Frontend project copied successfully!" -ForegroundColor Green
} else {
    Write-Host "Automation Frontend project not found at ..\Automation Frontend" -ForegroundColor Red
    Write-Host "Please make sure the Automation Frontend project exists in the parent directory" -ForegroundColor Yellow
}

# Initialize git repository
Write-Host "Initializing git repository..." -ForegroundColor Cyan
git init

# Add remote origin
Write-Host "Adding remote origin..." -ForegroundColor Cyan
git remote add origin https://github.com/PranayGaynarIKF/Address_Book.git

# Create main branch
Write-Host "Creating main branch..." -ForegroundColor Cyan
git branch -M main

# Show current status
Write-Host "Current git status:" -ForegroundColor Cyan
git status

Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Review the copied projects" -ForegroundColor White
Write-Host "2. Add files to git: git add ." -ForegroundColor White
Write-Host "3. Commit: git commit -m 'Initial commit: Add NestJS backend and React frontend'" -ForegroundColor White
Write-Host "4. Push: git push -u origin main" -ForegroundColor White

Write-Host "Repository setup complete!" -ForegroundColor Green
