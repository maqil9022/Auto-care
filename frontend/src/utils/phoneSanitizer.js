/**
 * Sri Lanka Phone Number Sanitizer & WhatsApp Link Generator
 *
 * Rules:
 * - 07XXXXXXXX (10 digits) -> 947XXXXXXXX
 * - 7XXXXXXXX  (9 digits)  -> 947XXXXXXXX
 * - +947XXXXXXXX or 00947XXXXXXXX -> 947XXXXXXXX
 * - 947XXXXXXXX (11 digits) -> 947XXXXXXXX
 * - Other international numbers: digits only without '+' or '00'
 */

export function sanitizeSriLankanPhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      raw: '',
      clean: '',
      formatted: '',
      isValid: false,
      isSriLankan: false,
      error: 'Phone number is empty'
    };
  }

  const raw = rawPhone.trim();
  let digits = raw.replace(/[^\d]/g, '');

  if (digits.startsWith('0094')) {
    digits = digits.slice(2);
  }

  let isSl = false;
  let clean = digits;

  // 1. Starts with 07 and 10 digits total (standard Sri Lankan mobile: 070, 071, 072, 074, 075, 076, 077, 078)
  if (digits.length === 10 && digits.startsWith('07')) {
    clean = '94' + digits.slice(1);
    isSl = true;
  }
  // 2. Starts with 7 and 9 digits total
  else if (digits.length === 9 && digits.startsWith('7')) {
    clean = '94' + digits;
    isSl = true;
  }
  // 3. Starts with 947 and 11 digits total (international format)
  else if (digits.length === 11 && digits.startsWith('947')) {
    clean = digits;
    isSl = true;
  }
  // 4. Starts with 0 and 10 digits (landline)
  else if (digits.length === 10 && digits.startsWith('0')) {
    clean = '94' + digits.slice(1);
    isSl = true;
  }
  // 5. Starts with 94 and 11 digits
  else if (digits.length === 11 && digits.startsWith('94')) {
    clean = digits;
    isSl = true;
  } else {
    // Non-Sri Lankan international number
    clean = digits;
    isSl = false;
  }

  const isValid = clean.length >= 9 && clean.length <= 15;

  let formatted = raw;
  if (isSl && clean.length === 11) {
    // Format: +94 77 123 4567
    formatted = `+${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  } else if (clean.length > 5) {
    formatted = `+${clean}`;
  }

  return {
    raw,
    clean,
    formatted,
    isValid,
    isSriLankan: isSl,
    error: isValid ? null : 'Please provide a valid 9 or 10-digit mobile number (e.g. 077 123 4567)'
  };
}

export function generateWhatsAppLink(cleanPhone, messageText) {
  if (!cleanPhone) return '';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText || '')}`;
}

export const DEFAULT_WHATSAPP_TEMPLATES = {
  booking_confirmed: {
    id: 'booking_confirmed',
    name: 'Booking Confirmed',
    content: `🚗 *{garage_name} — Appointment Confirmed*

Dear {customer_name},
Your service appointment has been scheduled!

📅 *Date:* {booking_date}
⏰ *Time:* {booking_time}
🔧 *Service:* {service_name}
🚙 *Vehicle:* {vehicle_no}

Please arrive 10 minutes before your slot at our workshop.
📍 *Location:* No 787, Kandy Road, Meepitiya, Kegalle
📞 *Hotline:* {garage_phone}

Thank you for choosing {garage_name}! 🙏`
  },
  work_started: {
    id: 'work_started',
    name: 'Work In-Progress / Started',
    content: `⚙️ *{garage_name} — Service In Progress*

Dear {customer_name},
Service has commenced on your vehicle:

🚙 *Vehicle:* {vehicle_no}
🔧 *Service:* {service_name}
👨‍🔧 *Technician:* {assigned_tech}
⏱️ *Status:* Active in Service Bay

Our technicians are conducting standard multi-point inspections. We will notify you once your vehicle is ready for pickup.

📞 *Hotline:* {garage_phone}`
  },
  work_completed: {
    id: 'work_completed',
    name: 'Work Completed / Ready for Pickup',
    content: `✅ *{garage_name} — Vehicle Ready for Pickup!*

Dear {customer_name},
Your vehicle service is complete and quality-tested!

🚙 *Vehicle:* {vehicle_no}
🔧 *Service:* {service_name}
💰 *Total Amount:* Rs. {total_amount}
🏁 *Status:* Ready for Collection

Workshop Hours: Mon - Sat 08:00 AM - 06:00 PM.
Cash, Card, & Bank Transfer accepted at counter.

📍 *No 787, Kandy Road, Meepitiya, Kegalle*
📞 *Hotline:* {garage_phone}
Thank you for trusting {garage_name}! 🚘`
  },
  urgent_update: {
    id: 'urgent_update',
    name: 'Urgent Notice / Parts Approval',
    content: `⚠️ *{garage_name} — Workshop Notice*

Dear {customer_name},
We have an update regarding your vehicle {vehicle_no}:

{custom_note}

Please reply to this WhatsApp message or call our service desk at {garage_phone} to approve how we should proceed.

Thank you,
*{garage_name} Team*`
  },
  payment_receipt: {
    id: 'payment_receipt',
    name: 'Payment Receipt / Settled',
    content: `🧾 *{garage_name} — Payment Confirmation*

Dear {customer_name},
We have received payment of *Rs. {total_amount}* for Invoice #{invoice_no}.

🚙 *Vehicle:* {vehicle_no}
💳 *Method:* {payment_method}
✅ *Status:* Paid in full

Drive safely, and thank you for choosing {garage_name}!
📞 {garage_phone}`
  }
};

export function renderWhatsAppTemplate(templateStr, vars = {}) {
  const safeVars = {
    garage_name: 'Auto Lab 360',
    garage_phone: '071-881 8898 / 071-881 8854',
    garage_address: 'No 787, Kandy Road, Meepitiya, Kegalle',
    garage_email: 'autolab360lk@gmail.com',
    customer_name: 'Valued Customer',
    vehicle_no: 'Vehicle',
    service_name: 'General Service',
    booking_date: 'Today',
    booking_time: '09:30 AM',
    total_amount: '0.00',
    assigned_tech: 'Senior Technician',
    invoice_no: 'INV-2026-00041',
    payment_method: 'Card',
    custom_note: 'Inspection requires additional component renewal.',
    ...vars
  };

  let res = templateStr || '';
  Object.keys(safeVars).forEach(key => {
    res = res.split(`{${key}}`).join(String(safeVars[key]));
  });
  return res;
}
