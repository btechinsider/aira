# AIRA Code Optimization Plan

## Executive Summary
This document outlines critical issues identified in the AIRA codebase and provides a comprehensive optimization strategy to fix logic breaks and streamline workflows.

## Critical Issues Identified

### 1. Database Session Management Issues ⚠️ HIGH PRIORITY

**Location**: `backend/main.py`, `backend/auth_routes.py`, `backend/agent.py`

**Problems**:
- **Resource Leaks**: Database sessions created but not properly closed in error scenarios
- **Connection Pool Exhaustion**: Multiple places create `SessionLocal()` without proper context management
- **Transaction Inconsistency**: No proper rollback handling in many error paths

**Specific Issues**:
```python
# main.py:160-165 - Session not closed on error
db = SessionLocal()
try:
    is_valid = await verify_api_key(api_key, db)
    return is_valid
finally:
    db.close()  # ✓ Good, but missing in other places

# main.py:295-313 - Rollback called but session still needs proper cleanup
db = SessionLocal()
try:
    incident = Incident(...)
    db.add(incident)
    db.commit()
except Exception as e:
    db.rollback()  # ✓ Good
    raise HTTPException(...)
finally:
    db.close()  # ✓ Good

# agent.py:193-221 - Session management in background task
db = SessionLocal()
try:
    incident = db.query(Incident).filter(...).first()
    # ... many operations ...
    db.commit()
finally:
    db.close()  # ✓ Good, but no rollback on error
```

**Impact**: Connection pool exhaustion, database locks, memory leaks

**Solution**:
1. Use context managers consistently: `with SessionLocal() as db:`
2. Add proper rollback in all error paths
3. Implement database session dependency injection
4. Add connection pool monitoring

---

### 2. WebSocket Connection Manager Race Conditions ⚠️ HIGH PRIORITY

**Location**: `backend/main.py:54-83`

**Problems**:
- **Race Condition**: `disconnect()` modifies list while `broadcast()` iterates
- **Memory Leak**: Disconnected connections not always removed
- **No Connection Validation**: Stale connections accumulate

**Specific Issues**:
```python
# main.py:69-82 - Race condition
async def broadcast(self, message: dict):
    disconnected = []
    for connection in self.active_connections:  # ← Iterating
        try:
            await connection.send_json(message)
        except Exception as e:
            disconnected.append(connection)
    
    for conn in disconnected:
        if conn in self.active_connections:  # ← Race: list modified elsewhere
            self.active_connections.remove(conn)

# main.py:65-67 - No error handling
def disconnect(self, websocket: WebSocket):
    self.active_connections.remove(websocket)  # ← Can raise ValueError
```

**Impact**: Crashes, memory leaks, failed broadcasts

**Solution**:
1. Use `asyncio.Lock` for thread-safe operations
2. Use set instead of list for O(1) removal
3. Add connection health checks
4. Implement automatic cleanup of stale connections

---

### 3. Agent Workflow Redundancy ⚠️ MEDIUM PRIORITY

**Location**: `backend/agent.py`

**Problems**:
- **No Early Exit**: Escalated incidents still go through all nodes
- **Redundant Processing**: Nodes check escalation status individually
- **No Caching**: Similar incidents processed identically

**Specific Issues**:
```python
# agent.py:122-125 - Check but still processes
if state.get("escalated"):
    logger.info("[Diagnosis] Skipping - incident already escalated")
    return state  # ✓ Good, but graph still executes next nodes

# agent.py:192-194 - Duplicate check
if state.get("escalated"):
    logger.info("[Fix] Skipping - incident already escalated")
    return state  # Redundant check

# agent.py:454-459 - Linear workflow, no conditional routing
workflow.add_edge("triage", "diagnose")
workflow.add_edge("diagnose", "fix")
workflow.add_edge("fix", "confidence")
workflow.add_edge("confidence", "action_router")
```

**Impact**: Wasted compute, slower response times, unnecessary API calls

