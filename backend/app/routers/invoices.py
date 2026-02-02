import os
import shutil
import uuid
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.invoice import Invoice, LineItem, InvoiceStatus, ValidationStatus
from app.models.audit import AuditLog, AuditAction
from app.schemas.invoice import InvoiceResponse, InvoiceUpdate, InvoiceListResponse
from app.auth import get_current_active_user
from app.config import UPLOAD_DIR, AI_MODEL, AI_MODEL_VERSION
from app.services.extraction import ExtractionService
from app.services.validation import ValidationService

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

extraction_service = ExtractionService()
validation_service = ValidationService()


def create_audit_log(
    db: Session,
    invoice_id: str,
    action: str,
    user: Optional[User] = None,
    changes: Optional[dict] = None,
    ai_model: Optional[str] = None,
    ai_model_version: Optional[str] = None,
    extra_data: Optional[dict] = None
):
    """Helper to create audit log entries."""
    log = AuditLog(
        invoice_id=invoice_id,
        action=action,
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        changes=changes,
        ai_model=ai_model,
        ai_model_version=ai_model_version,
        extra_data=extra_data
    )
    db.add(log)
    return log


def invoice_to_dict(invoice: Invoice) -> dict:
    """Convert invoice to dictionary for comparison."""
    return {
        "vendor_name": invoice.vendor_name,
        "invoice_number": invoice.invoice_number,
        "invoice_date": invoice.invoice_date.isoformat() if invoice.invoice_date else None,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
        "subtotal": invoice.subtotal,
        "tax": invoice.tax,
        "total": invoice.total,
        "currency": invoice.currency,
        "status": invoice.status,
    }


