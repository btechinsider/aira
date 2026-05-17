"""
LangGraph Agent for Autonomous Incident Response
Optimized with conditional routing and early exits
"""
import os
import re
import json
import hashlib
import logging
from typing import TypedDict, Annotated, Literal
from datetime import datetime
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from groq_client import get_groq_client
from mcp_clients import get_mcp_manager
from diagnosis_enhanced import EnhancedDiagnosisAgent, DiagnosisContext
from exceptions import AgentWorkflowError, DiagnosisError, FixGenerationError

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
    # Enhanced diagnosis fields
    language: str
    stack_frames_count: int


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
    Enhanced diagnosis node: Multi-language stack trace parsing, deep GitHub integration
    Note: Escalation check removed - handled by conditional routing
    """
    logger.info(f"[Diagnosis] Analyzing incident {state['incident_id']}")
    
    groq = get_groq_client()
    mcp = get_mcp_manager()
    
    # Initialize enhanced diagnosis agent
    enhanced_agent = EnhancedDiagnosisAgent(groq, mcp)
    
    try:
        # Perform comprehensive diagnosis
        diagnosis_context = await enhanced_agent.diagnose(
            incident_id=state['incident_id'],
            error_message=state['raw_log'],
            stack_trace=state.get('stack_trace', ''),
            error_signature=state['error_signature']
        )
        
        # Update state with diagnosis results
        if diagnosis_context.primary_frame:
            state["affected_file"] = diagnosis_context.primary_frame.file_path
            state["affected_line"] = diagnosis_context.primary_frame.line_number
            logger.info(f"[Diagnosis] Affected: {diagnosis_context.primary_frame}")
        else:
            state["affected_file"] = "unknown"
            state["affected_line"] = 0
        
        state["code_context"] = diagnosis_context.code_context
        state["similar_incidents"] = diagnosis_context.similar_incidents
        state["root_cause"] = diagnosis_context.root_cause
        state["diagnosis"] = diagnosis_context.diagnosis
        
        # Store enhanced diagnosis fields
        state["language"] = diagnosis_context.language.value
        state["stack_frames_count"] = len(diagnosis_context.stack_frames)
        
        # Check if escalation is needed (security-critical files)
        if "Security-critical file" in diagnosis_context.root_cause:
            state["escalated"] = True
            state["action_taken"] = "slack_alert"
            logger.warning(f"[Diagnosis] Security-critical file detected, escalating")
        
        state["messages"].append(f"Diagnosis: {diagnosis_context.root_cause}")
        logger.info(f"[Diagnosis] Root cause: {diagnosis_context.root_cause} (confidence: {diagnosis_context.confidence:.2f})")
        logger.info(f"[Diagnosis] Language: {diagnosis_context.language.value}")
        logger.info(f"[Diagnosis] Stack frames: {len(diagnosis_context.stack_frames)}")
        
    except Exception as e:
        logger.error(f"[Diagnosis] Enhanced diagnosis failed: {e}")
        # Fallback to basic diagnosis
        state["root_cause"] = "Diagnosis failed"
        state["diagnosis"] = str(e)
        state["affected_file"] = "unknown"
        state["affected_line"] = 0
        state["code_context"] = ""
        state["similar_incidents"] = []
        state["messages"].append(f"Diagnosis error: {str(e)}")
    
    return state


async def fix_node(state: IncidentState) -> IncidentState:
    """
    Fix node: Generate patch and unit test
    Note: Escalation check removed - handled by conditional routing
    """
    logger.info(f"[Fix] Generating fix for incident {state['incident_id']}")
    
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


async def action_router(state: IncidentState) -> IncidentState:
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
        return state
    
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
            return state
            
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
    
    return state


# Conditional routing functions
def should_skip_diagnosis(state: IncidentState) -> Literal["escalate", "diagnose"]:
    """
    Conditional edge: Skip diagnosis if incident is already escalated
    P0 incidents go directly to escalation
    """
    if state.get("escalated") or state.get("severity") == "P0":
        logger.info(f"[Router] Skipping diagnosis - incident escalated or P0")
        return "escalate"
    return "diagnose"


def should_skip_fix(state: IncidentState) -> Literal["escalate", "fix"]:
    """
    Conditional edge: Skip fix generation if diagnosis failed or escalated
    """
    if state.get("escalated"):
        logger.info(f"[Router] Skipping fix - incident escalated")
        return "escalate"
    
    if not state.get("root_cause") or state.get("root_cause") == "Diagnosis failed":
        logger.info(f"[Router] Skipping fix - diagnosis failed")
        return "escalate"
    
    return "fix"


def should_skip_confidence(state: IncidentState) -> Literal["escalate", "confidence"]:
    """
    Conditional edge: Skip confidence calculation if no fix was generated
    """
    if state.get("escalated"):
        logger.info(f"[Router] Skipping confidence - incident escalated")
        return "escalate"
    
    if not state.get("proposed_fix"):
        logger.info(f"[Router] Skipping confidence - no fix generated")
        return "escalate"
    
    return "confidence"


async def escalate_node(state: IncidentState) -> IncidentState:
    """
    Escalation node: Handle escalated incidents
    Sends Slack alert and marks as escalated
    """
    logger.info(f"[Escalate] Processing escalated incident {state['incident_id']}")
    
    mcp = get_mcp_manager()
    
    try:
        await mcp.send_slack_alert(
            incident_id=state["incident_id"],
            severity=state.get("severity", "P0"),
            summary=state.get("triage_summary", "Critical incident requiring human intervention"),
            details=state.get("diagnosis", "Incident escalated for manual review"),
            include_approval_buttons=False
        )
        
        state["action_taken"] = "escalated"
        state["messages"].append("Action: Escalated to human review via Slack")
        
        logger.info(f"[Escalate] Incident {state['incident_id']} escalated successfully")
        
    except Exception as e:
        logger.error(f"[Escalate] Failed to send Slack alert: {e}", exc_info=True)
        state["messages"].append(f"Escalation error: {str(e)}")
    
    return state


# Build the graph
def build_agent_graph():
    """
    Build the LangGraph agent with conditional routing
    Optimized to skip unnecessary processing for escalated incidents
    """
    
    workflow = StateGraph(IncidentState)
    
    # Add nodes
    workflow.add_node("triage", triage_node)
    workflow.add_node("diagnose", diagnosis_node)
    workflow.add_node("fix", fix_node)
    workflow.add_node("confidence", confidence_node)
    workflow.add_node("action_router", action_router)
    workflow.add_node("escalate", escalate_node)
    
    # Set entry point
    workflow.set_entry_point("triage")
    
    # Conditional routing after triage
    workflow.add_conditional_edges(
        "triage",
        should_skip_diagnosis,
        {
            "escalate": "escalate",  # P0 goes directly to escalation
            "diagnose": "diagnose"   # Others continue normal flow
        }
    )
    
    # Conditional routing after diagnosis
    workflow.add_conditional_edges(
        "diagnose",
        should_skip_fix,
        {
            "escalate": "escalate",  # Failed diagnosis escalates
            "fix": "fix"             # Successful diagnosis continues
        }
    )
    
    # Conditional routing after fix
    workflow.add_conditional_edges(
        "fix",
        should_skip_confidence,
        {
            "escalate": "escalate",      # No fix escalates
            "confidence": "confidence"   # Fix generated continues
        }
    )
    
    # Linear edges for successful path
    workflow.add_edge("confidence", "action_router")
    workflow.add_edge("action_router", END)
    workflow.add_edge("escalate", END)
    
    logger.info("Agent graph built with conditional routing")
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
        messages=[],
        language="",
        stack_frames_count=0
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
