import { useState, useEffect } from 'react';
import { Printer, Calendar, Clock, Car, User, Wrench, ShieldCheck, X, Check, FileText, Phone, AlertTriangle, AlertCircle, MessageSquare } from 'lucide-react';
import { SERVICES_CATALOG } from '../data/mockData';
import { useToast } from '../context/ToastContext';

export default function BookingDetailsModal({ booking, onClose, onConfirm, onAssignTech, onOpenWhatsApp }) {
  const toast = useToast();
  const [selectedTech, setSelectedTech] = useState(booking?.tech || '');
  const [techSaved, setTechSaved] = useState(false);
  const [attemptedConfirm, setAttemptedConfirm] = useState(false);

  useEffect(() => {
    if (booking) {
      setSelectedTech(booking.tech || '');
      setTechSaved(false);
      setAttemptedConfirm(false);
    }
  }, [booking?.id, booking?.tech]);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const bookingId = booking.id || booking.reference || 'APT-000';
  const customerName = booking.customer || booking.customerName || 'Valued Customer';
  const customerPhone = booking.phone || '071-881 8898';
  const customerEmail = booking.email || null;
  const vehicleName = booking.vehicle || 'Customer Vehicle';
  const plateNumber = booking.plate || 'Pending check-in';
  const bookingDate = booking.date || '2026-09-28';
  const bookingTime = booking.time || '09:30 AM';
  const bookingStatus = (booking.status || 'pending').toLowerCase();
  const assignedTech = selectedTech || booking.tech || 'Unassigned (Workshop Queue)';
  const totalCost = booking.cost !== undefined ? booking.cost : (booking.total !== undefined ? booking.total : 0);
  const totalEst = booking.est || (Array.isArray(booking.services) ? booking.services.reduce((a, b) => a + (b.duration || 0), 0) : 60);

  const isTechAssigned = !!selectedTech && selectedTech.trim() !== '' && !selectedTech.toLowerCase().includes('unassigned');

  const handleTechSelect = (newTech) => {
    setSelectedTech(newTech);
    setTechSaved(true);
    setAttemptedConfirm(false);
    if (onAssignTech) {
      onAssignTech(bookingId, newTech);
    }
    setTimeout(() => setTechSaved(false), 2500);
  };

  const handleConfirmClick = () => {
    setAttemptedConfirm(true);
    if (!isTechAssigned) {
      toast.warning(
        'Technician Assignment Required',
        'You cannot confirm this appointment without assigning a technician to this time slot.'
      );
      return;
    }
    if (onConfirm) {
      onConfirm(bookingId, selectedTech);
      onClose();
    }
  };

  // Normalize services list
  let serviceList = [];
  if (Array.isArray(booking.services) && booking.services.length > 0) {
    serviceList = booking.services.map(s => ({
      name: s.name,
      duration: s.duration || 60,
      price: s.price || 0,
      category: s.category || 'Workshop Service'
    }));
  } else if (typeof booking.service === 'string' && booking.service.trim().length > 0) {
    serviceList = booking.service.split(', ').map(name => {
      const catalogItem = SERVICES_CATALOG.find(s => s.name.toLowerCase() === name.toLowerCase());
      return {
        name,
        duration: catalogItem ? catalogItem.duration : Math.round(totalEst / Math.max(1, booking.service.split(', ').length)),
        price: catalogItem ? catalogItem.price : Math.round(totalCost / Math.max(1, booking.service.split(', ').length)),
        category: catalogItem ? catalogItem.category : 'Workshop Service'
      };
    });
  } else {
    serviceList = [{
      name: 'Automotive Inspection & Diagnostic Service',
      duration: totalEst,
      price: totalCost,
      category: 'Workshop Service'
    }];
  }

  return (
    <>
      {/* ── Screen Modal (Interactive UI) ────────────────────── */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-lg booking-details-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-handle-bar" />
          
          {/* Header */}
          <div className="modal-header" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="flex items-center gap-2 mb-1" style={{ gap: 8 }}>
                <span className="modal-title" style={{ fontSize: 18, fontWeight: 800 }}>
                  Booking Details — {bookingId}
                </span>
                <span className={`badge badge-${bookingStatus}`}>
                  <span className="badge-dot" /> {bookingStatus.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Official Auto Lab 360 Workshop Appointment Record
              </div>
            </div>

            <div className="flex items-center gap-2" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handlePrint}
                title="Print official work order & booking slip"
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                <Printer size={14} /> Print Slip
              </button>
              <button
                type="button"
                className="modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            
            {/* Customer & Vehicle 2-Column Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
              
              {/* Customer Box */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={13} style={{ color: 'var(--brand-primary)' }} /> Customer Information
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {customerName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={12} /> {customerPhone}
                </div>
                {customerEmail && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {customerEmail}
                  </div>
                )}
              </div>

              {/* Vehicle Box */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Car size={13} style={{ color: 'var(--brand-primary)' }} /> Vehicle & Registration
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {vehicleName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono" style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(255, 122, 0, 0.12)',
                    color: 'var(--brand-primary)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--brand-primary)'
                  }}>
                    {plateNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Schedule & Assignment Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 18,
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              border: `1.5px solid ${!isTechAssigned && attemptedConfirm ? 'var(--brand-danger)' : 'var(--border-subtle)'}`
            }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} /> Appointment Date
                </span>
                <strong style={{ fontSize: 13, marginTop: 2, display: 'block' }}>{bookingDate}</strong>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> Scheduled Time Slot
                </span>
                <strong style={{ fontSize: 13, marginTop: 2, display: 'block' }}>{bookingTime}</strong>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: isTechAssigned ? 'var(--text-muted)' : 'var(--brand-warning)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: isTechAssigned ? 500 : 700 }}>
                    <Wrench size={12} /> Assign Technician *
                  </span>
                  {techSaved && (
                    <span style={{ fontSize: 10, color: 'var(--brand-success)', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 700 }}>
                      <Check size={10} /> Saved
                    </span>
                  )}
                </div>
                <select
                  className="form-control"
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    height: 32,
                    borderColor: isTechAssigned ? 'var(--brand-primary)' : 'var(--brand-warning)',
                    background: 'var(--bg-card)',
                    color: isTechAssigned ? 'var(--text-primary)' : 'var(--brand-warning)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  value={selectedTech}
                  onChange={(e) => handleTechSelect(e.target.value)}
                  title="Assign or reassign workshop technician"
                >
                  <option value="">Unassigned (Queue)</option>
                  <option value="Mohamed Hassan">Mohamed Hassan (Senior)</option>
                  <option value="Ali Sayed">Ali Sayed (Mid Tech)</option>
                  <option value="Yusuf Ali">Yusuf Ali (Mid Tech)</option>
                  <option value="Kwame Asante">Kwame Asante (Junior)</option>
                </select>
              </div>
            </div>

            {/* Validation Notice for Confirmation */}
            {bookingStatus === 'pending' && (
              !isTechAssigned ? (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                  color: '#f87171'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Technician Required to Confirm:</strong> You cannot confirm this appointment without assigning a technician. Please choose a technician from the dropdown above.
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                  color: 'var(--brand-success)'
                }}>
                  <Check size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Ready to Confirm:</strong> Technician <strong>{selectedTech}</strong> is assigned to slot <strong>{bookingTime}</strong>. Clicking Confirm will generate a Service Job Card.
                  </div>
                </div>
              )
            )}

            {/* Itemized Services Breakdown Table */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={14} style={{ color: 'var(--brand-primary)' }} />
                Requested Services Breakdown ({serviceList.length} Job{serviceList.length > 1 ? 's' : ''}):
              </div>

              <div style={{
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Service Name</th>
                      <th style={{ padding: '8px 12px' }}>Category</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Est. Time</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Price (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceList.map((s, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.name}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>{s.category}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{s.duration} mins</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          Rs. {s.price}.00
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Totals & Payment Terms */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              border: '1px solid var(--border-glow)',
              marginBottom: 16
            }}>
              <div className="flex justify-between items-center mb-2" style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Duration Total:</span>
                <strong>{totalEst} mins ({Math.floor(totalEst / 60)}h {totalEst % 60}m)</strong>
              </div>
              <div className="flex justify-between items-center mb-2" style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Applicable Workshop Taxes:</span>
                <span>Included (5% VAT)</span>
              </div>
              <div className="divider" style={{ margin: '8px 0' }} />
              <div className="flex justify-between items-center">
                <span style={{ fontSize: 15, fontWeight: 700 }}>Total Booking Estimate:</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--brand-primary)' }}>
                  Rs. {totalCost}.00
                </span>
              </div>
            </div>

            {/* Notes / Instructions */}
            {booking.notes && (
              <div style={{
                background: 'rgba(255, 122, 0, 0.05)',
                border: '1px solid rgba(255, 122, 0, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: 12,
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--brand-primary)' }}>Customer Notes:</strong> {booking.notes}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} style={{ color: 'var(--brand-success)' }} />
              <span>Official Auto Lab 360 Booking Estimate</span>
            </div>

            <div className="modal-footer-actions flex gap-2 flex-wrap" style={{ gap: 8 }}>
              {bookingStatus === 'pending' && onConfirm && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConfirmClick}
                  title={isTechAssigned ? "Confirm appointment and create service job card" : "Assign a technician above to enable confirmation"}
                  style={{
                    opacity: isTechAssigned ? 1 : 0.6,
                    cursor: isTechAssigned ? 'pointer' : 'not-allowed'
                  }}
                >
                  <Check size={15} /> Confirm Booking {isTechAssigned ? `& Assign (${selectedTech.split(' ')[0]})` : '(Tech Required)'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrint}
              >
                <Printer size={15} /> Print Booking Slip
              </button>
              {onOpenWhatsApp && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onOpenWhatsApp(booking, 'booking_confirmed')}
                  style={{ borderColor: '#25D366', color: '#25D366', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                  title="Send or preview WhatsApp booking confirmation"
                >
                  <MessageSquare size={15} /> WhatsApp Confirmation
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hidden Print Voucher (Only appears on printer preview) ──────── */}
      <div id="printable-booking-slip">
        {/* Printable Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: 14, marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: -0.5, color: '#000' }}>
              AUTO LAB 360
            </h1>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>
              AUTOMOTIVE SERVICE WORK ORDER & BOOKING ESTIMATE
            </div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
              No 787, Kandy Road, Meepitiya, Kegalle | Tel: 071-881 8898 / 071-881 8854 | autolab360lk@gmail.com
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#000', letterSpacing: 0.5 }}>
              {bookingId}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#444', textTransform: 'uppercase' }}>
              Status: {bookingStatus}
            </div>
            <div style={{ fontSize: 10, color: '#666' }}>
              Date Issued: {bookingDate}
            </div>
          </div>
        </div>

        {/* 2-Column Details Box */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, border: '1px solid #ccc', fontSize: 11 }}>
          <tbody>
            <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
              <th style={{ width: '50%', padding: '6px 10px', textAlign: 'left' }}>CUSTOMER DETAILS</th>
              <th style={{ width: '50%', padding: '6px 10px', textAlign: 'left' }}>VEHICLE & APPOINTMENT</th>
            </tr>
            <tr>
              <td style={{ padding: '8px 10px', verticalAlign: 'top', borderRight: '1px solid #ccc' }}>
                <div><strong>Client Name:</strong> {customerName}</div>
                <div><strong>Contact Phone:</strong> {customerPhone}</div>
                {customerEmail && <div><strong>Email:</strong> {customerEmail}</div>}
              </td>
              <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                <div><strong>Vehicle:</strong> {vehicleName}</div>
                <div><strong>Plate Number:</strong> {plateNumber}</div>
                <div><strong>Scheduled Date & Time:</strong> {bookingDate} at {bookingTime}</div>
                <div><strong>Assigned Technician:</strong> {assignedTech}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Itemized Services Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#000', color: '#fff', borderBottom: '1px solid #000' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', width: 40 }}>#</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Service Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: 90 }}>Duration</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: 110 }}>Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {serviceList.map((s, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '7px 10px' }}>{idx + 1}</td>
                <td style={{ padding: '7px 10px', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '7px 10px', color: '#555' }}>{s.category}</td>
                <td style={{ padding: '7px 10px', textAlign: 'center' }}>{s.duration} mins</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>
                  Rs. {s.price}.00
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ width: 280, border: '1px solid #000', padding: 12, background: '#fafafa', fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Total Estimated Duration:</span>
              <strong>{totalEst} mins</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Services Subtotal:</span>
              <strong>Rs. {totalCost}.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Applicable VAT:</span>
              <span>Included</span>
            </div>
            <div style={{ borderTop: '2px solid #000', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
              <strong>Grand Total:</strong>
              <strong style={{ fontSize: 17 }}>Rs. {totalCost}.00</strong>
            </div>
          </div>
        </div>

        {/* Client Authorization & Signatures */}
        <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid #aaa', fontSize: 10, color: '#444' }}>
          <p style={{ margin: '0 0 16px', lineHeight: 1.4 }}>
            <strong>Terms & Customer Authorization:</strong> I hereby authorize the repair work and services listed above to be performed along with necessary replacement materials and parts. I understand pricing is in Rs. Auto Lab 360 mechanics are granted permission to test operate the vehicle for diagnostic and inspection purposes.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <div style={{ width: '45%', borderTop: '1px solid #000', paddingTop: 6, textAlign: 'center' }}>
              <strong>Client Signature:</strong> {customerName}
            </div>
            <div style={{ width: '45%', borderTop: '1px solid #000', paddingTop: 6, textAlign: 'center' }}>
              <strong>Workshop Service Advisor:</strong> Auto Lab 360 Kegalle Service Center
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
