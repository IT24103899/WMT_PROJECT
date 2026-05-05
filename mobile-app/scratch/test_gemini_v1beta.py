import requests
import json

key = "AIzaSyBXfzVlohPOGg9Pzh33nEDq8hJlqy1lWcI"
# Try v1beta
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
payload = {"contents": [{"parts": [{"text": "Hello"}]}]}

print(f"Testing v1beta with gemini-1.5-flash")
try:
    response = requests.post(url, json=payload, timeout=10)
    print(f"Status: {response.status_code}")
    print(response.text)
except Exception as e:
    print(f"Failed: {e}")
