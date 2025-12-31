from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import os
import random
from datetime import datetime, timedelta

# Ensure uploads directory exists
os.makedirs('uploads', exist_ok=True)

# Data for generating random invoices
COMPANIES = [
    {'name': 'Acme Technology Solutions', 'address': '123 Silicon Valley Blvd', 'city': 'San Francisco, CA 94105', 'email': 'billing@acmetech.com'},
    {'name': 'Creative Marketing Agency', 'address': '789 Madison Avenue', 'city': 'New York, NY 10022', 'email': 'invoices@creativeagency.com'},
    {'name': 'Strategic Consulting Partners', 'address': '555 Financial District', 'city': 'Boston, MA 02110', 'email': 'accounts@stratconsult.com'},
    {'name': 'ProTech IT Solutions', 'address': '1200 Tech Park Drive', 'city': 'Seattle, WA 98101', 'email': 'billing@protechit.com'},
    {'name': 'Office Essentials Plus', 'address': '3000 Commerce Way', 'city': 'Atlanta, GA 30301', 'email': 'orders@officeessentials.com'},
    {'name': 'Digital Dreams Studio', 'address': '450 Sunset Boulevard', 'city': 'Los Angeles, CA 90028', 'email': 'finance@digitaldreams.com'},
    {'name': 'CloudFirst Systems', 'address': '800 Innovation Way', 'city': 'Austin, TX 78701', 'email': 'ar@cloudfirst.io'},
    {'name': 'Premier Legal Services', 'address': '100 Justice Lane', 'city': 'Chicago, IL 60601', 'email': 'billing@premierlegal.com'},
    {'name': 'GreenLeaf Landscaping', 'address': '25 Garden Path', 'city': 'Denver, CO 80201', 'email': 'invoices@greenleaf.com'},
    {'name': 'Apex Manufacturing Co', 'address': '5000 Industrial Park', 'city': 'Detroit, MI 48201', 'email': 'accounts@apexmfg.com'},
    {'name': 'Swift Logistics Inc', 'address': '7500 Freight Way', 'city': 'Memphis, TN 38101', 'email': 'billing@swiftlogistics.com'},
    {'name': 'Bright Ideas Electric', 'address': '320 Power Street', 'city': 'Phoenix, AZ 85001', 'email': 'invoices@brightideas.com'},
    {'name': 'Urban Design Architects', 'address': '150 Blueprint Ave', 'city': 'Portland, OR 97201', 'email': 'finance@urbandesign.com'},
    {'name': 'DataFlow Analytics', 'address': '900 Binary Boulevard', 'city': 'San Jose, CA 95101', 'email': 'ar@dataflow.io'},
    {'name': 'Precision Engineering Ltd', 'address': '450 Mechanics Row', 'city': 'Pittsburgh, PA 15201', 'email': 'billing@precisioneng.com'},
    {'name': 'Wellness Medical Group', 'address': '200 Health Center Dr', 'city': 'Houston, TX 77001', 'email': 'billing@wellnessmed.com'},
    {'name': 'Summit Financial Advisors', 'address': '1000 Wall Street', 'city': 'New York, NY 10005', 'email': 'invoices@summitfa.com'},
    {'name': 'Oceanview Hospitality', 'address': '888 Beachfront Ave', 'city': 'Miami, FL 33101', 'email': 'accounts@oceanview.com'},
    {'name': 'TechForward Solutions', 'address': '333 Innovation Circle', 'city': 'Raleigh, NC 27601', 'email': 'billing@techforward.com'},
    {'name': 'BuildRight Construction', 'address': '750 Contractor Lane', 'city': 'Dallas, TX 75201', 'email': 'invoices@buildright.com'},
]

