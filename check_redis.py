import redis
import os
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
print(f"Connecting to Redis at {redis_url}...")

try:
    r = redis.from_url(redis_url)
    r.ping()
    print("Redis connection successful!")
except Exception as e:
    print(f"Redis connection failed: {e}")
