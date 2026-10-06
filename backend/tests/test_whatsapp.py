import os
import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.whatsapp_service import (
    sanitize_sri_lankan_phone,
    generate_wa_me_link,
    WhatsAppService,
    DEFAULT_TEMPLATES
)

class TestWhatsAppService(unittest.TestCase):
    def test_sri_lanka_phone_sanitization(self):
        # 10 digits starting with 07
        res1 = sanitize_sri_lankan_phone("0771234567")
        self.assertTrue(res1["is_valid"])
        self.assertTrue(res1["is_sri_lankan"])
        self.assertEqual(res1["clean"], "94771234567")
        self.assertEqual(res1["formatted"], "+94 77 123 4567")

        # 9 digits starting with 7
        res2 = sanitize_sri_lankan_phone("712345678")
        self.assertTrue(res2["is_valid"])
        self.assertTrue(res2["is_sri_lankan"])
        self.assertEqual(res2["clean"], "94712345678")

        # Formatted with spaces and dashes
        res3 = sanitize_sri_lankan_phone("077-345 6789")
        self.assertTrue(res3["is_valid"])
        self.assertEqual(res3["clean"], "94773456789")

        # Full international format +9477...
        res4 = sanitize_sri_lankan_phone("+94 77 888 9999")
        self.assertTrue(res4["is_valid"])
        self.assertEqual(res4["clean"], "94778889999")

        # Starting with 009477...
        res5 = sanitize_sri_lankan_phone("0094776543210")
        self.assertTrue(res5["is_valid"])
        self.assertEqual(res5["clean"], "94776543210")

        # Foreign international number
        res6 = sanitize_sri_lankan_phone("+966 50 123 4567")
        self.assertTrue(res6["is_valid"])
        self.assertFalse(res6["is_sri_lankan"])
        self.assertEqual(res6["clean"], "966501234567")

        # Invalid numbers
        res_empty = sanitize_sri_lankan_phone("")
        self.assertFalse(res_empty["is_valid"])

        res_short = sanitize_sri_lankan_phone("1234")
        self.assertFalse(res_short["is_valid"])

    def test_wa_me_link_generation(self):
        link = generate_wa_me_link("94771234567", "Hello from Auto Lab 360!")
        self.assertTrue(link.startswith("https://wa.me/94771234567?text="))
        self.assertIn("Auto%20Lab%20360", link)

    def test_template_rendering(self):
        svc = WhatsAppService()
        rendered = svc.render_template(
            "Hello {customer_name}, vehicle {vehicle_no} is ready! Amount: Rs. {total_amount}",
            {
                "customer_name": "Kasun Perera",
                "vehicle_no": "WP CA-1234",
                "total_amount": "4500.00"
            }
        )
        self.assertIn("Kasun Perera", rendered)
        self.assertIn("WP CA-1234", rendered)
        self.assertIn("Rs. 4500.00", rendered)

    def test_simulated_send_message(self):
        svc = WhatsAppService()
        svc.mode = "simulated"
        res = svc.send_message(
            recipient_phone="0771234567",
            template_id="booking_confirmed",
            variables={
                "customer_name": "Nimal Silva",
                "booking_date": "2026-10-01",
                "booking_time": "10:30 AM",
                "service_name": "Full Service",
                "vehicle_no": "CAB-5678"
            }
        )
        self.assertTrue(res["success"])
        self.assertEqual(res["sanitized"]["clean"], "94771234567")
        self.assertTrue(res["wa_link"].startswith("https://wa.me/94771234567?text="))
        self.assertIn("Nimal%20Silva", res["wa_link"])

if __name__ == "__main__":
    unittest.main()
