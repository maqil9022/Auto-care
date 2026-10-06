from typing import Optional, List
from pydantic import BaseModel, Field

class AppointmentCreate(BaseModel):
    id: Optional[str] = Field(None, description="Optional custom reference e.g. APT-2026-1234")
    customer: str = Field(..., description="Customer full name")
    phone: Optional[str] = Field(None, description="Customer phone number")
    email: Optional[str] = None
    vehicle: str = Field(..., description="Vehicle make and model")
    plate: Optional[str] = Field("NEW-0000", description="License plate number")
    service: str = Field(..., description="Selected service name(s)")
    service_ids: Optional[List[int]] = Field(default_factory=list, description="List of service IDs selected")
    date: str = Field(..., description="Appointment date YYYY-MM-DD")
    time: str = Field(..., description="Time slot e.g. 09:30 AM")
    tech: Optional[str] = Field(None, description="Assigned technician name")
    est: Optional[int] = Field(60, description="Estimated duration in minutes")
    cost: Optional[float] = Field(0.0, description="Estimated total cost in Rs.")
    notes: Optional[str] = Field(None, description="Customer complaints or notes")

class AppointmentStatusUpdate(BaseModel):
    status: str = Field(..., description="Status: pending, confirmed, in_progress, completed, cancelled")
    tech: Optional[str] = Field(None, description="Assigned technician name")

class AppointmentAssignTech(BaseModel):
    tech: str = Field(..., description="Technician name to assign")

class AppointmentResponse(BaseModel):
    id: str
    customer: str
    vehicle: str
    plate: str
    service: str
    date: str
    time: str
    status: str
    tech: Optional[str] = None
    est: int
    cost: float
    notes: Optional[str] = None
