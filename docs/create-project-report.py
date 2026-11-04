from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'Warehouse_and_Supply_Chain_Management_System_Report.docx'
ARCH = ROOT / 'docs' / 'diagrams' / 'modular-monolith-architecture.png'
ERD = ROOT / 'docs' / 'diagrams' / 'database-erd.png'

NAVY = '17365D'
BLUE = 'D9EAF7'
PALE = 'F4F7FA'
GRAY = 'D9E2F3'

def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), fill)
    tc_pr.append(shd)

def border_table(table):
    tbl_pr = table._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        node = OxmlElement(f'w:{edge}')
        node.set(qn('w:val'), 'single')
        node.set(qn('w:sz'), '4')
        node.set(qn('w:color'), 'D9D9D9')
        borders.append(node)
    tbl_pr.append(borders)

def set_cell_text(cell, text, bold=False, color=None, size=9):
    cell.text = ''
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = p.add_run(str(text))
    r.bold = bold
    r.font.size = Pt(size)
    if color:
        r.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

def table(doc, headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.style = 'Table Grid'
    border_table(t)
    for i, header in enumerate(headers):
        shade(t.rows[0].cells[i], NAVY)
        set_cell_text(t.rows[0].cells[i], header, bold=True, color='FFFFFF')
    for row_index, row in enumerate(rows):
        cells = t.add_row().cells
        for i, value in enumerate(row):
            if row_index % 2:
                shade(cells[i], PALE)
            set_cell_text(cells[i], value)
    if widths:
        for row in t.rows:
            for idx, width in enumerate(widths):
                row.cells[idx].width = Inches(width)
    doc.add_paragraph()
    return t

def heading(doc, text, level=1):
    p = doc.add_paragraph(style=f'Heading {level}')
    p.paragraph_format.space_before = Pt(14 if level == 1 else 8)
    p.paragraph_format.space_after = Pt(5)
    r = p.add_run(text)
    r.font.color.rgb = RGBColor(0, 0, 0)
    return p

def para(doc, text, bold_lead=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.12
    if bold_lead and text.startswith(bold_lead):
        p.add_run(bold_lead).bold = True
        p.add_run(text[len(bold_lead):])
    else:
        p.add_run(text)
    return p

def bullet(doc, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(3)
    p.add_run(text)

def caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(8)
    r = p.add_run(text)
    r.italic = True
    r.font.size = Pt(9)

def add_page_number(section):
    p = section.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run('Warehouse and Supply Chain Management System  |  Page ')
    fld = OxmlElement('w:fldSimple')
    fld.set(qn('w:instr'), 'PAGE')
    p._p.append(fld)

def main():
    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.65)
    sec.bottom_margin = Inches(0.65)
    sec.left_margin = Inches(0.72)
    sec.right_margin = Inches(0.72)
    add_page_number(sec)

    styles = doc.styles
    styles['Normal'].font.name = 'Aptos'
    styles['Normal']._element.rPr.rFonts.set(qn('w:ascii'), 'Aptos')
    styles['Normal']._element.rPr.rFonts.set(qn('w:hAnsi'), 'Aptos')
    styles['Normal'].font.size = Pt(10)
    for style_name in ('Title', 'Heading 1', 'Heading 2', 'Heading 3'):
        styles[style_name].font.name = 'Aptos Display'
        styles[style_name].font.color.rgb = RGBColor(0, 0, 0)

    title = doc.add_paragraph(style='Title')
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.add_run('Warehouse and Supply Chain Management System')
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run('Technical Project Report and Demonstration Guide')
    r.bold = True
    r.font.size = Pt(15)
    doc.add_paragraph()
    para(doc, 'This report explains the implemented warehouse and supply chain application, its two database systems, role based access control, core workflows, reporting features, and the realistic demo dataset prepared for project demonstration.')
    table(doc, ['Project area', 'Implementation'], [
        ['Client', 'React and Vite single page application'],
        ['Server', 'NestJS modular monolith REST API'],
        ['Relational database', 'PostgreSQL through Prisma ORM'],
        ['Document database', 'MongoDB native driver collections'],
        ['Authentication', 'JWT access and refresh tokens with bcrypt password hashes'],
        ['Prepared data', '60 records per core operational dataset plus MongoDB demo documents'],
    ], [1.75, 4.6])
    para(doc, 'Main conclusion: the system is designed as a hybrid data platform. PostgreSQL stores transactional data requiring relationships and consistency. MongoDB stores flexible operational records such as alerts, audit logs, metrics, and application logs. The database role of a user determines the permissions shown after login.')
    doc.add_page_break()

    heading(doc, '1 Project Purpose and Scope')
    para(doc, 'The application supports a typical supply chain cycle: configure warehouses and storage locations, maintain a product catalog and batches, receive inventory from suppliers, issue inventory for sales orders, dispatch shipments, monitor alerts, and review operational reports. The same project also records user actions for audit purposes and produces demand forecast records for planning.')
    heading(doc, 'Business modules', 2)
    table(doc, ['Module', 'Main responsibility', 'Examples'], [
        ['User management', 'Account lifecycle and access control', 'Users, invitations, refresh tokens, roles'],
        ['Warehouse', 'Physical storage model', 'Warehouses, rack or shelf locations, capacity'],
        ['Product', 'Catalog and traceability', 'Products, categories, batches, barcode or QR data'],
        ['Inventory', 'Available and reserved stock', 'Receive, dispatch, transfer, reserve, adjust'],
        ['Procurement', 'Inbound purchasing', 'Suppliers, purchase orders, received quantities'],
        ['Sales and logistics', 'Outbound fulfillment', 'Customers, sales orders, shipments, tracking events'],
        ['Planning and reporting', 'Operational decisions', 'Demand forecasts, low stock, valuation, trends'],
        ['Alerts and audit', 'Monitoring and accountability', 'Low stock alerts, expiry alerts, audit logs, metrics'],
    ], [1.35, 2.25, 2.75])
    heading(doc, 'System architecture snapshot', 2)
    doc.add_picture(str(ARCH), width=Inches(5.25))
    caption(doc, 'Figure 1. Repository architecture snapshot showing the functional modules and the PostgreSQL and MongoDB responsibilities.')
    doc.add_page_break()

    heading(doc, '2 Application Architecture and Request Flow')
    para(doc, 'The frontend is a React application served by Vite. It sends HTTP requests to the NestJS backend at the configured local API address. NestJS groups the business logic into modules such as product, inventory, procurement, sales, shipment, reporting, and authentication. Prisma provides the relational mapping to PostgreSQL, while the MongoDB service manages document collections and indexes.')
    table(doc, ['Step', 'What happens', 'Why it matters'], [
        ['1', 'User signs in from the React login screen.', 'Credentials are never used to choose a role in the browser.'],
        ['2', 'NestJS checks the User record and bcrypt password hash.', 'Only active accounts with valid passwords can continue.'],
        ['3', 'Server signs a JWT containing user id, email, and stored role.', 'The API and frontend can enforce access consistently.'],
        ['4', 'Frontend stores tokens and filters navigation and routes by role.', 'Users see only relevant screens and receive an access denied state when required.'],
        ['5', 'Controllers call services and repositories.', 'Business rules remain separate from HTTP route definitions.'],
        ['6', 'PostgreSQL or MongoDB persists the resulting data.', 'Each datastore is used for the kind of data it handles best.'],
    ], [0.45, 3.05, 2.85])
    heading(doc, 'Core API functions', 2)
    bullet(doc, 'Authentication: signup, login, refresh token, logout, change password, current user profile, and administrator-managed invitations.')
    bullet(doc, 'Inventory: receive stock, dispatch stock, adjust quantity, transfer between locations, reserve stock, release stock, and query inventory by location or product batch.')
    bullet(doc, 'Procurement and sales: create and manage suppliers, customers, purchase orders, purchase order receipts, sales orders, order items, and order statuses.')
    bullet(doc, 'Logistics: create shipments, link shipments to sales orders, record shipment items, carriers, tracking codes, and tracking events.')
    bullet(doc, 'Reporting: low-stock, expiry, stock-level, movement, valuation, warehouse utilization, supplier performance, sales performance, and demand accuracy endpoints.')
    doc.add_page_break()

    heading(doc, '3 PostgreSQL SQL Database')
    para(doc, 'PostgreSQL is the system of record for transactional data. Transactions are appropriate here because warehouse operations involve linked entities and quantities. For example, a product batch, a location inventory row, a stock movement, and a purchase or sales document need reliable references to each other.')
    heading(doc, 'Why SQL is used', 2)
    table(doc, ['Capability', 'How PostgreSQL supports it in this project'], [
        ['Relationships', 'Foreign keys connect product categories to products, products to batches, batches to inventory, and orders to their item lines.'],
        ['Consistency', 'Unique keys protect SKU, warehouse code, purchase order number, sales order number, shipment number, and idempotency key values.'],
        ['Transactions', 'Multi-step actions can safely update related records together, reducing partial operational changes.'],
        ['Reporting joins', 'Inventory, product, supplier, customer, order, and shipment data can be grouped and joined for reports.'],
        ['Schema control', 'Prisma schema defines entity fields, types, indexes, enums, and relation rules in one versioned source.'],
    ], [1.45, 4.95])
    heading(doc, 'Major SQL entities', 2)
    table(doc, ['Entity group', 'Tables and role'], [
        ['Master data', 'User, Warehouse, Location, ProductCategory, Product, Supplier, Customer'],
        ['Inventory data', 'ProductBatch, Inventory, StockMovement'],
        ['Inbound flow', 'PurchaseOrder and PurchaseOrderItem'],
        ['Outbound flow', 'SalesOrder, SalesOrderItem, Shipment, ShipmentItem, ShipmentTrackingEvent'],
        ['Planning and security', 'DemandForecast, UserInvite, RefreshToken'],
    ], [1.55, 4.85])
    heading(doc, 'Entity relationship snapshot', 2)
    doc.add_picture(str(ERD), width=Inches(5.7))
    caption(doc, 'Figure 2. PostgreSQL entity relationship diagram snapshot from the project documentation.')
    doc.add_page_break()

    heading(doc, '4 MongoDB NoSQL Database')
    para(doc, 'MongoDB stores operational documents whose structure is naturally flexible or event-like. This avoids forcing every alert, audit entry, metric label set, and diagnostic log into a strictly relational schema. The backend connects through the MongoDB native driver and creates useful indexes during initialization.')
    table(doc, ['Collection', 'Purpose', 'Example document fields', 'Retention or indexing'], [
        ['alerts', 'Operational notifications', 'type, severity, message, isRead, timestamps', 'TTL index used for alert retention'],
        ['audit_logs', 'Traceability of user and system actions', 'entity type, entity id, action, user id, metadata, timestamp', 'TTL index used for audit retention'],
        ['metrics', 'Time based measurements', 'name, value, type, labels, timestamp', 'Indexes by timestamp and name plus timestamp'],
        ['logs', 'Application diagnostics', 'level, context, message, metadata, timestamp', 'TTL index used for log retention'],
    ], [1.0, 1.6, 2.7, 1.2])
    heading(doc, 'Why NoSQL is appropriate', 2)
    bullet(doc, 'Alert payloads vary by event type, for example low stock versus upcoming expiry; document fields can evolve without a relational migration for every new optional attribute.')
    bullet(doc, 'Audit metadata captures the context of many different actions. A JSON-like metadata field can preserve what happened without many sparse relational columns.')
    bullet(doc, 'Metrics use labels that differ by measurement. MongoDB documents can store those label sets directly and still support time range queries.')
    bullet(doc, 'TTL indexes automatically remove old operational documents according to the configured retention period, keeping the live dataset manageable.')
    heading(doc, 'Example NoSQL demonstration queries', 2)
    table(doc, ['Purpose', 'MongoDB Compass filter or shell query'], [
        ['Unread critical alerts', "{ severity: 'CRITICAL', isRead: false }"],
        ['Recent audit records', "db.audit_logs.find({ timestamp: { $gte: ISODate('2026-11-01') } }).sort({ timestamp: -1 })"],
        ['Seed metric series', "db.metrics.find({ name: 'seed_daily_volume' }).sort({ timestamp: -1 })"],
        ['Audit action count', "db.audit_logs.aggregate([{ $group: { _id: '$action', count: { $sum: 1 } } }])"],
    ], [2.1, 4.4])
    doc.add_page_break()

    heading(doc, '5 Authentication and Role Based Access Control')
    para(doc, 'A role is a server-side attribute of a User account. During login, the backend finds the account by email, verifies the password hash with bcrypt, checks that the account is active, and signs a JWT with the account role. A user cannot legitimately obtain administrator access by selecting Admin in the browser because the backend does not accept a role from the login form as an authority decision.')
    heading(doc, 'Login screen behavior', 2)
    para(doc, 'The login screen now includes a Demo login as drop-down. It is a demonstration convenience only: selecting a role fills the correct seeded account email and demonstration password. The server still validates the selected account and derives its actual role from PostgreSQL. A regular user can choose Use my own account and enter normal credentials.')
    table(doc, ['Role', 'Typical permitted areas'], [
        ['Admin', 'All modules, users, audit logs, reporting, administration'],
        ['Manager', 'Broad operational oversight, users, reports, procurement and sales workflows'],
        ['Warehouse staff', 'Warehouse, locations, product and batch handling, inventory, shipments, operational reports'],
        ['Procurement', 'Suppliers, purchase orders, inventory visibility, demand planning, procurement reports'],
        ['Sales', 'Customers, sales orders, shipment visibility, sales reports and demand planning'],
        ['Logistics', 'Shipments and warehouse related views'],
        ['Analyst', 'Reporting, demand planning, audit log review'],
        ['Partner', 'Restricted partner account; no privileged operational administration'],
    ], [1.45, 5.05])
    heading(doc, 'Secure login sequence', 2)
    table(doc, ['Stage', 'Control'], [
        ['Password storage', 'bcrypt hash is stored; plaintext password is not persisted.'],
        ['Access token', 'Short-lived JWT includes subject, email, and assigned role.'],
        ['Refresh token', 'Server persists a refresh token record and can revoke it on logout or password change.'],
        ['Route protection', 'Frontend requires a token and checks allowed roles before rendering restricted pages.'],
        ['API protection', 'Backend guards validate authenticated identity and authorize endpoints.'],
        ['Role change', 'Administrator changes the User role in the database or through the user management flow; user signs out and in again to receive an updated JWT.'],
    ], [1.45, 5.05])
    doc.add_page_break()

    heading(doc, '6 Seeded Demonstration Dataset')
    para(doc, 'A non-destructive realistic seed command was added for the demonstration. It uses deterministic SEED prefixes and create or skip behavior so it can safely be run again without duplicating the core seed records. It creates linked records across the procurement to fulfillment path rather than isolated rows.')
    table(doc, ['Dataset', 'Verified seed records', 'How it helps the demonstration'], [
        ['Users', '60', 'Accounts distributed across administrator, manager, warehouse, procurement, sales, logistics, analyst, and partner roles'],
        ['User invites', '60', 'Demonstrates invitation based role assignment'],
        ['Products, suppliers, customers', '60 each', 'Enough records for listing, searching, and realistic order references'],
        ['Locations, batches, inventory', '60 each', 'Demonstrates physical inventory distribution and batch traceability'],
        ['Purchase orders and sales orders', '60 each', 'Provides inbound and outbound transaction history'],
        ['Shipments and stock movements', '60 each', 'Provides fulfillment and inventory movement data'],
        ['Mongo alerts, audit logs, metrics', '60 each', 'Provides NoSQL records for Compass queries and monitoring views'],
    ], [2.25, 1.0, 3.25])
    heading(doc, 'Demo accounts', 2)
    table(doc, ['Role', 'Demo email', 'Password'], [
        ['Admin', 'seed-admin-01@warehouse.demo', 'DemoPass123!'],
        ['Manager', 'seed-manager-01@warehouse.demo', 'DemoPass123!'],
        ['Warehouse staff', 'seed-warehouse-01@warehouse.demo', 'DemoPass123!'],
        ['Procurement', 'seed-procurement-01@warehouse.demo', 'DemoPass123!'],
        ['Sales', 'seed-sales-01@warehouse.demo', 'DemoPass123!'],
        ['Logistics', 'seed-logistics-01@warehouse.demo', 'DemoPass123!'],
        ['Analyst', 'seed-analyst-01@warehouse.demo', 'DemoPass123!'],
    ], [1.5, 3.7, 1.3])
    para(doc, 'Important: the demonstration password is appropriate only for local academic use. It should be changed or replaced by a proper identity provider before any production deployment.')
    doc.add_page_break()

    heading(doc, '7 Demonstration Plan')
    para(doc, 'The following short sequence demonstrates both functional scope and database concepts in a coherent order.')
    table(doc, ['Step', 'Action to demonstrate', 'What to explain'], [
        ['1', 'Start MongoDB, backend, and frontend.', 'The application requires PostgreSQL for relational data and MongoDB for alerts, audit logs, metrics, and logs.'],
        ['2', 'Use the Demo login as picker and choose Admin.', 'The picker fills a real seeded account. Admin permissions come from the account role stored in PostgreSQL, not from the picker.'],
        ['3', 'Open Users and Reports.', 'Admin sees protected administration and reporting functions.'],
        ['4', 'Log out and sign in as Warehouse staff.', 'The sidebar and routes are filtered; restricted pages show access denied.'],
        ['5', 'Show Products, Batches, Inventory and Stock Movements.', 'These are linked SQL entities and use primary keys, foreign keys, indexes, and business rules.'],
        ['6', 'Show Purchase Orders, Sales Orders, and Shipments.', 'This shows the inbound and outbound supply chain lifecycle.'],
        ['7', 'Open MongoDB Compass and select warehouse_db.', 'Show alerts, audit_logs, and metrics collections, then run the NoSQL filters in this report.'],
        ['8', 'Open Reports.', 'Use the seeded operational records to discuss low stock, valuation, supplier, sales, and demand analysis.'],
    ], [0.45, 2.45, 3.6])
    heading(doc, 'Useful SQL queries for the demonstration', 2)
    table(doc, ['Question', 'SQL query'], [
        ['List products with their categories', 'SELECT p.sku, p.name, c.name AS category FROM "Product" p LEFT JOIN "ProductCategory" c ON c.id = p."categoryId" LIMIT 10;'],
        ['Show inventory by location', 'SELECT i."availableQty", l.code, pb."batchNo" FROM "Inventory" i JOIN "Location" l ON l.id = i."locationId" JOIN "ProductBatch" pb ON pb.id = i."productBatchId" LIMIT 10;'],
        ['Count orders by status', 'SELECT status, COUNT(*) FROM "SalesOrder" GROUP BY status;'],
        ['Review seed user roles', 'SELECT email, role FROM "User" WHERE email LIKE ''%@warehouse.demo'' ORDER BY role, email LIMIT 20;'],
        ['List shipment status', 'SELECT "shipmentNo", status, carrier, "trackingCode" FROM "Shipment" ORDER BY "shipmentNo" LIMIT 10;'],
    ], [2.0, 4.5])
    doc.add_page_break()

    heading(doc, '8 Local Setup and Operating Instructions')
    heading(doc, 'Start MongoDB', 2)
    para(doc, 'If MongoDB is installed locally and is not running as a service, start it in a separate PowerShell window using the configured data folder. Keep that terminal open while demonstrating the system.')
    table(doc, ['Component', 'Command'], [
        ['MongoDB', 'Start-Service MongoDB  (or run mongod with the configured dbpath if the service is unavailable)'],
        ['Backend', 'cd backend  then npm run start:dev'],
        ['Frontend', 'cd frontend  then npm run dev'],
        ['Realistic data seed', 'cd backend  then npm run seed:realistic'],
    ], [1.6, 4.9])
    heading(doc, 'Configuration checklist', 2)
    bullet(doc, 'backend/.env must contain the PostgreSQL connection URL, MongoDB URL, JWT access secret, and JWT refresh secret.')
    bullet(doc, 'frontend/.env must use VITE_BASE_URL=http://localhost:3000 for the local API.')
    bullet(doc, 'PostgreSQL migration must be applied before the application or seed script uses tables.')
    bullet(doc, 'MongoDB must listen on the same host and port stated in MONGODB_URL, normally mongodb://127.0.0.1:27017/warehouse_db.')
    bullet(doc, 'If port 3000 is already in use, stop the earlier backend process before starting another one.')
    heading(doc, 'Conclusion', 2)
    para(doc, 'The project implements a realistic warehouse and supply chain platform with a clear split between relational transactions and document-based operational data. The seeded dataset, role-specific accounts, protected routes, and report endpoints make it suitable for an academic demonstration of SQL, NoSQL, authentication, authorization, inventory operations, and supply chain workflows.')

    doc.core_properties.title = 'Warehouse and Supply Chain Management System Report'
    doc.core_properties.subject = 'Technical project report and demonstration guide'
    doc.core_properties.author = 'Project Team'
    doc.save(OUT)
    print(OUT)

if __name__ == '__main__':
    main()
