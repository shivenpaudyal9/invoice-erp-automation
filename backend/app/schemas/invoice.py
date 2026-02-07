from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List, Any, Dict


class LineItemCreate(BaseModel):
    description: Optional[str] = None
    quantity: float = 1.0
    unit_price: float = 0.0
    amount: float = 0.0


class LineItemUpdate(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    amount: Optional[float] = None


class LineItemResponse(BaseModel):
    id: str
    invoice_id: str
    description: Optional[str]
    quantity: float
    unit_price: float
    amount: float

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    filename: str
    pdf_path: str


class InvoiceUpdate(BaseModel):
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    currency: Optional[str] = None
    line_items: Optional[List[LineItemUpdate]] = None
    custom_fields: Optional[Dict[str, Any]] = None


class InvoiceResponse(BaseModel):
    id: str
    filename: str
    upload_date: datetime
    status: str
    vendor_name: Optional[str]
    invoice_number: Optional[str]
    invoice_date: Optional[date]
    due_date: Optional[date]
    subtotal: Optional[float]
    tax: Optional[float]
    total: Optional[float]
    currency: str
    validation_status: str
    validation_notes: List[str]
    pdf_path: str
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    ai_model_version: Optional[str]
    line_items: List[LineItemResponse]
    custom_fields: Optional[Dict[str, Any]] = None
    requested_fields: Optional[List[str]] = None

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    invoices: List[InvoiceResponse]
    total: int
    page: int
    page_size: int


class ExtractionResult(BaseModel):
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    currency: str = "USD"
    line_items: List[LineItemCreate] = []
    custom_fields: Optional[Dict[str, Any]] = None