**Solution**:
1. Use conditional edges in LangGraph
2. Add early termination for escalated incidents
3. Implement result caching for similar incidents
4. Add workflow state validation

---

### 4. Error Handling Inconsistencies ⚠️ MEDIUM PRIORITY

**Location**: All modules

**Problems**:
- **Inconsistent Patterns**: Some functions raise, others return error states
- **Lost Context**: Generic exception handling loses stack traces
- **No Error Classification**: All errors treated equally

**Specific Issues**:
```python
# agent.py:107-111 - Generic exception, loses context
except Exception as e:
    logger.error(f"[Triage] Error: {e}")  # ✗ No exc_info=True
    state["severity"] = "P2"
    state["triage_summary"] = f"Triage failed: {str(e)}"

# groq_client.py:118-120 - Swallows specific errors
except Exception as e:
    last_error = e
    logger.warning(f"Groq API error (attempt {attempt + 1}): {e}")
    # ✗ Loses error type information

# mcp_clients.py:53-56 - Inconsistent error handling
except httpx.HTTPStatusError as e:
    logger.error(f"MCP tool {tool_name} HTTP error: {e.response.status_code}")
    raise Exception(f"MCP tool {tool_name} failed: {e.response.text}")
    # ✗ Wraps in generic Exception
```

**Impact**: Difficult debugging, poor error recovery, unclear failure modes

**Solution**:
1. Create custom exception hierarchy
2. Use `exc_info=True` in logging
3. Implement error classification system
4. Add structured error responses

---

### 5. Async/Await Pattern Issues ⚠️ MEDIUM PRIORITY

**Location**: `backend/groq_client.py`, `backend/mcp_clients.py`

**Problems**:
- **Blocking Operations**: `init_redis()` called in sync context
- **No Timeout Handling**: Async operations can hang indefinitely
- **Resource Cleanup**: Async resources not properly closed

**Specific Issues**:
```python
# groq_client.py:31-33 - Called in __init__ (sync)
async def init_redis(self):
    """Initialize Redis connection (disabled - using in-memory cache)"""
    logger.info("Using in-memory cache (Redis disabled)")
    # ✗ Async method but does nothing

# groq_client.py:79 - Blocking call in async function
await self.init_redis()  # ✗ Called every time, does nothing

# mcp_clients.py:42-43 - No timeout on client creation
async with httpx.AsyncClient(timeout=self.timeout) as client:
    # ✓ Good timeout, but client creation can hang
```

**Impact**: Potential deadlocks, resource leaks, poor performance

**Solution**:
1. Remove unnecessary async/await patterns
2. Add timeouts to all async operations
3. Implement proper async context managers
4. Use `asyncio.wait_for()` for timeout enforcement

---

### 6. Cache Implementation Issues ⚠️ LOW PRIORITY

**Location**: `backend/groq_client.py`

**Problems**:
- **No TTL Enforcement**: Cache grows indefinitely
- **No Size Limit**: Memory can be exhausted
- **No Invalidation**: Stale data persists

**Specific Issues**:
```python
# groq_client.py:29 - Simple dict, no limits
self.cache: Dict[str, str] = {}  # ✗ Unbounded growth

# groq_client.py:51-54 - TTL parameter ignored
async def _set_cached_response(self, cache_key: str, response: str, ttl: int = 3600):
    self.cache[cache_key] = response  # ✗ TTL not used
    logger.info(f"Cached response in memory")

# groq_client.py:36-37 - No cleanup
async def close(self):
    self.cache.clear()  # ✓ Good, but only on shutdown
```

**Impact**: Memory leaks, stale data, poor cache hit rates

**Solution**:
1. Implement LRU cache with size limit
2. Add TTL enforcement with background cleanup
3. Use `cachetools` or similar library
4. Add cache metrics and monitoring

---

### 7. Transaction Management Issues ⚠️ MEDIUM PRIORITY

**Location**: `backend/main.py`, `backend/auth_routes.py`

**Problems**:
- **Partial Commits**: Multiple operations without transaction boundaries
- **No Savepoints**: Complex operations can't be partially rolled back
- **Inconsistent State**: Errors leave database in inconsistent state

