from typing import Optional
from pydantic import BaseModel, Field

class PartCreate(BaseModel):
    partNo: str
    name: str
    category: str
    stock: int
    reorder: int
    unit: str
    cost: float
    price: float
    supplier: str

class StockAdjustment(BaseModel):
    part_id: int
    quantity: int = Field(..., description="Quantity delta to add (positive) or deduct (negative)")
    reason: Optional[str] = "Manual inventory adjustment"
