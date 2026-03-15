import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")
FREE_MODEL = "meta-llama/llama-3.1-8b-instruct:free"

print(f"--- Testing OpenRouter with FREE MODEL ---")
print(f"Model: {FREE_MODEL}")

payload = {
    "model": FREE_MODEL,
    "messages": [{"role": "user", "content": "Tell me a short joke."}]
}

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    with httpx.Client(timeout=30) as client:
        response = client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        print("\n✅ Connection Successful with Free Model!")
        content = data['choices'][0]['message']['content']
        print(f"AI Response: {content}")
except Exception as e:
    print(f"\n❌ Free Model Test Failed: {e}")
    if hasattr(e, 'response'):
        print(f"Status Code: {e.response.status_code}")
        print(f"Response: {e.response.text}")
