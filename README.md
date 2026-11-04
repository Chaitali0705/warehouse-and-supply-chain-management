# Warehouse and Supply Chain Management System

Full-stack warehouse software for products, batches, inventory, suppliers, purchase orders, sales orders, shipments, reports, alerts, and role-based users.

It uses **PostgreSQL** for relational business transactions and **MongoDB** for alerts, audit logs, metrics, and application logs.

## Features

- Warehouse, storage-location, product, category, barcode, and batch management
- Inventory receiving, dispatching, transfers, reservation, release, and adjustments
- Supplier, purchase order, customer, sales order, shipment, and tracking workflows
- JWT authentication with bcrypt password hashes and role-based access control
- Operational reporting for stock, expiry, valuation, warehouse use, supplier, and demand data
- Offline AI-assisted supply-chain insights with explainable risk scores
- Realistic, non-destructive seed data for a complete demonstration

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Material UI, Zustand, Axios |
| Backend | NestJS, TypeScript, Prisma ORM |
| SQL | PostgreSQL / Supabase |
| NoSQL | MongoDB Community Server |
| Security | JWT, Passport, bcrypt |

## Repository Layout

```text
backend/       NestJS API, Prisma schema, scripts, and modules
frontend/      React and Vite application
docs/          Architecture diagrams, ERD, and project report
iac/           Infrastructure-as-code files
```

## Run Locally Without Docker

### 1. Backend setup

```powershell
cd backend
npm install
```

Create `backend/.env`. Do not commit it.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
POSTGRES_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
MONGODB_URL=mongodb://127.0.0.1:27017/warehouse_db
JWT_ACCESS_SECRET=replace_with_a_long_random_value
JWT_REFRESH_SECRET=replace_with_a_different_long_random_value
JWT_ACCESS_TTL=900s
JWT_REFRESH_TTL=7d
PORT=3000
```

Generate Prisma and migrate the SQL database:

```powershell
npx prisma generate
npx prisma migrate dev
```

### 2. Start MongoDB

If MongoDB is installed as a Windows service:

```powershell
Start-Service MongoDB
Get-Service MongoDB
```

### 3. Seed the demonstration data

```powershell
cd backend
npm run seed:realistic
```

This safe command creates or verifies 60 records in each core operational SQL dataset and 60 MongoDB alerts, audit logs, and metrics. It does not delete existing records.

### 4. Start backend and frontend

```powershell
# Terminal 1
cd backend
npm run start:dev

# Terminal 2
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_BASE_URL=http://localhost:3000
```

Then start the UI:

```powershell
npm run dev
```

Open `http://localhost:5173`.

## Demo Roles

The **Demo login as** picker fills a seeded account. It does not grant permissions itself: the backend verifies the password and reads the account role from PostgreSQL.

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `seed-admin-01@warehouse.demo` | `DemoPass123!` |
| Manager | `seed-manager-01@warehouse.demo` | `DemoPass123!` |
| Warehouse staff | `seed-warehouse-01@warehouse.demo` | `DemoPass123!` |
| Procurement | `seed-procurement-01@warehouse.demo` | `DemoPass123!` |
| Sales | `seed-sales-01@warehouse.demo` | `DemoPass123!` |
| Logistics | `seed-logistics-01@warehouse.demo` | `DemoPass123!` |
| Analyst | `seed-analyst-01@warehouse.demo` | `DemoPass123!` |

Demo credentials are for local academic demonstration only.

## AI Supply Chain Insights

Open **Reports → AI Insights** after signing in. It is an offline, explainable decision-support feature, with no external API key required. It reads live PostgreSQL data and ranks recommendations for:

- Out-of-stock or below-minimum-stock products
- Batches expiring within 30 days
- Open purchase orders that have missed their expected arrival date
- Products whose available quantity is below the latest demand forecast

Each recommendation has a severity, a risk score, an explanation, and an action. The protected endpoint is:

```text
GET /reports/ai-insights
```

## Database Demonstration

### PostgreSQL

```sql
SELECT email, role, active
FROM "User"
WHERE email LIKE '%@warehouse.demo'
ORDER BY role, email;
```

```sql
SELECT p.sku, p.name, c.name AS category
FROM "Product" p
LEFT JOIN "ProductCategory" c ON c.id = p."categoryId"
WHERE p.sku LIKE 'SEED-%'
LIMIT 10;
```

```sql
SELECT status, COUNT(*) AS order_count
FROM "SalesOrder"
GROUP BY status;
```

### MongoDB Compass

Connect to `mongodb://127.0.0.1:27017`, open `warehouse_db`, then inspect `alerts`, `audit_logs`, and `metrics`.

Example filters:

```json
{ "severity": "CRITICAL" }
```

```json
{ "isRead": false }
```

## Useful Commands

```powershell
cd backend
npx tsc --noEmit
npm run start:dev
npm run seed:realistic

cd ../frontend
npm run dev
```

## Documentation

- [Project Report](docs/Warehouse_and_Supply_Chain_Management_System_Report.docx)
- [Architecture Diagram](docs/diagrams/modular-monolith-architecture.png)
- [Database ERD](docs/diagrams/database-erd.png)

## Security

Never commit `.env`, database URLs, JWT secrets, or production passwords. Change all demo credentials before deploying an application.

## License

Educational use.
