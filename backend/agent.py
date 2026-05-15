"""
LangGraph Agent for Autonomous Incident Response
"""
import os
import re
import json
import hashlib
import logging
from typing import TypedDict, Annotated, Literal
from datetime import datetime
import redis.asyncio as redis
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from groq_client import get_groq_client
from mcp_clients import get_mcp_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blocked paths that should never be auto-fixed
BLOCKED_PATHS = ["auth.py", "security/", "secrets.yml", "credentials", ".env", "config/auth"]


class IncidentState(TypedDict):
    """State for incident response agent"""
    incident_id: str
    raw_log: str
    stack_trace: str
    severity: str  # P0, P1, P2, P3
    triage_summary: str
    affected_file: str
    affected_line: int
    diagnosis: str
    root_cause: str
    similar_incidents: list
    code_context: str
    proposed_fix: str
    proposed_test: str
    llm_confidence: float
    pattern_match_score: float
    historical_score: float
    confidence_score: float
    action_taken: str  # pr_created, slack_alert, human_approval
    pr_url: str
    error_signature: str
    escalated: bool
    messages: Annotated[list, "append"]


async def triage_node(state: IncidentState) -> IncidentState:
    """
    Triage node: Classify severity and generate summary
    """
    logger.info(f"[Triage] Processing incident {state['incident_id']}")
    
    groq = get_groq_client()
    
    system_prompt = """You are an expert incident triage system. Analyze the log and classify severity:
- P0: Critical production outage, data loss, security breach
- P1: Major functionality broken, significant user impact
- P2: Minor functionality issue, workaround available
- P3: Cosmetic issue, low impact

Respond in JSON format:
{
  "severity": "P0|P1|P2|P3",
  "summary": "one-line summary of the issue",
  "error_signature": "key error identifier (e.g., exception type + first line)"
}"""
    
    prompt = f"""Log Message: {state['raw_log']}

Stack Trace:
{state.get('stack_trace', 'N/A')}

Classify this incident."""
    
    try:
        result = await groq.call_groq_with_json(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.1,
            use_cache=True
        )
        
        severity = result.get("severity", "P2")
        summary = result.get("summary", "Unknown issue")
        error_signature = result.get("error_signature", state['raw_log'][:100])
        
        state["severity"] = severity
        state["triage_summary"] = summary
        state["error_signature"] = error_signature
        state["messages"].append(f"Triage: {severity} - {summary}")
        
        # P0 incidents are immediately escalated
        if severity == "P0":
            state["escalated"] = True
            state["action_taken"] = "slack_alerted"
            logger.warning(f"[Triage] P0 incident detected, escalating immediately")
        
        logger.info(f"[Triage] Classified as {severity}: {summary}")
        
    except Exception as e:
        logger.error(f"[Triage] Error: {e}")
        state["severity"] = "P2"
        state["triage_summary"] = f"Triage failed: {str(e)}"
        state["messages"].append(f"Triage error: {str(e)}")
    
    return state


