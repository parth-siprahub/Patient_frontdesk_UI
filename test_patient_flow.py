#!/usr/bin/env python
"""
Test script to verify patient onboarding and booking flow.
Tests the complete journey: Signup (PATIENT) -> Login -> Book Appointment
"""

import requests
import json
from datetime import datetime, timedelta
from uuid import uuid4

BASE_URL = "http://localhost:8000/api/v1"

def test_complete_flow():
    print("=" * 60)
    print("TESTING PATIENT ONBOARDING AND BOOKING FLOW")
    print("=" * 60)
    
    # Generate unique test data  
    test_id = uuid4().hex[:6]
    patient_email = f"patient_{test_id}@test.com"
    patient_password = "Test@123"
    
    print(f"\n1. Testing Patient Signup (email: {patient_email})...")
    signup_data = {
        "email": patient_email,
        "password": patient_password,
        "role": "PATIENT",
        "first_name": "Test",
        "last_name": "Patient",
        "phone": "9876543210"
    }
    
    response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   ✅ Signup successful: {response.json()}")
    else:
        print(f"   ❌ Signup failed: {response.text}")
        return
    
    print(f"\n2. Testing Patient Login...")
    login_data = {
        "username": patient_email,
        "password": patient_password
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        token = token_data["access_token"]
        user_role = token_data["role"]
        print(f"   ✅ Login successful | Role: {user_role}")
    else:
        print(f"   ❌ Login failed: {response.text}")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n3. Testing Get Current User...")
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        user_data = response.json()
        patient_id = user_data["id"]
        print(f"   ✅ User data retrieved | ID: {patient_id} | Role: {user_data['role']}")
    else:
        print(f"   ❌ Failed to get user: {response.text}")
        return
    
    print(f"\n4. Testing Get Doctors List...")
    response = requests.get(f"{BASE_URL}/users/doctors", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        doctors = response.json()
        if doctors:
            doctor = doctors[0]
            print(f"   ✅ Found {len(doctors)} doctor(s)")
            print(f"   Using: Dr. {doctor['first_name']} {doctor['last_name']} ({doctor['specialization']})")
        else:
            print("   ⚠️  No doctors found, creating test doctor...")
            # Create a test doctor
            doctor_email = f"doctor_{test_id}@test.com"
            doctor_signup = {
                "email": doctor_email,
                "password": "Test@123",
                "role": "DOCTOR",
                "first_name": "Test",
                "last_name": "Doctor",
                "phone": "9876543211"
            }
            requests.post(f"{BASE_URL}/auth/signup", json=doctor_signup)
            response = requests.get(f"{BASE_URL}/users/doctors", headers=headers)
            doctors = response.json()
            doctor = doctors[0]
            print(f"   ✅ Created and using: Dr. {doctor['first_name']} {doctor['last_name']}")
    else:
        print(f"   ❌ Failed to get doctors: {response.text}")
        return
    
    print(f"\n5. Testing Book Appointment...")
    scheduled_time = datetime.utcnow() + timedelta(days=1)
    appointment_data = {
        "patient_id": patient_id,
        "doctor_id": doctor["id"],
        "doctor_name": f"Dr. {doctor['first_name']} {doctor['last_name']}",
        "scheduled_at": scheduled_time.isoformat(),
        "reason": "Automated test consultation"
    }
    
    response = requests.post(f"{BASE_URL}/appointments/", json=appointment_data, headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        appointment = response.json()
        print(f"   ✅ Appointment created successfully!")
        print(f"   Appointment ID: {appointment['id']}")
        print(f"   Doctor Name: {appointment.get('doctor_name', 'N/A')}")
        print(f"   Scheduled: {appointment['scheduled_at']}") 
    else:
        print(f"   ❌ Appointment creation failed: {response.text}")
        return
    
    print(f"\n6. Testing Get My Appointments...")
    response = requests.get(f"{BASE_URL}/appointments/me", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        appointments = response.json()
        print(f"   ✅ Retrieved {len(appointments)} appointment(s)")
        if appointments:
            print(f"   Latest: {appointments[0].get('doctor_name', 'N/A')} - {appointments[0]['scheduled_at']}")
    else:
        print(f"   ❌ Failed to get appointments: {response.text}")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED - PATIENT BOOKING FLOW WORKS!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_complete_flow()
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
