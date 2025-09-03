Write-Host "Starting Frontend Server..." -ForegroundColor Green
Write-Host ""
Write-Host "This will start a local HTTP server to serve the frontend files" -ForegroundColor Yellow
Write-Host "and avoid CORS issues that occur when opening HTML files directly." -ForegroundColor Yellow
Write-Host ""
Write-Host "The server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

try {
    node serve-frontend.js
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    Write-Host "Make sure Node.js is installed and you're in the correct directory." -ForegroundColor Yellow
}

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
