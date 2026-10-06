from typing import Optional
from pydantic import BaseModel, Field

class EmployeeCreate(BaseModel):
    name: str
    role: str
    dept: str
    type: str = "full_time"
    salary: float
    hire: str
    status: str = "active"
    phone: Optional[str] = None
    email: Optional[str] = None

class AttendanceRecord(BaseModel):
    emp: str
    name: str
    checkIn: Optional[str] = None
    checkOut: Optional[str] = None
    status: str = "present"
    ot: float = 0.0

class PayrollStatusUpdate(BaseModel):
    status: str = Field(..., description="draft, approved, paid, cancelled")
