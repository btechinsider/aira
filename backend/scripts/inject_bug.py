#!/usr/bin/env python3
"""
Demo script to inject a fake bug/incident into AIRA for testing
"""
import requests
import json
import sys
from datetime import datetime

BACKEND_URL = "http://localhost:8000"

# Sample incidents for testing
SAMPLE_INCIDENTS = [
    {
        "message": "NullPointerException in user authentication service",
        "stack_trace": """
java.lang.NullPointerException: Cannot invoke "String.length()" because "token" is null
    at com.example.auth.AuthService.validateToken(AuthService.java:142)
    at com.example.api.UserController.authenticate(UserController.java:67)
    at com.example.api.UserController$$FastClassBySpringCGLIB$$123.invoke(<generated>)
    at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:205)
    at org.springframework.web.servlet.mvc.method.annotation.ServletInvocableHandlerMethod.invokeAndHandle(ServletInvocableHandlerMethod.java:126)
""",
        "severity": "P1"
    },
    {
        "message": "IndexOutOfBoundsException in data processing pipeline",
        "stack_trace": """
java.lang.IndexOutOfBoundsException: Index 5 out of bounds for length 3
    at java.base/java.util.ArrayList.get(ArrayList.java:427)
    at com.example.data.DataProcessor.processRecords(DataProcessor.java:89)
    at com.example.jobs.BatchJob.run(BatchJob.java:45)
""",
        "severity": "P2"
    },
    {
        "message": "CRITICAL: Database connection pool exhausted",
        "stack_trace": """
java.sql.SQLException: Cannot get connection, pool exhausted
    at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:197)
    at com.example.db.DatabaseManager.executeQuery(DatabaseManager.java:56)
    at com.example.service.UserService.findUser(UserService.java:123)
""",
        "severity": "P0"
    },
    {
        "message": "KeyError in configuration loader",
        "stack_trace": """
Traceback (most recent call last):
  File "/app/config/loader.py", line 45, in load_config
    return config['database']['host']
KeyError: 'host'
""",
        "severity": "P1"
    },
    {
        "message": "TypeError in API response serialization",
        "stack_trace": """
Traceback (most recent call last):
  File "/app/api/serializers.py", line 78, in serialize_response
    return json.dumps(data)
  File "/usr/lib/python3.11/json/__init__.py", line 231, in dumps
    return _default_encoder.encode(obj)
TypeError: Object of type datetime is not JSON serializable
""",
        "severity": "P2"
    }
]


def inject_incident(incident_data):
    """Send incident to AIRA webhook"""
    url = f"{BACKEND_URL}/webhook"
    
    print(f"\n{'='*60}")
    print(f"Injecting incident: {incident_data['message'][:50]}...")
    print(f"Severity: {incident_data['severity']}")
    print(f"{'='*60}\n")
    
    try:
        response = requests.post(
            url,
            json=incident_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        response.raise_for_status()
        result = response.json()
        
        print(f"✅ Incident injected successfully!")
        print(f"   Incident ID: {result['incident_id']}")
        print(f"   Status: {result['status']}")
        print(f"   Message: {result['message']}")
        
        return result
        
    except requests.exceptions.ConnectionError:
        print(f"❌ Error: Cannot connect to AIRA backend at {BACKEND_URL}")
        print(f"   Make sure the backend is running: docker-compose up")
        sys.exit(1)
    except requests.exceptions.Timeout:
        print(f"❌ Error: Request timed out")
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        print(f"   Response: {e.response.text}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


def main():
    """Main function"""
    print("\n" + "="*60)
    print("AIRA Bug Injection Tool")
    print("="*60)
    
    if len(sys.argv) > 1:
        # Inject specific incident by index
        try:
            index = int(sys.argv[1])
            if 0 <= index < len(SAMPLE_INCIDENTS):
                inject_incident(SAMPLE_INCIDENTS[index])
            else:
                print(f"❌ Invalid index. Choose 0-{len(SAMPLE_INCIDENTS)-1}")
                sys.exit(1)
        except ValueError:
            print(f"❌ Invalid argument. Usage: {sys.argv[0]} [incident_index]")
            sys.exit(1)
    else:
        # Show menu
        print("\nAvailable test incidents:")
        for i, incident in enumerate(SAMPLE_INCIDENTS):
            print(f"  [{i}] {incident['severity']} - {incident['message'][:60]}")
        
        print(f"\nUsage: {sys.argv[0]} [incident_index]")
        print(f"Example: {sys.argv[0]} 0")
        print("\nOr inject all incidents:")
        
        choice = input("\nInject all incidents? (y/N): ").strip().lower()
        if choice == 'y':
            for i, incident in enumerate(SAMPLE_INCIDENTS):
                inject_incident(incident)
                if i < len(SAMPLE_INCIDENTS) - 1:
                    print("\nWaiting 2 seconds before next injection...")
                    import time
                    time.sleep(2)
        else:
            print("Cancelled.")
    
    print("\n" + "="*60)
    print("Done! Check the AIRA dashboard at http://localhost:3000")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()

# Made with Bob
