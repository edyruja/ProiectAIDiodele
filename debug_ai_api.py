import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("ORCHESTRATOR_MODEL", "meta-llama/llama-3.1-8b-instruct:free")

print(f"--- Direct OpenRouter API Test ---")
print(f"Model: {MODEL}")
print(f"API Key starts with: {API_KEY[:10]}...")

payload = {
    "model": MODEL,
    "messages": [{"role": "user", "content": "Tell me a very short joke."}]
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
        print("\nFull Response Data:")
        print(json.dumps(data, indent=2))
        
        content = data['choices'][0]['message']['content']
        print(f"\nAI Content: {content}")
        print("\n✅ API KEY and CONNECTION ARE VALID!")
except Exception as e:
    print(f"\n❌ API TEST FAILED: {e}")
    if hasattr(e, 'response'):
        print(f"Status Code: {e.response.status_code}")
        print(f"Response: {e.response.text}")
