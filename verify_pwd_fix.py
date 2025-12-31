import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_long_password():
    print("Testing signup with long password (> 72 chars)...")
    payload = {
        "email": "test_long_pwd@example.com",
        "password": "a" * 73,
        "role": "patient",
        "first_name": "Test",
        "last_name": "User"
    }
    resp = requests.post(f"{BASE_URL}/auth/signup", json=payload)
    print(f"Status Code: {resp.status_code}")
    print(f"Response Body: {resp.text}")
    
    if resp.status_code == 422:
        print("✅ SUCCESS: Received expected 422 Unprocessable Entity error.")
    elif resp.status_code == 500:
        print("❌ FAILURE: Received 500 Internal Server Error.")
    else:
        print(f"❓ UNEXPECTED: Received {resp.status_code}.")

if __name__ == "__main__":
    test_long_password()
