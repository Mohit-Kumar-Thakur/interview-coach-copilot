Write-Host "`n=== Test 1: No Authorization Token ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/sessions" -Method Get
} catch {
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== Test 2: Invalid Payload (Empty JSON) ===" -ForegroundColor Cyan
$body = '{}'
try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/interview/start" -Method Post -ContentType "application/json" -Body $body
} catch {
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
}

Write-Host "`n"
