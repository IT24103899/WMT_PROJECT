import requests
import json

key = "AIzaSyBXfzVlohPOGg9Pzh33nEDq8hJlqy1lWcI"
models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"]

for model in models:
    url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "Pick a book for me"}]}]}
    print(f"Testing model: {model}")
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ SUCCESS!")
            break
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Failed: {e}")
