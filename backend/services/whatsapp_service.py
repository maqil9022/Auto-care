import os
import re
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from pathlib import Path
from config import settings

logger = logging.getLogger("autocare.whatsapp")

# Sri Lanka Phone Sanitizer
def sanitize_sri_lankan_phone(raw_phone: Optional[str]) -> Dict[str, Any]:
    """
    Sanitizes phone numbers with specialized rules for Sri Lanka:
    - 07XXXXXXXX (10 digits) -> 947XXXXXXXX
    - 7XXXXXXXX  (9 digits)  -> 947XXXXXXXX
    - +947XXXXXXXX or 00947XXXXXXXX -> 947XXXXXXXX
    - 947XXXXXXXX (11 digits) -> 947XXXXXXXX
    - Other international numbers: strips +, dashes, spaces, 00.
    """
    if not raw_phone:
        return {
            "raw": "",
            "clean": "",
            "formatted": "",
            "is_valid": False,
            "is_sri_lankan": False,
            "error": "Phone number is empty"
        }

    raw = str(raw_phone).strip()
    # Strip non-digit characters except leading '+'
    digits = re.sub(r"[^\d]", "", raw)

    # Check for Sri Lanka number patterns
    is_sl = False
    clean = digits

    # 1. Starts with 0094
    if digits.startswith("0094"):
        digits = digits[2:]

    # 2. Starts with 07 and 10 digits total (standard domestic mobile: 070, 071, 072, 074, 075, 076, 077, 078)
    if len(digits) == 10 and digits.startswith("07"):
        clean = "94" + digits[1:]
        is_sl = True
    # 3. Starts with 7 and 9 digits total
    elif len(digits) == 9 and digits.startswith("7"):
        clean = "94" + digits
        is_sl = True
    # 4. Starts with 947 and 11 digits total (international format)
    elif len(digits) == 11 and digits.startswith("947"):
        clean = digits
        is_sl = True
    # 5. Starts with 011, 081, etc. (landline 10 digits)
    elif len(digits) == 10 and digits.startswith("0"):
        clean = "94" + digits[1:]
        is_sl = True
    elif len(digits) == 11 and digits.startswith("94"):
        clean = digits
        is_sl = True
    else:
        # Other international number
        clean = digits
        is_sl = False

    # Valid if at least 9 digits
    is_valid = len(clean) >= 9 and len(clean) <= 15

    # Human-friendly formatting
    if is_sl and len(clean) == 11:
        # +94 7X XXX XXXX
        formatted = f"+{clean[:2]} {clean[2:4]} {clean[4:7]} {clean[7:]}"
    elif len(clean) > 4:
        formatted = f"+{clean}"
    else:
        formatted = raw

    return {
        "raw": raw,
        "clean": clean,
        "formatted": formatted,
        "is_valid": is_valid,
        "is_sri_lankan": is_sl,
        "error": None if is_valid else "Invalid phone number length"
    }

def generate_wa_me_link(clean_phone: str, message: str) -> str:
    """Generates direct https://wa.me/<phone>?text=<encoded_msg> link for zero-cost manual fallback."""
    from urllib.parse import quote
    return f"https://wa.me/{clean_phone}?text={quote(message)}"

# Default Templates
DEFAULT_TEMPLATES = {
    "booking_confirmed": {
        "id": "booking_confirmed",
        "name": "Booking Confirmed",
        "content": (
            "🚗 *{garage_name} — Appointment Confirmed*\n\n"
            "Dear {customer_name},\n"
            "Your service appointment has been scheduled!\n\n"
            "📅 *Date:* {booking_date}\n"
            "⏰ *Time:* {booking_time}\n"
            "🔧 *Service:* {service_name}\n"
            "🚙 *Vehicle:* {vehicle_no}\n\n"
            "Please arrive 10 minutes before your slot at our workshop.\n"
            "📍 *Location:* No 787, Kandy Road, Meepitiya, Kegalle\n"
            "📞 *Hotline:* {garage_phone}\n\n"
            "Thank you for choosing {garage_name}! 🙏"
        )
    },
    "work_started": {
        "id": "work_started",
        "name": "Work In-Progress / Started",
        "content": (
            "⚙️ *{garage_name} — Service In Progress*\n\n"
            "Dear {customer_name},\n"
            "Service has commenced on your vehicle:\n\n"
            "🚙 *Vehicle:* {vehicle_no}\n"
            "🔧 *Service:* {service_name}\n"
            "👨‍🔧 *Technician:* {assigned_tech}\n"
            "⏱️ *Status:* Active in Service Bay\n\n"
            "Our technicians are conducting standard multi-point inspections. We will notify you once your vehicle is ready for pickup.\n\n"
            "📞 *Hotline:* {garage_phone}"
        )
    },
    "work_completed": {
        "id": "work_completed",
        "name": "Work Completed / Ready for Pickup",
        "content": (
            "✅ *{garage_name} — Vehicle Ready for Pickup!*\n\n"
            "Dear {customer_name},\n"
            "Your vehicle service is complete and quality-tested!\n\n"
            "🚙 *Vehicle:* {vehicle_no}\n"
            "🔧 *Service:* {service_name}\n"
            "💰 *Total Amount:* Rs. {total_amount}\n"
            "🏁 *Status:* Ready for Collection\n\n"
            "Workshop Hours: Mon - Sat 08:00 AM - 06:00 PM.\n"
            "Cash, Card, & Bank Transfer accepted at counter.\n\n"
            "📍 *No 787, Kandy Road, Meepitiya, Kegalle*\n"
            "📞 *Hotline:* {garage_phone}\n"
            "Thank you for trusting {garage_name}! 🚘"
        )
    },
    "urgent_update": {
        "id": "urgent_update",
        "name": "Urgent Workshop Notice / Parts Approval",
        "content": (
            "⚠️ *{garage_name} — Workshop Notice*\n\n"
            "Dear {customer_name},\n"
            "We have an update regarding your vehicle {vehicle_no}:\n\n"
            "{custom_note}\n\n"
            "Please reply to this WhatsApp message or call our service desk at {garage_phone} to approve how we should proceed.\n\n"
            "Thank you,\n"
            "*{garage_name} Team*"
        )
    },
    "payment_receipt": {
        "id": "payment_receipt",
        "name": "Payment Receipt / Invoice Settled",
        "content": (
            "🧾 *{garage_name} — Payment Confirmation*\n\n"
            "Dear {customer_name},\n"
            "We have received payment of *Rs. {total_amount}* for Invoice #{invoice_no}.\n\n"
            "🚙 *Vehicle:* {vehicle_no}\n"
            "💳 *Method:* {payment_method}\n"
            "✅ *Status:* Paid in full\n\n"
            "Drive safely, and thank you for choosing {garage_name}!\n"
            "📞 {garage_phone}"
        )
    }
}

