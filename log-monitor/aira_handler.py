"""
AIRA Logging Handler for Python Applications

This handler automatically sends ERROR and CRITICAL logs to AIRA for incident response.
"""
import logging
import traceback
import json
import requests
from typing import Optional
from datetime import datetime


class AIRAHandler(logging.Handler):
    """
    Custom logging handler that sends errors to AIRA webhook
    
    Usage:
        import logging
        from aira_handler import AIRAHandler
        
        logger = logging.getLogger(__name__)
        aira_handler = AIRAHandler(aira_url="http://localhost:8000/webhook")
        logger.addHandler(aira_handler)
    """
    
    def __init__(
        self,
        aira_url: str = "http://localhost:8000/webhook",
        level: int = logging.ERROR,
        timeout: int = 5,
        app_name: Optional[str] = None
    ):
        """
        Initialize AIRA handler
        
        Args:
            aira_url: AIRA webhook URL
            level: Minimum log level to send (default: ERROR)
            timeout: Request timeout in seconds
            app_name: Application name for context
        """
        super().__init__(level)
        self.aira_url = aira_url
        self.timeout = timeout
        self.app_name = app_name or "python-app"
        
    def emit(self, record: logging.LogRecord):
        """
        Send log record to AIRA
        
        Args:
            record: LogRecord instance
        """
        try:
            # Extract stack trace if available
            stack_trace = ""
            if record.exc_info:
                stack_trace = "".join(traceback.format_exception(*record.exc_info))
            
            # Determine severity based on log level
            severity_map = {
                logging.CRITICAL: "P0",
                logging.ERROR: "P1",
                logging.WARNING: "P2",
            }
            severity = severity_map.get(record.levelno, "P2")
            
            # Build incident payload
            payload = {
                "message": f"[{self.app_name}] {record.getMessage()}",
                "stack_trace": stack_trace,
                "severity": severity,
                "timestamp": datetime.utcnow().isoformat(),
                "metadata": {
                    "logger": record.name,
                    "module": record.module,
                    "function": record.funcName,
                    "line": record.lineno,
                    "level": record.levelname,
                    "app": self.app_name
                }
            }
            
            # Send to AIRA (non-blocking)
            response = requests.post(
                self.aira_url,
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"[AIRA] Incident reported: {result.get('incident_id')}")
            else:
                print(f"[AIRA] Failed to report incident: {response.status_code}")
                
        except Exception as e:
            # Don't let handler errors break the application
            print(f"[AIRA] Handler error: {e}")
            self.handleError(record)


def setup_aira_logging(
    aira_url: str = "http://localhost:8000/webhook",
    app_name: Optional[str] = None,
    level: int = logging.ERROR
) -> logging.Logger:
    """
    Quick setup function to add AIRA handler to root logger
    
    Args:
        aira_url: AIRA webhook URL
        app_name: Application name
        level: Minimum log level to send
        
    Returns:
        Configured logger
    """
    logger = logging.getLogger()
    
    # Add AIRA handler
    aira_handler = AIRAHandler(
        aira_url=aira_url,
        level=level,
        app_name=app_name
    )
    logger.addHandler(aira_handler)
    
    # Also add console handler for local debugging
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    logger.setLevel(logging.INFO)
    
    return logger

# Made with Bob
