Write-Host "`n=== Testing Profile Score Refactoring ===" -ForegroundColor Cyan

# Step 1: Login (or register if needed)
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email    = "test@example.com"
    password = "testpass123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.access_token
    Write-Host "✓ Logged in successfully" -ForegroundColor Green
}
catch {
    Write-Host "Login failed, trying to register..." -ForegroundColor Yellow
    $registerBody = @{
        email    = "test@example.com"
        password = "testpass123"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/register" -Method Post -ContentType "application/json" -Body $registerBody
        Write-Host "✓ Registered successfully" -ForegroundColor Green
        
        # Login after registration
        $loginResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
        $token = $loginResponse.access_token
        Write-Host "✓ Logged in successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Get current profile
Write-Host "`n2. Getting current profile (GET /api/users/me)..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $profile = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/users/me" -Method Get -Headers $headers
    Write-Host "Current Profile:" -ForegroundColor Cyan
    $profile | ConvertTo-Json -Depth 10 | Write-Host
}
catch {
    Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Step 3: Update profile to complete it
Write-Host "`n3. Updating profile to 100% completion..." -ForegroundColor Yellow
$updateBody = @{
    full_name       = "Mohit Kumar"
    college         = "University of Delhi"
    department      = "ECE"
    graduation_year = 2026
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/users/me" -Method Put -Headers $headers -ContentType "application/json" -Body $updateBody
    Write-Host "✓ Profile updated successfully" -ForegroundColor Green
}
catch {
    Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Step 4: Get updated profile
Write-Host "`n4. Getting updated profile (GET /api/users/me)..." -ForegroundColor Yellow
try {
    $updatedProfile = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/users/me" -Method Get -Headers $headers
    Write-Host "`nExpected JSON response:" -ForegroundColor Cyan
    $updatedProfile | ConvertTo-Json -Depth 10 | Write-Host
    
    # Verify profile_score is 100
    if ($updatedProfile.profile_score -eq 100) {
        Write-Host "`n✅ SUCCESS: Profile score is 100!" -ForegroundColor Green
    }
    else {
        Write-Host "`n⚠ WARNING: Profile score is $($updatedProfile.profile_score), expected 100" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Check the uvicorn logs to see enhanced logging with score!" -ForegroundColor Cyan
Write-Host ""
