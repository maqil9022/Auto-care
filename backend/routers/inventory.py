from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from database import db
from models.inventory import PartCreate, StockAdjustment

router = APIRouter(prefix="/api/inventory", tags=["Inventory & Spare Parts"])

@router.get("")
def list_parts(
    category: Optional[str] = Query(None, description="Category filter"),
    low_stock: Optional[bool] = Query(False, description="Filter only low stock parts")
):
    sql = "SELECT * FROM parts WHERE 1=1"
    params = []
    
    if category and category.lower() != "all":
        sql += " AND category = ?"
        params.append(category)
        
    if low_stock:
        sql += " AND stock <= reorder"
        
    sql += " ORDER BY stock ASC, id ASC"
    return db.query_all(sql, tuple(params))

@router.get("/low-stock")
def get_low_stock():
    return db.query_all("SELECT * FROM parts WHERE stock <= reorder ORDER BY stock ASC")

@router.post("", status_code=201)
def create_part(part: PartCreate):
    existing = db.query_one("SELECT id FROM parts WHERE partNo = ?", (part.partNo,))
    if existing:
        raise HTTPException(status_code=400, detail=f"Part number {part.partNo} already exists")
        
    max_id_row = db.query_one("SELECT MAX(id) as max_id FROM parts")
    new_id = (max_id_row["max_id"] or 0) + 1
    
    db.execute_write("""
        INSERT INTO parts (id, partNo, name, category, stock, reorder, unit, cost, price, supplier)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (new_id, part.partNo, part.name, part.category, part.stock, part.reorder, part.unit, part.cost, part.price, part.supplier))
    
    return db.query_one("SELECT * FROM parts WHERE id = ?", (new_id,))

@router.post("/adjust")
def adjust_stock(adj: StockAdjustment):
    part = db.query_one("SELECT * FROM parts WHERE id = ?", (adj.part_id,))
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
        
    new_stock = max(0, part["stock"] + adj.quantity)
    db.execute_write("UPDATE parts SET stock = ? WHERE id = ?", (new_stock, adj.part_id))
    
    # If stock falls below reorder, trigger critical alert
    if new_stock <= part["reorder"]:
        db.execute_write("""
            INSERT INTO notifications (type, title, desc, time, unread, category)
            VALUES ('warning', 'Low Stock Threshold Reached', ?, 'Just now', 1, 'critical')
        """, (f"{part['name']} ({part['partNo']}) dropped to {new_stock} {part['unit']} (Reorder point: {part['reorder']}).",))
        
    return db.query_one("SELECT * FROM parts WHERE id = ?", (adj.part_id,))
