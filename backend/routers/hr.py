import random
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from database import db
from models.hr import EmployeeCreate, PayrollStatusUpdate
from seeds.initial_data import ATTENDANCE_TODAY

router = APIRouter(prefix="/api/hr", tags=["HR, Employees, Payroll & Attendance"])

@router.get("/employees")
def list_employees(dept: Optional[str] = Query(None, description="Department filter")):
    if dept and dept.lower() != "all":
        return db.query_all("SELECT * FROM employees WHERE dept = ? ORDER BY id ASC", (dept,))
    return db.query_all("SELECT * FROM employees ORDER BY id ASC")

@router.post("/employees", status_code=201)
def create_employee(emp: EmployeeCreate):
    count = db.query_one("SELECT COUNT(*) as count FROM employees")["count"]
    new_id = f"EMP-{count + 1:03d}"
    
    db.execute_write("""
        INSERT INTO employees (id, name, role, dept, type, salary, hire, status, phone, email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (new_id, emp.name, emp.role, emp.dept, emp.type, emp.salary, emp.hire, emp.status, emp.phone, emp.email))
    
    return db.query_one("SELECT * FROM employees WHERE id = ?", (new_id,))

@router.get("/payroll")
def list_payroll():
    return db.query_all("SELECT * FROM payroll ORDER BY id ASC")

@router.patch("/payroll/{payroll_id}/status")
def update_payroll_status(payroll_id: str, body: PayrollStatusUpdate):
    pr = db.query_one("SELECT * FROM payroll WHERE id = ?", (payroll_id,))
    if not pr:
        raise HTTPException(status_code=404, detail="Payroll record not found")
        
    db.execute_write("UPDATE payroll SET status = ? WHERE id = ?", (body.status.lower(), payroll_id))
    return db.query_one("SELECT * FROM payroll WHERE id = ?", (payroll_id,))

@router.get("/attendance")
def get_today_attendance():
    return ATTENDANCE_TODAY
