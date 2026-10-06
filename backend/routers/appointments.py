import random
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from database import db
from models.appointment import AppointmentCreate, AppointmentStatusUpdate, AppointmentAssignTech

router = APIRouter(prefix="/api/appointments", tags=["Appointments & Customer Booking"])

@router.get("")
def get_appointments(
    status: Optional[str] = Query(None, description="Filter by status: pending, confirmed, in_progress, completed, cancelled"),
    search: Optional[str] = Query(None, description="Search by customer name, plate, or service")
):
    sql = "SELECT * FROM appointments WHERE 1=1"
    params = []
    
    if status and isinstance(status, str) and status.lower() != "all":
        sql += " AND status = ?"
        params.append(status.lower())
        
    if search and isinstance(search, str):
        pattern = f"%{search.strip()}%"
        sql += " AND (customer LIKE ? OR plate LIKE ? OR service LIKE ? OR id LIKE ? OR phone LIKE ?)"
        params.extend([pattern, pattern, pattern, pattern, pattern])
        
    sql += " ORDER BY date DESC, time ASC"
    return db.query_all(sql, tuple(params))

@router.get("/{appt_id}")
def get_appointment(appt_id: str):
    appt = db.query_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    if not appt:
        raise HTTPException(status_code=404, detail=f"Appointment {appt_id} not found")
    return appt

@router.post("", status_code=201)
def create_appointment(data: AppointmentCreate):
    new_id = data.id.strip() if data.id else f"APT-{random.randint(100, 999)}"
    
    # Check ID collision (rare)
    while db.query_one("SELECT id FROM appointments WHERE id = ?", (new_id,)):
        new_id = f"APT-{random.randint(100, 999)}"

    plate = data.plate or "Pending check-in"
    cost = data.cost if data.cost and data.cost > 0 else 50.0
    est = data.est if data.est and data.est > 0 else 60

    try:
        db.execute_write("""
            INSERT INTO appointments (id, customer, phone, email, vehicle, plate, service, date, time, status, tech, est, cost, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
        """, (new_id, data.customer.strip(), data.phone, data.email, data.vehicle.strip(), plate.strip(),
              data.service.strip(), data.date, data.time, data.tech, est, cost, data.notes))
    except Exception:
        # Fallback if phone/email columns don't exist in older table
        db.execute_write("""
            INSERT INTO appointments (id, customer, vehicle, plate, service, date, time, status, tech, est, cost, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
        """, (new_id, data.customer.strip(), data.vehicle.strip(), plate.strip(),
              data.service.strip(), data.date, data.time, data.tech, est, cost, data.notes))

    # Also log a workshop notification
    db.execute_write("""
        INSERT INTO notifications (type, title, desc, time, unread, category)
        VALUES ('success', 'New Booking Received', ?, 'Just now', 1, 'general')
    """, (f"Booking {new_id} from {data.customer} for {data.service} (Rs. {cost:.2f}).",))

    created = db.query_one("SELECT * FROM appointments WHERE id = ?", (new_id,))
    return created

@router.patch("/{appt_id}/status")
def update_appointment_status(appt_id: str, body: AppointmentStatusUpdate):
    existing = db.query_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    if not existing:
        raise HTTPException(status_code=404, detail=f"Appointment {appt_id} not found")
        
    new_status = body.status.lower()
    tech_assigned = body.tech if body.tech is not None else existing.get("tech")

    # Update appointment status & tech
    db.execute_write(
        "UPDATE appointments SET status = ?, tech = ? WHERE id = ?",
        (new_status, tech_assigned, appt_id)
    )

    # When appointment is confirmed, automatically generate a Service Job Card
    if new_status == "confirmed":
        job_exists = db.query_one("SELECT id FROM service_jobs WHERE appt = ?", (appt_id,))
        if not job_exists:
            new_job_id = f"JOB-2026-{random.randint(10000, 99999)}"
            cost = float(existing.get("cost") or 50.0)
            labor_val = round(cost * 0.6, 2)
            parts_val = round(cost * 0.4, 2)
            assigned_tech = tech_assigned or "Unassigned"
            job_status = "assigned" if tech_assigned and tech_assigned != "Unassigned" else "queued"
            start_val = f"{existing.get('date')} {existing.get('time')}"

            db.execute_write("""
                INSERT INTO service_jobs (id, appt, vehicle, plate, customer, service, tech, status, start, mileage, labor, parts, total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_job_id, appt_id, existing.get("vehicle"), existing.get("plate"), existing.get("customer"),
                  existing.get("service"), assigned_tech, job_status, start_val, 32000, labor_val, parts_val, cost))

            # Add workshop telemetry notification
            db.execute_write("""
                INSERT INTO notifications (type, title, desc, time, unread, category)
                VALUES ('success', 'Service Job Created', ?, 'Just now', 1, 'general')
            """, (f"Job card {new_job_id} opened for {existing.get('customer')} ({existing.get('vehicle')}) under {assigned_tech}.",))

        # Automated WhatsApp Notification Trigger: Booking Confirmed
        customer_phone = existing.get("phone")
        if customer_phone:
            try:
                from services.whatsapp_service import whatsapp_service
                whatsapp_service.send_message(
                    recipient_phone=customer_phone,
                    template_id="booking_confirmed",
                    variables={
                        "customer_name": existing.get("customer"),
                        "booking_date": existing.get("date"),
                        "booking_time": existing.get("time"),
                        "service_name": existing.get("service"),
                        "vehicle_no": f"{existing.get('vehicle')} ({existing.get('plate')})",
                        "total_amount": f"{existing.get('cost', 50):.2f}"
                    }
                )
            except Exception as e:
                pass

    return db.query_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))

@router.patch("/{appt_id}/assign")
def assign_technician(appt_id: str, body: AppointmentAssignTech):
    existing = db.query_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    if not existing:
        raise HTTPException(status_code=404, detail=f"Appointment {appt_id} not found")

    tech_name = body.tech.strip() if body.tech else None
    db.execute_write("UPDATE appointments SET tech = ? WHERE id = ?", (tech_name, appt_id))

    # Also update tech on linked service job if it exists
    if tech_name and tech_name != "Unassigned":
        db.execute_write(
            "UPDATE service_jobs SET tech = ?, status = CASE WHEN status = 'queued' THEN 'assigned' ELSE status END WHERE appt = ?",
            (tech_name, appt_id)
        )
    return db.query_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))

@router.delete("/{appt_id}")
def delete_appointment(appt_id: str):
    existing = db.query_one("SELECT * FROM appointments WHERE id = ?", (appt_id,))
    if not existing:
        raise HTTPException(status_code=404, detail=f"Appointment {appt_id} not found")
        
    db.execute_write("DELETE FROM appointments WHERE id = ?", (appt_id,))
    return {"message": f"Appointment {appt_id} deleted successfully"}
