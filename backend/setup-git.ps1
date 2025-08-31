# Git Setup Script for Automated Contact Collection Project
# This script will help you set up Git and push to your GitHub repository

Write-Host "🚀 Setting up Git for Automated Contact Collection Project" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com/downloads" -ForegroundColor Yellow
    exit 1
}

# Check if this is already a Git repository
if (Test-Path ".git") {
    Write-Host "⚠️  This directory is already a Git repository" -ForegroundColor Yellow
    $response = Read-Host "Do you want to continue? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit 0
    }
} else {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Cyan
    git init
}

# Add remote origin
Write-Host "🔗 Adding GitHub remote origin..." -ForegroundColor Cyan
git remote add origin https://github.com/PranayGaynarIKF/Automated_Contact_Collection.git

# Check if remote was added successfully
$remotes = git remote -v
if ($remotes -like "*origin*") {
    Write-Host "✅ Remote origin added successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to add remote origin" -ForegroundColor Red
    exit 1
}

# Add all files
Write-Host "📝 Adding all files to Git..." -ForegroundColor Cyan
git add .

# Check if there are files to commit
$status = git status --porcelain
if ($status) {
    Write-Host "✅ Files staged for commit" -ForegroundColor Green
    
    # Make initial commit
    Write-Host "💾 Making initial commit..." -ForegroundColor Cyan
    git commit -m "Initial commit: NestJS API for Automated Contact Collection

- Multi-database architecture (Main + Invoice)
- Gmail OAuth integration for contact collection
- Database management and health monitoring
- API endpoints for ingestion and management
- Comprehensive error handling and logging
- Updated README with project documentation"
    
    Write-Host "✅ Initial commit completed" -ForegroundColor Green
} else {
    Write-Host "⚠️  No files to commit" -ForegroundColor Yellow
}

# Push to GitHub
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "Note: You may be prompted for your GitHub credentials" -ForegroundColor Yellow

try {
    git push -u origin main
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
    Write-Host "You may need to:" -ForegroundColor Yellow
    Write-Host "1. Set up GitHub authentication (Personal Access Token)" -ForegroundColor Yellow
    Write-Host "2. Check your internet connection" -ForegroundColor Yellow
    Write-Host "3. Verify repository permissions" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Git setup completed!" -ForegroundColor Green
Write-Host "Your project is now connected to GitHub" -ForegroundColor Green
Write-Host "Repository: https://github.com/PranayGaynarIKF/Automated_Contact_Collection" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Visit your GitHub repository to see the uploaded files" -ForegroundColor White
Write-Host "2. Set up GitHub authentication if you haven't already" -ForegroundColor White
Write-Host "3. Continue development and commit changes regularly" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
