from datetime import date, datetime
from typing import List, Tuple, Optional
from app.models.invoice import Invoice, LineItem, ValidationStatus


class ValidationService:
    """Service for validating invoice data and flagging exceptions."""

    # Tolerance for floating point comparisons (1 cent)
    TOLERANCE = 0.01

    def validate_invoice(self, invoice: Invoice) -> Tuple[ValidationStatus, List[str]]:
        """
        Validate an invoice and return validation status with notes.
        Returns (ValidationStatus, list of validation notes/issues)
        """
        notes = []
        has_errors = False
        has_warnings = False

        # Validate line items sum to subtotal
        line_item_validation = self._validate_line_items_sum(invoice)
        if line_item_validation:
            notes.append(line_item_validation)
            has_warnings = True

        # Validate subtotal + tax = total
        total_validation = self._validate_total(invoice)
        if total_validation:
            notes.append(total_validation)
            has_warnings = True

        # Validate dates
        date_validations = self._validate_dates(invoice)
        notes.extend(date_validations)
        if date_validations:
            has_warnings = True

        # Validate required fields
        missing_fields = self._validate_required_fields(invoice)
        notes.extend(missing_fields)
        if missing_fields:
            has_errors = True

        # Determine overall status
        if has_errors:
            status = ValidationStatus.ERROR
        elif has_warnings:
            status = ValidationStatus.WARNING
        else:
            status = ValidationStatus.VALID

        return status, notes

    def _validate_line_items_sum(self, invoice: Invoice) -> Optional[str]:
        """Validate that line items sum to subtotal."""
        if not invoice.line_items or invoice.subtotal is None:
            return None

        line_items_total = sum(item.amount for item in invoice.line_items)
        difference = abs(line_items_total - invoice.subtotal)

        if difference > self.TOLERANCE:
            return f"Line items sum ({line_items_total:.2f}) does not match subtotal ({invoice.subtotal:.2f}). Difference: {difference:.2f}"

        return None

    def _validate_total(self, invoice: Invoice) -> Optional[str]:
        """Validate that subtotal + tax = total."""
        if invoice.subtotal is None or invoice.total is None:
            return None

        tax = invoice.tax if invoice.tax is not None else 0
        calculated_total = invoice.subtotal + tax
        difference = abs(calculated_total - invoice.total)

        if difference > self.TOLERANCE:
            return f"Subtotal ({invoice.subtotal:.2f}) + Tax ({tax:.2f}) = {calculated_total:.2f} does not match total ({invoice.total:.2f}). Difference: {difference:.2f}"

        return None

    def _validate_dates(self, invoice: Invoice) -> List[str]:
        """Validate invoice dates."""
        notes = []
        today = date.today()

        # Check if invoice date is in the future
        if invoice.invoice_date and invoice.invoice_date > today:
            notes.append(f"Invoice date ({invoice.invoice_date}) is in the future")

        # Check if due date is before invoice date
        if invoice.invoice_date and invoice.due_date:
            if invoice.due_date < invoice.invoice_date:
                notes.append(f"Due date ({invoice.due_date}) is before invoice date ({invoice.invoice_date})")

        return notes

    def _validate_required_fields(self, invoice: Invoice) -> List[str]:
        """Check for missing required fields."""
        missing = []

        if not invoice.vendor_name:
            missing.append("Missing vendor name")
        if not invoice.invoice_number:
            missing.append("Missing invoice number")
        if invoice.total is None:
            missing.append("Missing total amount")

        return missing

    def validate_line_item(self, line_item: LineItem) -> List[str]:
        """Validate a single line item."""
        notes = []

        # Check if quantity * unit_price = amount
        if line_item.quantity and line_item.unit_price:
            calculated_amount = line_item.quantity * line_item.unit_price
            if abs(calculated_amount - line_item.amount) > self.TOLERANCE:
                notes.append(
                    f"Line item calculation mismatch: {line_item.quantity} x {line_item.unit_price:.2f} = {calculated_amount:.2f}, but amount is {line_item.amount:.2f}"
                )

        # Check for negative values
        if line_item.quantity and line_item.quantity < 0:
            notes.append("Negative quantity detected")
        if line_item.unit_price and line_item.unit_price < 0:
            notes.append("Negative unit price detected")
        if line_item.amount and line_item.amount < 0:
            notes.append("Negative amount detected")

        return notes
