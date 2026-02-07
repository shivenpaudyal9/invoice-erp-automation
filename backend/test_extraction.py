import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

print("=" * 50)
print("Testing Invoice Extraction")
print("=" * 50)

# Check API key
api_key = os.getenv("GEMINI_API_KEY", "")
print(f"\n1. API Key: {'Set (' + api_key[:20] + '...)' if api_key else 'NOT SET'}")

# Test PDF to image conversion
print("\n2. Testing PDF to Image conversion...")
try:
    from pdf2image import convert_from_path

    # Find a test PDF
    uploads_dir = "uploads"
    pdf_files = [f for f in os.listdir(uploads_dir) if f.endswith('.pdf')]

    if not pdf_files:
        print("   ERROR: No PDF files found in uploads folder")
    else:
        test_pdf = os.path.join(uploads_dir, pdf_files[0])
        print(f"   Testing with: {test_pdf}")

        images = convert_from_path(test_pdf, dpi=200)
        print(f"   SUCCESS: Converted PDF to {len(images)} image(s)")

except Exception as e:
    print(f"   ERROR: {type(e).__name__}: {e}")

# Test Gemini connection
print("\n3. Testing Gemini API connection...")
try:
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    # Simple test call
    response = model.generate_content("Say 'API working' in 2 words")
    print(f"   SUCCESS: {response.text.strip()}")

except Exception as e:
    print(f"   ERROR: {type(e).__name__}: {e}")

# Test full extraction
print("\n4. Testing full extraction pipeline...")
try:
    from app.services.extraction import ExtractionService

    service = ExtractionService()

    if pdf_files:
        test_pdf = os.path.join(uploads_dir, pdf_files[0])
        print(f"   Extracting from: {test_pdf}")

        result, raw_data = service.extract_from_pdf(test_pdf)

        print(f"\n   EXTRACTION RESULTS:")
        print(f"   - Vendor: {result.vendor_name}")
        print(f"   - Invoice #: {result.invoice_number}")
        print(f"   - Date: {result.invoice_date}")
        print(f"   - Total: {result.total}")
        print(f"   - Line items: {len(result.line_items)}")
        print(f"   - Custom fields: {result.custom_fields}")

except Exception as e:
    import traceback
    print(f"   ERROR: {type(e).__name__}: {e}")
    print("\n   Full traceback:")
    traceback.print_exc()

print("\n" + "=" * 50)
