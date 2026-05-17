"""
MCP Client Manager for GitHub and Incident Context operations
Enhanced with circuit breakers and better error handling
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional
import httpx

from circuit_breaker import CircuitBreaker
from exceptions import MCPServiceError, GitHubAPIError, TimeoutError as AIRATimeoutError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MCPClientManager:
    """
    Manager for MCP server interactions with circuit breaker protection
    """
    
    def __init__(self):
        self.github_mcp_url = os.getenv("GITHUB_MCP_URL", "http://github-mcp:8000")
        self.incident_context_mcp_url = os.getenv("INCIDENT_CONTEXT_MCP_URL", "http://incident-context-mcp:8000")
        self.timeout = 30.0
        
        # Circuit breakers for each MCP service
        self.github_circuit = CircuitBreaker(
            failure_threshold=5,
            timeout=60,
            name="github_mcp"
        )
        self.incident_circuit = CircuitBreaker(
            failure_threshold=5,
            timeout=60,
            name="incident_context_mcp"
        )
        
    async def _call_mcp_tool(
        self,
        base_url: str,
        tool_name: str,
        arguments: Dict[str, Any],
        circuit_breaker: CircuitBreaker
    ) -> Dict[str, Any]:
        """
        Call an MCP tool via HTTP with circuit breaker protection
        
        Args:
            base_url: MCP server base URL
            tool_name: Tool name to call
            arguments: Tool arguments
            circuit_breaker: Circuit breaker to use
            
        Returns:
            Tool response
            
        Raises:
            MCPServiceError: If MCP call fails
            CircuitBreakerOpen: If circuit breaker is open
        """
        url = f"{base_url}/mcp/tools/{tool_name}"
        
        async def _make_call():
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    logger.info(f"Calling MCP tool: {tool_name} at {url}")
                    response = await client.post(
                        url,
                        json={"arguments": arguments}
                    )
                    response.raise_for_status()
                    result = response.json()
                    logger.info(f"MCP tool {tool_name} succeeded")
                    return result
                    
            except httpx.TimeoutException as e:
                raise AIRATimeoutError(
                    f"MCP tool {tool_name} timed out",
                    details={"url": url, "timeout": self.timeout},
                    original_error=e
                )
            except httpx.HTTPStatusError as e:
                logger.error(f"MCP tool {tool_name} HTTP error: {e.response.status_code}", exc_info=True)
                logger.error(f"Response: {e.response.text}")
                raise MCPServiceError(
                    f"MCP tool {tool_name} failed with status {e.response.status_code}",
                    details={"url": url, "status_code": e.response.status_code, "response": e.response.text},
                    original_error=e
                )
            except Exception as e:
                logger.error(f"MCP tool {tool_name} error: {e}", exc_info=True)
                raise MCPServiceError(
                    f"MCP tool {tool_name} failed",
                    details={"url": url, "error": str(e)},
                    original_error=e
                )
        
        # Execute with circuit breaker
        return await circuit_breaker.call(_make_call)
    
    # GitHub MCP Tools
    
    async def fetch_github_context(
        self,
        repo: str,
        file_path: str,
        line_number: int,
        context_lines: int = 10
    ) -> Dict[str, Any]:
        """
        Fetch code context from GitHub around a specific line
        
        Args:
            repo: Repository in format "owner/repo"
            file_path: Path to file in repo
            line_number: Line number to fetch context around
            context_lines: Number of lines before/after to include
            
        Returns:
            Dict with file_path, line_number, code_snippet, start_line, end_line
        """
        return await self._call_mcp_tool(
            self.github_mcp_url,
            "fetch_affected_file",
            {
                "repo": repo,
                "file_path": file_path,
                "line_number": line_number,
                "context_lines": context_lines
            },
            self.github_circuit
        )
    
    async def create_pr(
        self,
        repo: str,
        branch_name: str,
        file_path: str,
        patch_content: str,
        title: str,
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Create a GitHub PR with the proposed fix
        
        Args:
            repo: Repository in format "owner/repo"
            branch_name: New branch name for the fix
            file_path: Path to file to patch
            patch_content: Git-style patch content
            title: PR title
            description: PR description
            
        Returns:
            Dict with pr_url, pr_number, branch_name
        """
        return await self._call_mcp_tool(
            self.github_mcp_url,
            "create_remediation_pr",
            {
                "repo": repo,
                "branch_name": branch_name,
                "file_path": file_path,
                "patch_content": patch_content,
                "title": title,
                "description": description
            },
            self.github_circuit
        )
    
    # Incident Context MCP Tools
    
    async def get_similar_incidents(
        self,
        error_signature: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find similar past incidents based on error signature
        
        Args:
            error_signature: Error signature (usually first line of stack trace)
            limit: Maximum number of similar incidents to return
            
        Returns:
            List of similar incidents with resolution info
        """
        result = await self._call_mcp_tool(
            self.incident_context_mcp_url,
            "get_similar_incidents",
            {
                "error_signature": error_signature,
                "limit": limit
            },
            self.incident_circuit
        )
        return result.get("incidents", [])
    
    async def store_incident_outcome(
        self,
        incident_id: str,
        error_signature: str,
        root_cause: str,
        resolution: str,
        patch_url: Optional[str] = None,
        success: bool = True
    ) -> Dict[str, Any]:
        """
        Store incident outcome for future similarity matching
        
        Args:
            incident_id: Unique incident ID
            error_signature: Error signature
            root_cause: Identified root cause
            resolution: Resolution description
            patch_url: URL to PR or patch (optional)
            success: Whether resolution was successful
            
        Returns:
            Confirmation dict
        """
        return await self._call_mcp_tool(
            self.incident_context_mcp_url,
            "store_incident_outcome",
            {
                "incident_id": incident_id,
                "error_signature": error_signature,
                "root_cause": root_cause,
                "resolution": resolution,
                "patch_url": patch_url,
                "success": success
            },
            self.incident_circuit
        )
    
    async def send_slack_alert(
        self,
        incident_id: str,
        severity: str,
        summary: str,
        details: str,
        include_approval_buttons: bool = False
    ) -> Dict[str, Any]:
        """
        Send Slack alert (via webhook or MCP if available)
        
        Args:
            incident_id: Incident ID
            severity: P0, P1, P2, P3
            summary: Brief summary
            details: Detailed information
            include_approval_buttons: Whether to include interactive buttons
            
        Returns:
            Confirmation dict
        """
        webhook_url = os.getenv("SLACK_WEBHOOK_URL")
        if not webhook_url:
            logger.warning("SLACK_WEBHOOK_URL not configured, skipping Slack alert")
            return {"status": "skipped", "reason": "no webhook configured"}
        
        # Build Slack message
        color = "#FF0000" if severity == "P0" else "#FFA500" if severity == "P1" else "#FFFF00"
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🚨 {severity} Incident: {incident_id}"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Summary:* {summary}\n\n*Details:*\n```{details}```"
                }
            }
        ]
        
        if include_approval_buttons:
            blocks.append({
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "✅ Approve Fix"},
                        "style": "primary",
                        "value": f"approve_{incident_id}",
                        "action_id": "approve_fix"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "❌ Reject"},
                        "style": "danger",
                        "value": f"reject_{incident_id}",
                        "action_id": "reject_fix"
                    }
                ]
            })
        
        payload = {
            "attachments": [
                {
                    "color": color,
                    "blocks": blocks
                }
            ]
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(webhook_url, json=payload)
                response.raise_for_status()
                logger.info(f"Slack alert sent for incident {incident_id}")
                return {"status": "sent", "incident_id": incident_id}
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}", exc_info=True)
            return {"status": "failed", "error": str(e)}
    
    def get_circuit_breaker_stats(self) -> Dict[str, Any]:
        """Get circuit breaker statistics for all MCP services"""
        return {
            "github_mcp": self.github_circuit.get_state(),
            "incident_context_mcp": self.incident_circuit.get_state()
        }


# Global instance
_mcp_manager: Optional[MCPClientManager] = None


def get_mcp_manager() -> MCPClientManager:
    """Get or create global MCP manager instance"""
    global _mcp_manager
    if _mcp_manager is None:
        _mcp_manager = MCPClientManager()
    return _mcp_manager

# Made with Bob
