"""
Example Flask application with AIRA logging integration
"""
from flask import Flask, jsonify
import logging
import sys
import os

# Add parent directory to path to import aira_handler
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from aira_handler import setup_aira_logging

app = Flask(__name__)

# Setup AIRA logging
logger = setup_aira_logging(
    aira_url="http://localhost:8000/webhook",
    app_name="flask-demo-app",
    level=logging.INFO
)


@app.route('/')
def index():
    logger.info("Index page accessed")
    return jsonify({"message": "Hello from Flask + AIRA!"})


@app.route('/error')
def trigger_error():
    """Endpoint that triggers an error to test AIRA"""
    logger.warning("Error endpoint accessed - this will trigger an error")
    try:
        # This will cause a ZeroDivisionError
        result = 1 / 0
    except Exception as e:
        logger.error("Intentional error for testing AIRA", exc_info=True)
        return jsonify({"error": "An error occurred and was sent to AIRA"}), 500


@app.route('/critical')
def trigger_critical():
    """Endpoint that triggers a critical error"""
    logger.critical("CRITICAL: Database connection lost!")
    return jsonify({"error": "Critical error sent to AIRA"}), 500


@app.errorhandler(Exception)
def handle_exception(error):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {error}", exc_info=True)
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    logger.info("Starting Flask application with AIRA monitoring")
    app.run(debug=True, host='0.0.0.0', port=5000)

# Made with Bob
