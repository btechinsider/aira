"""
AIRA Log Watcher Service

Monitors log files for errors and automatically sends them to AIRA.
Useful for applications that write to log files instead of using Python logging.
"""
import os
import re
import time
import json
import requests
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Set
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileModifiedEvent


class LogFileHandler(FileSystemEventHandler):
    """Handler for log file changes"""
    
    def __init__(
        self,
        aira_url: str,
        error_patterns: List[str],
        app_name: str,
        file_positions: Dict[str, int]
    ):
        self.aira_url = aira_url
        self.error_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in error_patterns]
        self.app_name = app_name
        self.file_positions = file_positions
        self.processed_errors: Set[str] = set()  # Prevent duplicate reports
        
    def on_modified(self, event):
        """Handle file modification events"""
        if event.is_directory:
            return
            
        if isinstance(event, FileModifiedEvent):
            self.process_log_file(event.src_path)
    
    def process_log_file(self, file_path: str):
        """Process new lines in log file"""
        try:
            # Get last read position
            last_position = self.file_positions.get(file_path, 0)
            
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                # Seek to last position
                f.seek(last_position)
                
                # Read new lines
                new_lines = f.readlines()
                
                # Update position
                self.file_positions[file_path] = f.tell()
                
                # Process lines for errors
                if new_lines:
                    self.check_for_errors(file_path, new_lines)
                    
        except Exception as e:
            print(f"[LogWatcher] Error processing {file_path}: {e}")
    
    def check_for_errors(self, file_path: str, lines: List[str]):
        """Check lines for error patterns"""
        error_buffer = []
        in_error = False
        
        for line in lines:
            # Check if line matches error pattern
            is_error_line = any(pattern.search(line) for pattern in self.error_patterns)
            
            if is_error_line:
                in_error = True
                error_buffer = [line]
            elif in_error:
                # Continue collecting stack trace
                if line.strip() and (line.startswith(' ') or line.startswith('\t') or 'at ' in line):
                    error_buffer.append(line)
                else:
                    # End of error block
                    self.send_error_to_aira(file_path, error_buffer)
                    error_buffer = []
                    in_error = False
        
        # Send remaining error if any
        if error_buffer:
            self.send_error_to_aira(file_path, error_buffer)
    
    def send_error_to_aira(self, file_path: str, error_lines: List[str]):
        """Send error to AIRA webhook"""
        if not error_lines:
            return
        
        # Create error signature to prevent duplicates
        error_text = ''.join(error_lines)
        error_signature = hash(error_text)
        
        if error_signature in self.processed_errors:
            return
        
        self.processed_errors.add(error_signature)
        
        # Keep only last 100 signatures to prevent memory growth
        if len(self.processed_errors) > 100:
            self.processed_errors.pop()
        
        # Extract message and stack trace
        message = error_lines[0].strip()
        stack_trace = ''.join(error_lines[1:]) if len(error_lines) > 1 else ""
        
        # Determine severity
        severity = "P1"  # Default
        if any(keyword in message.lower() for keyword in ['critical', 'fatal', 'panic']):
            severity = "P0"
        elif any(keyword in message.lower() for keyword in ['warning', 'warn']):
            severity = "P2"
        
        # Build payload
        payload = {
            "message": f"[{self.app_name}] {message}",
            "stack_trace": stack_trace,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": {
                "source": "log_watcher",
                "file": file_path,
                "app": self.app_name
            }
        }
        
        try:
            response = requests.post(
                self.aira_url,
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"[LogWatcher] Incident reported: {result.get('incident_id')} from {Path(file_path).name}")
            else:
                print(f"[LogWatcher] Failed to report incident: {response.status_code}")
                
        except Exception as e:
            print(f"[LogWatcher] Error sending to AIRA: {e}")


class LogWatcher:
    """Main log watcher service"""
    
    def __init__(
        self,
        log_paths: List[str],
        aira_url: str = "http://localhost:8000/webhook",
        app_name: str = "monitored-app",
        error_patterns: Optional[List[str]] = None
    ):
        """
        Initialize log watcher
        
        Args:
            log_paths: List of log file paths or directories to monitor
            aira_url: AIRA webhook URL
            app_name: Application name
            error_patterns: Regex patterns to match errors
        """
        self.log_paths = log_paths
        self.aira_url = aira_url
        self.app_name = app_name
        
        # Default error patterns
        self.error_patterns = error_patterns or [
            r'ERROR',
            r'CRITICAL',
            r'FATAL',
            r'Exception',
            r'Traceback',
            r'Error:',
            r'FAILED',
        ]
        
        self.file_positions: Dict[str, int] = {}
        self.observer = Observer()
        
    def start(self):
        """Start monitoring log files"""
        print(f"[LogWatcher] Starting log monitoring for {self.app_name}")
        print(f"[LogWatcher] AIRA URL: {self.aira_url}")
        print(f"[LogWatcher] Monitoring paths: {self.log_paths}")
        
        # Initialize file positions
        for path in self.log_paths:
            if os.path.isfile(path):
                self.file_positions[path] = os.path.getsize(path)
            elif os.path.isdir(path):
                for log_file in Path(path).glob('*.log'):
                    self.file_positions[str(log_file)] = log_file.stat().st_size
        
        # Create event handler
        event_handler = LogFileHandler(
            aira_url=self.aira_url,
            error_patterns=self.error_patterns,
            app_name=self.app_name,
            file_positions=self.file_positions
        )
        
        # Schedule observers
        for path in self.log_paths:
            if os.path.isfile(path):
                # Monitor parent directory for file changes
                self.observer.schedule(event_handler, os.path.dirname(path), recursive=False)
            elif os.path.isdir(path):
                # Monitor directory
                self.observer.schedule(event_handler, path, recursive=True)
        
        self.observer.start()
        print("[LogWatcher] Monitoring started. Press Ctrl+C to stop.")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()
    
    def stop(self):
        """Stop monitoring"""
        print("\n[LogWatcher] Stopping log monitoring...")
        self.observer.stop()
        self.observer.join()
        print("[LogWatcher] Stopped.")


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="AIRA Log Watcher - Monitor log files and send errors to AIRA"
    )
    parser.add_argument(
        'paths',
        nargs='+',
        help='Log file paths or directories to monitor'
    )
    parser.add_argument(
        '--aira-url',
        default='http://localhost:8000/webhook',
        help='AIRA webhook URL (default: http://localhost:8000/webhook)'
    )
    parser.add_argument(
        '--app-name',
        default='monitored-app',
        help='Application name for context (default: monitored-app)'
    )
    parser.add_argument(
        '--patterns',
        nargs='+',
        help='Custom error patterns (regex)'
    )
    
    args = parser.parse_args()
    
    watcher = LogWatcher(
        log_paths=args.paths,
        aira_url=args.aira_url,
        app_name=args.app_name,
        error_patterns=args.patterns
    )
    
    watcher.start()


if __name__ == '__main__':
    main()

# Made with Bob
