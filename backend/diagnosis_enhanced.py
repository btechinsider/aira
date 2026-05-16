"""
Enhanced Diagnosis Agent with Deep GitHub Integration
Provides advanced stack trace parsing, intelligent code analysis, and comprehensive root cause diagnosis
"""
import os
import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class Language(Enum):
    """Supported programming languages"""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    GO = "go"
    RUBY = "ruby"
    PHP = "php"
    CSHARP = "csharp"
    UNKNOWN = "unknown"


@dataclass
class StackFrame:
    """Represents a single stack trace frame"""
    file_path: str
    line_number: int
    function_name: Optional[str] = None
    code_snippet: Optional[str] = None
    language: Language = Language.UNKNOWN
    is_user_code: bool = True  # False for library/framework code
    
    def __str__(self):
        return f"{self.file_path}:{self.line_number} in {self.function_name or 'unknown'}"


@dataclass
class DiagnosisContext:
    """Complete diagnosis context"""
    error_message: str
    error_type: str
    stack_frames: List[StackFrame]
    primary_frame: Optional[StackFrame]
    code_context: str
    related_files: List[str]
    similar_incidents: List[Dict[str, Any]]
    root_cause: str
    diagnosis: str
    confidence: float
    language: Language


class EnhancedStackTraceParser:
    """
    Advanced stack trace parser supporting multiple languages and formats
    """
    
    # Stack trace patterns for different languages
    PATTERNS = {
        Language.PYTHON: [
            # File "path/to/file.py", line 123, in function_name
            r'File "([^"]+)", line (\d+)(?:, in (\w+))?',
            # at path/to/file.py:123
            r'at ([^\s:]+\.py):(\d+)',
            # path/to/file.py:123: in function_name
            r'([^\s]+\.py):(\d+)(?:: in (\w+))?',
        ],
        Language.JAVASCRIPT: [
            # at functionName (path/to/file.js:123:45)
            r'at (?:(\w+) )?\(([^:]+):(\d+):\d+\)',
            # at path/to/file.js:123:45
            r'at ([^\s:]+\.(?:js|ts)):(\d+):\d+',
        ],
        Language.TYPESCRIPT: [
            # at functionName (path/to/file.ts:123:45)
            r'at (?:(\w+) )?\(([^:]+\.ts):(\d+):\d+\)',
            # at path/to/file.ts:123:45
            r'at ([^\s:]+\.ts):(\d+):\d+',
        ],
        Language.JAVA: [
            # at com.example.Class.method(File.java:123)
            r'at [\w.]+\.(\w+)\(([^:]+\.java):(\d+)\)',
        ],
        Language.GO: [
            # path/to/file.go:123 +0x123
            r'([^\s]+\.go):(\d+)',
        ],
        Language.RUBY: [
            # path/to/file.rb:123:in `method_name'
            r'([^\s:]+\.rb):(\d+)(?::in `(\w+)\')?',
        ],
        Language.PHP: [
            # #0 path/to/file.php(123): function_name()
            r'#\d+ ([^\(]+\.php)\((\d+)\): (\w+)',
        ],
        Language.CSHARP: [
            # at Namespace.Class.Method() in path/to/file.cs:line 123
            r'at [\w.]+\.(\w+)\([^\)]*\) in ([^:]+\.cs):line (\d+)',
        ],
    }
    
    # Library/framework patterns to identify non-user code
    LIBRARY_PATTERNS = [
        r'/site-packages/',
        r'/node_modules/',
        r'/vendor/',
        r'/lib/python\d+\.\d+/',
        r'<frozen ',
        r'<built-in>',
        r'/usr/lib/',
        r'/System/Library/',
    ]
    
    def detect_language(self, stack_trace: str) -> Language:
        """Detect programming language from stack trace"""
        language_indicators = {
            Language.PYTHON: ['.py', 'Traceback', 'File "'],
            Language.JAVASCRIPT: ['.js', 'at ', 'node_modules'],
            Language.TYPESCRIPT: ['.ts', 'at ', 'node_modules'],
            Language.JAVA: ['.java', 'at ', 'Exception in thread'],
            Language.GO: ['.go', 'goroutine', 'panic:'],
            Language.RUBY: ['.rb', 'from ', 'in `'],
            Language.PHP: ['.php', 'Fatal error', 'Stack trace:'],
            Language.CSHARP: ['.cs', 'at ', 'System.'],
        }
        
        for lang, indicators in language_indicators.items():
            if all(ind in stack_trace for ind in indicators[:2]):
                return lang
        
        return Language.UNKNOWN
    
    def is_library_code(self, file_path: str) -> bool:
        """Check if file path is from a library/framework"""
        return any(re.search(pattern, file_path) for pattern in self.LIBRARY_PATTERNS)
    
    def parse_stack_trace(self, stack_trace: str, error_message: str = "") -> List[StackFrame]:
        """
        Parse stack trace into structured frames
        
        Args:
            stack_trace: Raw stack trace string
            error_message: Error message for context
            
        Returns:
            List of StackFrame objects
        """
        if not stack_trace:
            return []
        
        # Detect language
        language = self.detect_language(stack_trace)
        logger.info(f"[Parser] Detected language: {language.value}")
        
        frames = []
        patterns = self.PATTERNS.get(language, self.PATTERNS[Language.PYTHON])
        
        # Try each pattern for the detected language
        for pattern in patterns:
            matches = re.finditer(pattern, stack_trace, re.MULTILINE)
            for match in matches:
                groups = match.groups()
                
                # Extract file path and line number (always present)
                if len(groups) >= 2:
                    # Handle different group orders
                    if language in [Language.JAVASCRIPT, Language.TYPESCRIPT, Language.JAVA, Language.PHP, Language.CSHARP]:
                        function_name = groups[0] if len(groups) > 2 else None
                        file_path = groups[1] if len(groups) > 2 else groups[0]
                        line_number = int(groups[2] if len(groups) > 2 else groups[1])
                    else:
                        file_path = groups[0]
                        line_number = int(groups[1])
                        function_name = groups[2] if len(groups) > 2 else None
                    
                    # Create frame
                    frame = StackFrame(
                        file_path=file_path,
                        line_number=line_number,
                        function_name=function_name,
                        language=language,
                        is_user_code=not self.is_library_code(file_path)
                    )
                    frames.append(frame)
        
        logger.info(f"[Parser] Extracted {len(frames)} stack frames")
        return frames
    
    def get_primary_frame(self, frames: List[StackFrame]) -> Optional[StackFrame]:
        """
        Get the primary frame (most relevant for diagnosis)
        Prioritizes user code over library code
        """
        if not frames:
            return None
        
        # First, try to find user code frames
        user_frames = [f for f in frames if f.is_user_code]
        if user_frames:
            return user_frames[0]  # Return first user code frame
        
        # Fall back to first frame if no user code found
        return frames[0]


