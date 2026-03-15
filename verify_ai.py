import os
import json
from dotenv import load_dotenv
from agent_core import call_llm

load_dotenv()

def test_api_connection():
    print("--- Testing OpenRouter Connection ---")
    print(f"Using Model: {os.getenv('ORCHESTRATOR_MODEL')}")
    print(f"Real LLM Enabled: {os.getenv('OPENROUTER_USE_REAL_LLM')}")
    
    test_prompt = "Say 'Hello, AI is working!' if you can read this."
    
    try:
        response = call_llm(prompt=test_prompt)
        print("\nResponse from AI:")
        print(response)
        
        if "Hello" in str(response) or "working" in str(response):
            print("\n✅ AI Integration SUCCESSFUL!")
        else:
            print("\n⚠️ Received response, but it might be a stub or unexpected.")
            
    except Exception as e:
        print(f"\n❌ AI Integration FAILED: {e}")

if __name__ == "__main__":
    test_api_connection()
