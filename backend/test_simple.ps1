$loginBody = '{"email": "test@example.com", "password": "testpass123"}'

Write-Host "Attempting login..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $response.access_token
    Write-Host "Token: $token" -ForegroundColor Green
    
    Write-Host "`nGetting profile..." -ForegroundColor Yellow
    $headers = @{ "Authorization" = "Bearer $token" }
    $profile = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/users/me" -Method Get -Headers $headers
    
    Write-Host "`nProfile Response:" -ForegroundColor Cyan
    $profile | ConvertTo-Json | Write-Host
    
}
catch {
    Write-Host "Full Error:" -ForegroundColor Red
    Write-Host $_ 
    Write-Host $_.Exception.Message
}
