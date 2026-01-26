# First try to register
$registerBody = '{"email": "testuser@example.com", "password": "testpass123"}'

Write-Host "Step 1: Registering new user..." -ForegroundColor Yellow
try {
    $regResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/register" -Method Post -ContentType "application/json" -Body $registerBody -ErrorAction SilentlyContinue
    Write-Host " Registered successfully" -ForegroundColor Green
}
catch {
    Write-Host "Already registered or error (OK to continue)" -ForegroundColor Gray
}

# Now login
$loginBody = '{"email": "testuser@example.com", "password": "testpass123"}'
Write-Host "`nStep 2: Logging in..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $response.access_token
    Write-Host "✓ Logged in successfully" -ForegroundColor Green
    
    # Get profile
    Write-Host "`nStep 3: Getting profile (GET /api/users/me)..." -ForegroundColor Yellow
    $headers = @{ "Authorization" = "Bearer $token" }
    $profile = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/users/me" -Method Get -Headers $headers
    
    Write-Host "`n--- Profile Response ---" -ForegroundColor Cyan
    $profile | Format-List
    
    # Update profile
    Write-Host "`nStep 4: Updating profile to 100%..." -ForegroundColor Yellow
    $updateBody = '{"full_name": "Mohit Kumar", "college": "University of Delhi", "department": "ECE", "graduation_year": 2026}'
    $updateResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/users/me" -Method Put -Headers $headers -ContentType "application/json" -Body $updateBody
    Write-Host "✓ Profile updated" -ForegroundColor Green
    
    # Get updated profile
    Write-Host "`nStep 5: Getting updated profile..." -ForegroundColor Yellow
    $updatedProfile = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/users/me" -Method Get -Headers $headers
    
    Write-Host "`n--- Updated Profile Response ---" -ForegroundColor Cyan
    $updatedProfile | Format-List
    
    if ($updatedProfile.profile_score -eq 100) {
        Write-Host "`n✅ SUCCESS: profile_score = 100" -ForegroundColor Green
    }
    else {
        Write-Host "`n⚠ profile_score = $($updatedProfile.profile_score)" -ForegroundColor Yellow
    }
    
}
catch {
    Write-Host "`nError occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
