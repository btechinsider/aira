"""
Custom exception hierarchy for AIRA
Provides structured error handling with context preservation
"""
from typing import Dict, Any, Optional


class AIRAException(Exception):
    """Base exception for all AIRA errors"""
    
    def __init__(
        self,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        original_error: Optional[Exception] = None
    ):
        self.message = message
        self.details = details or {}
        self.original_error = original_error
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API responses"""
        result = {
            "error_type": self.__class__.__name__,
            "message": self.message,
            "details": self.details
        }
        if self.original_error:
            result["original_error"] = str(self.original_error)
        return result


class DatabaseError(AIRAException):
    """Database operation failed"""
    pass


class ConnectionPoolExhausted(DatabaseError):
    """Database connection pool is exhausted"""
    pass


class TransactionError(DatabaseError):
    """Database transaction failed"""
    pass


class ExternalServiceError(AIRAException):
    """External service (Groq, GitHub, MCP, etc.) failed"""
    pass


class GroqAPIError(ExternalServiceError):
    """Groq API call failed"""
    pass


class GitHubAPIError(ExternalServiceError):
    """GitHub API call failed"""
    pass


class MCPServiceError(ExternalServiceError):
    """MCP service call failed"""
    pass


class SlackAPIError(ExternalServiceError):
    """Slack API call failed"""
    pass


class ValidationError(AIRAException):
    """Input validation failed"""
    pass


class AuthenticationError(AIRAException):
    """Authentication failed"""
    pass


class AuthorizationError(AIRAException):
    """Authorization failed - insufficient permissions"""
    pass


class IncidentProcessingError(AIRAException):
    """Incident processing failed"""
    pass


class AgentWorkflowError(IncidentProcessingError):
    """Agent workflow execution failed"""
    pass


class DiagnosisError(IncidentProcessingError):
    """Diagnosis phase failed"""
    pass


class FixGenerationError(IncidentProcessingError):
    """Fix generation phase failed"""
    pass


class CircuitBreakerOpen(ExternalServiceError):
    """Circuit breaker is open - service unavailable"""
    pass


class RateLimitExceeded(ExternalServiceError):
    """Rate limit exceeded for external service"""
    pass


class TimeoutError(AIRAException):
    """Operation timed out"""
    pass


class ConfigurationError(AIRAException):
    """Configuration is invalid or missing"""
    pass


class WebSocketError(AIRAException):
    """WebSocket operation failed"""
    pass


# Made with Bob