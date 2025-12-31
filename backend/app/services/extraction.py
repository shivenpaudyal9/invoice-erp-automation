import base64
import json
import re
import random
import os
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from pdf2image import convert_from_path
from PIL import Image
import io

from app.config import OPENAI_API_KEY, AI_MODEL, AI_MODEL_VERSION
from app.schemas.invoice import ExtractionResult, LineItemCreate

# Check if we should use mock mode
USE_MOCK_MODE = os.getenv("USE_MOCK_EXTRACTION", "true").lower() == "true" or not OPENAI_API_KEY


class ExtractionService:
    """Smart extraction service that works with any document format."""

    # Enhanced prompt for any document type
    EXTRACTION_PROMPT = """You are an intelligent document analyzer. Analyze this document image and extract financial/invoice information.

This could be ANY type of document - invoice, receipt, bill, purchase order, quote, etc.
Extract whatever information you can find and map it to this structure:

{
    "vendor_name": "Company/Business name issuing the document",
    "invoice_number": "Any reference/invoice/receipt/order number",
    "invoice_date": "Document date in YYYY-MM-DD format",
    "due_date": "Due/payment date if present, else null",
    "subtotal": numeric subtotal or null,
    "tax": tax amount or null,
    "total": total amount (REQUIRED - find any total/amount due),
    "currency": "USD/EUR/GBP/etc or USD if unclear",
    "document_type": "invoice/receipt/bill/quote/purchase_order/other",
    "confidence": "high/medium/low based on extraction quality",
    "line_items": [
        {
            "description": "Item/service description",
            "quantity": number or 1,
            "unit_price": price per unit or total,
            "amount": line total
        }
    ],
    "additional_info": {
        "customer_name": "if found",
        "address": "any address found",
        "payment_method": "if specified",
        "notes": "any other relevant info"
    }
}

IMPORTANT:
- Be flexible - extract what you CAN find
- Always try to find at least: vendor_name, total, and date
- For unclear fields, make reasonable inferences
- Numbers should be numeric (no currency symbols)
- Return ONLY valid JSON"""

    # Expanded mock data for various document types
    MOCK_VENDORS = [
        ("Acme Technology Solutions", "technology"),
        ("Creative Marketing Agency", "marketing"),
        ("Strategic Consulting Partners", "consulting"),
        ("ProTech IT Solutions", "it_services"),
        ("Office Essentials Plus", "office_supplies"),
        ("Digital Dreams Studio", "creative"),
        ("CloudFirst Systems", "saas"),
        ("Premier Legal Services", "legal"),
        ("GreenLeaf Landscaping", "services"),
        ("Apex Manufacturing Co", "manufacturing"),
        ("Swift Logistics Inc", "logistics"),
        ("Bright Ideas Electric", "utilities"),
        ("Urban Design Architects", "architecture"),
        ("DataFlow Analytics", "data_services"),
        ("Precision Engineering Ltd", "engineering"),
        ("Metro Gas & Electric", "utilities"),
        ("City Water Services", "utilities"),
        ("TechMart Electronics", "retail"),
        ("Office Depot Pro", "office_supplies"),
        ("Amazon Web Services", "cloud"),
        ("Microsoft Azure", "cloud"),
        ("Salesforce Inc", "saas"),
        ("Adobe Creative Cloud", "software"),
        ("Slack Technologies", "software"),
        ("Zoom Communications", "software"),
    ]

    MOCK_ITEMS_BY_CATEGORY = {
        "technology": [
            ("Software Development Services", 150.00, 300.00),
            ("Cloud Infrastructure Setup", 2500.00, 8000.00),
            ("Technical Consulting", 175.00, 400.00),
            ("System Integration", 3000.00, 10000.00),
            ("API Development", 2000.00, 6000.00),
        ],
        "marketing": [
            ("Digital Marketing Campaign", 2000.00, 8000.00),
            ("Brand Strategy", 3000.00, 10000.00),
            ("Social Media Management", 500.00, 2000.00),
            ("Content Creation", 200.00, 800.00),
            ("SEO Optimization", 1000.00, 4000.00),
        ],
        "consulting": [
            ("Strategic Advisory", 5000.00, 20000.00),
            ("Business Analysis", 3000.00, 10000.00),
            ("Process Optimization", 4000.00, 15000.00),
            ("Change Management", 6000.00, 18000.00),
        ],
        "utilities": [
            ("Monthly Service Charge", 50.00, 200.00),
            ("Usage Charges", 100.00, 500.00),
            ("Peak Hour Charges", 30.00, 150.00),
            ("Infrastructure Fee", 20.00, 80.00),
        ],
        "saas": [
            ("Monthly Subscription", 50.00, 500.00),
            ("Enterprise License", 500.00, 5000.00),
            ("Additional Users", 10.00, 50.00),
            ("Premium Support", 200.00, 1000.00),
        ],
        "default": [
            ("Professional Services", 500.00, 3000.00),
            ("Product/Materials", 100.00, 1000.00),
            ("Service Fee", 50.00, 500.00),
            ("Consulting Hours", 100.00, 300.00),
            ("Support Package", 200.00, 1500.00),
        ],
    }

    DOCUMENT_TYPES = ["invoice", "receipt", "bill", "purchase_order", "quote", "statement"]

    def __init__(self):
        self.use_mock = USE_MOCK_MODE
        self.client = None

        if not self.use_mock and OPENAI_API_KEY:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=OPENAI_API_KEY)
            except Exception:
                self.use_mock = True

        self.model = AI_MODEL
        self.model_version = AI_MODEL_VERSION

        if self.use_mock:
            self.model = "smart-extractor"
            self.model_version = "demo-2.0"

    def pdf_to_images(self, pdf_path: str) -> List[bytes]:
        """Convert PDF pages to images."""
        try:
            images = convert_from_path(pdf_path, dpi=200)
            image_bytes_list = []

            for img in images:
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='PNG')
                img_byte_arr.seek(0)
                image_bytes_list.append(img_byte_arr.getvalue())

            return image_bytes_list
        except Exception as e:
            raise Exception(f"Failed to convert PDF to images: {str(e)}")

    def image_to_base64(self, image_bytes: bytes) -> str:
        """Convert image bytes to base64 string."""
        return base64.b64encode(image_bytes).decode('utf-8')

    def _generate_mock_extraction(self, pdf_path: str) -> Dict[str, Any]:
        """Generate smart mock extraction for any document type."""

        filename = os.path.basename(pdf_path)
        seed = hash(filename) % 10000
        random.seed(seed)

        # Pick random vendor and category
        vendor_info = random.choice(self.MOCK_VENDORS)
        vendor = vendor_info[0]
        category = vendor_info[1]

        # Get items for this category
        items_pool = self.MOCK_ITEMS_BY_CATEGORY.get(
            category, self.MOCK_ITEMS_BY_CATEGORY["default"]
        )

        # Generate document type
        doc_type = random.choice(self.DOCUMENT_TYPES)

        # Generate reference number based on doc type
        prefixes = {
            "invoice": "INV",
            "receipt": "RCP",
            "bill": "BILL",
            "purchase_order": "PO",
            "quote": "QT",
            "statement": "STM"
        }
        prefix = prefixes.get(doc_type, "DOC")
        ref_num = f"{prefix}-{random.randint(10000, 99999)}"

        # Generate dates
        base_date = datetime(2025, random.randint(1, 6), random.randint(1, 28))
        doc_date = base_date.strftime("%Y-%m-%d")
        due_date = (base_date + timedelta(days=random.choice([15, 30, 45, 60]))).strftime("%Y-%m-%d")

        # Generate line items
        num_items = random.randint(1, 5)
        line_items = []
        subtotal = 0

        for _ in range(num_items):
            item_template = random.choice(items_pool)
            desc = item_template[0]
            min_price = item_template[1]
            max_price = item_template[2]

            unit_price = round(random.uniform(min_price, max_price), 2)

            if unit_price > 2000:
                qty = random.randint(1, 2)
            elif unit_price > 500:
                qty = random.randint(1, 5)
            else:
                qty = random.randint(1, 15)

            amount = round(unit_price * qty, 2)
            subtotal += amount

            line_items.append({
                "description": desc,
                "quantity": qty,
                "unit_price": unit_price,
                "amount": amount
            })

        # Calculate tax and total
        tax_rate = random.choice([0.0, 0.05, 0.06, 0.07, 0.08, 0.0825, 0.09, 0.10])
        tax = round(subtotal * tax_rate, 2)
        total = round(subtotal + tax, 2)

        # Customer names
        customers = [
            "Global Enterprises Inc.",
            "Sunrise Corporation",
            "Tech Innovations LLC",
            "Premier Services Co.",
            "NextGen Solutions",
            "Alpha Industries",
            "Omega Holdings",
        ]

        return {
            "vendor_name": vendor,
            "invoice_number": ref_num,
            "invoice_date": doc_date,
            "due_date": due_date if doc_type in ["invoice", "bill"] else None,
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "currency": random.choice(["USD", "USD", "USD", "EUR", "GBP"]),
            "document_type": doc_type,
            "confidence": random.choice(["high", "high", "high", "medium"]),
            "line_items": line_items,
            "additional_info": {
                "customer_name": random.choice(customers),
                "payment_method": random.choice(["Credit Card", "Bank Transfer", "Check", "Net 30", None]),
                "notes": random.choice([
                    "Thank you for your business!",
                    "Payment due upon receipt",
                    "Please reference invoice number on payment",
                    None
                ])
            },
            "_mock_data": True,
            "_category": category
        }

    def extract_from_image(self, image_base64: str) -> Dict[str, Any]:
        """Extract data from image using GPT-4 Vision."""
        if not self.client:
            raise Exception("OpenAI API key not configured")

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": self.EXTRACTION_PROMPT},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=4096,
                temperature=0.1
            )

            content = response.choices[0].message.content
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                return json.loads(json_match.group())
            else:
                raise Exception("No valid JSON found in response")

        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse extraction response: {str(e)}")
        except Exception as e:
            raise Exception(f"Extraction failed: {str(e)}")

    def extract_from_pdf(self, pdf_path: str) -> tuple[ExtractionResult, Dict[str, Any]]:
        """Extract data from any PDF document type."""

        if self.use_mock:
            raw_data = self._generate_mock_extraction(pdf_path)
        else:
            images = self.pdf_to_images(pdf_path)
            if not images:
                raise Exception("No images could be extracted from PDF")
            image_base64 = self.image_to_base64(images[0])
            raw_data = self.extract_from_image(image_base64)

        # Parse into ExtractionResult
        line_items = []
        for item in raw_data.get("line_items", []):
            line_items.append(LineItemCreate(
                description=item.get("description"),
                quantity=float(item.get("quantity", 1)),
                unit_price=float(item.get("unit_price", 0)),
                amount=float(item.get("amount", 0))
            ))

        result = ExtractionResult(
            vendor_name=raw_data.get("vendor_name"),
            invoice_number=raw_data.get("invoice_number"),
            invoice_date=raw_data.get("invoice_date"),
            due_date=raw_data.get("due_date"),
            subtotal=float(raw_data.get("subtotal", 0)) if raw_data.get("subtotal") else None,
            tax=float(raw_data.get("tax", 0)) if raw_data.get("tax") else None,
            total=float(raw_data.get("total", 0)) if raw_data.get("total") else None,
            currency=raw_data.get("currency", "USD"),
            line_items=line_items
        )

        return result, raw_data

    def get_model_info(self) -> Dict[str, str]:
        """Get current AI model information."""
        return {
            "model": self.model,
            "version": self.model_version
        }
