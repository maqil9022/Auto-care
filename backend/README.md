# Auto Lab 360 — Backend API (FastAPI & Hybrid PostgreSQL)

FastAPI REST API powering the **Auto Lab 360** Vehicle Care & Workshop ERP platform.

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.10+ (Current: Python 3.14)
- Virtual environment is set up in `backend/.venv`

### 2. Run the Development Server
```powershell
cd "d:\Auto care\backend"
.\.venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Interactive Documentation
Once running, open your browser:
* **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Specification**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🗄️ Hybrid Database Architecture

The backend supports a **zero-configuration hybrid database**:

1. **Immediate Local Mode (Active by default)**:
   - Uses a local SQLite database (`backend/autocare.db`).
   - Automatically seeded with complete catalogs: 12 detailed automotive services, 8 appointments, 5 service jobs, 10 employees, 10 inventory parts, and invoices.
   - Works immediately out-of-the-box with zero setup or external servers.

2. **PostgreSQL Production Mode**:
   - Matches the enterprise schema defined in [`database/schema.sql`](file:///d:/Auto%20care/database/schema.sql).
   - To connect to a live PostgreSQL instance (local or Cloud like Supabase, Neon, AWS RDS):
     1. Open `backend/.env`
     2. Set `USE_POSTGRES=True`
     3. Provide your `DATABASE_URL=postgresql://user:password@host:5432/dbname`
     4. Restart the backend; the backend will automatically apply `database/schema.sql` on startup!

---

## 📡 API Endpoints Overview

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **System** | `GET` | `/` | Root API status & info |
| **System** | `GET` | `/api/health` | Health & database engine status |
| **Appointments** | `GET` | `/api/appointments` | List appointments (filter by status, search) |
| **Appointments** | `POST` | `/api/appointments` | Book new appointment (multi-job support) |
| **Appointments** | `PATCH` | `/api/appointments/{id}/status` | Update appointment status |
| **Services** | `GET` | `/api/services` | Service catalog in **Rs.** |
| **Services** | `GET` | `/api/services/categories` | Service categories |
| **Jobs** | `GET` | `/api/jobs` | Workshop job cards & technician assignments |
| **Jobs** | `POST` | `/api/jobs` | Create new job card |
| **Jobs** | `PATCH` | `/api/jobs/{id}/status` | Update job status, mileage & labor/parts |
| **Inventory** | `GET` | `/api/inventory` | Spare parts & inventory stock |
| **Inventory** | `GET` | `/api/inventory/low-stock` | Critical parts below reorder threshold |
| **Inventory** | `POST` | `/api/inventory/adjust` | Record stock adjustment (+/-) |
| **Billing** | `GET` | `/api/billing/invoices` | List invoices in **Rs.** |
| **Billing** | `POST` | `/api/billing/invoices/{id}/pay` | Settle payment (cash, card, POS) |
| **HR** | `GET` | `/api/hr/employees` | Employee roster & departments |
| **HR** | `GET` | `/api/hr/payroll` | Payroll runs & status |
| **HR** | `GET` | `/api/hr/attendance` | Today's employee check-in & OT |
| **Reports** | `GET` | `/api/reports/kpis` | Live workshop KPI summary |
| **Reports** | `GET` | `/api/reports/revenue` | 6-month revenue & job count history |
| **Notifications** | `GET` | `/api/notifications` | Real-time workshop alerts & telemetry |
| **Notifications** | `POST` | `/api/notifications/read-all` | Mark all notifications read |
