import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_rbac():
    print("\n--- Running Test A: RBAC ---")
    # 1. Signup as Patient
    patient_email = f"patient_{int(time.time())}@test.com"
    signup_data = {
        "email": patient_email,
        "password": "password123",
        "role": "PATIENT",
        "first_name": "Test",
        "last_name": "Patient"
    }
    r = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
    print(f"Signup Result: {r.status_code}")
    if r.status_code != 200:
        print(f"Error: {r.text}")
    
    # 2. Login
    login_data = {"username": patient_email, "password": "password123"}
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if r.status_code != 200:
        print(f"Login Error: {r.text}")
        return
    token = r.json()["access_token"]
    
    # 3. Access admin endpoint
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/admin/triage_queue", headers=headers)
    print(f"Access /admin/triage_queue as PATIENT: {r.status_code} (Expected: 403)")
    if r.status_code == 403:
        print("✅ RBAC Test Passed")
    else:
        print("❌ RBAC Test Failed")

def test_triage_flow():
    print("\n--- Running Test B: Triage Update ---")
    # 1. Use existing patient token or login
    patient_email = f"patient_triage_{int(time.time())}@test.com"
    requests.post(f"{BASE_URL}/auth/signup", json={
        "email": patient_email, "password": "password123", "role": "PATIENT", 
        "first_name": "Triage", "last_name": "Patient"
    })
    token_p = requests.post(f"{BASE_URL}/auth/login", data={"username": patient_email, "password": "password123"}).json()["access_token"]
    
    # 2. Create Front Desk User
    fd_email = f"fd_{int(time.time())}@test.com"
    requests.post(f"{BASE_URL}/auth/signup", json={
        "email": fd_email, "password": "password123", "role": "FRONT_DESK", 
        "first_name": "Front", "last_name": "Desk"
    })
    token_fd = requests.post(f"{BASE_URL}/auth/login", data={"username": fd_email, "password": "password123"}).json()["access_token"]
    
    # 3. List Doctors to get a doctor_id
    doctors = requests.get(f"{BASE_URL}/users/doctors").json()
    if not doctors:
        # Create a doctor if none exist
        dr_email = f"dr_{int(time.time())}@test.com"
        requests.post(f"{BASE_URL}/auth/signup", json={
            "email": dr_email, "password": "password123", "role": "DOCTOR", 
            "first_name": "Ananya", "last_name": "Sharma"
        })
        doctors = requests.get(f"{BASE_URL}/users/doctors").json()
    
    doctor_id = doctors[0]["id"]
    
    # 4. Book Appointment
    booking_data = {
        "patient_id": requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token_p}"}).json()["id"],
        "doctor_id": doctor_id,
        "doctor_name": doctors[0]["first_name"],
        "scheduled_at": "2026-12-31T10:00:00Z",
        "reason": "Severe headache and confusion"
    }
    r = requests.post(f"{BASE_URL}/appointments/", json=booking_data, headers={"Authorization": f"Bearer {token_p}"})
    appointment_id = r.json()["id"]
    print(f"Appointment Created: {appointment_id}")
    
    # 5. Create Consultation (simulating intake)
    r = requests.post(f"{BASE_URL}/consultations/", json={
        "appointment_id": appointment_id,
        "notes": "Patient reports sudden onset of severe headache."
    }, headers={"Authorization": f"Bearer {token_fd}"})
    consultation_id = r.json()["id"]
    
    # Update consultation with a triage score manually (mocking AI result for speed)
    # or just check if it appears in queue
    r = requests.get(f"{BASE_URL}/admin/triage_queue", headers={"Authorization": f"Bearer {token_fd}"})
    queue = r.json()
    patient_in_queue = any(p["id"] == str(consultation_id) for p in queue)
    
    if patient_in_queue:
        print("✅ Triage Queue Update Test Passed")
    else:
        print("❌ Triage Queue Update Test Failed")
    
    return appointment_id, token_fd, doctor_id

def test_assignment(appointment_id, token_fd, doctor_id):
    print("\n--- Running Test C: Doctor Assignment ---")
    r = requests.patch(f"{BASE_URL}/admin/assign/{appointment_id}", 
                       json={"doctor_id": doctor_id},
                       headers={"Authorization": f"Bearer {token_fd}"})
    print(f"Assignment Result: {r.status_code}")
    if r.status_code == 200:
        print(f"✅ Doctor Assignment Test Passed. Assigned to: {r.json().get('doctor_name')}")
    else:
        print("❌ Doctor Assignment Test Failed")

if __name__ == "__main__":
    try:
        test_rbac()
        appt_id, t_fd, d_id = test_triage_flow()
        test_assignment(appt_id, t_fd, d_id)
    except Exception as e:
        print(f"Test Execution Error: {e}")