async def diagnosis_node(state: IncidentState) -> IncidentState:
    """
    Diagnosis node: Extract file/line, fetch context, find similar incidents
    """
    logger.info(f"[Diagnosis] Analyzing incident {state['incident_id']}")
    
    # Skip diagnosis if already escalated
    if state.get("escalated"):
        logger.info("[Diagnosis] Skipping - incident already escalated")
        return state
    
    groq = get_groq_client()
    mcp = get_mcp_manager()
    
    # Extract file path and line number from stack trace
    file_path = None
    line_number = None
    
    if state.get("stack_trace"):
        # Common patterns: "at file.py:123", "File \"file.py\", line 123"
        patterns = [
            r'File "([^"]+)", line (\d+)',
            r'at ([^\s:]+):(\d+)',
            r'([^\s]+\.py):(\d+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, state["stack_trace"])
            if match:
                file_path = match.group(1)
                line_number = int(match.group(2))
                break
    
    if file_path and line_number:
        state["affected_file"] = file_path
        state["affected_line"] = line_number
        logger.info(f"[Diagnosis] Affected: {file_path}:{line_number}")
        
        # Check if file is in blocked paths
        for blocked in BLOCKED_PATHS:
            if blocked in file_path:
                logger.warning(f"[Diagnosis] File {file_path} is in blocked paths, escalating")
                state["escalated"] = True
                state["action_taken"] = "slack_alert"
                state["diagnosis"] = f"Security-critical file detected: {file_path}"
                state["messages"].append(f"Diagnosis: Blocked path detected, escalating")
                return state
        
        # Fetch code context from GitHub
        try:
            repo = os.getenv("GITHUB_REPO", "owner/repo")
            context_result = await mcp.fetch_github_context(
                repo=repo,
                file_path=file_path,
                line_number=line_number,
                context_lines=10
            )
            state["code_context"] = context_result.get("code_snippet", "")
            logger.info(f"[Diagnosis] Fetched code context ({len(state['code_context'])} chars)")
        except Exception as e:
            logger.warning(f"[Diagnosis] Failed to fetch code context: {e}")
            state["code_context"] = ""
    else:
        logger.warning("[Diagnosis] Could not extract file/line from stack trace")
        state["affected_file"] = "unknown"
        state["affected_line"] = 0
    
    # Find similar past incidents
    try:
        similar = await mcp.get_similar_incidents(
            error_signature=state["error_signature"],
            limit=5
        )
        state["similar_incidents"] = similar
        logger.info(f"[Diagnosis] Found {len(similar)} similar incidents")
    except Exception as e:
        logger.warning(f"[Diagnosis] Failed to fetch similar incidents: {e}")
        state["similar_incidents"] = []
    
    # Generate diagnosis using LLM
    system_prompt = """You are an expert software debugger. Analyze the incident and provide:
1. Root cause analysis
2. Detailed diagnosis

Respond in JSON format:
{
  "root_cause": "brief root cause",
  "diagnosis": "detailed diagnosis with reasoning"
}"""
    
    similar_context = ""
    if state["similar_incidents"]:
        similar_context = "\n\nSimilar past incidents:\n"
        for inc in state["similar_incidents"][:3]:
            similar_context += f"- {inc.get('root_cause', 'N/A')}: {inc.get('resolution', 'N/A')}\n"
    
    prompt = f"""Error: {state['triage_summary']}

Stack Trace:
{state.get('stack_trace', 'N/A')}

Code Context ({state.get('affected_file', 'unknown')}:{state.get('affected_line', 0)}):
{state.get('code_context', 'N/A')}
{similar_context}

Diagnose the root cause."""
    
    try:
        result = await groq.call_groq_with_json(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.2,
            use_cache=True
        )
        
        state["root_cause"] = result.get("root_cause", "Unknown")
        state["diagnosis"] = result.get("diagnosis", "Unable to diagnose")
        state["messages"].append(f"Diagnosis: {state['root_cause']}")
        logger.info(f"[Diagnosis] Root cause: {state['root_cause']}")
        
    except Exception as e:
        logger.error(f"[Diagnosis] Error: {e}")
        state["root_cause"] = "Diagnosis failed"
        state["diagnosis"] = str(e)
        state["messages"].append(f"Diagnosis error: {str(e)}")
    
    return state


async def fix_node(state: IncidentState) -> IncidentState:
    """
    Fix node: Generate patch and unit test
    """
    logger.info(f"[Fix] Generating fix for incident {state['incident_id']}")
    
    # Skip if already escalated
    if state.get("escalated"):
        logger.info("[Fix] Skipping - incident already escalated")
        return state
    
    groq = get_groq_client()
    
    system_prompt = """You are an expert software engineer. Generate a fix for the diagnosed issue.

Provide:
1. A git-style unified diff patch
2. A unit test to verify the fix

Respond in JSON format:
{
  "patch": "unified diff format patch",
  "test": "unit test code",
  "explanation": "brief explanation of the fix"
}"""
    
    prompt = f"""Root Cause: {state.get('root_cause', 'Unknown')}

Diagnosis: {state.get('diagnosis', 'N/A')}

Affected File: {state.get('affected_file', 'unknown')}
Line: {state.get('affected_line', 0)}

Code Context:
{state.get('code_context', 'N/A')}

Generate a fix with patch and test."""
    
    try:
        result = await groq.call_groq_with_json(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            use_cache=False  # Don't cache fixes - each should be unique
        )
        
        state["proposed_fix"] = result.get("patch", "")
        state["proposed_test"] = result.get("test", "")
        explanation = result.get("explanation", "")
        
        state["messages"].append(f"Fix generated: {explanation}")
        logger.info(f"[Fix] Generated patch ({len(state['proposed_fix'])} chars)")
        
    except Exception as e:
        logger.error(f"[Fix] Error: {e}")
        state["proposed_fix"] = ""
        state["proposed_test"] = ""
        state["messages"].append(f"Fix generation error: {str(e)}")
    
    return state


async def confidence_node(state: IncidentState) -> IncidentState:
    """
    Confidence node: Calculate composite confidence score
    """
    logger.info(f"[Confidence] Calculating confidence for incident {state['incident_id']}")
    
    groq = get_groq_client()
    
    # 1. LLM Confidence (40%)
    system_prompt = """You are a confidence estimator. Rate your confidence in the proposed fix on a scale of 0-100.

Consider:
- Clarity of root cause
- Quality of diagnosis
- Completeness of fix
- Test coverage

Respond with just a number between 0 and 100."""
    
    prompt = f"""Root Cause: {state.get('root_cause', 'Unknown')}
Diagnosis: {state.get('diagnosis', 'N/A')}
Proposed Fix: {state.get('proposed_fix', 'N/A')[:500]}

Rate confidence (0-100):"""
    
    try:
        llm_response = await groq.call_groq(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.1,
            use_cache=True
        )
        llm_confidence = float(re.search(r'\d+', llm_response).group()) / 100.0
    except Exception as e:
        logger.warning(f"[Confidence] LLM confidence error: {e}")
        llm_confidence = 0.5
    
    state["llm_confidence"] = llm_confidence
    
    # 2. Pattern Match Score (30%)
    pattern_score = 0.0
    
    # Known error patterns
    known_patterns = {
        "NullPointerException": 0.8,
        "IndexOutOfBoundsException": 0.9,
        "KeyError": 0.85,
        "AttributeError": 0.75,
        "TypeError": 0.7,
        "ValueError": 0.7,
    }
    
    for pattern, score in known_patterns.items():
        if pattern.lower() in state.get("error_signature", "").lower():
            pattern_score = score
            break
    
    # If we have code context, increase confidence
    if state.get("code_context"):
        pattern_score = min(1.0, pattern_score + 0.1)
    
    state["pattern_match_score"] = pattern_score
    
    # 3. Historical Score (30%)
    historical_score = 0.5  # Default
    
    if state.get("similar_incidents"):
        # Calculate success rate from similar incidents
        successful = sum(1 for inc in state["similar_incidents"] if inc.get("success", False))
        total = len(state["similar_incidents"])
        if total > 0:
            historical_score = successful / total
    
    state["historical_score"] = historical_score
    
    # Composite score
    composite = (
        0.4 * llm_confidence +
        0.3 * pattern_score +
        0.3 * historical_score
    )
    
    state["confidence_score"] = composite
    state["messages"].append(
        f"Confidence: {composite:.2%} (LLM: {llm_confidence:.2%}, Pattern: {pattern_score:.2%}, Historical: {historical_score:.2%})"
    )
    
    logger.info(f"[Confidence] Composite score: {composite:.2%}")
    
    return state


async def action_router(state: IncidentState) -> Literal["pr_created", "slack_alert", "human_approval"]:
    """
    Action router: Decide what action to take based on confidence and severity
    """
    logger.info(f"[Router] Routing action for incident {state['incident_id']}")
    
    mcp = get_mcp_manager()
    
    # P0 always goes to Slack immediately
    if state.get("severity") == "P0" or state.get("escalated"):
        logger.info("[Router] P0 or escalated - sending Slack alert")
        await mcp.send_slack_alert(
            incident_id=state["incident_id"],
            severity=state.get("severity", "P0"),
            summary=state.get("triage_summary", "Critical incident"),
            details=state.get("diagnosis", "No diagnosis available"),
            include_approval_buttons=False
        )
        state["action_taken"] = "slack_alert"
        state["messages"].append("Action: Slack alert sent (P0/escalated)")
        return "slack_alert"
    
    # High confidence (>85%) and not P0 -> Auto-create PR
    if state.get("confidence_score", 0) > 0.85 and state.get("proposed_fix"):
        logger.info("[Router] High confidence - creating PR")
        
        try:
            repo = os.getenv("GITHUB_REPO", "owner/repo")
            branch_name = f"aira-fix-{state['incident_id']}"
            
            pr_result = await mcp.create_pr(
                repo=repo,
                branch_name=branch_name,
                file_path=state.get("affected_file", "unknown"),
                patch_content=state["proposed_fix"],
                title=f"[AIRA] Fix: {state.get('triage_summary', 'Incident fix')}",
                description=f"""**Incident ID:** {state['incident_id']}
**Severity:** {state.get('severity', 'Unknown')}
**Root Cause:** {state.get('root_cause', 'Unknown')}
**Confidence:** {state.get('confidence_score', 0):.2%}

**Diagnosis:**
{state.get('diagnosis', 'N/A')}

**Proposed Test:**
```python
{state.get('proposed_test', 'N/A')}
```

---
*This PR was automatically generated by AIRA (Autonomous Incident Response Agent)*
"""
            )
            
            state["pr_url"] = pr_result.get("pr_url", "")
            state["action_taken"] = "pr_created"
            state["messages"].append(f"Action: PR created at {state['pr_url']}")
            
            # Store successful outcome
            await mcp.store_incident_outcome(
                incident_id=state["incident_id"],
                error_signature=state["error_signature"],
                root_cause=state.get("root_cause", ""),
                resolution=state.get("diagnosis", ""),
                patch_url=state["pr_url"],
                success=True
            )
            
            logger.info(f"[Router] PR created: {state['pr_url']}")
            return "pr_created"
            
        except Exception as e:
            logger.error(f"[Router] PR creation failed: {e}")
            state["messages"].append(f"PR creation failed: {str(e)}")
            # Fall through to human approval
    
    # Otherwise -> Human approval via Slack
    logger.info("[Router] Requesting human approval via Slack")
    
    await mcp.send_slack_alert(
        incident_id=state["incident_id"],
        severity=state.get("severity", "P2"),
        summary=state.get("triage_summary", "Incident requires approval"),
        details=f"""**Root Cause:** {state.get('root_cause', 'Unknown')}
**Confidence:** {state.get('confidence_score', 0):.2%}

**Proposed Fix:**
```
{state.get('proposed_fix', 'N/A')[:500]}
```

Please review and approve or reject this fix.""",
        include_approval_buttons=True
    )
    
    state["action_taken"] = "human_approval"
    state["messages"].append("Action: Awaiting human approval via Slack")
    
    return "human_approval"


# Build the graph
def build_agent_graph():
    """Build the LangGraph agent"""
    
    workflow = StateGraph(IncidentState)
    
    # Add nodes
    workflow.add_node("triage", triage_node)
    workflow.add_node("diagnose", diagnosis_node)
    workflow.add_node("fix", fix_node)
    workflow.add_node("confidence", confidence_node)
    workflow.add_node("action_router", action_router)
    
    # Define edges
    workflow.set_entry_point("triage")
    workflow.add_edge("triage", "diagnose")
    workflow.add_edge("diagnose", "fix")
    workflow.add_edge("fix", "confidence")
    workflow.add_edge("confidence", "action_router")
    workflow.add_edge("action_router", END)
    
    return workflow


async def run_incident_agent(incident_id: str, raw_log: str, stack_trace: str = "") -> dict:
    """
    Run the incident response agent
    
    Args:
        incident_id: Unique incident ID
        raw_log: Raw log message
        stack_trace: Stack trace (optional)
        
    Returns:
        Final state dictionary
    """
    logger.info(f"[Agent] Starting agent for incident {incident_id}")
    
    # Initialize state
    initial_state = IncidentState(
        incident_id=incident_id,
        raw_log=raw_log,
        stack_trace=stack_trace,
        severity="",
        triage_summary="",
        affected_file="",
        affected_line=0,
        diagnosis="",
        root_cause="",
        similar_incidents=[],
        code_context="",
        proposed_fix="",
        proposed_test="",
        llm_confidence=0.0,
        pattern_match_score=0.0,
        historical_score=0.0,
        confidence_score=0.0,
        action_taken="",
        pr_url="",
        error_signature="",
        escalated=False,
        messages=[]
    )
    
    # Build graph with checkpointing
    workflow = build_agent_graph()
    
    # Use SQLite checkpointer
    async with AsyncSqliteSaver.from_conn_string("checkpoints.db") as checkpointer:
        app = workflow.compile(checkpointer=checkpointer)
        
        # Run the agent
        config = {"configurable": {"thread_id": incident_id}}
        final_state = await app.ainvoke(initial_state, config)
        
        logger.info(f"[Agent] Completed incident {incident_id}: {final_state.get('action_taken')}")
        
        return final_state

# Made with Bob
