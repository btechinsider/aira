"""
Groq LLM client with retry logic and Redis caching
"""
import os
import json
import hashlib
import asyncio
from typing import Optional, Dict, Any
import httpx
from groq import AsyncGroq
import redis.asyncio as redis
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GroqClient:
    """Groq LLM client with caching and retry logic"""
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        self.client = AsyncGroq(api_key=self.api_key)
        self.model = "llama-3.3-70b-versatile"
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client: Optional[redis.Redis] = None
        self.max_retries = 3
        self.base_delay = 1.0
        
    async def init_redis(self):
        """Initialize Redis connection"""
        if not self.redis_client:
            self.redis_client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("Redis client initialized")
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
    
    def _generate_cache_key(self, prompt: str, system_prompt: Optional[str], temperature: float) -> str:
        """Generate cache key from prompt parameters"""
        content = f"{system_prompt or ''}|{prompt}|{temperature}"
        return f"groq:cache:{hashlib.sha256(content.encode()).hexdigest()}"
    
    async def _get_cached_response(self, cache_key: str) -> Optional[str]:
        """Get cached response from Redis"""
        if not self.redis_client:
            return None
        
        try:
            cached = await self.redis_client.get(cache_key)
            if cached:
                logger.info(f"Cache hit for key: {cache_key[:16]}...")
                return cached
        except Exception as e:
            logger.warning(f"Redis get error: {e}")
        
        return None
    
    async def _set_cached_response(self, cache_key: str, response: str, ttl: int = 3600):
        """Cache response in Redis with TTL"""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.setex(cache_key, ttl, response)
            logger.info(f"Cached response with TTL {ttl}s")
        except Exception as e:
            logger.warning(f"Redis set error: {e}")
    
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
        Call Groq API with retry logic and caching
        
        Args:
            prompt: User prompt
            system_prompt: System prompt (optional)
            temperature: Sampling temperature (0.0-2.0)
            max_tokens: Maximum tokens in response
            use_cache: Whether to use Redis cache
            cache_ttl: Cache TTL in seconds
            
        Returns:
            LLM response text
        """
        await self.init_redis()
        
        # Check cache
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
        
        # Retry logic with exponential backoff
        last_error = None
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Calling Groq API (attempt {attempt + 1}/{self.max_retries})")
                
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    top_p=1,
                    stream=False
                )
                
                result = response.choices[0].message.content
                
                # Cache successful response
                if use_cache:
                    await self._set_cached_response(cache_key, result, cache_ttl)
                
                logger.info(f"Groq API call successful (tokens: {response.usage.total_tokens})")
                return result
                
            except Exception as e:
                last_error = e
                logger.warning(f"Groq API error (attempt {attempt + 1}): {e}")
                
                if attempt < self.max_retries - 1:
                    delay = self.base_delay * (2 ** attempt)
                    logger.info(f"Retrying in {delay}s...")
                    await asyncio.sleep(delay)
        
        # All retries failed
        error_msg = f"Groq API failed after {self.max_retries} attempts: {last_error}"
        logger.error(error_msg)
        raise Exception(error_msg)
    
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
            logger.error(f"Failed to parse JSON response: {e}")
            logger.error(f"Response: {response}")
            raise ValueError(f"Invalid JSON response from Groq: {e}")


# Global client instance
_groq_client: Optional[GroqClient] = None


def get_groq_client() -> GroqClient:
    """Get or create global Groq client instance"""
    global _groq_client
    if _groq_client is None:
        _groq_client = GroqClient()
    return _groq_client

# Made with Bob
