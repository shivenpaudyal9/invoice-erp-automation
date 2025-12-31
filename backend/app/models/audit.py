import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class AuditAction(str, enum.Enum):
    UPLOAD = "upload"
    EXTRACT = "extract"
    EDIT = "edit"
    APPROVE = "approve"
    REJECT = "reject"
    EXPORT = "export"
    REEXTRACT = "reextract"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    user_email = Column(String, nullable=True)
    changes = Column(JSON, nullable=True)  # {"before": {...}, "after": {...}}
    ai_model = Column(String, nullable=True)
    ai_model_version = Column(String, nullable=True)
    extra_data = Column(JSON, nullable=True)  # Additional context/metadata

    # Relationship
    invoice = relationship("Invoice", back_populates="audit_logs")
