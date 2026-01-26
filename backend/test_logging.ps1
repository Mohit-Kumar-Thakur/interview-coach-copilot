Write-Host "`n=== Testing Backend Logging ===" -ForegroundColor Cyan

Write-Host "`n1. Testing JWT Authentication Failure (should log warning)..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer invalid_token_here"
}
try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/sessions" -Method Get -Headers $headers
}
catch {
    Write-Host "Expected error: $($_.ErrorDetails.Message)" -ForegroundColor Green
}

Write-Host "`n2. Testing Missing Authorization (should log unauthorized)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/sessions" -Method Get
}
catch {
    Write-Host "Expected error: $($_.ErrorDetails.Message)" -ForegroundColor Green
}

Write-Host "`n✅ Check the uvicorn server logs to see the logging output!" -ForegroundColor Cyan
Write-Host ""
