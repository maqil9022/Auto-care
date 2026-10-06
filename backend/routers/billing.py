import random
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from database import db
from models.billing import InvoiceCreate, PaymentRecord

router = APIRouter(prefix="/api/billing", tags=["Billing & Invoices (in Rs.)"])

@router.get("/invoices")
def list_invoices(status: Optional[str] = Query(None, description="paid, partially_paid, overdue, draft")):
    if status and status.lower() != "all":
        return db.query_all("SELECT * FROM invoices WHERE status = ? ORDER BY date DESC", (status.lower(),))
    return db.query_all("SELECT * FROM invoices ORDER BY date DESC")

@router.get("/invoices/{invoice_id}")
def get_invoice(invoice_id: str):
    inv = db.query_one("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    if not inv:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
    return inv

@router.post("/invoices", status_code=201)
def create_invoice(data: InvoiceCreate):
    new_id = f"INV-{random.randint(100, 999)}"
    new_no = f"INV-2026-{random.randint(10000, 99999)}"
    
    db.execute_write("""
        INSERT INTO invoices (id, invoiceNo, customer, job, date, due, subtotal, discount, tax, total, paid, status, method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (new_id, new_no, data.customer, data.job, data.date, data.due,
          data.subtotal, data.discount, data.tax, data.total, data.paid, data.status, data.method))
    
    return db.query_one("SELECT * FROM invoices WHERE id = ?", (new_id,))

@router.post("/invoices/{invoice_id}/pay")
def pay_invoice(invoice_id: str, payment: PaymentRecord):
    inv = db.query_one("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    if not inv:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
        
    new_paid = inv["paid"] + payment.amount
    total = inv["total"]
    
    if new_paid >= total:
        new_status = "paid"
    elif new_paid > 0:
        new_status = "partially_paid"
    else:
        new_status = inv["status"]
        
    db.execute_write("""
        UPDATE invoices SET paid = ?, status = ?, method = ? WHERE id = ?
    """, (new_paid, new_status, payment.method, invoice_id))
    
    # Notify payment
    db.execute_write("""
        INSERT INTO notifications (type, title, desc, time, unread, category)
        VALUES ('success', 'Payment Settled', ?, 'Just now', 1, 'general')
    """, (f"Customer payment of Rs. {payment.amount:.2f} received for {inv['invoiceNo']} ({payment.method.upper()}).",))
    
    return db.query_one("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
