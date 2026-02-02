import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class InvoiceStatus(str, enum.Enum):
    PENDING = "pending"
    EXTRACTED = "extracted"
    REVIEW = "review"
    APPROVED = "approved"
    REJECTED = "rejected"


class ValidationStatus(str, enum.Enum):
    VALID = "valid"
    WARNING = "warning"
    ERROR = "error"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # User ownership for multi-user support
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    filename = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default=InvoiceStatus.PENDING.value)

    # Extracted fields
    vendor_name = Column(String, nullable=True)
    invoice_number = Column(String, nullable=True)
    invoice_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    subtotal = Column(Float, nullable=True)
    tax = Column(Float, nullable=True)
    total = Column(Float, nullable=True)
    currency = Column(String, default="USD")

    # Validation
    validation_status = Column(String, default=ValidationStatus.VALID.value)
    validation_notes = Column(JSON, default=list)

    # File storage
    pdf_path = Column(String, nullable=False)

    # Review info
    reviewed_by = Column(String, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # AI model tracking
    ai_model_version = Column(String, nullable=True)
    raw_extraction = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="invoices")
    line_items = relationship("LineItem", back_populates="invoice", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="invoice", cascade="all, delete-orphan")


class LineItem(Base):
    __tablename__ = "line_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    description = Column(String, nullable=True)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)

    # Relationship
    invoice = relationship("Invoice", back_populates="line_items")