class EnhancedDiagnosisAgent:
    """
    Enhanced diagnosis agent with deep GitHub integration and intelligent analysis
    """
    
    def __init__(self, groq_client, mcp_manager):
        self.groq = groq_client
        self.mcp = mcp_manager
        self.parser = EnhancedStackTraceParser()
        self.blocked_paths = [
            "auth.py", "security/", "secrets.yml", "credentials", 
            ".env", "config/auth", "password", "token", "key"
        ]
    
    async def diagnose(
        self,
        incident_id: str,
        error_message: str,
        stack_trace: str,
        error_signature: str
    ) -> DiagnosisContext:
        """
        Perform comprehensive diagnosis
        
        Args:
            incident_id: Unique incident identifier
            error_message: Error message
            stack_trace: Stack trace string
            error_signature: Error signature for similarity search
            
        Returns:
            DiagnosisContext with complete diagnosis
        """
        logger.info(f"[Enhanced Diagnosis] Starting diagnosis for {incident_id}")
        
        # Step 1: Parse stack trace
        frames = self.parser.parse_stack_trace(stack_trace, error_message)
        primary_frame = self.parser.get_primary_frame(frames)
        language = self.parser.detect_language(stack_trace)
        
        if not primary_frame:
            logger.warning("[Enhanced Diagnosis] No stack frames found")
            return self._create_fallback_context(error_message, stack_trace)
        
        logger.info(f"[Enhanced Diagnosis] Primary frame: {primary_frame}")
        
        # Step 2: Security check
        if self._is_blocked_path(primary_frame.file_path):
            logger.warning(f"[Enhanced Diagnosis] Blocked path detected: {primary_frame.file_path}")
            return self._create_escalation_context(primary_frame, error_message)
        
        # Step 3: Fetch code context from GitHub
        code_context = await self._fetch_code_context(primary_frame)
        
        # Step 4: Fetch related files (imports, dependencies)
        related_files = await self._fetch_related_files(primary_frame)
        
        # Step 5: Find similar past incidents
        similar_incidents = await self._fetch_similar_incidents(error_signature)
        
        # Step 6: Perform LLM-powered diagnosis
        root_cause, diagnosis, confidence = await self._perform_llm_diagnosis(
            error_message=error_message,
            stack_trace=stack_trace,
            primary_frame=primary_frame,
            code_context=code_context,
            related_files=related_files,
            similar_incidents=similar_incidents,
            language=language
        )
        
        # Step 7: Create diagnosis context
        context = DiagnosisContext(
            error_message=error_message,
            error_type=self._extract_error_type(error_message),
            stack_frames=frames,
            primary_frame=primary_frame,
            code_context=code_context,
            related_files=related_files,
            similar_incidents=similar_incidents,
            root_cause=root_cause,
            diagnosis=diagnosis,
            confidence=confidence,
            language=language
        )
        
        logger.info(f"[Enhanced Diagnosis] Completed: {root_cause} (confidence: {confidence:.2f})")
        return context
    
    def _is_blocked_path(self, file_path: str) -> bool:
        """Check if file path is in blocked paths"""
        return any(blocked in file_path.lower() for blocked in self.blocked_paths)
    
    def _extract_error_type(self, error_message: str) -> str:
        """Extract error type from error message"""
        # Common pattern: ErrorType: message
        match = re.match(r'(\w+(?:Error|Exception)):', error_message)
        if match:
            return match.group(1)
        return "UnknownError"
    
    async def _fetch_code_context(self, frame: StackFrame) -> str:
        """Fetch code context from GitHub"""
        try:
            repo = os.getenv("GITHUB_REPO", "owner/repo")
            result = await self.mcp.fetch_github_context(
                repo=repo,
                file_path=frame.file_path,
                line_number=frame.line_number,
                context_lines=15  # More context for better analysis
            )
            code = result.get("code_snippet", "")
            logger.info(f"[Enhanced Diagnosis] Fetched {len(code)} chars of code context")
            return code
        except Exception as e:
            logger.warning(f"[Enhanced Diagnosis] Failed to fetch code context: {e}")
            return ""
    
    async def _fetch_related_files(self, frame: StackFrame) -> List[str]:
        """Fetch related files (imports, dependencies)"""
        # TODO: Implement import/dependency analysis
        # For now, return empty list
        return []
    
    async def _fetch_similar_incidents(self, error_signature: str) -> List[Dict[str, Any]]:
        """Fetch similar past incidents"""
        try:
            similar = await self.mcp.get_similar_incidents(
                error_signature=error_signature,
                limit=5
            )
            logger.info(f"[Enhanced Diagnosis] Found {len(similar)} similar incidents")
            return similar
        except Exception as e:
            logger.warning(f"[Enhanced Diagnosis] Failed to fetch similar incidents: {e}")
            return []
    
    async def _perform_llm_diagnosis(
        self,
        error_message: str,
        stack_trace: str,
        primary_frame: StackFrame,
        code_context: str,
        related_files: List[str],
        similar_incidents: List[Dict[str, Any]],
        language: Language
    ) -> Tuple[str, str, float]:
        """
        Perform LLM-powered diagnosis with comprehensive context
        
        Returns:
            Tuple of (root_cause, diagnosis, confidence)
        """
        system_prompt = f"""You are an expert {language.value} debugger and software architect. 
Analyze the incident deeply and provide:
1. Root cause analysis (brief, actionable)
2. Detailed diagnosis with reasoning
3. Confidence score (0.0-1.0) based on available context

Consider:
- Error type and message
- Stack trace and affected code
- Code context and patterns
- Similar past incidents and their resolutions
- Language-specific best practices

Respond in JSON format:
{{
  "root_cause": "brief root cause (max 100 chars)",
  "diagnosis": "detailed diagnosis with reasoning and evidence",
  "confidence": 0.85
}}"""
        
        # Build comprehensive prompt
        similar_context = ""
        if similar_incidents:
            similar_context = "\n\n## Similar Past Incidents:\n"
            for i, inc in enumerate(similar_incidents[:3], 1):
                similar_context += f"{i}. {inc.get('root_cause', 'N/A')}\n"
                similar_context += f"   Resolution: {inc.get('resolution', 'N/A')}\n"
        
        related_context = ""
        if related_files:
            related_context = f"\n\n## Related Files:\n" + "\n".join(f"- {f}" for f in related_files)
        
        prompt = f"""## Error Information
**Type**: {self._extract_error_type(error_message)}
**Message**: {error_message}

## Stack Trace
```
{stack_trace}
```

## Primary Affected Code
**File**: {primary_frame.file_path}
**Line**: {primary_frame.line_number}
**Function**: {primary_frame.function_name or 'unknown'}

## Code Context
```{language.value}
{code_context or 'Code context not available'}
```
{similar_context}{related_context}

## Task
Diagnose the root cause of this {language.value} error. Provide actionable insights."""
        
        try:
            result = await self.groq.call_groq_with_json(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.2,
                use_cache=True
            )
            
            root_cause = result.get("root_cause", "Unknown root cause")
            diagnosis = result.get("diagnosis", "Unable to diagnose")
            confidence = float(result.get("confidence", 0.5))
            
            return root_cause, diagnosis, confidence
            
        except Exception as e:
            logger.error(f"[Enhanced Diagnosis] LLM diagnosis failed: {e}")
            return "Diagnosis failed", str(e), 0.0
    
    def _create_fallback_context(self, error_message: str, stack_trace: str) -> DiagnosisContext:
        """Create fallback context when parsing fails"""
        return DiagnosisContext(
            error_message=error_message,
            error_type=self._extract_error_type(error_message),
            stack_frames=[],
            primary_frame=None,
            code_context="",
            related_files=[],
            similar_incidents=[],
            root_cause="Unable to parse stack trace",
            diagnosis="Stack trace parsing failed. Manual investigation required.",
            confidence=0.0,
            language=Language.UNKNOWN
        )
    
    def _create_escalation_context(self, frame: StackFrame, error_message: str) -> DiagnosisContext:
        """Create context for escalated incidents (blocked paths)"""
        return DiagnosisContext(
            error_message=error_message,
            error_type=self._extract_error_type(error_message),
            stack_frames=[frame],
            primary_frame=frame,
            code_context="",
            related_files=[],
            similar_incidents=[],
            root_cause=f"Security-critical file: {frame.file_path}",
            diagnosis="This incident affects a security-critical file and requires human review.",
            confidence=1.0,
            language=frame.language
        )

# Made with Bob
