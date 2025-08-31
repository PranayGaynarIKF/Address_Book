# PowerShell script to insert OAuth token
$uri = "http://localhost:4002/email/auth/GMAIL/callback"
$body = @{
    code = "manual_token_insert"
    userId = "current-user-id"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    Write-Host "Attempting to insert OAuth token..."
    $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -Headers $headers
    Write-Host "Success: $($response | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
