from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class WhatsAppSendRequest(BaseModel):
    phone: str = Field(..., description="Customer phone number (e.g., 0771234567, +94771234567)")
    template_id: Optional[str] = Field(None, description="Template identifier: booking_confirmed, work_started, work_completed, urgent_update, payment_receipt")
    message: Optional[str] = Field(None, description="Custom message text if not using standard template")
    variables: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Dynamic variables: customer_name, vehicle_no, etc.")
    job_id: Optional[str] = None
    appt_id: Optional[str] = None

class WhatsAppSanitizeRequest(BaseModel):
    phone: str = Field(..., description="Raw phone number to sanitize")

class WhatsAppTemplateUpdate(BaseModel):
    name: Optional[str] = None
    content: str = Field(..., description="Template body with tags like {customer_name}, {vehicle_no}")

class WhatsAppConfigUpdate(BaseModel):
    mode: Optional[str] = Field(None, description="simulated, manual, cloud_api")
    garage_name: Optional[str] = None
    garage_phone: Optional[str] = None
    api_token: Optional[str] = None
    phone_number_id: Optional[str] = None
