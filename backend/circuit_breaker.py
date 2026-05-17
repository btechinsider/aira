"""
Circuit Breaker Pattern Implementation
Prevents cascading failures by failing fast when external services are down
"""
import asyncio
import logging
from enum import Enum
from datetime import datetime, timedelta
from typing import Callable, Any, Optional
from functools import wraps

from exceptions import CircuitBreakerOpen, TimeoutError as AIRATimeoutError

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"          # Normal operation
    OPEN = "open"              # Failing, reject requests immediately
    HALF_OPEN = "half_open"    # Testing if service recovered


class CircuitBreaker:
    """
    Circuit breaker for external service calls
    
    States:
    - CLOSED: Normal operation, requests pass through
    - OPEN: Service is failing, requests fail immediately
    - HALF_OPEN: Testing if service recovered, limited requests allowed
    
    Usage:
        breaker = CircuitBreaker(failure_threshold=5, timeout=60)
        
        async def call_external_service():
            return await breaker.call(actual_service_call, arg1, arg2)
    """
    
    def __init__(
        self,
        failure_threshold: int = 5,
        timeout: int = 60,
        half_open_max_calls: int = 3,
        name: str = "unnamed"
    ):
        """
        Initialize circuit breaker
        
        Args:
            failure_threshold: Number of failures before opening circuit
            timeout: Seconds to wait before attempting recovery (OPEN -> HALF_OPEN)
            half_open_max_calls: Max calls allowed in HALF_OPEN state
            name: Name for logging purposes
        """
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.half_open_max_calls = half_open_max_calls
        self.name = name
        
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = CircuitState.CLOSED
        self.half_open_calls = 0
        
        self._lock = asyncio.Lock()
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection
        
        Args:
            func: Async function to call
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func
            
        Returns:
            Result from func
            
        Raises:
            CircuitBreakerOpen: If circuit is open
            Original exception: If func fails
        """
        async with self._lock:
            # Check if we should transition from OPEN to HALF_OPEN
            if self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    logger.info(f"[CircuitBreaker:{self.name}] Transitioning to HALF_OPEN")
                    self.state = CircuitState.HALF_OPEN
                    self.half_open_calls = 0
                else:
                    raise CircuitBreakerOpen(
                        f"Circuit breaker '{self.name}' is OPEN",
                        details={
                            "failure_count": self.failure_count,
                            "last_failure": self.last_failure_time.isoformat() if self.last_failure_time else None,
                            "retry_after": (self.last_failure_time + timedelta(seconds=self.timeout)).isoformat() if self.last_failure_time else None
                        }
                    )
            
            # In HALF_OPEN state, limit number of test calls
            if self.state == CircuitState.HALF_OPEN:
                if self.half_open_calls >= self.half_open_max_calls:
                    raise CircuitBreakerOpen(
                        f"Circuit breaker '{self.name}' is HALF_OPEN (max test calls reached)",
                        details={"half_open_calls": self.half_open_calls}
                    )
                self.half_open_calls += 1
        
        # Execute the function
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception as e:
            await self._on_failure(e)
            raise
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if not self.last_failure_time:
            return True
        return datetime.now() - self.last_failure_time > timedelta(seconds=self.timeout)
    
    async def _on_success(self):
        """Handle successful call"""
        async with self._lock:
            self.success_count += 1
            
            if self.state == CircuitState.HALF_OPEN:
                # If we've had enough successful calls in HALF_OPEN, close the circuit
                if self.success_count >= self.half_open_max_calls:
                    logger.info(f"[CircuitBreaker:{self.name}] Service recovered, transitioning to CLOSED")
                    self.state = CircuitState.CLOSED
                    self.failure_count = 0
                    self.success_count = 0
                    self.half_open_calls = 0
            elif self.state == CircuitState.CLOSED:
                # Reset failure count on success
                if self.failure_count > 0:
                    logger.debug(f"[CircuitBreaker:{self.name}] Resetting failure count after success")
                    self.failure_count = 0
    
    async def _on_failure(self, error: Exception):
        """Handle failed call"""
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = datetime.now()
            
            logger.warning(
                f"[CircuitBreaker:{self.name}] Call failed ({self.failure_count}/{self.failure_threshold}): {error}"
            )
            
            if self.state == CircuitState.HALF_OPEN:
                # Any failure in HALF_OPEN immediately opens the circuit
                logger.warning(f"[CircuitBreaker:{self.name}] Failure in HALF_OPEN, transitioning to OPEN")
                self.state = CircuitState.OPEN
                self.success_count = 0
            elif self.state == CircuitState.CLOSED:
                # Open circuit if threshold reached
                if self.failure_count >= self.failure_threshold:
                    logger.error(
                        f"[CircuitBreaker:{self.name}] Failure threshold reached, transitioning to OPEN"
                    )
                    self.state = CircuitState.OPEN
    
    def get_state(self) -> dict:
        """Get current circuit breaker state"""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure_time": self.last_failure_time.isoformat() if self.last_failure_time else None,
            "half_open_calls": self.half_open_calls if self.state == CircuitState.HALF_OPEN else None
        }
    
    async def reset(self):
        """Manually reset circuit breaker to CLOSED state"""
        async with self._lock:
            logger.info(f"[CircuitBreaker:{self.name}] Manual reset to CLOSED")
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            self.success_count = 0
            self.half_open_calls = 0
            self.last_failure_time = None


def circuit_breaker(
    failure_threshold: int = 5,
    timeout: int = 60,
    name: Optional[str] = None
):
    """
    Decorator for circuit breaker protection
    
    Usage:
        @circuit_breaker(failure_threshold=3, timeout=30, name="groq_api")
        async def call_groq_api():
            # API call here
            pass
    """
    def decorator(func: Callable):
        breaker_name = name or func.__name__
        breaker = CircuitBreaker(
            failure_threshold=failure_threshold,
            timeout=timeout,
            name=breaker_name
        )
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await breaker.call(func, *args, **kwargs)
        
        # Attach breaker to function for inspection
        wrapper.circuit_breaker = breaker
        return wrapper
    
    return decorator


# Made with Bob