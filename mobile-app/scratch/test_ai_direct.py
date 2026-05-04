import requests
import json

url = "https://python-a-9.onrender.com/api/mobile/recommend/idea"
payload = {"idea": "Detective stories in London"}
headers = {"Content-Type": "application/json"}

try:
    print(f"Direct Python Test: {url}")
    # This might take a while if it's the first request
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    print(f"Status Code: {response.status_code}")
    print("Response Content:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
