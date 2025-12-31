import requests
import json

url = "http://localhost:8000/api/v1/appointments/"

payload = {
    "patient_id": "7ec424a8-9fbb-4098-b2a7-e2898f0db7b8",
    "doctor_id": "7d89bdba-99ef-4951-940c-b5352e61a95e",
    "doctor_name": "Test Doctor",
    "scheduled_at": "2026-01-03T10:00:00Z",
    "reason": "test symptoms"
}

headers = {
    "Content-Type": "application/json"
}

print("Sending POST request to:", url)
print("Payload:", json.dumps(payload, indent=2))
print("\n" + "="*80 + "\n")

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
