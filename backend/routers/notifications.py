from fastapi import APIRouter
from pydantic import BaseModel, Field
from database import db

router = APIRouter(prefix="/api/notifications", tags=["Workshop Telemetry Notifications"])

class NotificationCreate(BaseModel):
    type: str = Field("info", description="warning, error, success, info")
    title: str
    desc: str
    category: str = "general"

@router.get("")
def list_notifications():
    rows = db.query_all("SELECT * FROM notifications ORDER BY id DESC")
    # Convert unread integer to boolean
    for r in rows:
        r["unread"] = bool(r["unread"])
    return rows

@router.post("/read-all")
def mark_all_read():
    db.execute_write("UPDATE notifications SET unread = 0")
    return {"message": "All notifications marked as read"}

@router.post("", status_code=201)
def create_notification(item: NotificationCreate):
    db.execute_write("""
        INSERT INTO notifications (type, title, desc, time, unread, category)
        VALUES (?, ?, ?, 'Just now', 1, ?)
    """, (item.type, item.title, item.desc, item.category))
    
    last = db.query_one("SELECT * FROM notifications ORDER BY id DESC LIMIT 1")
    if last:
        last["unread"] = bool(last["unread"])
    return last
