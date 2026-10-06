from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from database import db

router = APIRouter(prefix="/api/services", tags=["Services Catalog"])

class ServiceCreate(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., description="Service display name")
    category: str = Field(..., description="Category: Diagnostics, Brakes & Suspension, etc.")
    price: float = Field(..., description="Base price in Rs.")
    duration: int = Field(60, description="Duration in minutes")
    desc: Optional[str] = None
    is_active: Optional[int] = 1

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None
    desc: Optional[str] = None
    is_active: Optional[int] = None

@router.get("")
def list_services(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search query"),
    active_only: Optional[bool] = Query(False, description="Filter only active services")
):
    sql = "SELECT * FROM services WHERE 1=1"
    params = []
    
    if category and category.lower() != "all":
        sql += " AND category = ?"
        params.append(category)
        
    if search:
        search_term = f"%{search.strip().lower()}%"
        sql += " AND (LOWER(name) LIKE ? OR LOWER(desc) LIKE ? OR LOWER(category) LIKE ?)"
        params.extend([search_term, search_term, search_term])
        
    if active_only:
        sql += " AND (is_active IS NULL OR is_active = 1)"
        
    sql += " ORDER BY id ASC"
    return db.query_all(sql, tuple(params))

@router.get("/categories")
def list_categories():
    rows = db.query_all("SELECT DISTINCT category FROM services ORDER BY category ASC")
    return ["All"] + [r["category"] for r in rows if r["category"]]

@router.get("/{service_id}")
def get_service(service_id: int):
    row = db.query_one("SELECT * FROM services WHERE id = ?", (service_id,))
    if not row:
        raise HTTPException(status_code=404, detail=f"Service #{service_id} not found")
    return row

@router.post("", status_code=201)
def create_service(service: ServiceCreate):
    new_id = service.id
    if not new_id:
        max_id_row = db.query_one("SELECT MAX(id) as max_id FROM services")
        new_id = (max_id_row["max_id"] or 0) + 1
    else:
        existing = db.query_one("SELECT id FROM services WHERE id = ?", (new_id,))
        if existing:
            raise HTTPException(status_code=400, detail=f"Service ID #{new_id} already exists")
    
    db.execute_write("""
        INSERT INTO services (id, name, category, price, duration, desc, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        new_id,
        service.name.strip(),
        service.category.strip(),
        float(service.price),
        int(service.duration),
        service.desc.strip() if service.desc else "",
        1 if service.is_active is None or service.is_active else 0
    ))
    
    return db.query_one("SELECT * FROM services WHERE id = ?", (new_id,))

@router.put("/{service_id}")
def update_service(service_id: int, update: ServiceUpdate):
    existing = db.query_one("SELECT * FROM services WHERE id = ?", (service_id,))
    if not existing:
        raise HTTPException(status_code=404, detail=f"Service #{service_id} not found")
        
    fields = []
    params = []
    
    if update.name is not None:
        fields.append("name = ?")
        params.append(update.name.strip())
    if update.category is not None:
        fields.append("category = ?")
        params.append(update.category.strip())
    if update.price is not None:
        fields.append("price = ?")
        params.append(float(update.price))
    if update.duration is not None:
        fields.append("duration = ?")
        params.append(int(update.duration))
    if update.desc is not None:
        fields.append("desc = ?")
        params.append(update.desc.strip())
    if update.is_active is not None:
        fields.append("is_active = ?")
        params.append(1 if update.is_active else 0)
        
    if not fields:
        return existing
        
    params.append(service_id)
    sql = f"UPDATE services SET {', '.join(fields)} WHERE id = ?"
    db.execute_write(sql, tuple(params))
    return db.query_one("SELECT * FROM services WHERE id = ?", (service_id,))

@router.delete("/{service_id}")
def delete_service(service_id: int):
    existing = db.query_one("SELECT * FROM services WHERE id = ?", (service_id,))
    if not existing:
        raise HTTPException(status_code=404, detail=f"Service #{service_id} not found")
        
    db.execute_write("DELETE FROM services WHERE id = ?", (service_id,))
    return {"message": f"Service #{service_id} deleted successfully", "id": service_id}
