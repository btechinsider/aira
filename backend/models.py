"""
SQLAlchemy models for AIRA incident tracking
"""
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
import uuid

Base = declarative_base()


class Incident(Base):
    """Incident model for tracking all incidents and their resolution"""
    __tablename__ = "incidents"
    
    id = Column(String, primary_key=True)
    raw_log = Column(Text, nullable=False)
    stack_trace = Column(Text)
    severity = Column(String)  # P0, P1, P2, P3
    triage_summary = Column(Text)
    diagnosis = Column(Text)
    root_cause = Column(Text)
    proposed_fix = Column(Text)
    confidence_score = Column(Float)
    llm_confidence = Column(Float)
    pattern_match_score = Column(Float)
    historical_score = Column(Float)
    action_taken = Column(String)  # pr_created, slack_alert, human_approval
    pr_url = Column(String)
    affected_file = Column(String)
    affected_line = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    resolution_status = Column(String)  # pending, resolved, escalated
    escalated = Column(Boolean, default=False)
    # Enhanced diagnosis fields
    language = Column(String)  # Detected programming language
    stack_frames_count = Column(Integer)  # Number of stack frames parsed
    
    def to_dict(self):
        """Convert incident to dictionary"""
        return {
            "id": self.id,
            "raw_log": self.raw_log,
            "stack_trace": self.stack_trace,
            "severity": self.severity,
            "triage_summary": self.triage_summary,
            "diagnosis": self.diagnosis,
            "root_cause": self.root_cause,
            "proposed_fix": self.proposed_fix,
            "confidence_score": self.confidence_score,
            "llm_confidence": self.llm_confidence,
            "pattern_match_score": self.pattern_match_score,
            "historical_score": self.historical_score,
            "action_taken": self.action_taken,
            "pr_url": self.pr_url,
            "affected_file": self.affected_file,
            "affected_line": self.affected_line,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolution_status": self.resolution_status,
            "escalated": self.escalated,
            # Enhanced diagnosis fields
            "language": self.language,
            "stack_frames_count": self.stack_frames_count
        }


class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert user to dictionary (excluding password)"""
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None
        }


class APIKey(Base):
    """API Key model for webhook authentication"""
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    key = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)  # Friendly name for the key
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime)
    expires_at = Column(DateTime)  # Optional expiration
    
    # Relationships
    user = relationship("User", back_populates="api_keys")
    
    def to_dict(self):
        """Convert API key to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "key": self.key,
            "name": self.name,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None
        }


# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////app/data/aira.db")

# Handle Supabase connection string format
# Supabase uses postgres:// but SQLAlchemy requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure engine based on database type
if "postgresql" in DATABASE_URL or "postgres" in DATABASE_URL:
    # PostgreSQL configuration (for Supabase/Render)
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,   # Recycle connections after 1 hour
        echo=False,  # Set to True for SQL query logging
    )
else:
    # SQLite configuration (for local development)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    # Check if we need to recreate the database due to schema changes
    if "sqlite" in DATABASE_URL:
        import sqlite3
        db_path = DATABASE_URL.replace("sqlite:///", "")
        if os.path.exists(db_path):
            # Check if the new columns exist
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                cursor.execute("PRAGMA table_info(incidents)")
                columns = [row[1] for row in cursor.fetchall()]
                conn.close()
                
                # If new columns don't exist, drop and recreate
                if 'language' not in columns or 'stack_frames_count' not in columns:
                    print("Schema migration needed - recreating database...")
                    Base.metadata.drop_all(bind=engine)
            except Exception as e:
                print(f"Error checking schema: {e}")
                # If there's any error, recreate the database
                Base.metadata.drop_all(bind=engine)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print(f"Database initialized successfully using: {DATABASE_URL.split('@')[0] if '@' in DATABASE_URL else 'SQLite'}")


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Made with Bob
