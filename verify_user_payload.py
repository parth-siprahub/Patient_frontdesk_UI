import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_user_signup_payload():
    print("Testing signup with user's payload...")
    payload = {
        "email": "patient_test_fix_final@example.com",
        "password": "12345678",
        "role": "PATIENT",
        "first_name": "Patient",
        "last_name": "user",
        "phone": "string"
    }
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json=payload)
        print(f"Status Code: {resp.status_code}")
        print(f"Response Body: {resp.text}")
        
        if resp.status_code == 200:
            print("✅ SUCCESS: User created successfully.")
        else:
            print(f"❌ FAILURE: Received {resp.status_code}.")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_user_signup_payload()
