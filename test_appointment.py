import requests
import json

# Test the actual appointment creation endpoint
print("Testing appointment creation...")

auth_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Replace with actual token from browser localStorage

headers = {
    "Authorization": f"Bearer {auth_token}",
    "Content-Type": "application/json",
    "Origin": "http://localhost:8080"
}

payload = {
    "patient_id": "test-patient-id",
    "doctor_id": "test-doctor-id",
    "doctor_name": "Dr. Test",
    "scheduled_at": "2026-01-01T10:00:00",
    "reason": "headache"
}

try:
    response = requests.post(
        "http://localhost:8000/api/v1/appointments/",
        headers=headers,
        json=payload
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if "Access-Control-Allow-Origin" in response.headers:
        print(f"✅ CORS Header: {response.headers['Access-Control-Allow-Origin']}")
    else:
        print("❌ No CORS header in response")
        
except Exception as e:
    print(f"Error: {e}")
