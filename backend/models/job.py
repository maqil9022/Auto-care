from typing import Optional
from pydantic import BaseModel, Field

class ServiceJobCreate(BaseModel):
    appt: Optional[str] = Field(None, description="Linked appointment ID e.g. APT-001")
    vehicle: str
    plate: str
    customer: str
    service: str
    tech: Optional[str] = None
    status: str = "queued"
    start: Optional[str] = None
    mileage: Optional[int] = 0
    labor: Optional[float] = 0.0
    parts: Optional[float] = 0.0
    total: Optional[float] = 0.0
    services_json: Optional[str] = None
    parts_json: Optional[str] = None

class ServiceJobStatusUpdate(BaseModel):
    status: Optional[str] = Field(None, description="queued, assigned, in_progress, on_hold, completed, cancelled")
    tech: Optional[str] = None
    mileage: Optional[int] = None
    labor: Optional[float] = None
    parts: Optional[float] = None
    total: Optional[float] = None
    services_json: Optional[str] = None
    parts_json: Optional[str] = None
