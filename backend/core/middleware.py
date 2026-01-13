import time
from django.core.cache import cache

class RequestThroughputMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Get current timestamp (seconds)
        current_second = int(time.time())
        
        # 2. Define a cache key for this specific second
        key = f"throughput_{current_second}"
        
        # 3. Increment the counter safely
        # If key exists, add 1. If not, create it with value 1 and expire in 10s.
        if not cache.add(key, 1, timeout=10):
            cache.incr(key)

        response = self.get_response(request)
        return response