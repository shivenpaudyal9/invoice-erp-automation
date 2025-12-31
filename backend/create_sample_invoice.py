from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

# Create a sample invoice PDF
c = canvas.Canvas('uploads/sample_invoice.pdf', pagesize=letter)
width, height = letter

# Header
c.setFont('Helvetica-Bold', 24)
c.drawString(1*inch, height - 1*inch, 'INVOICE')

# Company Info
c.setFont('Helvetica', 12)
c.drawString(1*inch, height - 1.5*inch, 'Acme Corporation')
c.drawString(1*inch, height - 1.7*inch, '123 Business Street')
c.drawString(1*inch, height - 1.9*inch, 'New York, NY 10001')

# Invoice Details
c.setFont('Helvetica-Bold', 12)
c.drawString(5*inch, height - 1.5*inch, 'Invoice #: INV-2025-001')
c.setFont('Helvetica', 12)
c.drawString(5*inch, height - 1.7*inch, 'Date: 2025-01-15')
c.drawString(5*inch, height - 1.9*inch, 'Due Date: 2025-02-15')

# Bill To
c.setFont('Helvetica-Bold', 12)
c.drawString(1*inch, height - 2.5*inch, 'Bill To:')
c.setFont('Helvetica', 12)
c.drawString(1*inch, height - 2.7*inch, 'ABC Company Inc.')
c.drawString(1*inch, height - 2.9*inch, '456 Client Avenue')
c.drawString(1*inch, height - 3.1*inch, 'Los Angeles, CA 90001')

# Table Header
y = height - 3.8*inch
c.setFont('Helvetica-Bold', 11)
c.drawString(1*inch, y, 'Description')
c.drawString(4*inch, y, 'Qty')
c.drawString(5*inch, y, 'Unit Price')
c.drawString(6.5*inch, y, 'Amount')
c.line(1*inch, y - 5, 7.5*inch, y - 5)

# Line Items
items = [
    ('Web Development Services', 40, 75.00, 3000.00),
    ('UI/UX Design', 20, 85.00, 1700.00),
    ('Server Hosting (Annual)', 1, 299.00, 299.00),
    ('Technical Support', 10, 50.00, 500.00),
]

c.setFont('Helvetica', 11)
y = height - 4.2*inch
for desc, qty, price, amount in items:
    c.drawString(1*inch, y, desc)
    c.drawString(4*inch, y, str(qty))
    c.drawString(5*inch, y, '${:.2f}'.format(price))
    c.drawString(6.5*inch, y, '${:.2f}'.format(amount))
    y -= 0.3*inch

# Totals
y -= 0.3*inch
c.line(5*inch, y + 0.2*inch, 7.5*inch, y + 0.2*inch)
c.drawString(5*inch, y, 'Subtotal:')
c.drawString(6.5*inch, y, '$5,499.00')

y -= 0.3*inch
c.drawString(5*inch, y, 'Tax (8%):')
c.drawString(6.5*inch, y, '$439.92')

y -= 0.3*inch
c.setFont('Helvetica-Bold', 12)
c.drawString(5*inch, y, 'Total:')
c.drawString(6.5*inch, y, '$5,938.92')

# Footer
c.setFont('Helvetica', 10)
c.drawString(1*inch, 1*inch, 'Payment Terms: Net 30 | Thank you for your business!')

c.save()
print('Sample invoice created: uploads/sample_invoice.pdf')
