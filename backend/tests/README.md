# AIRA Test Suite

## Overview
This directory contains tests for the AIRA optimization features.

## Test Structure

### Unit Tests
- `test_optimizations.py` - Tests for new optimization features
  - Database session management
  - Exception hierarchy
  - Circuit breaker
  - LRU cache
  - WebSocket connection manager
  - Agent workflow

## Running Tests

### Prerequisites
```bash
pip install pytest pytest-asyncio
```

### Run All Tests
```bash
cd backend
pytest tests/ -v
```

### Run Specific Test File
```bash
pytest tests/test_optimizations.py -v
```

### Run Specific Test Class
```bash
pytest tests/test_optimizations.py::TestCircuitBreaker -v
```

### Run with Coverage
```bash
pip install pytest-cov
pytest tests/ --cov=. --cov-report=html
```

## Test Categories

### 1. Database Tests
- Context manager auto-commit
- Context manager auto-rollback
- Transaction savepoints

### 2. Exception Tests
- Exception serialization
- Inheritance hierarchy
- Context preservation

### 3. Circuit Breaker Tests
- CLOSED state operation
- Opening after failures
- Rejection when OPEN
- HALF_OPEN recovery
- Manual reset

### 4. Cache Tests
- Set and get operations
- TTL expiration
- LRU eviction
- Cleanup of expired entries
- Statistics

### 5. WebSocket Tests
- Thread safety
- Broadcast with timeout
- Dead connection cleanup

### 6. Agent Workflow Tests
- Conditional routing
- Early exits
- P0 escalation

### 7. Integration Tests
- End-to-end workflows
- Circuit breaker integration
- Database session in endpoints

## Writing New Tests

### Example Test
```python
import pytest

class TestMyFeature:
    """Test my new feature"""
    
    @pytest.mark.asyncio
    async def test_async_function(self):
        """Test async function"""
        result = await my_async_function()
        assert result == expected_value
    
    def test_sync_function(self):
        """Test sync function"""
        result = my_sync_function()
        assert result == expected_value
```

## Mocking External Services

### Groq API
```python
from unittest.mock import AsyncMock, patch

@patch('groq_client.AsyncGroq')
async def test_groq_call(mock_groq):
    mock_groq.return_value.chat.completions.create = AsyncMock(
        return_value=mock_response
    )
    # Test code here
```

### Database
```python
from unittest.mock import MagicMock

def test_database_operation():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = mock_incident
    # Test code here
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pip install pytest pytest-asyncio pytest-cov
      - run: pytest tests/ --cov=. --cov-report=xml
      - uses: codecov/codecov-action@v2
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Key workflows covered
- **Critical Paths**: 100% coverage
  - Database session management
  - Circuit breaker state transitions
  - Error handling

## Known Issues

- Some tests require actual database setup (marked as placeholders)
- WebSocket tests need proper mocking
- Agent workflow tests need LangGraph setup

## Future Improvements

1. Add load tests for WebSocket connections
2. Add stress tests for circuit breaker
3. Add performance benchmarks
4. Add mutation testing
5. Add property-based testing with Hypothesis

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [unittest.mock](https://docs.python.org/3/library/unittest.mock.html)