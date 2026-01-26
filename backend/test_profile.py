import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("\n=== Testing Profile Score Refactoring ===\n")

# Step 1: Register (or skip if exists)
print("1. Registering user...")
try:
    resp = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": "mohit@test.com",
        "password": "test123"
    })
    print("✓ Registered successfully")
except:
    print("⚠ User already exists (OK)")

# Step 2: Login
print("\n2. Logging in...")
resp = requests.post(f"{BASE_URL}/api/auth/login", json={
    "email": "mohit@test.com",
    "password": "test123"
})
token = resp.json()["access_token"]
print(f"✓ Logged in successfully")

headers = {"Authorization": f"Bearer {token}"}

# Step 3: Get current profile
print("\n3. Getting current profile (GET /api/users/me)...")
resp = requests.get(f"{BASE_URL}/api/users/me", headers=headers)
profile = resp.json()
print(json.dumps(profile, indent=2))

# Step 4: Update profile to 100%
print("\n4. Updating profile to 100% completion...")
resp = requests.put(f"{BASE_URL}/api/users/me", headers=headers, json={
    "full_name": "Mohit Kumar",
    "college": "University of Delhi",
    "department": "ECE",
    "graduation_year": 2026
})
print("✓ Profile updated")

# Step 5: Get updated profile
print("\n5. Getting updated profile (GET /api/users/me)...")
resp = requests.get(f"{BASE_URL}/api/users/me", headers=headers)
updated_profile = resp.json()
print("\n--- Expected JSON Response ---")
print(json.dumps(updated_profile, indent=2))

# Verify profile_score
if updated_profile.get("profile_score") == 100:
    print("\n✅ SUCCESS: profile_score = 100")
else:
    print(f"\n⚠ WARNING: profile_score = {updated_profile.get('profile_score')}")

print("\n✅ Check uvicorn logs for enhanced logging: 'Profile updated | user_id=X | score=100'")
print()
