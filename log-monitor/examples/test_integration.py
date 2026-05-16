"""
Test script to verify AIRA log monitoring integration
"""
import logging
import sys
import os
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from aira_handler import setup_aira_logging


def test_aira_integration():
    """Test AIRA logging integration"""
    
    print("=" * 60)
    print("AIRA Log Monitor Integration Test")
    print("=" * 60)
    print()
    
    # Setup logger
    print("1. Setting up AIRA logging handler...")
    logger = setup_aira_logging(
        aira_url="http://localhost:8000/webhook",
        app_name="test-integration",
        level=logging.INFO
    )
    print("   ✓ Logger configured")
    print()
    
    # Test 1: Info log (should not trigger AIRA)
    print("2. Testing INFO log (should NOT trigger AIRA)...")
    logger.info("This is an info message - should not trigger AIRA")
    time.sleep(1)
    print("   ✓ Info log sent")
    print()
    
    # Test 2: Error log
    print("3. Testing ERROR log (should trigger AIRA)...")
    logger.error("Test error message - this should trigger AIRA incident")
    time.sleep(2)
    print("   ✓ Error log sent to AIRA")
    print()
    
    # Test 3: Exception with stack trace
    print("4. Testing exception with stack trace...")
    try:
        result = 1 / 0
    except ZeroDivisionError as e:
        logger.error("Division by zero error", exc_info=True)
    time.sleep(2)
    print("   ✓ Exception sent to AIRA")
    print()
    
    # Test 4: Critical error
    print("5. Testing CRITICAL log (P0 severity)...")
    logger.critical("CRITICAL: System failure detected!")
    time.sleep(2)
    print("   ✓ Critical error sent to AIRA")
    print()
    
    # Test 5: Multiple errors
    print("6. Testing multiple errors...")
    for i in range(3):
        logger.error(f"Test error #{i+1}")
        time.sleep(0.5)
    print("   ✓ Multiple errors sent")
    print()
    
    print("=" * 60)
    print("Test completed!")
    print("=" * 60)
    print()
    print("Check AIRA dashboard at: http://localhost:3000")
    print("Check AIRA API at: http://localhost:8000/incidents")
    print()


if __name__ == '__main__':
    # Check if AIRA is running
    import requests
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=2)
        if response.status_code == 200:
            print("✓ AIRA backend is running")
            print()
            test_aira_integration()
        else:
            print("✗ AIRA backend returned unexpected status:", response.status_code)
    except requests.exceptions.ConnectionError:
        print("✗ ERROR: Cannot connect to AIRA backend at http://localhost:8000")
        print()
        print("Please start AIRA first:")
        print("  cd aira")
        print("  make up")
        print()
        sys.exit(1)
    except Exception as e:
        print(f"✗ ERROR: {e}")
        sys.exit(1)

# Made with Bob
