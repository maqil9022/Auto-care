import datetime
import random
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from database import db
from services.whatsapp_service import (
    whatsapp_service,
    sanitize_sri_lankan_phone,
    generate_wa_me_link,
    DEFAULT_TEMPLATES
)
from models.whatsapp import (
    WhatsAppSendRequest,
    WhatsAppSanitizeRequest,
    WhatsAppTemplateUpdate,
    WhatsAppConfigUpdate
)

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp Messaging & Notifications"])

def get_template_content(template_id: str) -> Optional[str]:
    """Fetches template from database or fallback to DEFAULT_TEMPLATES."""
    try:
        row = db.query_one("SELECT content FROM whatsapp_templates WHERE id = ?", (template_id,))
        if row and row.get("content"):
            return row["content"]
    except Exception:
        pass
    if template_id in DEFAULT_TEMPLATES:
        return DEFAULT_TEMPLATES[template_id]["content"]
    return None

@router.post("/sanitize-phone")
def sanitize_phone_endpoint(req: WhatsAppSanitizeRequest):
    """Sanitizes raw input into Sri Lankan standard format (947XXXXXXXX)."""
    return sanitize_sri_lankan_phone(req.phone)

@router.get("/templates")
def list_templates():
    """Returns all available message templates."""
    try:
        db_rows = db.query_all("SELECT * FROM whatsapp_templates")
        db_map = {r["id"]: r for r in db_rows}
    except Exception:
        db_map = {}

    result = []
    for tid, tinfo in DEFAULT_TEMPLATES.items():
        if tid in db_map:
            result.append({
                "id": tid,
                "name": db_map[tid]["name"],
                "content": db_map[tid]["content"],
                "updated_at": db_map[tid].get("updated_at")
            })
        else:
            result.append({
                "id": tid,
                "name": tinfo["name"],
                "content": tinfo["content"],
                "updated_at": None
            })
    return result

@router.put("/templates/{template_id}")
def update_template(template_id: str, body: WhatsAppTemplateUpdate):
    """Updates custom template body in database."""
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    name = body.name or DEFAULT_TEMPLATES.get(template_id, {}).get("name", template_id)
    
    # Check if exists
    existing = db.query_one("SELECT id FROM whatsapp_templates WHERE id = ?", (template_id,))
    if existing:
        db.execute_write(
            "UPDATE whatsapp_templates SET name = ?, content = ?, updated_at = ? WHERE id = ?",
            (name, body.content, now_str, template_id)
        )
    else:
        db.execute_write(
            "INSERT INTO whatsapp_templates (id, name, content, updated_at) VALUES (?, ?, ?, ?)",
            (template_id, name, body.content, now_str)
        )
    return {"message": "Template updated successfully", "id": template_id, "name": name, "content": body.content}

@router.post("/templates/reset")
def reset_templates():
    """Resets all templates back to default automotive copy."""
    try:
        db.execute_write("DELETE FROM whatsapp_templates")
    except Exception:
        pass
    return {"message": "All templates reset to defaults", "templates": list(DEFAULT_TEMPLATES.values())}

@router.post("/send")
def send_whatsapp(req: WhatsAppSendRequest):
    """
    Dispatches a WhatsApp message or prepares a direct wa.me link.
    Supports template_id or raw custom message text.
    """
    recipient = req.variables.get("customer_name", "Customer")
    
    # Resolve content: check if custom template or registered template
    template_content = None
    if req.template_id:
        template_content = get_template_content(req.template_id)
    
    body_text = None
    if req.message and req.message.strip():
        body_text = req.message.strip()
    elif template_content:
        body_text = template_content

    result = whatsapp_service.send_message(
        recipient_phone=req.phone,
        message=body_text,
        template_id=req.template_id if not req.message else None,
        variables=req.variables
    )

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_id = f"WALOG-{random.randint(100000, 999999)}"

    # Record log in database
    status = "sent" if result.get("success") else "failed"
    clean_p = result.get("sanitized", {}).get("clean", "")
    error_msg = result.get("error")
    rendered_body = result.get("body", body_text or "")
    wa_link = result.get("wa_link")
    mode = result.get("mode", whatsapp_service.mode)

    try:
        db.execute_write("""
            INSERT INTO whatsapp_logs (id, recipient, phone, clean_phone, event, message, status, mode, wa_link, created_at, error)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (log_id, recipient, req.phone, clean_p, req.template_id or "custom_message", rendered_body, status, mode, wa_link, now_str, error_msg))
    except Exception as e:
        pass

    # If linked to job or appointment, record note
    if result.get("success"):
        try:
            db.execute_write("""
                INSERT INTO notifications (type, title, desc, time, unread, category)
                VALUES ('info', 'WhatsApp Dispatched', ?, 'Just now', 1, 'general')
            """, (f"WhatsApp sent to {recipient} ({clean_p}) for {req.template_id or 'update'}.",))
        except Exception:
            pass

    return {
        **result,
        "log_id": log_id,
        "created_at": now_str,
        "recipient": recipient
    }

@router.get("/logs")
def list_logs(limit: int = Query(50, description="Max logs to return")):
    """Returns recent WhatsApp notification logs."""
    try:
        return db.query_all("SELECT * FROM whatsapp_logs ORDER BY created_at DESC LIMIT ?", (limit,))
    except Exception:
        return []

@router.get("/config")
def get_config():
    """Returns current WhatsApp service settings."""
    return {
        "mode": whatsapp_service.mode,
        "garage_name": whatsapp_service.garage_name,
        "garage_phone": whatsapp_service.garage_phone,
        "has_api_token": bool(whatsapp_service.api_token),
        "phone_number_id": whatsapp_service.phone_number_id,
        "available_modes": [
            {"id": "simulated", "label": "Simulated API (Testing & instant wa.me links)"},
            {"id": "manual", "label": "Manual Click-to-Chat (wa.me web links only)"},
            {"id": "cloud_api", "label": "Meta WhatsApp Cloud API (Automated delivery)"}
        ]
    }

@router.put("/config")
def update_config(update: WhatsAppConfigUpdate):
    """Updates WhatsApp runtime config."""
    if update.mode is not None:
        whatsapp_service.mode = update.mode.lower()
    if update.garage_name is not None:
        whatsapp_service.garage_name = update.garage_name
    if update.garage_phone is not None:
        whatsapp_service.garage_phone = update.garage_phone
    if update.api_token is not None:
        whatsapp_service.api_token = update.api_token
    if update.phone_number_id is not None:
        whatsapp_service.phone_number_id = update.phone_number_id

    return {
        "message": "Configuration updated successfully",
        "config": {
            "mode": whatsapp_service.mode,
            "garage_name": whatsapp_service.garage_name,
            "garage_phone": whatsapp_service.garage_phone,
            "has_api_token": bool(whatsapp_service.api_token),
            "phone_number_id": whatsapp_service.phone_number_id
        }
    }
