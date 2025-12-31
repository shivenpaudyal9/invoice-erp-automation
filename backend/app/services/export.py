import csv
import io
import json
from datetime import datetime
from typing import List, Dict, Any
from app.models.invoice import Invoice
from app.models.audit import AuditLog


class ExportService:
    """Service for exporting invoice data to ERP-ready formats."""

    ERP_EXPORT_VERSION = "1.0"

    def export_invoice_json(self, invoice: Invoice, include_audit: bool = True) -> Dict[str, Any]:
        """Export a single invoice as ERP-ready JSON."""
        export_data = {
            "erp_export_version": self.ERP_EXPORT_VERSION,
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "invoice": {
                "id": invoice.id,
                "vendor_name": invoice.vendor_name,
                "invoice_number": invoice.invoice_number,
                "invoice_date": invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
                "currency": invoice.currency,
                "subtotal": invoice.subtotal,
                "tax": invoice.tax,
                "total": invoice.total,
                "line_items": [
                    {
                        "description": item.description,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                        "amount": item.amount
                    }
                    for item in invoice.line_items
                ]
            },
            "processing_info": {
                "status": invoice.status,
                "validation_status": invoice.validation_status,
                "validation_notes": invoice.validation_notes or [],
                "ai_model": invoice.ai_model_version,
                "uploaded_at": invoice.upload_date.isoformat() + "Z" if invoice.upload_date else None,
                "reviewed_by": invoice.reviewed_by,
                "reviewed_at": invoice.reviewed_at.isoformat() + "Z" if invoice.reviewed_at else None
            }
        }

        if include_audit and invoice.audit_logs:
            export_data["audit_trail"] = [
                {
                    "timestamp": log.timestamp.isoformat() + "Z",
                    "action": log.action,
                    "user": log.user_email,
                    "changes": log.changes,
                    "ai_model": log.ai_model,
                    "ai_model_version": log.ai_model_version
                }
                for log in sorted(invoice.audit_logs, key=lambda x: x.timestamp)
            ]

        return export_data

    def export_invoice_csv(self, invoice: Invoice) -> str:
        """Export a single invoice as CSV (header row + line items)."""
        output = io.StringIO()

        # Header information
        output.write("# Invoice Export\n")
        output.write(f"# Exported: {datetime.utcnow().isoformat()}Z\n")
        output.write(f"# Invoice ID: {invoice.id}\n")
        output.write(f"# Vendor: {invoice.vendor_name or 'N/A'}\n")
        output.write(f"# Invoice Number: {invoice.invoice_number or 'N/A'}\n")
        output.write(f"# Invoice Date: {invoice.invoice_date or 'N/A'}\n")
        output.write(f"# Due Date: {invoice.due_date or 'N/A'}\n")
        output.write(f"# Currency: {invoice.currency}\n")
        output.write(f"# Subtotal: {invoice.subtotal or 0:.2f}\n")
        output.write(f"# Tax: {invoice.tax or 0:.2f}\n")
        output.write(f"# Total: {invoice.total or 0:.2f}\n")
        output.write(f"# Status: {invoice.status}\n")
        output.write(f"# Validation: {invoice.validation_status}\n")
        output.write("#\n")

        # Line items as CSV
        writer = csv.writer(output)
        writer.writerow(["Line Item", "Description", "Quantity", "Unit Price", "Amount"])

        for i, item in enumerate(invoice.line_items, 1):
            writer.writerow([
                i,
                item.description or "",
                item.quantity,
                f"{item.unit_price:.2f}",
                f"{item.amount:.2f}"
            ])

        return output.getvalue()

    def export_batch_json(self, invoices: List[Invoice]) -> Dict[str, Any]:
        """Export multiple invoices as a batch JSON."""
        return {
            "erp_export_version": self.ERP_EXPORT_VERSION,
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "invoice_count": len(invoices),
            "invoices": [
                self.export_invoice_json(invoice, include_audit=False)["invoice"]
                for invoice in invoices
            ]
        }

    def export_batch_csv(self, invoices: List[Invoice]) -> str:
        """Export multiple invoices as a single CSV file."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "Invoice ID",
            "Vendor Name",
            "Invoice Number",
            "Invoice Date",
            "Due Date",
            "Currency",
            "Subtotal",
            "Tax",
            "Total",
            "Status",
            "Validation Status",
            "Line Item #",
            "Item Description",
            "Quantity",
            "Unit Price",
            "Amount"
        ])

        for invoice in invoices:
            if invoice.line_items:
                for i, item in enumerate(invoice.line_items, 1):
                    writer.writerow([
                        invoice.id,
                        invoice.vendor_name or "",
                        invoice.invoice_number or "",
                        invoice.invoice_date.isoformat() if invoice.invoice_date else "",
                        invoice.due_date.isoformat() if invoice.due_date else "",
                        invoice.currency,
                        f"{invoice.subtotal:.2f}" if invoice.subtotal else "",
                        f"{invoice.tax:.2f}" if invoice.tax else "",
                        f"{invoice.total:.2f}" if invoice.total else "",
                        invoice.status,
                        invoice.validation_status,
                        i,
                        item.description or "",
                        item.quantity,
                        f"{item.unit_price:.2f}",
                        f"{item.amount:.2f}"
                    ])
            else:
                # Invoice with no line items
                writer.writerow([
                    invoice.id,
                    invoice.vendor_name or "",
                    invoice.invoice_number or "",
                    invoice.invoice_date.isoformat() if invoice.invoice_date else "",
                    invoice.due_date.isoformat() if invoice.due_date else "",
                    invoice.currency,
                    f"{invoice.subtotal:.2f}" if invoice.subtotal else "",
                    f"{invoice.tax:.2f}" if invoice.tax else "",
                    f"{invoice.total:.2f}" if invoice.total else "",
                    invoice.status,
                    invoice.validation_status,
                    "",
                    "",
                    "",
                    "",
                    ""
                ])

        return output.getvalue()
