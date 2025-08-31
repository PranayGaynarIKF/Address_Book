# Install @nestjs/terminus package for health checks
Write-Host "Installing @nestjs/terminus package..." -ForegroundColor Green
npm install @nestjs/terminus

Write-Host "Package installed successfully!" -ForegroundColor Green
Write-Host "You can now use the health check endpoints:" -ForegroundColor Yellow
Write-Host "  - GET /health" -ForegroundColor Cyan
Write-Host "  - GET /health/database" -ForegroundColor Cyan
Write-Host "  - GET /database/health" -ForegroundColor Cyan