@router.post("/upload", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def upload_invoice(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload a PDF invoice and trigger AI extraction."""
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )

    # Generate unique filename
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = UPLOAD_DIR / filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Create invoice record with user ownership
    invoice = Invoice(
        user_id=current_user.id,
        filename=file.filename,
        pdf_path=str(file_path),
        status=InvoiceStatus.PENDING.value
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # Create upload audit log
    create_audit_log(
        db=db,
        invoice_id=invoice.id,
        action=AuditAction.UPLOAD.value,
        user=current_user,
        extra_data={"filename": file.filename, "file_size": os.path.getsize(file_path)}
    )
    db.commit()

    # Run extraction
    try:
        result, raw_data = extraction_service.extract_from_pdf(str(file_path))

        # Update invoice with extracted data
        invoice.vendor_name = result.vendor_name
        invoice.invoice_number = result.invoice_number
        if result.invoice_date:
            try:
                invoice.invoice_date = datetime.strptime(result.invoice_date, "%Y-%m-%d").date()
            except ValueError:
                pass
        if result.due_date:
            try:
                invoice.due_date = datetime.strptime(result.due_date, "%Y-%m-%d").date()
            except ValueError:
                pass
        invoice.subtotal = result.subtotal
        invoice.tax = result.tax
        invoice.total = result.total
        invoice.currency = result.currency
        invoice.raw_extraction = raw_data
        invoice.ai_model_version = f"{AI_MODEL}:{AI_MODEL_VERSION}"
        invoice.status = InvoiceStatus.EXTRACTED.value

        # Add line items
        for item_data in result.line_items:
            line_item = LineItem(
                invoice_id=invoice.id,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                amount=item_data.amount
            )
            db.add(line_item)

        # Run validation
        val_status, val_notes = validation_service.validate_invoice(invoice)
        invoice.validation_status = val_status.value
        invoice.validation_notes = val_notes

        # Move to review status
        invoice.status = InvoiceStatus.REVIEW.value

        # Create extraction audit log
        create_audit_log(
            db=db,
            invoice_id=invoice.id,
            action=AuditAction.EXTRACT.value,
            user=current_user,
            ai_model=AI_MODEL,
            ai_model_version=AI_MODEL_VERSION,
            changes={"after": invoice_to_dict(invoice)},
            extra_data={"validation_status": val_status.value, "validation_notes": val_notes}
        )

        db.commit()
        db.refresh(invoice)

    except Exception as e:
        # Keep invoice with pending status if extraction fails
        invoice.validation_status = ValidationStatus.ERROR.value
        invoice.validation_notes = [f"Extraction failed: {str(e)}"]
        db.commit()
        db.refresh(invoice)

    return invoice


@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    status: Optional[str] = Query(None, description="Filter by status"),
    validation_status: Optional[str] = Query(None, description="Filter by validation status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's invoices with optional filters."""
    # Filter by current user - each user only sees their own invoices
    query = db.query(Invoice).filter(Invoice.user_id == current_user.id)

    if status:
        query = query.filter(Invoice.status == status)
    if validation_status:
        query = query.filter(Invoice.validation_status == validation_status)

    total = query.count()
    invoices = query.order_by(Invoice.upload_date.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return InvoiceListResponse(
        invoices=invoices,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a single invoice by ID (only if owned by current user)."""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: str,
    update_data: InvoiceUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update invoice fields (human review/edit)."""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    # Store before state for audit
    before_state = invoice_to_dict(invoice)

    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True, exclude={"line_items"})
    for field, value in update_dict.items():
        setattr(invoice, field, value)

    # Update line items if provided
    if update_data.line_items is not None:
        # For simplicity, update existing items by index
        for i, item_update in enumerate(update_data.line_items):
            if i < len(invoice.line_items):
                item = invoice.line_items[i]
                item_dict = item_update.model_dump(exclude_unset=True)
                for field, value in item_dict.items():
                    setattr(item, field, value)

    # Re-run validation
    val_status, val_notes = validation_service.validate_invoice(invoice)
    invoice.validation_status = val_status.value
    invoice.validation_notes = val_notes

    # Create edit audit log
    after_state = invoice_to_dict(invoice)
    create_audit_log(
        db=db,
        invoice_id=invoice.id,
        action=AuditAction.EDIT.value,
        user=current_user,
        changes={"before": before_state, "after": after_state}
    )

    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/{invoice_id}/approve", response_model=InvoiceResponse)
def approve_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Approve an invoice for ERP export."""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    if invoice.status == InvoiceStatus.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already approved"
        )

    # Store before state
    before_state = invoice_to_dict(invoice)

    # Update status
    invoice.status = InvoiceStatus.APPROVED.value
    invoice.reviewed_by = current_user.id
    invoice.reviewed_at = datetime.utcnow()

    # Create approval audit log
    after_state = invoice_to_dict(invoice)
    create_audit_log(
        db=db,
        invoice_id=invoice.id,
        action=AuditAction.APPROVE.value,
        user=current_user,
        changes={"before": before_state, "after": after_state}
    )

    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/{invoice_id}/reject", response_model=InvoiceResponse)
def reject_invoice(
    invoice_id: str,
    reason: Optional[str] = Query(None, description="Rejection reason"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reject an invoice."""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    # Store before state
    before_state = invoice_to_dict(invoice)

    # Update status
    invoice.status = InvoiceStatus.REJECTED.value
    invoice.reviewed_by = current_user.id
    invoice.reviewed_at = datetime.utcnow()

    # Create rejection audit log
    after_state = invoice_to_dict(invoice)
    create_audit_log(
        db=db,
        invoice_id=invoice.id,
        action=AuditAction.REJECT.value,
        user=current_user,
        changes={"before": before_state, "after": after_state},
        extra_data={"reason": reason} if reason else None
    )

    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/{invoice_id}/reextract", response_model=InvoiceResponse)
async def reextract_invoice(
    invoice_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Re-run AI extraction on an invoice."""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    # Store before state
    before_state = invoice_to_dict(invoice)

    try:
        result, raw_data = extraction_service.extract_from_pdf(invoice.pdf_path)

        # Update invoice with new extracted data
        invoice.vendor_name = result.vendor_name
        invoice.invoice_number = result.invoice_number
        if result.invoice_date:
            try:
                invoice.invoice_date = datetime.strptime(result.invoice_date, "%Y-%m-%d").date()
            except ValueError:
                pass
        if result.due_date:
            try:
                invoice.due_date = datetime.strptime(result.due_date, "%Y-%m-%d").date()
            except ValueError:
                pass
        invoice.subtotal = result.subtotal
        invoice.tax = result.tax
        invoice.total = result.total
        invoice.currency = result.currency
        invoice.raw_extraction = raw_data
        invoice.ai_model_version = f"{AI_MODEL}:{AI_MODEL_VERSION}"

        # Remove old line items and add new ones
        for item in invoice.line_items:
            db.delete(item)

        for item_data in result.line_items:
            line_item = LineItem(
                invoice_id=invoice.id,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                amount=item_data.amount
            )
            db.add(line_item)

        # Re-run validation
        val_status, val_notes = validation_service.validate_invoice(invoice)
        invoice.validation_status = val_status.value
        invoice.validation_notes = val_notes
        invoice.status = InvoiceStatus.REVIEW.value

        # Create reextract audit log
        after_state = invoice_to_dict(invoice)
        create_audit_log(
            db=db,
            invoice_id=invoice.id,
            action=AuditAction.REEXTRACT.value,
            user=current_user,
            ai_model=AI_MODEL,
            ai_model_version=AI_MODEL_VERSION,
            changes={"before": before_state, "after": after_state}
        )

        db.commit()
        db.refresh(invoice)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Re-extraction failed: {str(e)}"
        )

    return invoice