CLIENTS = [
    {'name': 'Global Enterprises Inc.', 'address': '456 Corporate Plaza', 'city': 'New York, NY 10001'},
    {'name': 'Sunrise Retail Group', 'address': '321 Commerce Street', 'city': 'Chicago, IL 60601'},
    {'name': 'MedTech Innovations LLC', 'address': '900 Healthcare Parkway', 'city': 'Austin, TX 78701'},
    {'name': 'Northwest Manufacturing Co.', 'address': '4500 Industrial Blvd', 'city': 'Portland, OR 97201'},
    {'name': 'Downtown Law Offices LLP', 'address': '100 Legal Center', 'city': 'Miami, FL 33101'},
    {'name': 'Pacific Trading Company', 'address': '200 Harbor Drive', 'city': 'San Diego, CA 92101'},
    {'name': 'Mountain View Hotels', 'address': '555 Resort Way', 'city': 'Denver, CO 80202'},
    {'name': 'Eastside Medical Center', 'address': '1200 Hospital Road', 'city': 'Boston, MA 02115'},
    {'name': 'Central Bank Corp', 'address': '800 Finance Square', 'city': 'Charlotte, NC 28201'},
    {'name': 'Metro Transit Authority', 'address': '350 Transportation Hub', 'city': 'Philadelphia, PA 19101'},
    {'name': 'Riverside School District', 'address': '400 Education Blvd', 'city': 'Sacramento, CA 95814'},
    {'name': 'Lakefront Properties LLC', 'address': '175 Waterside Drive', 'city': 'Cleveland, OH 44101'},
    {'name': 'Valley Tech Startups', 'address': '650 Venture Lane', 'city': 'San Jose, CA 95110'},
    {'name': 'Heritage Museum Foundation', 'address': '225 Cultural Center', 'city': 'Washington, DC 20001'},
    {'name': 'Coastal Energy Partners', 'address': '900 Offshore Blvd', 'city': 'Houston, TX 77002'},
    {'name': 'Pinnacle Sports Academy', 'address': '500 Athletic Way', 'city': 'Orlando, FL 32801'},
    {'name': 'Northern Timber Products', 'address': '1500 Forest Road', 'city': 'Minneapolis, MN 55401'},
    {'name': 'Desert Sun Resorts', 'address': '777 Oasis Drive', 'city': 'Las Vegas, NV 89101'},
    {'name': 'Midwest Agriculture Co-op', 'address': '2000 Farmland Ave', 'city': 'Kansas City, MO 64101'},
    {'name': 'Atlantic Shipping Lines', 'address': '300 Dockside Way', 'city': 'Baltimore, MD 21201'},
]

