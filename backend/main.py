from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import db
from routers import (
    appointments,
    services,
    jobs,
    inventory,
    billing,
    hr,
    reports,
    notifications,
    whatsapp
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure database initialized
    status = db.get_status()
    print(f"[API] Auto Lab 360 API running on {settings.HOST}:{settings.PORT}")
    print(f"[DB] Database Engine: {status.get('engine')} ({status.get('status')})")
    print(f"[DOCS] Swagger Docs available at: http://localhost:{settings.PORT}/docs")
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="Auto Lab 360 — Vehicle Care & Workshop ERP API",
    description="""
    High-performance backend API for Auto Lab 360 Automotive Care Management System.
    
    ### Features:
    * **Appointments & Customer Booking**: Multi-job selection, auto reference generator, status transitions.
    * **Services Catalog**: 12 detailed automotive service jobs categorized with pricing in **Rs.**
    * **Workshop Job Cards**: Technician job assignment, labor & parts tracking, mileage records.
    * **Inventory & Spare Parts**: Stock level alerts, reorder thresholds, inventory adjustments.
    * **Billing & Invoices**: Invoicing in Rs., payment settlements, status tracking.
    * **HR & Payroll**: Employee rosters, attendance clock-ins, payroll runs.
    * **Analytics & Reports**: Real-time KPI summaries, monthly revenue history.
    * **Workshop Telemetry**: Real-time alerts for stock levels, online bookings, and job completion.
    * **Hybrid Database**: Connected to PostgreSQL or local SQLite fallback with zero configuration required.
    """,
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows Vite dev server & production client
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(appointments.router)
app.include_router(services.router)
app.include_router(jobs.router)
app.include_router(inventory.router)
app.include_router(billing.router)
app.include_router(hr.router)
app.include_router(reports.router)
app.include_router(notifications.router)
app.include_router(whatsapp.router)

@app.get("/", tags=["System"])
def root():
    return {
        "system": "Auto Lab 360 API",
        "version": "1.0.0",
        "status": "operational",
        "currency": "Rs.",
        "documentation": "/docs",
        "database": db.get_status()
    }

@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "database": db.get_status()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
