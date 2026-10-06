import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

base = "http://127.0.0.1:8000/api/whatsapp"

def main():
    print("Testing WhatsApp API Endpoints...")
    
    # 1. Fetch templates
    req = urllib.request.urlopen(f"{base}/templates")
    templates = json.loads(req.read().decode())
    print(f"Templates fetched: {len(templates)}")
    for t in templates:
        print(f"  [{t['id']}] {t['name']} (trigger: {t.get('trigger_event')})")
        
    # 2. Sanitize phone
    test_phones = ["0771234567", "712345678", "+94 78 999 8888", "0094761112233"]
    print("\nTesting Sri Lankan Phone Number Sanitizer:")
    for p in test_phones:
        req_data = json.dumps({"phone": p}).encode()
        req = urllib.request.Request(f"{base}/sanitize-phone", data=req_data, headers={"Content-Type": "application/json"})
        res = json.loads(urllib.request.urlopen(req).read().decode())
        print(f"  Input: {p:18} -> Standardized: {res['clean']} | Formatted: {res['formatted']} | Valid: {res['is_valid']}")

    # 3. Test sending a message
    print("\nTesting Message Dispatch (Simulated + wa.me generation):")
    payload = {
        "phone": "077 123 4567",
        "template_id": "booking_confirmed",
        "variables": {
            "customer_name": "Nimal Silva",
            "vehicle_no": "WP CAS-5566",
            "service_name": "Full Synthetic Lubrication & Filter Renewal",
            "booking_date": "2026-10-05",
            "booking_time": "09:30 AM",
            "total_amount": "12,500.00"
        }
    }
    req_data = json.dumps(payload).encode()
    req = urllib.request.Request(f"{base}/send", data=req_data, headers={"Content-Type": "application/json"})
    send_res = json.loads(urllib.request.urlopen(req).read().decode())
    print(f"  Success: {send_res.get('success')}")
    print(f"  Mode: {send_res.get('mode')}")
    print(f"  Clean Phone: {send_res.get('clean_phone')}")
    print(f"  wa.me link: {send_res.get('wa_link')[:65]}...")
    print(f"  Message preview:\n    {send_res.get('body', '')[:140]}...")

    # 4. Check logs
    req = urllib.request.urlopen(f"{base}/logs?limit=5")
    logs = json.loads(req.read().decode())
    print(f"\nWhatsApp Database Logs count: {len(logs)}")
    if logs:
        l = logs[0]
        print(f"  Latest log -> ID: {l.get('id')}, Phone: {l.get('phone')}, Event: {l.get('event')}, Status: {l.get('status')}")

if __name__ == "__main__":
    main()