SERVICE_CATEGORIES = {
    'technology': [
        ('Cloud Infrastructure Setup', 3000, 8000),
        ('Software Development (per hour)', 100, 200),
        ('Database Migration', 2000, 5000),
        ('Technical Consulting', 150, 300),
        ('Annual Support License', 1200, 5000),
        ('API Integration', 1500, 4000),
        ('Security Audit', 2500, 6000),
        ('Mobile App Development', 5000, 15000),
        ('System Architecture Review', 3000, 7000),
        ('DevOps Implementation', 4000, 10000),
    ],
    'marketing': [
        ('Brand Strategy Development', 5000, 12000),
        ('Logo Design Package', 1500, 4000),
        ('Website Redesign', 8000, 20000),
        ('Social Media Campaign', 2000, 5000),
        ('Photography Session', 800, 2000),
        ('Video Production', 3000, 10000),
        ('SEO Optimization', 1500, 4000),
        ('Content Writing (per article)', 200, 500),
        ('Email Marketing Setup', 1000, 3000),
        ('PPC Campaign Management', 1500, 4000),
    ],
    'consulting': [
        ('Market Analysis Report', 8000, 15000),
        ('Competitive Intelligence', 5000, 10000),
        ('Executive Workshop', 3000, 8000),
        ('Implementation Roadmap', 5000, 12000),
        ('Business Process Review', 4000, 9000),
        ('Change Management', 6000, 14000),
        ('Risk Assessment', 3500, 8000),
        ('Strategic Planning Session', 4000, 10000),
        ('Performance Optimization', 5000, 11000),
        ('Merger & Acquisition Advisory', 15000, 50000),
    ],
    'it_services': [
        ('Network Security Audit', 3000, 7000),
        ('Firewall Installation', 800, 2000),
        ('Employee Security Training', 50, 150),
        ('Backup System Setup', 1500, 4000),
        ('Monthly Monitoring', 400, 1000),
        ('Hardware Installation', 500, 2000),
        ('Software Licensing', 200, 1000),
        ('Help Desk Support (per hour)', 75, 150),
        ('Disaster Recovery Planning', 5000, 12000),
        ('VPN Configuration', 1000, 3000),
    ],
    'office_supplies': [
        ('Premium Copy Paper (case)', 35, 55),
        ('Ink Cartridges', 25, 50),
        ('Office Chairs - Ergonomic', 200, 400),
        ('Standing Desks', 350, 600),
        ('Filing Cabinets', 150, 300),
        ('Office Supplies Bundle', 200, 500),
        ('Computer Monitors', 250, 500),
        ('Keyboards and Mice Set', 50, 120),
        ('Desk Organizers', 30, 80),
        ('Printer/Scanner Combo', 300, 800),
    ],
    'construction': [
        ('Foundation Work', 10000, 30000),
        ('Electrical Installation', 5000, 15000),
        ('Plumbing Services', 3000, 10000),
        ('HVAC Installation', 8000, 20000),
        ('Roofing', 5000, 15000),
        ('Interior Finishing', 10000, 25000),
        ('Painting Services', 2000, 8000),
        ('Flooring Installation', 3000, 12000),
        ('Window Installation', 2000, 6000),
        ('Landscaping', 1500, 5000),
    ],
    'healthcare': [
        ('Medical Consultation', 150, 400),
        ('Laboratory Tests', 100, 500),
        ('Imaging Services', 500, 2000),
        ('Physical Therapy Session', 100, 250),
        ('Medical Equipment', 1000, 10000),
        ('Prescription Services', 50, 300),
        ('Health Screening Package', 300, 800),
        ('Telemedicine Consultation', 75, 200),
        ('Wellness Program', 500, 2000),
        ('Medical Supplies', 200, 1000),
    ],
    'legal': [
        ('Legal Consultation (per hour)', 200, 500),
        ('Contract Drafting', 1000, 5000),
        ('Document Review', 500, 2000),
        ('Court Representation', 5000, 20000),
        ('Legal Research', 300, 1000),
        ('Patent Filing', 3000, 10000),
        ('Trademark Registration', 1500, 4000),
        ('Compliance Review', 2000, 6000),
        ('Mediation Services', 2000, 8000),
        ('Corporate Formation', 1000, 3000),
    ],
}

def create_invoice(filename, company, invoice_num, date, due_date, client, items, tax_rate):
    c = canvas.Canvas(f'uploads/{filename}', pagesize=letter)
    width, height = letter

    # Calculate totals
    subtotal = sum(item[3] for item in items)
    tax = subtotal * tax_rate
    total = subtotal + tax

    # Header
    c.setFont('Helvetica-Bold', 24)
    c.drawString(1*inch, height - 1*inch, 'INVOICE')

    # Company Info
    c.setFont('Helvetica-Bold', 14)
    c.drawString(1*inch, height - 1.5*inch, company['name'])
    c.setFont('Helvetica', 11)
    c.drawString(1*inch, height - 1.75*inch, company['address'])
    c.drawString(1*inch, height - 1.95*inch, company['city'])
    c.drawString(1*inch, height - 2.15*inch, 'Email: ' + company['email'])

    # Invoice Details Box
    c.setFont('Helvetica-Bold', 11)
    c.drawString(5*inch, height - 1.5*inch, 'Invoice #: ' + invoice_num)
    c.setFont('Helvetica', 11)
    c.drawString(5*inch, height - 1.75*inch, 'Date: ' + date)
    c.drawString(5*inch, height - 1.95*inch, 'Due Date: ' + due_date)

    # Bill To
    c.setFont('Helvetica-Bold', 11)
    c.drawString(1*inch, height - 2.7*inch, 'Bill To:')
    c.setFont('Helvetica', 11)
    c.drawString(1*inch, height - 2.95*inch, client['name'])
    c.drawString(1*inch, height - 3.15*inch, client['address'])
    c.drawString(1*inch, height - 3.35*inch, client['city'])

    # Table Header
    y = height - 4*inch
    c.setFillColorRGB(0.2, 0.2, 0.6)
    c.rect(0.8*inch, y - 5, 6.9*inch, 20, fill=True)
    c.setFillColorRGB(1, 1, 1)
    c.setFont('Helvetica-Bold', 10)
    c.drawString(1*inch, y, 'Description')
    c.drawString(4.2*inch, y, 'Qty')
    c.drawString(5*inch, y, 'Unit Price')
    c.drawString(6.3*inch, y, 'Amount')

    # Line Items
    c.setFillColorRGB(0, 0, 0)
    c.setFont('Helvetica', 10)
    y = height - 4.4*inch
    for desc, qty, price, amount in items:
        c.drawString(1*inch, y, desc[:40])  # Truncate long descriptions
        c.drawString(4.2*inch, y, str(qty))
        c.drawString(5*inch, y, '${:,.2f}'.format(price))
        c.drawString(6.3*inch, y, '${:,.2f}'.format(amount))
        y -= 0.25*inch

    # Totals
    y -= 0.3*inch
    c.line(4.8*inch, y + 0.15*inch, 7.5*inch, y + 0.15*inch)

    c.setFont('Helvetica', 11)
    c.drawString(5*inch, y, 'Subtotal:')
    c.drawRightString(7.4*inch, y, '${:,.2f}'.format(subtotal))

    y -= 0.25*inch
    c.drawString(5*inch, y, 'Tax ({:.1%}):'.format(tax_rate))
    c.drawRightString(7.4*inch, y, '${:,.2f}'.format(tax))

    y -= 0.3*inch
    c.line(4.8*inch, y + 0.15*inch, 7.5*inch, y + 0.15*inch)
    c.setFont('Helvetica-Bold', 12)
    c.drawString(5*inch, y, 'TOTAL:')
    c.drawRightString(7.4*inch, y, '${:,.2f}'.format(total))

    # Footer
    c.setFont('Helvetica', 9)
    c.drawString(1*inch, 0.8*inch, 'Payment Terms: Net 30 | Thank you for your business!')

    c.save()
    return total

