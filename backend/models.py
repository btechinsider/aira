"""
SQLAlchemy models for AIRA incident tracking
"""
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

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
            "escalated": self.escalated
        }


# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////app/data/aira.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Made with Bob
