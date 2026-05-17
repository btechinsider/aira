"""
Groq LLM client with retry logic, caching, and circuit breaker
"""
import os
import json
import hashlib
import asyncio
import time
from typing import Optional, Dict, Any, Tuple
from collections import OrderedDict
import httpx
from groq import AsyncGroq
import logging

from exceptions import GroqAPIError, RateLimitExceeded, TimeoutError as AIRATimeoutError
from circuit_breaker import CircuitBreaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LRUCache:
    """
    Simple LRU cache with TTL support
    Thread-safe for async operations
    """
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 3600):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: OrderedDict[str, Tuple[str, float]] = OrderedDict()
        self._lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache if not expired"""
        async with self._lock:
            if key not in self.cache:
                return None
            
            value, expiry = self.cache[key]
            
            # Check if expired
            if time.time() > expiry:
                del self.cache[key]
                return None
            
            # Move to end (most recently used)
            self.cache.move_to_end(key)
            return value
    
    async def set(self, key: str, value: str, ttl: Optional[int] = None):
        """Set value in cache with TTL"""
        async with self._lock:
            expiry = time.time() + (ttl or self.default_ttl)
            
            # Remove oldest if at capacity
            if len(self.cache) >= self.max_size and key not in self.cache:
                self.cache.popitem(last=False)
            
            self.cache[key] = (value, expiry)
            self.cache.move_to_end(key)
    
    async def clear(self):
        """Clear all cache entries"""
        async with self._lock:
            self.cache.clear()
    
    async def cleanup_expired(self):
        """Remove expired entries"""
        async with self._lock:
            current_time = time.time()
            expired_keys = [
                key for key, (_, expiry) in self.cache.items()
                if current_time > expiry
            ]
            for key in expired_keys:
                del self.cache[key]
            
            if expired_keys:
                logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "utilization": len(self.cache) / self.max_size if self.max_size > 0 else 0
        }


class GroqClient:
    """
    Groq LLM client with retry logic, LRU caching, and circuit breaker
    """
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.client = AsyncGroq(api_key=self.api_key)
        self.model = "llama-3.3-70b-versatile"
        self.max_retries = 3
        self.base_delay = 1.0
        self.timeout = 30.0  # 30 second timeout for API calls
        
        # LRU cache with TTL
        self.cache = LRUCache(max_size=1000, default_ttl=3600)
        
        # Circuit breaker for Groq API
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            timeout=60,
            name="groq_api"
        )
        
        # Background task for cache cleanup
        self._cleanup_task: Optional[asyncio.Task] = None
    
    async def start_cache_cleanup(self):
        """Start background task for cache cleanup"""
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._cache_cleanup_loop())
            logger.info("Started cache cleanup background task")
    
    async def _cache_cleanup_loop(self):
        """Background loop to clean up expired cache entries"""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                await self.cache.cleanup_expired()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cache cleanup: {e}", exc_info=True)
    
    async def close(self):
        """Cleanup resources"""
        if self._cleanup_task and not self._cleanup_task.done():
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        await self.cache.clear()
        logger.info("Groq client closed")
    
    def _generate_cache_key(self, prompt: str, system_prompt: Optional[str], temperature: float) -> str:
        """Generate cache key from prompt parameters"""
        content = f"{system_prompt or ''}|{prompt}|{temperature}"
        return f"groq:cache:{hashlib.sha256(content.encode()).hexdigest()}"
    
    async def _get_cached_response(self, cache_key: str) -> Optional[str]:
        """Get cached response from LRU cache"""
        cached = await self.cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for key: {cache_key[:16]}...")
        return cached
    
    async def _set_cached_response(self, cache_key: str, response: str, ttl: int = 3600):
        """Cache response with TTL"""
        await self.cache.set(cache_key, response, ttl)
        logger.debug(f"Cached response with TTL={ttl}s")
    
    async def call_groq(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2000,
        use_cache: bool = True,
        cache_ttl: int = 3600
    ) -> str:
        """
        Call Groq API with retry logic, caching, and circuit breaker
        
        Args:
            prompt: User prompt
            system_prompt: System prompt (optional)
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens in response
            use_cache: Whether to use cache
            cache_ttl: Cache TTL in seconds
            
        Returns:
            LLM response text
            
        Raises:
            GroqAPIError: If API call fails after retries
            CircuitBreakerOpen: If circuit breaker is open
        """
        # Check cache first
        cache_key = None
        if use_cache:
            cache_key = self._generate_cache_key(prompt, system_prompt, temperature)
            cached_response = await self._get_cached_response(cache_key)
            if cached_response:
                return cached_response
        
        # Prepare messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Call with circuit breaker protection
        async def _make_api_call():
            """Internal function for API call with retry logic"""
            last_error = None
            
            for attempt in range(self.max_retries):
                try:
                    logger.info(f"Calling Groq API (attempt {attempt + 1}/{self.max_retries})")
                    
                    # Add timeout protection
                    response = await asyncio.wait_for(
                        self.client.chat.completions.create(
                            model=self.model,
                            messages=messages,
                            temperature=temperature,
                            max_tokens=max_tokens,
                            top_p=1,
                            stream=False
                        ),
                        timeout=self.timeout
                    )
                    
                    result = response.choices[0].message.content
                    
                    # Cache successful response
                    if use_cache and cache_key:
                        await self._set_cached_response(cache_key, result, cache_ttl)
                    
                    logger.info(f"Groq API call successful (tokens: {response.usage.total_tokens})")
                    return result
                    
                except asyncio.TimeoutError:
                    last_error = AIRATimeoutError(
                        f"Groq API call timed out after {self.timeout}s",
                        details={"attempt": attempt + 1, "timeout": self.timeout}
                    )
                    logger.warning(f"Groq API timeout (attempt {attempt + 1})")
                    
                except Exception as e:
                    last_error = e
                    logger.warning(f"Groq API error (attempt {attempt + 1}): {e}")
                    
                    # Check for rate limiting
                    if "rate_limit" in str(e).lower():
                        raise RateLimitExceeded(
                            "Groq API rate limit exceeded",
                            details={"error": str(e)},
                            original_error=e
                        )
                
                # Exponential backoff before retry
                if attempt < self.max_retries - 1:
                    delay = self.base_delay * (2 ** attempt)
                    logger.info(f"Retrying in {delay}s...")
                    await asyncio.sleep(delay)
            
            # All retries failed
            raise GroqAPIError(
                f"Groq API failed after {self.max_retries} attempts",
                details={"last_error": str(last_error)},
                original_error=last_error
            )
        
        # Execute with circuit breaker
        try:
            return await self.circuit_breaker.call(_make_api_call)
        except Exception as e:
            logger.error(f"Groq API call failed: {e}", exc_info=True)
            raise
    
    async def call_groq_with_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Call Groq and parse JSON response
        
        Returns:
            Parsed JSON dictionary
            
        Raises:
            GroqAPIError: If API call fails
            ValueError: If response is not valid JSON
        """
        response = await self.call_groq(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            use_cache=use_cache
        )
        
        # Extract JSON from response (handle markdown code blocks)
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        
        try:
            return json.loads(response.strip())
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}", exc_info=True)
            logger.error(f"Response: {response[:500]}...")  # Log first 500 chars
            raise ValueError(f"Invalid JSON response from Groq: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats = self.cache.get_stats()
        stats["circuit_breaker"] = self.circuit_breaker.get_state()
        return stats


# Global client instance
_groq_client: Optional[GroqClient] = None


def get_groq_client() -> GroqClient:
    """Get or create global Groq client instance"""
    global _groq_client
    if _groq_client is None:
        _groq_client = GroqClient()
    return _groq_client

# Made with Bob
