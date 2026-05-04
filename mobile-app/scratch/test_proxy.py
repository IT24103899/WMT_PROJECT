import requests
import json

url = "https://mobile-backend-new.onrender.com/api/ai/recommend/idea"
payload = {"idea": "Detective stories in London"}
headers = {"Content-Type": "application/json"}

try:
    print(f"Testing Proxy: {url}")
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
