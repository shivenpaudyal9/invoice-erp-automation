from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.invoice import Invoice, InvoiceStatus
from app.models.audit import AuditLog, AuditAction
from app.auth import get_current_active_user
from app.services.export import ExportService

router = APIRouter(prefix="/api", tags=["Export"])

export_service = ExportService()


def create_export_audit_log(
    db: Session,
    invoice_id: str,
    user: User,
    export_format: str
):
    """Create audit log for export action."""
    log = AuditLog(
        invoice_id=invoice_id,
        action=AuditAction.EXPORT.value,
        user_id=user.id,
        user_email=user.email,
        extra_data={"format": export_format}
    )
    db.add(log)


@router.get("/invoices/{invoice_id}/export/json")
def export_invoice_json(
    invoice_id: str,
    include_audit: bool = Query(True, description="Include audit trail in export"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export a single invoice as ERP-ready JSON."""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    # Create audit log for export
    create_export_audit_log(db, invoice_id, current_user, "json")
    db.commit()

    export_data = export_service.export_invoice_json(invoice, include_audit=include_audit)
    return JSONResponse(content=export_data)


@router.get("/invoices/{invoice_id}/export/csv")
def export_invoice_csv(
    invoice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export a single invoice as CSV."""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    # Create audit log for export
    create_export_audit_log(db, invoice_id, current_user, "csv")
    db.commit()

    csv_content = export_service.export_invoice_csv(invoice)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=invoice_{invoice.invoice_number or invoice_id}.csv"
        }
    )


@router.post("/export/batch/json")
def export_batch_json(
    invoice_ids: List[str],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Batch export multiple invoices as JSON."""
    invoices = db.query(Invoice).filter(
        Invoice.id.in_(invoice_ids),
        Invoice.user_id == current_user.id
    ).all()

    if not invoices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No invoices found"
        )

    # Create audit logs for each exported invoice
    for invoice in invoices:
        create_export_audit_log(db, invoice.id, current_user, "json_batch")
    db.commit()

    export_data = export_service.export_batch_json(invoices)
    return JSONResponse(content=export_data)


@router.post("/export/batch/csv")
def export_batch_csv(
    invoice_ids: List[str],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Batch export multiple invoices as CSV."""
    invoices = db.query(Invoice).filter(
        Invoice.id.in_(invoice_ids),
        Invoice.user_id == current_user.id
    ).all()

    if not invoices:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No invoices found"
        )

    # Create audit logs for each exported invoice
    for invoice in invoices:
        create_export_audit_log(db, invoice.id, current_user, "csv_batch")
    db.commit()

    csv_content = export_service.export_batch_csv(invoices)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=invoices_batch_export.csv"
        }
    )


@router.get("/export/approved/json")
def export_approved_invoices_json(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export all approved invoices as JSON (user's invoices only)."""
    invoices = db.query(Invoice).filter(
        Invoice.status == InvoiceStatus.APPROVED.value,
        Invoice.user_id == current_user.id
    ).all()

    if not invoices:
        return JSONResponse(content={
            "erp_export_version": export_service.ERP_EXPORT_VERSION,
            "invoice_count": 0,
            "invoices": []
        })

    # Create audit logs for each exported invoice
    for invoice in invoices:
        create_export_audit_log(db, invoice.id, current_user, "json_approved_batch")
    db.commit()

    export_data = export_service.export_batch_json(invoices)
    return JSONResponse(content=export_data)