def generate_random_invoice(invoice_number):
    # Random company and client
    company = random.choice(COMPANIES)
    client = random.choice(CLIENTS)

    # Random category and items
    category = random.choice(list(SERVICE_CATEGORIES.keys()))
    available_items = SERVICE_CATEGORIES[category]

    # Generate 2-6 line items
    num_items = random.randint(2, 6)
    items = []
    for _ in range(num_items):
        item_template = random.choice(available_items)
        name = item_template[0]
        min_price = item_template[1]
        max_price = item_template[2]

        price = round(random.uniform(min_price, max_price), 2)
        qty = random.randint(1, 20)

        # For hourly/per-unit items, use higher quantities
        if 'hour' in name.lower() or 'per' in name.lower():
            qty = random.randint(5, 50)
        elif price > 5000:
            qty = random.randint(1, 3)

        amount = round(price * qty, 2)
        items.append((name, qty, price, amount))

    # Random dates within 2025
    base_date = datetime(2025, 1, 1) + timedelta(days=random.randint(0, 180))
    invoice_date = base_date.strftime('%Y-%m-%d')
    due_date = (base_date + timedelta(days=30)).strftime('%Y-%m-%d')

    # Random tax rate
    tax_rate = random.choice([0.05, 0.06, 0.0625, 0.07, 0.075, 0.08, 0.0825, 0.0875, 0.09, 0.10])

    # Generate invoice number prefix based on company
    prefix = ''.join([word[0] for word in company['name'].split()[:2]]).upper()
    inv_num = f'{prefix}-2025-{invoice_number:04d}'

    # Filename
    filename = f'invoice_{invoice_number:03d}_{prefix.lower()}.pdf'

    total = create_invoice(
        filename=filename,
        company=company,
        invoice_num=inv_num,
        date=invoice_date,
        due_date=due_date,
        client=client,
        items=items,
        tax_rate=tax_rate
    )

    return filename, total

# Generate 100 invoices
print('Generating 100 sample invoices...\n')
total_value = 0
for i in range(1, 101):
    filename, total = generate_random_invoice(i)
    total_value += total
    if i % 10 == 0:
        print(f'  Created {i} invoices...')

print(f'\n✅ Successfully created 100 sample invoices!')
print(f'\nTotal value of all invoices: ${total_value:,.2f}')
print(f'\nInvoices saved in: C:\\Users\\91953\\invoice-erp-automation\\backend\\uploads\\')
print('\nYou can now upload these through the frontend at http://localhost:5173/upload')
