# JWT Token Generator PowerShell Script
# Make sure you have Node.js installed and the jsonwebtoken package

Write-Host "🔐 JWT Token Generator" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if jsonwebtoken package is installed
try {
    $jwtCheck = node -e "console.log(require('jsonwebtoken') ? 'installed' : 'not installed')" 2>$null
    if ($jwtCheck -eq "installed") {
        Write-Host "✅ jsonwebtoken package is installed" -ForegroundColor Green
    } else {
        Write-Host "📦 Installing jsonwebtoken package..." -ForegroundColor Yellow
        npm install jsonwebtoken
    }
} catch {
    Write-Host "📦 Installing jsonwebtoken package..." -ForegroundColor Yellow
    npm install jsonwebtoken
}

Write-Host ""
Write-Host "🚀 Running JWT generator..." -ForegroundColor Cyan

# Run the Node.js script
node generate-jwt.js

Write-Host ""
Write-Host "💡 Tip: You can also run with a custom email:" -ForegroundColor Yellow
Write-Host "   node generate-jwt.js your-email@example.com" -ForegroundColor White