**Specific Issues**:
```python
# main.py:193-221 - Multiple updates without transaction
db = SessionLocal()
try:
    incident = db.query(Incident).filter(...).first()
    if incident:
        incident.severity = final_state.get("severity", "")
        incident.triage_summary = final_state.get("triage_summary", "")
        # ... 15+ field updates ...
        db.commit()  # ✗ All or nothing, no partial rollback
finally:
    db.close()

# auth_routes.py:83-95 - No transaction for user creation
hashed_password = get_password_hash(user_data.password)
new_user = User(...)
db.add(new_user)
db.commit()  # ✗ What if commit fails after password hash?
db.refresh(new_user)
```

**Impact**: Data corruption, inconsistent state, difficult recovery

**Solution**:
1. Use explicit transaction boundaries
2. Implement savepoints for complex operations
3. Add transaction retry logic
4. Use database constraints for data integrity

---

## Optimization Strategy

### Phase 1: Critical Fixes (Week 1)
1. ✅ Fix database session management
2. ✅ Fix WebSocket race conditions
3. ✅ Add proper error handling

### Phase 2: Performance Optimization (Week 2)
4. ✅ Optimize agent workflow
5. ✅ Fix async/await patterns
6. ✅ Improve cache implementation

### Phase 3: Reliability Improvements (Week 3)
7. ✅ Add circuit breaker pattern
8. ✅ Implement connection pooling
9. ✅ Add comprehensive logging

### Phase 4: Testing & Validation (Week 4)
10. ✅ Create test suite
11. ✅ Performance benchmarking
12. ✅ Load testing

---

## Detailed Solutions

### Solution 1: Database Session Management

**Create a proper session dependency**:
```python
# backend/database.py (new file)
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from models import SessionLocal

@asynccontextmanager
async def get_db_session():
    """Async context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

# Usage in endpoints
async def webhook_handler(...):
    async with get_db_session() as db:
        incident = Incident(...)
        db.add(incident)
        # Auto-commit on success, auto-rollback on error
```

### Solution 2: WebSocket Connection Manager

**Thread-safe implementation**:
```python
import asyncio
from typing import Set

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            self.active_connections.discard(websocket)  # Safe removal
    
    async def broadcast(self, message: dict):
        async with self._lock:
            connections = list(self.active_connections)  # Snapshot
        
        disconnected = []
        for connection in connections:
            try:
                await asyncio.wait_for(
                    connection.send_json(message),
                    timeout=5.0
                )
            except Exception:
                disconnected.append(connection)
        
        if disconnected:
            async with self._lock:
                for conn in disconnected:
                    self.active_connections.discard(conn)
```

### Solution 3: Agent Workflow Optimization

**Conditional routing with early exit**:
```python
def should_skip_diagnosis(state: IncidentState) -> Literal["skip", "continue"]:
    """Conditional edge: skip diagnosis if escalated"""
    return "skip" if state.get("escalated") else "continue"

def build_agent_graph():
    workflow = StateGraph(IncidentState)
    
    workflow.add_node("triage", triage_node)
    workflow.add_node("diagnose", diagnosis_node)
    workflow.add_node("fix", fix_node)
    workflow.add_node("confidence", confidence_node)
    workflow.add_node("action_router", action_router)
    workflow.add_node("escalate", escalate_node)  # New node
    
    workflow.set_entry_point("triage")
    
    # Conditional routing after triage
    workflow.add_conditional_edges(
        "triage",
        should_skip_diagnosis,
        {
            "skip": "escalate",      # P0 goes directly to escalation
            "continue": "diagnose"   # Others continue normal flow
        }
    )
    
    workflow.add_edge("diagnose", "fix")
    workflow.add_edge("fix", "confidence")
    workflow.add_edge("confidence", "action_router")
    workflow.add_edge("action_router", END)
    workflow.add_edge("escalate", END)
    
    return workflow
```

### Solution 4: Error Handling

