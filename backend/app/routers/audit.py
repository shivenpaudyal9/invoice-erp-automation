from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.invoice import Invoice
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse, AuditLogListResponse
from app.auth import get_current_active_user

router = APIRouter(prefix="/api", tags=["Audit"])


@router.get("/invoices/{invoice_id}/audit", response_model=AuditLogListResponse)
def get_invoice_audit_logs(
    invoice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get audit trail for a specific invoice."""
    # Verify invoice exists
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    logs = db.query(AuditLog).filter(
        AuditLog.invoice_id == invoice_id
    ).order_by(AuditLog.timestamp.desc()).all()

    return AuditLogListResponse(logs=logs, total=len(logs))


@router.get("/audit", response_model=AuditLogListResponse)
def get_all_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action type"),
    user_email: Optional[str] = Query(None, description="Filter by user email"),
    invoice_id: Optional[str] = Query(None, description="Filter by invoice ID"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get global audit log with filters."""
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if user_email:
        query = query.filter(AuditLog.user_email == user_email)
    if invoice_id:
        query = query.filter(AuditLog.invoice_id == invoice_id)

    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()

    return AuditLogListResponse(logs=logs, total=total)
