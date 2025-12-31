import httpx
from uuid import uuid4
from datetime import datetime

# Assuming local backend is running on port 8000
BASE_URL = "http://localhost:8000/api/v1"

def verify_appointment_flow():
    # 1. Login to get token (using a known user from previous tests or creating one)
    # For speed, let's just assume we can use the test_api logic if we had credentials.
    # Alternatively, let's just use the logic from tests/system_validation if available.
    
    # Let's create a temporary user for testing
    email = f"test_{uuid4().hex[:6]}@example.com"
    password = "password123"
    
    print(f"Creating test user: {email}")
    with httpx.Client(base_url=BASE_URL) as client:
        # Signup
        r = client.post("/auth/signup", json={
            "email": email,
            "password": password,
            "role": "PATIENT",
            "first_name": "Test",
            "last_name": "Patient"
        })
        if r.status_code != 200:
            print(f"Signup failed: {r.text}")
            return
        user_id = r.json()["id"]
        
        # Login
        r = client.post("/auth/login", data={"username": email, "password": password})
        if r.status_code != 200:
            print(f"Login failed: {r.text}")
            return
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get Doctors
        r = client.get("/users/doctors", headers=headers)
        if r.status_code != 200:
            print(f"Get doctors failed: {r.text}")
            return
        doctors = r.json()
        if not doctors:
            print("No doctors found in system.")
            return
        doctor = doctors[0]
        
        # Create Appointment
        print(f"Creating appointment with doctor: {doctor['first_name']} {doctor['last_name']}")
        appointment_payload = {
            "patient_id": user_id,
            "doctor_id": doctor["id"],
            "doctor_name": f"Dr. {doctor['first_name']} {doctor['last_name']}",
            "scheduled_at": datetime.utcnow().isoformat(),
            "reason": "Expert Verification Test"
        }
        
        r = client.post("/appointments/", json=appointment_payload, headers=headers)
        if r.status_code != 200:
            print(f"Appointment creation failed: {r.text}")
            return
        
        appointment = r.json()
        print(f"Appointment created successfully! ID: {appointment['id']}")
        print(f"Stored Doctor Name: {appointment.get('doctor_name')}")
        
        # Verify it's retrieved
        r = client.get("/appointments/me", headers=headers)
        appointments = r.json()
        if any(a["id"] == appointment["id"] and a["doctor_name"] == appointment_payload["doctor_name"] for a in appointments):
            print("SUCCESS: Appointment retrieved with correct doctor_name.")
        else:
            print("FAILURE: Appointment not found or doctor_name mismatch.")

if __name__ == "__main__":
    verify_appointment_flow()
