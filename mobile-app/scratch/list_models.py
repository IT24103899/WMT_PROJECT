import os
from google import genai

GEMINI_API_KEY = "AIzaSyBXfzVlohPOGg9Pzh33nEDq8hJlqy1lWcI"
client = genai.Client(api_key=GEMINI_API_KEY)

try:
    print("Listing available models...")
    for model in client.models.list():
        print(f"Name: {model.name}, Display: {model.display_name}")
except Exception as e:
    print(f"Error: {e}")
