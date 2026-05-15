"""
Incident Context MCP Server - Handles incident similarity search and storage
"""
import os
import json
import hashlib
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import redis.asyncio as redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Incident Context MCP Server", version="1.0.0")


class ToolRequest(BaseModel):
    """MCP tool request format"""
    arguments: Dict[str, Any]


class IncidentContextManager:
    """Manage incident context using Redis"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
        self.redis_client: Optional[redis.Redis] = None
        self.ttl_days = 90  # Store incidents for 90 days
    
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
    
    def _generate_signature_hash(self, error_signature: str) -> str:
        """Generate hash from error signature"""
        # Normalize signature
        normalized = error_signature.lower().strip()
        # Take first 200 chars for similarity
        normalized = normalized[:200]
        return hashlib.md5(normalized.encode()).hexdigest()
    
    async def store_incident(
        self,
        incident_id: str,
        error_signature: str,
        root_cause: str,
        resolution: str,
        patch_url: Optional[str] = None,
        success: bool = True
    ) -> Dict[str, Any]:
        """Store incident outcome in Redis"""
        await self.init_redis()
        
        signature_hash = self._generate_signature_hash(error_signature)
        
        incident_data = {
            "incident_id": incident_id,
            "error_signature": error_signature,
            "signature_hash": signature_hash,
            "root_cause": root_cause,
            "resolution": resolution,
            "patch_url": patch_url or "",
            "success": success,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Store incident data
        key = f"incident:{incident_id}:resolution"
        await self.redis_client.setex(
            key,
            timedelta(days=self.ttl_days),
            json.dumps(incident_data)
        )
        
        # Add to signature index for similarity search
        index_key = f"signature:{signature_hash}:incidents"
        await self.redis_client.sadd(index_key, incident_id)
        await self.redis_client.expire(index_key, timedelta(days=self.ttl_days))
        
        logger.info(f"Stored incident {incident_id} with signature hash {signature_hash}")
        
        return {
            "status": "stored",
            "incident_id": incident_id,
            "signature_hash": signature_hash
        }
    
    async def find_similar_incidents(
        self,
        error_signature: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Find similar incidents based on error signature"""
        await self.init_redis()
        
        signature_hash = self._generate_signature_hash(error_signature)
        
        # Get incidents with same signature hash
        index_key = f"signature:{signature_hash}:incidents"
        incident_ids = await self.redis_client.smembers(index_key)
        
        similar_incidents = []
        
        for incident_id in incident_ids:
            key = f"incident:{incident_id}:resolution"
            data = await self.redis_client.get(key)
            
            if data:
                try:
                    incident = json.loads(data)
                    similar_incidents.append(incident)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse incident data for {incident_id}")
        
        # Sort by timestamp (most recent first)
        similar_incidents.sort(
            key=lambda x: x.get("timestamp", ""),
            reverse=True
        )
        
        # Limit results
        similar_incidents = similar_incidents[:limit]
        
        logger.info(f"Found {len(similar_incidents)} similar incidents for hash {signature_hash}")
        
        return similar_incidents
    
    async def get_incident_stats(self) -> Dict[str, Any]:
        """Get statistics about stored incidents"""
        await self.init_redis()
        
        # Count all incident keys
        incident_keys = []
        async for key in self.redis_client.scan_iter("incident:*:resolution"):
            incident_keys.append(key)
        
        total_incidents = len(incident_keys)
        
        # Count successful resolutions
        successful = 0
        for key in incident_keys:
            data = await self.redis_client.get(key)
            if data:
                try:
                    incident = json.loads(data)
                    if incident.get("success"):
                        successful += 1
                except:
                    pass
        
        return {
            "total_incidents": total_incidents,
            "successful_resolutions": successful,
            "success_rate": successful / total_incidents if total_incidents > 0 else 0
        }


context_manager = IncidentContextManager()


@app.on_event("startup")
async def startup():
    """Initialize on startup"""
    await context_manager.init_redis()


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown"""
    await context_manager.close()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Incident Context MCP Server",
        "version": "1.0.0",
        "tools": ["get_similar_incidents", "store_incident_outcome"]
    }


@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy"}


@app.get("/stats")
async def stats():
    """Get incident statistics"""
    return await context_manager.get_incident_stats()


@app.post("/mcp/tools/get_similar_incidents")
async def get_similar_incidents(request: ToolRequest):
    """
    Find similar past incidents
    
    Arguments:
        error_signature: Error signature to search for
        limit: Maximum number of results (default: 5)
    """
    args = request.arguments
    error_signature = args.get("error_signature")
    limit = args.get("limit", 5)
    
    if not error_signature:
        raise HTTPException(status_code=400, detail="error_signature is required")
    
    try:
        incidents = await context_manager.find_similar_incidents(
            error_signature=error_signature,
            limit=limit
        )
        
        return {
            "incidents": incidents,
            "count": len(incidents)
        }
        
    except Exception as e:
        logger.error(f"Error finding similar incidents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/mcp/tools/store_incident_outcome")
async def store_incident_outcome(request: ToolRequest):
    """
    Store incident outcome for future reference
    
    Arguments:
        incident_id: Unique incident ID
        error_signature: Error signature
        root_cause: Identified root cause
        resolution: Resolution description
        patch_url: URL to PR or patch (optional)
        success: Whether resolution was successful (default: true)
    """
    args = request.arguments
    incident_id = args.get("incident_id")
    error_signature = args.get("error_signature")
    root_cause = args.get("root_cause")
    resolution = args.get("resolution")
    patch_url = args.get("patch_url")
    success = args.get("success", True)
    
    if not all([incident_id, error_signature, root_cause, resolution]):
        raise HTTPException(
            status_code=400,
            detail="incident_id, error_signature, root_cause, and resolution are required"
        )
    
    try:
        result = await context_manager.store_incident(
            incident_id=incident_id,
            error_signature=error_signature,
            root_cause=root_cause,
            resolution=resolution,
            patch_url=patch_url,
            success=success
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error storing incident: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Made with Bob
