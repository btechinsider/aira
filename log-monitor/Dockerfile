FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy log monitor files
COPY aira_handler.py .
COPY log_watcher.py .
COPY config.yaml .

# Create directory for logs to monitor
RUN mkdir -p /logs

# Run log watcher
CMD ["python", "log_watcher.py", "/logs", "--aira-url", "http://backend:8000/webhook", "--app-name", "monitored-app"]

# Made with Bob
