#!/usr/bin/env python3
"""
Wrapper script to run uvicorn with better error handling
"""
import sys
import os
import traceback
import logging

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    try:
        logger.info("🔍 Python version: %s", sys.version)
        logger.info("🔍 Working directory: %s", os.getcwd())
        logger.info("🔍 Python path: %s", sys.path)
        logger.info("🔍 Environment variables:")
        logger.info("  - DATABASE_URL: %s", "SET" if os.getenv("DATABASE_URL") else "NOT SET")
        logger.info("  - GROQ_API_KEY: %s", "SET" if os.getenv("GROQ_API_KEY") else "NOT SET")
        logger.info("  - PORT: %s", os.getenv("PORT", "8000"))
        
        logger.info("🔍 Attempting to import main module...")
        try:
            import main
            logger.info("✅ Main module imported successfully")
        except Exception as import_error:
            logger.error("❌ Failed to import main module!", exc_info=True)
            raise
        
        logger.info("🔍 Checking FastAPI app...")
        app = main.app
        logger.info("✅ FastAPI app found: %s", app)
        
        logger.info("🚀 Starting Uvicorn on port %s...", os.getenv("PORT", "8000"))
        import uvicorn
        
        port = int(os.getenv("PORT", "8000"))
        
        # Run with more verbose settings
        uvicorn.run(
            app,  # Pass app object directly instead of string
            host="0.0.0.0",
            port=port,
            log_level="debug",
            access_log=True
        )
        
    except KeyboardInterrupt:
        logger.info("⚠️  Received interrupt signal, shutting down...")
        sys.exit(0)
    except Exception as e:
        logger.error("❌ FATAL ERROR: %s", e, exc_info=True)
        print(f"\n{'='*60}")
        print(f"❌ DEPLOYMENT FAILED")
        print(f"{'='*60}")
        print(f"Error: {e}")
        print(f"\nFull traceback:")
        traceback.print_exc()
        print(f"{'='*60}\n")
        sys.exit(1)

if __name__ == "__main__":
    logger.info("="*60)
    logger.info("Starting AIRA Backend Wrapper")
    logger.info("="*60)
    main()

# Made with Bob
