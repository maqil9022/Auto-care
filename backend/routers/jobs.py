import random
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from database import db
from models.job import ServiceJobCreate, ServiceJobStatusUpdate

router = APIRouter(prefix="/api/jobs", tags=["Workshop Service Jobs"])

@router.get("")
def list_jobs(
    status: Optional[str] = Query(None, description="queued, assigned, in_progress, on_hold, completed, cancelled"),
    search: Optional[str] = Query(None, description="Search vehicle, plate, or customer")
):
    sql = "SELECT * FROM service_jobs WHERE 1=1"
    params = []
    
    if status and isinstance(status, str) and status.lower() != "all":
        sql += " AND status = ?"
        params.append(status.lower())
        
    if search and isinstance(search, str):
        pattern = f"%{search.strip()}%"
        sql += " AND (customer LIKE ? OR plate LIKE ? OR vehicle LIKE ? OR service LIKE ? OR id LIKE ? OR tech LIKE ?)"
        params.extend([pattern, pattern, pattern, pattern, pattern, pattern])
        
    sql += " ORDER BY id DESC"
    return db.query_all(sql, tuple(params))

@router.post("", status_code=201)
def create_job(job: ServiceJobCreate):
    new_id = f"JOB-2026-{random.randint(10000, 99999)}"
    total = (job.labor or 0.0) + (job.parts or 0.0)
    
    is_unassigned = not job.tech or job.tech.strip().lower() in ("unassigned", "none", "")
    target_status = (job.status or "queued").lower()
    
    # Logic rule: unassigned cannot be in_progress or assigned
    if is_unassigned:
        if target_status in ("assigned", "in_progress"):
            target_status = "queued"
    else:
        if target_status == "queued":
            target_status = "assigned"

    db.execute_write("""
        INSERT INTO service_jobs (id, appt, vehicle, plate, customer, service, tech, status, start, mileage, labor, parts, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (new_id, job.appt, job.vehicle, job.plate, job.customer, job.service,
          job.tech if not is_unassigned else "Unassigned", target_status, job.start, job.mileage, job.labor, job.parts, total))
    
    return db.query_one("SELECT * FROM service_jobs WHERE id = ?", (new_id,))

@router.patch("/{job_id}/status")
def update_job_status(job_id: str, update: ServiceJobStatusUpdate):
    existing = db.query_one("SELECT * FROM service_jobs WHERE id = ?", (job_id,))
    if not existing:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        
    # Determine target technician and whether it is unassigned
    if update.tech is not None:
        target_tech = update.tech.strip()
    else:
        target_tech = existing.get("tech") or "Unassigned"

    is_unassigned = not target_tech or target_tech.lower() in ("unassigned", "none", "")

    # Determine explicit requested status vs existing status
    explicit_status = update.status.strip().lower() if update.status else None
    target_status = explicit_status or existing.get("status", "queued").lower()

    # LOGIC RULES:
    # 0. Cannot unassign technician from an already completed job
    if existing.get("status") == "completed" and update.tech is not None and is_unassigned:
        raise HTTPException(
            status_code=400,
            detail="Cannot unassign technician from a completed job card."
        )

    # 1. If explicitly trying to start service or set in_progress while unassigned -> reject
    if explicit_status == "in_progress" and is_unassigned:
        raise HTTPException(
            status_code=400,
            detail="Cannot start service without an assigned technician. Please assign a technician first."
        )

    # 2. If explicitly trying to complete service while unassigned -> reject
    if explicit_status == "completed" and is_unassigned:
        raise HTTPException(
            status_code=400,
            detail="Cannot complete service without an assigned technician."
        )

    # 3. If unassigning technician, active progress or assignment halts and reverts to queued
    if is_unassigned:
        if target_status in ("assigned", "in_progress"):
            target_status = "queued"
    else:
        # If assigning a technician to a queued job without explicit status, promote to assigned
        if target_status == "queued" and not explicit_status:
            target_status = "assigned"

    # Build dynamic UPDATE query
    fields = ["status = ?"]
    params = [target_status]

    if update.tech is not None:
        fields.append("tech = ?")
        params.append("Unassigned" if is_unassigned else target_tech)
    if update.labor is not None:
        fields.append("labor = ?")
        params.append(update.labor)
    if update.parts is not None:
        fields.append("parts = ?")
        params.append(update.parts)
    if update.total is not None:
        fields.append("total = ?")
        params.append(update.total)
    if update.mileage is not None:
        fields.append("mileage = ?")
        params.append(update.mileage)
    if update.services_json is not None:
        fields.append("services_json = ?")
        params.append(update.services_json)
    if update.parts_json is not None:
        fields.append("parts_json = ?")
        params.append(update.parts_json)

    sql = f"UPDATE service_jobs SET {', '.join(fields)} WHERE id = ?"
    params.append(job_id)

    db.execute_write(sql, tuple(params))
    
    # Resolve customer phone for WhatsApp notifications
    phone = existing.get("phone")
    if not phone and existing.get("appt"):
        appt_row = db.query_one("SELECT phone FROM appointments WHERE id = ?", (existing["appt"],))
        if appt_row and appt_row.get("phone"):
            phone = appt_row["phone"]
    if not phone and existing.get("customer"):
        cust_row = db.query_one("SELECT phone FROM appointments WHERE customer = ? AND phone IS NOT NULL ORDER BY date DESC", (existing["customer"],))
        if cust_row and cust_row.get("phone"):
            phone = cust_row["phone"]

    # 1. Trigger WhatsApp: Work In-Progress / Started
    if target_status == "in_progress" and existing.get("status") != "in_progress":
        if phone:
            try:
                from services.whatsapp_service import whatsapp_service
                whatsapp_service.send_message(
                    recipient_phone=phone,
                    template_id="work_started",
                    variables={
                        "customer_name": existing.get("customer"),
                        "vehicle_no": f"{existing.get('vehicle')} ({existing.get('plate')})",
                        "service_name": existing.get("service"),
                        "assigned_tech": target_tech if not is_unassigned else "Workshop Technician"
                    }
                )
            except Exception:
                pass

    # 2. Trigger WhatsApp: Work Completed / Ready for Pickup
    if target_status == "completed" and existing.get("status") != "completed":
        final_tech = target_tech if not is_unassigned else "Technician"
        db.execute_write("""
            INSERT INTO notifications (type, title, desc, time, unread, category)
            VALUES ('info', 'Job Card Completed', ?, 'Just now', 1, 'general')
        """, (f"{job_id} on plate {existing['plate']} completed by {final_tech}.",))
        
        if phone:
            try:
                from services.whatsapp_service import whatsapp_service
                final_total = update.total if update.total is not None else existing.get("total", 0.0)
                whatsapp_service.send_message(
                    recipient_phone=phone,
                    template_id="work_completed",
                    variables={
                        "customer_name": existing.get("customer"),
                        "vehicle_no": f"{existing.get('vehicle')} ({existing.get('plate')})",
                        "service_name": existing.get("service"),
                        "total_amount": f"{float(final_total):.2f}"
                    }
                )
            except Exception:
                pass
        
    return db.query_one("SELECT * FROM service_jobs WHERE id = ?", (job_id,))
