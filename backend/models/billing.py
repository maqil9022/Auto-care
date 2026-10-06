from typing import Optional
from pydantic import BaseModel, Field

class InvoiceCreate(BaseModel):
    customer: str
    job: Optional[str] = None
    date: str
    due: str
    subtotal: float
    discount: float = 0.0
    tax: float = 5.0
    total: float
    paid: float = 0.0
    status: str = "draft"
    method: Optional[str] = None

class PaymentRecord(BaseModel):
    amount: float = Field(..., description="Payment amount in Rs.")
    method: str = Field("cash", description="Payment method: cash, card, bank_transfer, pos")
