Write-Host "Regenerating Prisma client..." -ForegroundColor Green
Set-Location $PSScriptRoot
npx prisma generate
Write-Host "Prisma client regenerated successfully!" -ForegroundColor Green
Read-Host "Press Enter to continue"