class WhatsAppService:
    def __init__(self):
        self.garage_name = os.getenv("WHATSAPP_GARAGE_NAME", "Auto Lab 360")
        self.garage_phone = os.getenv("WHATSAPP_GARAGE_PHONE", "071-881 8898 / 071-881 8854")
        self.garage_address = os.getenv("WHATSAPP_GARAGE_ADDRESS", "No 787, Kandy Road, Meepitiya, Kegalle")
        self.garage_email = os.getenv("WHATSAPP_GARAGE_EMAIL", "autolab360lk@gmail.com")
        # Delivery modes: 'manual', 'simulated', 'cloud_api'
        self.mode = os.getenv("WHATSAPP_MODE", "simulated").lower()
        self.api_token = os.getenv("WHATSAPP_API_TOKEN", "")
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")

    def render_template(self, template_str: str, variables: Dict[str, Any]) -> str:
        """Interpolates dynamic template tags like {customer_name}, {vehicle_no}, etc."""
        safe_vars = {
            "garage_name": self.garage_name,
            "garage_phone": self.garage_phone,
            "garage_address": self.garage_address,
            "garage_email": self.garage_email,
            "customer_name": "Valued Customer",
            "vehicle_no": "Vehicle",
            "service_name": "General Service",
            "booking_date": "Today",
            "booking_time": "09:00 AM",
            "total_amount": "0.00",
            "assigned_tech": "Workshop Tech",
            "invoice_no": "INV-001",
            "payment_method": "Cash",
            "custom_note": "Inspection update required.",
        }
        safe_vars.update({k: str(v) for k, v in variables.items() if v is not None})
        
        # Replace {tag} safely without failing on extra braces
        rendered = template_str
        for tag, val in safe_vars.items():
            rendered = rendered.replace(f"{{{tag}}}", str(val))
        return rendered

    def send_message(
        self,
        recipient_phone: str,
        message: Optional[str] = None,
        template_id: Optional[str] = None,
        variables: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Sends message via configured strategy (Cloud API or Simulated),
        and always returns wa_link for manual fallback.
        """
        sanitized = sanitize_sri_lankan_phone(recipient_phone)
        if not sanitized["is_valid"]:
            return {
                "success": False,
                "error": f"Invalid recipient phone number: '{recipient_phone}'",
                "sanitized": sanitized,
                "mode": self.mode,
                "wa_link": None
            }

        # Resolve message content
        vars_dict = variables or {}
        if template_id and template_id in DEFAULT_TEMPLATES:
            body = self.render_template(DEFAULT_TEMPLATES[template_id]["content"], vars_dict)
        elif message:
            body = self.render_template(message, vars_dict)
        else:
            body = f"Hello from {self.garage_name}."

        clean_number = sanitized["clean"]
        wa_link = generate_wa_me_link(clean_number, body)

        # 1. Cloud API Delivery (if credentials provided and mode is cloud_api)
        if self.mode == "cloud_api" and self.api_token and self.phone_number_id:
            try:
                url = f"https://graph.facebook.com/v19.0/{self.phone_number_id}/messages"
                headers = {
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json"
                }
                payload = json.dumps({
                    "messaging_product": "whatsapp",
                    "to": clean_number,
                    "type": "text",
                    "text": {"preview_url": False, "body": body}
                }).encode("utf-8")

                req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    res_data = json.loads(resp.read().decode())
                    logger.info(f"[WhatsApp] Cloud API sent to {clean_number}: {res_data}")
                    return {
                        "success": True,
                        "message_id": res_data.get("messages", [{}])[0].get("id", "wa_api_ok"),
                        "mode": "cloud_api",
                        "sanitized": sanitized,
                        "body": body,
                        "wa_link": wa_link
                    }
            except Exception as e:
                logger.error(f"[WhatsApp] Cloud API delivery failed ({e}). Falling back to manual wa.me link.")
                return {
                    "success": False,
                    "error": f"WhatsApp Cloud API Error: {str(e)}",
                    "mode": "fallback_manual",
                    "sanitized": sanitized,
                    "body": body,
                    "wa_link": wa_link
                }

        # 2. Simulated / Zero-cost Mock Delivery
        logger.info(f"[WhatsApp] ({self.mode.upper()}) Message prepared for {clean_number} ({sanitized['formatted']})")
        return {
            "success": True,
            "message_id": f"sim_wa_{abs(hash(clean_number + body)) % 1000000}",
            "mode": self.mode,
            "sanitized": sanitized,
            "body": body,
            "wa_link": wa_link,
            "status_text": "Dispatched via simulated queue (WhatsApp Web link available)"
        }

whatsapp_service = WhatsAppService()
