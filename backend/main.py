"""
FastAPI backend for AIRA - Autonomous Incident Response Agent
"""
import os
import uuid
import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Set
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from models import init_db, get_db, Incident, SessionLocal
from agent import run_incident_agent
from groq_client import get_groq_client
from mcp_clients import get_mcp_manager
from integration_guides import router as integration_router
from database import get_db_session
from exceptions import DatabaseError, WebSocketError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Pydantic models
class LogEvent(BaseModel):
    """Incoming log event from webhook"""
    id: Optional[str] = None
    message: str
    stack_trace: Optional[str] = ""
    severity: Optional[str] = None
    timestamp: Optional[str] = None


class IncidentResponse(BaseModel):
    """Response for incident creation"""
    incident_id: str
    status: str
    message: str


class WebSocketMessage(BaseModel):
    """WebSocket message format"""
    type: str
    incident_id: Optional[str] = None
    data: dict = Field(default_factory=dict)


# WebSocket connection manager
class ConnectionManager:
    """
    Thread-safe WebSocket connection manager
    Fixes race conditions and memory leaks
    """
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection"""
        try:
            await websocket.accept()
            async with self._lock:
                self.active_connections.add(websocket)
            logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
        except Exception as e:
            logger.error(f"Failed to accept WebSocket connection: {e}", exc_info=True)
            raise WebSocketError("Failed to establish WebSocket connection", original_error=e)
    
    async def disconnect(self, websocket: WebSocket):
        """Safely remove a WebSocket connection"""
        async with self._lock:
            self.active_connections.discard(websocket)  # Safe removal, no error if not present
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """
        Broadcast message to all connected clients
        Handles failures gracefully and cleans up dead connections
        """
        # Create snapshot of connections to avoid race conditions
        async with self._lock:
            connections = list(self.active_connections)
        
        if not connections:
            logger.debug("No active WebSocket connections to broadcast to")
            return
        
        disconnected = []
        for connection in connections:
            try:
                # Add timeout to prevent hanging
                await asyncio.wait_for(
                    connection.send_json(message),
                    timeout=5.0
                )
            except asyncio.TimeoutError:
                logger.warning(f"WebSocket send timeout, marking for removal")
                disconnected.append(connection)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        if disconnected:
            async with self._lock:
                for conn in disconnected:
                    self.active_connections.discard(conn)
            logger.info(f"Cleaned up {len(disconnected)} dead WebSocket connections")
    
    async def get_connection_count(self) -> int:
        """Get current number of active connections"""
        async with self._lock:
            return len(self.active_connections)
    
    async def close_all(self):
        """Close all active connections (for shutdown)"""
        async with self._lock:
            connections = list(self.active_connections)
            self.active_connections.clear()
        
        for connection in connections:
            try:
                await connection.close()
            except Exception as e:
                logger.warning(f"Error closing WebSocket: {e}")
        
        logger.info(f"Closed {len(connections)} WebSocket connections")


manager = ConnectionManager()


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    try:
        logger.info("Starting AIRA backend...")
        
        # Initialize database with timeout
        try:
            logger.info("Initializing database...")
            init_db()
            logger.info("✅ Database initialized successfully")
        except Exception as db_error:
            logger.warning(f"⚠️ Database initialization failed: {db_error}")
            logger.warning("Application will start but database operations may fail")
        
        # Initialize Groq client
        try:
            groq = get_groq_client()
            await groq.start_cache_cleanup()
            logger.info("✅ Groq client initialized with cache cleanup")
        except Exception as groq_error:
            logger.warning(f"⚠️ Groq client initialization failed: {groq_error}")
        
        logger.info("✅ AIRA backend startup complete!")
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}", exc_info=True)
        # Don't raise - let the app start anyway
        logger.warning("⚠️ Starting with limited functionality")
    
    yield
    
    # Shutdown
    try:
        logger.info("Shutting down AIRA backend...")
        
        # Close all WebSocket connections
        try:
            await manager.close_all()
        except Exception as e:
            logger.warning(f"Error closing WebSocket connections: {e}")
        
        # Close Groq client
        try:
            groq = get_groq_client()
            await groq.close()
        except Exception as e:
            logger.warning(f"Error closing Groq client: {e}")
        
        logger.info("✅ Shutdown complete")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}", exc_info=True)


# FastAPI app
app = FastAPI(
    title="AIRA - Autonomous Incident Response Agent",
    description="AI-powered incident response system with LangGraph and Groq",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include integration routes
app.include_router(integration_router)


async def process_incident_background(incident_id: str, event: LogEvent):
    """
    Background task to process incident through agent
    """
    logger.info(f"[Background] Processing incident {incident_id}")
    
    try:
        # Broadcast that processing started
        await manager.broadcast({
            "type": "incident_started",
            "incident_id": incident_id,
            "data": {
                "message": event.message,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
        
        # Run the agent
        final_state = await run_incident_agent(
            incident_id=incident_id,
            raw_log=event.message,
            stack_trace=event.stack_trace or ""
        )
        
        # Update database
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if incident:
                incident.severity = final_state.get("severity", "")
                incident.triage_summary = final_state.get("triage_summary", "")
                incident.diagnosis = final_state.get("diagnosis", "")
                incident.root_cause = final_state.get("root_cause", "")
                incident.proposed_fix = final_state.get("proposed_fix", "")
                incident.confidence_score = final_state.get("confidence_score", 0.0)
                incident.llm_confidence = final_state.get("llm_confidence", 0.0)
                incident.pattern_match_score = final_state.get("pattern_match_score", 0.0)
                incident.historical_score = final_state.get("historical_score", 0.0)
                incident.action_taken = final_state.get("action_taken", "")
                incident.pr_url = final_state.get("pr_url", "")
                incident.affected_file = final_state.get("affected_file", "")
                incident.affected_line = final_state.get("affected_line", 0)
                incident.escalated = final_state.get("escalated", False)
                incident.language = final_state.get("language", "")
                incident.stack_frames_count = final_state.get("stack_frames_count", 0)
                incident.resolution_status = "resolved" if final_state.get("action_taken") else "pending"
                
                if final_state.get("action_taken"):
                    incident.resolved_at = datetime.utcnow()
                
                db.commit()
                logger.info(f"[Background] Updated incident {incident_id} in database")
        finally:
            db.close()
        
        # Broadcast completion
        await manager.broadcast({
            "type": "incident_completed",
            "incident_id": incident_id,
            "data": {
                "severity": final_state.get("severity", ""),
                "action_taken": final_state.get("action_taken", ""),
                "pr_url": final_state.get("pr_url", ""),
                "confidence_score": final_state.get("confidence_score", 0.0),
                "messages": final_state.get("messages", [])
            }
        })
        
        logger.info(f"[Background] Completed incident {incident_id}")
        
    except Exception as e:
        logger.error(f"[Background] Error processing incident {incident_id}: {e}")
        
        # Broadcast error
        await manager.broadcast({
            "type": "incident_error",
            "incident_id": incident_id,
            "data": {
                "error": str(e)
            }
        })


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AIRA - Autonomous Incident Response Agent",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/webhook", response_model=IncidentResponse)
async def webhook_handler(
    event: LogEvent,
    background_tasks: BackgroundTasks
):
    """
    Webhook endpoint to receive log events
    Open access - no authentication required
    """
    # Generate incident ID
    incident_id = event.id or str(uuid.uuid4())
    
    logger.info(f"[Webhook] Received incident {incident_id}")
    
    # Store raw incident in database with proper session management
    try:
        with get_db_session() as db:
            incident = Incident(
                id=incident_id,
                raw_log=event.message,
                stack_trace=event.stack_trace or "",
                severity=event.severity or "",
                resolution_status="pending",
                created_at=datetime.utcnow()
            )
            db.add(incident)
            # Commit happens automatically via context manager
            logger.info(f"[Webhook] Stored incident {incident_id} in database")
    except Exception as e:
        logger.error(f"[Webhook] Database error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    
    # Broadcast that incident was received
    await manager.broadcast({
        "type": "incident_received",
        "incident_id": incident_id,
        "data": {
            "message": event.message[:100],
            "timestamp": datetime.utcnow().isoformat()
        }
    })
    
    # Process in background
    background_tasks.add_task(process_incident_background, incident_id, event)
    
    return IncidentResponse(
        incident_id=incident_id,
        status="processing",
        message="Incident received and queued for processing"
    )


@app.post("//webhook", response_model=IncidentResponse)
async def webhook_handler_proxy(
    event: LogEvent,
    background_tasks: BackgroundTasks
):
    """
    Workaround for Render.com proxy adding extra slash
    Handles requests to //webhook by forwarding to main webhook handler
    """
    logger.info("[Webhook] Received request via double-slash path (proxy issue)")
    return await webhook_handler(event, background_tasks)


@app.get("/incidents")
async def list_incidents(limit: int = 50, offset: int = 0):
    """
    List recent incidents with proper session management
    """
    try:
        with get_db_session() as db:
            incidents = db.query(Incident).order_by(
                Incident.created_at.desc()
            ).limit(limit).offset(offset).all()
            
            total = db.query(Incident).count()
            
            return {
                "incidents": [inc.to_dict() for inc in incidents],
                "total": total
            }
    except Exception as e:
        logger.error(f"Error listing incidents: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve incidents")


@app.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """
    Get specific incident details with proper session management
    """
    try:
        with get_db_session() as db:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if not incident:
                raise HTTPException(status_code=404, detail="Incident not found")
            
            return incident.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving incident {incident_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve incident")


@app.post("/slack/approval")
async def slack_approval_handler(payload: dict):
    """
    Handle Slack interactive button clicks with proper session management
    """
    logger.info(f"[Slack] Received approval payload: {payload}")
    
    # Parse Slack payload
    action = payload.get("actions", [{}])[0]
    action_id = action.get("action_id", "")
    value = action.get("value", "")
    
    # Extract incident ID
    incident_id = value.split("_")[-1] if "_" in value else ""
    
    if not incident_id:
        return {"status": "error", "message": "Invalid incident ID"}
    
    # Update incident based on approval
    try:
        with get_db_session() as db:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if not incident:
                return {"status": "error", "message": "Incident not found"}
            
            if action_id == "approve_fix":
                # Create PR if approved
                logger.info(f"[Slack] Approved fix for incident {incident_id}")
                
                mcp = get_mcp_manager()
                repo = os.getenv("GITHUB_REPO", "owner/repo")
                branch_name = f"aira-fix-{incident_id}-approved"
                
                try:
                    pr_result = await mcp.create_pr(
                        repo=repo,
                        branch_name=branch_name,
                        file_path=str(incident.affected_file or "unknown"),
                        patch_content=str(incident.proposed_fix or ""),
                        title=f"[AIRA-APPROVED] Fix: {incident.triage_summary}",
                        description=f"**Incident ID:** {incident_id}\n**Approved by:** Slack user\n\n{incident.diagnosis}"
                    )
                    
                    incident.pr_url = pr_result.get("pr_url", "")
                    incident.action_taken = "pr_created"
                    incident.resolution_status = "resolved"
                    incident.resolved_at = datetime.utcnow()
                    
                except Exception as e:
                    logger.error(f"[Slack] PR creation failed: {e}", exc_info=True)
                    return {"status": "error", "message": str(e)}
            
            elif action_id == "reject_fix":
                logger.info(f"[Slack] Rejected fix for incident {incident_id}")
                incident.action_taken = "rejected"
                incident.resolution_status = "escalated"
            
            # Commit happens automatically via context manager
            
            # Broadcast update
            await manager.broadcast({
                "type": "incident_updated",
                "incident_id": incident_id,
                "data": {
                    "action_taken": str(incident.action_taken),
                    "pr_url": str(incident.pr_url) if incident.pr_url else ""
                }
            })
            
            return {"status": "success", "incident_id": incident_id}
    except Exception as e:
        logger.error(f"[Slack] Error handling approval: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates
    """
    await manager.connect(websocket)
    
    try:
        while True:
            # Keep connection alive and receive messages
            data = await websocket.receive_text()
            logger.debug(f"[WebSocket] Received: {data}")
            
            # Echo back for testing
            await websocket.send_json({
                "type": "pong",
                "data": {"message": "Connection alive"}
            })
            
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
        logger.info("[WebSocket] Client disconnected")
    except Exception as e:
        logger.error(f"[WebSocket] Error: {e}", exc_info=True)
        await manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

# Made with Bob
