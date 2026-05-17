#!/usr/bin/env python3
"""
Wrapper script to run uvicorn with better error handling
"""
import sys
import os
import traceback

def main():
    try:
        print("🔍 Attempting to import main module...")
        import main
        print("✅ Main module imported successfully")
        
        print("🔍 Checking FastAPI app...")
        app = main.app
        print(f"✅ FastAPI app found: {app}")
        
        print("🚀 Starting Uvicorn...")
        import uvicorn
        
        port = int(os.getenv("PORT", "8000"))
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=port,
            log_level="info"
        )
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print(f"\n📋 Full traceback:")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

# Made with Bob
