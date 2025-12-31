import requests

# Test CORS with OPTIONS request (preflight)
print("Testing CORS...")

try:
    # OPTIONS request (CORS preflight)
    response = requests.options(
        "http://localhost:8000/api/v1/appointments/",
        headers={
            "Origin": "http://localhost:8080",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization"
        }
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    
    if "Access-Control-Allow-Origin" in response.headers:
        print("✅ CORS is working!")
        print(f"Allowed Origin: {response.headers['Access-Control-Allow-Origin']}")
    else:
        print("❌ CORS NOT working - No Access-Control-Allow-Origin header")
        
except Exception as e:
    print(f"Error: {e}")