**Custom exception hierarchy**:
```python
# backend/exceptions.py (new file)
class AIRAException(Exception):
    """Base exception for AIRA"""
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

class DatabaseError(AIRAException):
    """Database operation failed"""
    pass

class ExternalServiceError(AIRAException):
    """External service (Groq, GitHub, etc.) failed"""
    pass

class ValidationError(AIRAException):
    """Input validation failed"""
    pass

# Usage
try:
    result = await groq.call_groq(...)
except httpx.HTTPError as e:
    raise ExternalServiceError(
        "Groq API call failed",
        details={"status": e.response.status_code, "error": str(e)}
    )
```

### Solution 5: Circuit Breaker Pattern

**Implement circuit breaker for external services**:
```python
# backend/circuit_breaker.py (new file)
from enum import Enum
import asyncio
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if recovered

class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
    
    async def call(self, func, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if datetime.now() - self.last_failure_time > timedelta(seconds=self.timeout):
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = await func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise
    
    def on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED
    
    def on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

# Usage in mcp_clients.py
class MCPClientManager:
    def __init__(self):
        self.github_circuit = CircuitBreaker()
        self.incident_circuit = CircuitBreaker()
    
    async def fetch_github_context(self, ...):
        return await self.github_circuit.call(
            self._fetch_github_context_impl, ...
        )
```

---

## Implementation Priority Matrix

| Issue | Priority | Impact | Effort | Order |
|-------|----------|--------|--------|-------|
| Database Session Management | HIGH | HIGH | MEDIUM | 1 |
| WebSocket Race Conditions | HIGH | HIGH | LOW | 2 |
| Error Handling | MEDIUM | HIGH | MEDIUM | 3 |
| Agent Workflow | MEDIUM | MEDIUM | MEDIUM | 4 |
| Async/Await Patterns | MEDIUM | MEDIUM | LOW | 5 |
| Transaction Management | MEDIUM | MEDIUM | MEDIUM | 6 |
| Circuit Breaker | MEDIUM | MEDIUM | MEDIUM | 7 |
| Cache Implementation | LOW | LOW | LOW | 8 |

---

## Testing Strategy

### Unit Tests
- Database session management
- WebSocket connection handling
- Error handling and propagation
- Cache operations

### Integration Tests
- End-to-end incident processing
- WebSocket real-time updates
- Database transaction rollback
- External service failures

### Load Tests
- Concurrent incident processing
- WebSocket connection limits
- Database connection pool
- Cache performance

---

## Monitoring & Metrics

### Key Metrics to Track
1. **Database**: Connection pool usage, query latency, transaction failures
2. **WebSocket**: Active connections, broadcast latency, disconnection rate
3. **Agent**: Processing time per node, escalation rate, confidence scores
4. **Cache**: Hit rate, memory usage, eviction rate
5. **Errors**: Error rate by type, retry success rate, circuit breaker state

---

## Rollout Plan

### Stage 1: Development (Week 1-2)
- Implement fixes in feature branch
- Add comprehensive tests
- Code review and refinement

### Stage 2: Staging (Week 3)
- Deploy to staging environment
- Run load tests
- Monitor metrics
- Fix any issues

### Stage 3: Production (Week 4)
- Gradual rollout (10% → 50% → 100%)
- Monitor error rates
- Be ready to rollback
- Document lessons learned

---

## Success Criteria

✅ **Zero database connection leaks**
✅ **No WebSocket race conditions**
✅ **95%+ error handling coverage**
✅ **50% reduction in redundant processing**
✅ **99.9% uptime for external service calls**
✅ **<100ms p95 latency for incident processing**

---

## Conclusion

This optimization plan addresses all critical issues in the AIRA codebase. By following this structured approach, we will:

1. **Eliminate logic breaks** through proper error handling and transaction management
2. **Improve reliability** with circuit breakers and retry logic
3. **Enhance performance** through workflow optimization and caching
4. **Ensure maintainability** with consistent patterns and comprehensive testing

The estimated timeline is 4 weeks for complete implementation and validation.