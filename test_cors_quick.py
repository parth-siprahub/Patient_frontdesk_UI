import requests

print("Testing CORS with actual request...")

# Test 1: OPTIONS (preflight)
print("\n1. Testing OPTIONS (CORS preflight)...")
response = requests.options(
    "http://localhost:8000/api/v1/appointments/",
    headers={
        "Origin": "http://localhost:8080",
        "Access-Control-Request-Method": "POST",
    }
)
print(f"Status: {response.status_code}")
print(f"CORS Header: {response.headers.get('Access-Control-Allow-Origin', 'MISSING')}")

# Test 2: GET without auth (should fail auth but have CORS)
print("\n2. Testing GET without auth...")
response = requests.get(
    "http://localhost:8000/api/v1/appointments/me",
    headers={"Origin": "http://localhost:8080"}
)
print(f"Status: {response.status_code}")
print(f"CORS Header: {response.headers.get('Access-Control-Allow-Origin', 'MISSING')}")
print(f"Response: {response.text[:100]}")

print("\n✅ If both show CORS headers, CORS is working!")
