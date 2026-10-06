import { usePermission } from "../hooks/usePermission";
import { useState, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Clock, Calendar, X, Check, AlertCircle, AlertTriangle, User, Car, Phone, Shield, UserCheck, UserPlus, MessageSquare } from 'lucide-react';
import { APPOINTMENTS, SERVICES_CATALOG } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import BookingDetailsModal from '../components/BookingDetailsModal';
import WhatsAppModal from '../components/WhatsAppModal';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const TIME_SLOTS = [
  '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM', '02:00 PM',
  '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '05:00 PM'
];

const TECHNICIANS = [
  { name: 'Mohamed Hassan', role: 'Senior Technician', grade: 'Sr' },
  { name: 'Ali Sayed',      role: 'Technician',        grade: 'Mid' },
  { name: 'Yusuf Ali',       role: 'Technician',        grade: 'Mid' },
  { name: 'Kwame Asante',    role: 'Junior Technician', grade: 'Jr' },
];

function getStoredCustomers() {
  try {
    const d = JSON.parse(localStorage.getItem('autolab_customers') || '[]');
    if (d && d.length > 0) return d;
  } catch {}
  return [
    {
      id: 'CUS-001', name: 'Ahmed Al-Rashid', phone: '+966501234567',
      email: 'ahmed@email.com', address: 'Al-Riyadh, SA', tag: 'vip',
      vehicles: [{ id: 'VEH-001', make: 'Toyota', model: 'Corolla', year: '2021', plate: 'ABC-1234', color: 'White' }]
    },
    {
      id: 'CUS-002', name: 'Sara Khalid', phone: '+966502345678',
      email: 'sara@email.com', address: 'Jeddah, SA', tag: 'regular',
      vehicles: [{ id: 'VEH-002', make: 'Honda', model: 'Civic', year: '2022', plate: 'XYZ-5678', color: 'Black' }]
    },
    {
      id: 'CUS-003', name: 'James Okonkwo', phone: '+966503456789',
      email: 'james@email.com', address: 'Dammam, SA', tag: 'fleet',
      vehicles: [{ id: 'VEH-003', make: 'Ford', model: 'F-150', year: '2020', plate: 'JKL-9012', color: 'Silver' }]
    },
    {
      id: 'CUS-004', name: 'Fatima Nasser', phone: '+966504567890',
      email: 'fatima@email.com', address: 'Mecca, SA', tag: 'regular',
      vehicles: [{ id: 'VEH-004', make: 'BMW', model: '3 Series', year: '2023', plate: 'MNO-3456', color: 'Blue' }]
    },
    {
      id: 'CUS-005', name: 'David Mensah', phone: '+966505678901',
      email: 'david@email.com', address: 'Riyadh, SA', tag: 'regular',
      vehicles: [{ id: 'VEH-005', make: 'Hyundai', model: 'Tucson', year: '2021', plate: 'PQR-7890', color: 'Grey' }]
    },
    {
      id: 'CUS-006', name: 'Layla Ibrahim', phone: '+966506789012',
      email: 'layla@email.com', address: 'Medina, SA', tag: 'regular',
      vehicles: [{ id: 'VEH-006', make: 'Nissan', model: 'Altima', year: '2022', plate: 'STU-1234', color: 'Red' }]
    },
    {
      id: 'CUS-007', name: 'Omar Farouq', phone: '+966507890123',
      email: 'omar@email.com', address: 'Riyadh, SA', tag: 'vip',
      vehicles: [{ id: 'VEH-007', make: 'Mercedes', model: 'C200', year: '2023', plate: 'VWX-5678', color: 'Black' }]
    },
    {
      id: 'CUS-008', name: 'Priya Sharma', phone: '+966508901234',
      email: 'priya@email.com', address: 'Jeddah, SA', tag: 'new',
      vehicles: [{ id: 'VEH-008', make: 'Kia', model: 'Sportage', year: '2020', plate: 'YZA-9012', color: 'White' }]
    }
  ];
}

function StatusBadge({ status }) {
  const map = {
    pending:     'badge-pending',    confirmed:   'badge-confirmed',
    in_progress: 'badge-in-progress', completed:   'badge-completed',
    cancelled:   'badge-cancelled',  no_show:     'badge-cancelled',
  };
  const labels = {
    pending: 'Pending', confirmed: 'Confirmed', in_progress: 'In Progress',
    completed: 'Completed', cancelled: 'Cancelled', no_show: 'No Show',
  };
  return (
    <span className={`badge ${map[status] || ''}`}>
      <span className="badge-dot" />{labels[status] || status}
    </span>
  );
}

// Calendar mini-view
function CalendarView({ appointments }) {
  const today = new Date(2026, 8, 26); // Sep 26
  const [current, setCurrent] = useState(today);

  const year  = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const apptDates = new Set(appointments.map(a => a.date));

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, date });
  }

  return (
    <div className="card" style={{ height: 'fit-content' }}>
      <div className="flex justify-between items-center mb-4" style={{ marginBottom: 14 }}>
        <div className="section-title">{MONTH_NAMES[month]} {year}</div>
        <div className="flex gap-2" style={{ gap: 6 }}>
          <button className="btn btn-secondary btn-icon-only btn-sm"
            onClick={() => setCurrent(new Date(year, month - 1, 1))}>
            <ChevronLeft size={14} />
          </button>
          <button className="btn btn-secondary btn-icon-only btn-sm"
            onClick={() => setCurrent(new Date(year, month + 1, 1))}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {DAY_NAMES.map(d => <div key={d} className="cal-day-header">{d}</div>)}
        {cells.map((c, i) => (
          <div key={i}
            className={`cal-day${!c.day ? ' other-month' : ''}${c.date === '2026-09-26' ? ' today' : ''}${c.date && apptDates.has(c.date) ? ' has-appt' : ''}`}>
            {c.day}
          </div>
        ))}
      </div>
      <div className="divider" />
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-2" style={{ gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-primary)' }} />
          Has appointments
        </div>
        <div className="flex items-center gap-2" style={{ gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,122,0,0.3)', border: '1.5px solid var(--brand-primary)' }} />
          Today
        </div>
      </div>
    </div>
  );
}

function getStoredServices() {
  try {
    const d = JSON.parse(localStorage.getItem('autolab_services') || '[]');
    if (d && d.length > 0) return d.filter(s => s.is_active !== 0);
  } catch {}
  return SERVICES_CATALOG.filter(s => s.is_active !== 0);
}

// New Appointment Modal with Registered Customer Selector & New Customer Registration
function NewAppointmentModal({ onClose, onAdd, existingAppointments = [] }) {
  const toast = useToast();
  const [customerMode, setCustomerMode] = useState('registered'); // 'registered' | 'new'

  // Dynamic services catalog
  const [availableServices, setAvailableServices] = useState(getStoredServices);

  // Registered Customer State
  const [customerList, setCustomerList] = useState(getStoredCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerList[0]?.id || '');
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);

  // New Customer State
  const [newCustName,    setNewCustName]    = useState('');
  const [newCustPhone,   setNewCustPhone]   = useState('');
  const [newCustEmail,   setNewCustEmail]   = useState('');
  const [newCustTag,     setNewCustTag]     = useState('regular');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [shouldRegister, setShouldRegister] = useState(true);

  // Custom Vehicle state
  const [isCustomVehicle, setIsCustomVehicle] = useState(false);
  const [customMake,  setCustomMake]  = useState('Toyota');
  const [customModel, setCustomModel] = useState('Corolla');
  const [customYear,  setCustomYear]  = useState('2022');
  const [customPlate, setCustomPlate] = useState('');

  // Date, Time & Tech
  const [date, setDate] = useState('2026-09-26');
  const [time, setTime] = useState('09:30 AM');
  const [selectedServices, setSelectedServices] = useState(() => [getStoredServices()[0] || SERVICES_CATALOG[0]]);
  const [tech, setTech] = useState('');
  const [confirmImmediately, setConfirmImmediately] = useState(false);
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const selectedCustomer = customerList.find(c => c.id === selectedCustomerId) || customerList[0];

  // Schedule conflict detection
  const conflictAppt = tech ? existingAppointments.find(a =>
    a.tech === tech &&
    a.date === date &&
    a.time === time &&
    ['confirmed', 'in_progress'].includes(a.status)
  ) : null;

  const toggleService = (srv) => {
    if (selectedServices.some(s => s.id === srv.id)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter(s => s.id !== srv.id));
        toast.info('Job Removed', `${srv.name} deselected.`);
      } else {
        toast.warning('Selection Required', 'At least one job must be selected for the appointment.');
      }
    } else {
      setSelectedServices([...selectedServices, srv]);
      toast.success('Job Added', `${srv.name} (Rs. ${srv.price}) added.`);
    }
  };

  const totalCost = selectedServices.reduce((acc, s) => acc + s.price, 0);
  const totalEst = selectedServices.reduce((acc, s) => acc + s.duration, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    let finalCustomerName = '';
    let finalPhone = '';
    let finalVehicleName = '';
    let finalPlate = '';

    if (customerMode === 'registered') {
      if (!selectedCustomer) {
        toast.warning('Customer Required', 'Please select a registered customer.');
        return;
      }
      finalCustomerName = selectedCustomer.name;
      finalPhone = selectedCustomer.phone;

      if (isCustomVehicle) {
        if (!customMake.trim() || !customModel.trim()) errors.customVehicle = true;
        finalVehicleName = `${customMake.trim()} ${customModel.trim()} ${customYear.trim() || ''}`.trim();
        finalPlate = customPlate.trim() || 'Pending check-in';
      } else {
        const v = selectedCustomer.vehicles?.[selectedVehicleIdx] || selectedCustomer.vehicles?.[0] || {};
        finalVehicleName = `${v.make || 'Toyota'} ${v.model || 'Corolla'} ${v.year || ''}`.trim();
        finalPlate = v.plate || 'Pending check-in';
      }
    } else {
      // New Customer Mode
      if (!newCustName.trim()) errors.name = true;
      if (!newCustPhone.trim()) errors.phone = true;
      if (!customMake.trim() || !customModel.trim()) errors.customVehicle = true;

      finalCustomerName = newCustName.trim();
      finalPhone = newCustPhone.trim();
      finalVehicleName = `${customMake.trim()} ${customModel.trim()} ${customYear.trim() || ''}`.trim();
      finalPlate = customPlate.trim() || 'Pending check-in';

      // Register new customer in database if checked
      if (shouldRegister && finalCustomerName) {
        const newCustId = `CUS-${Math.floor(100 + Math.random() * 900)}`;
        const newCustomerObj = {
          id: newCustId,
          name: finalCustomerName,
          phone: finalPhone,
          email: newCustEmail.trim() || null,
          address: newCustAddress.trim() || 'SA',
          tag: newCustTag || 'new',
          notes: notes.trim() || 'Registered via Appointment booking',
          joined: new Date().toISOString().slice(0, 10),
          vehicles: [{
            id: `VEH-${Math.floor(100 + Math.random() * 900)}`,
            make: customMake.trim(),
            model: customModel.trim(),
            year: customYear.trim() || '2022',
            plate: finalPlate,
            color: 'Standard',
            fuel: 'Petrol',
            mileage: 0
          }]
        };
        try {
          const stored = getStoredCustomers();
          const updated = [newCustomerObj, ...stored];
          localStorage.setItem('autolab_customers', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('autolab_customers_updated', { detail: newCustomerObj }));
          toast.success('Customer Registered', `${finalCustomerName} has been added to customer database.`);
        } catch (err) {}
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.warning('Missing Fields', 'Please complete the required customer and vehicle fields.');
      return;
    }

    // Logic verification for confirmation:
    // If user checked "Confirm Immediately", a technician MUST be assigned!
    if (confirmImmediately && (!tech || tech.trim() === '' || tech.toLowerCase().includes('unassigned'))) {
      toast.warning(
        'Technician Assignment Required',
        'Cannot confirm appointment immediately: Please assign a technician to this time slot.'
      );
      return;
    }

    if (confirmImmediately && conflictAppt) {
      toast.warning(
        'Technician Schedule Conflict',
        `Cannot double-book: ${tech} already has a confirmed service at ${time} on ${date}. Please select another technician or time slot.`
      );
      return;
    }

    const newAppt = {
      id: `APT-${Math.floor(100 + Math.random() * 900)}`,
      customer: finalCustomerName,
      phone: finalPhone,
      vehicle: finalVehicleName,
      plate: finalPlate,
      service: selectedServices.map(s => s.name).join(', '),
      date,
      time,
      status: (confirmImmediately && tech) ? 'confirmed' : 'pending',
      tech: tech || null,
      est: totalEst,
      cost: totalCost,
      notes,
    };

    onAdd(newAppt);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <span className="modal-title">Book New Appointment</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {/* Customer Type Selector */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              marginBottom: 16,
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                type="button"
                onClick={() => setCustomerMode('registered')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: customerMode === 'registered' ? 'var(--brand-primary)' : 'transparent',
                  color: customerMode === 'registered' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s'
                }}
              >
                <UserCheck size={16} /> Registered Customer
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('new')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: customerMode === 'new' ? 'var(--brand-primary)' : 'transparent',
                  color: customerMode === 'new' ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s'
                }}
              >
                <UserPlus size={16} /> New Customer (+ Register)
              </button>
            </div>

            {/* Registered Customer Selection UI */}
            {customerMode === 'registered' && (
              <div style={{
                background: 'rgba(255, 122, 0, 0.05)',
                border: '1px solid rgba(255, 122, 0, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                marginBottom: 18
              }}>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Select Registered Customer <span>*</span></label>
                  <select
                    className="form-control"
                    value={selectedCustomerId}
                    onChange={e => {
                      setSelectedCustomerId(e.target.value);
                      setSelectedVehicleIdx(0);
                      setIsCustomVehicle(false);
                    }}
                    style={{ fontWeight: 600, fontSize: 13 }}
                  >
                    {customerList.map(c => {
                      const v = c.vehicles?.[0];
                      const vText = v ? `${v.make} ${v.model} (${v.plate})` : 'No vehicle on file';
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.phone} — {vText}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedCustomer && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, fontSize: 12, marginBottom: 14 }}>
                    <div style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Client ID</span>
                      <strong>{selectedCustomer.id}</strong> ({selectedCustomer.tag?.toUpperCase() || 'REGULAR'})
                    </div>
                    <div style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Phone</span>
                      <strong>{selectedCustomer.phone}</strong>
                    </div>
                    <div style={{ padding: '8px 10px', background: 'var(--bg-card)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Email</span>
                      <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{selectedCustomer.email || 'None'}</strong>
                    </div>
                  </div>
                )}

                {/* Vehicle Selection for Registered Customer */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Customer's Registered Vehicle <span>*</span></label>
                  <select
                    className="form-control"
                    value={isCustomVehicle ? '__custom__' : selectedVehicleIdx}
                    onChange={e => {
                      if (e.target.value === '__custom__') {
                        setIsCustomVehicle(true);
                      } else {
                        setIsCustomVehicle(false);
                        setSelectedVehicleIdx(Number(e.target.value));
                      }
                    }}
                  >
                    {selectedCustomer?.vehicles?.map((v, idx) => (
                      <option key={idx} value={idx}>
                        {v.make} {v.model} ({v.year || '2022'}) — Plate: {v.plate}
                      </option>
                    ))}
                    <option value="__custom__">+ Add Different / New Vehicle for this customer</option>
                  </select>
                </div>

                {isCustomVehicle && (
                  <div className="form-grid" style={{ marginTop: 10 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input className="form-control" placeholder="Make (e.g. Toyota)" value={customMake} onChange={e => setCustomMake(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input className="form-control" placeholder="Model (e.g. Camry)" value={customModel} onChange={e => setCustomModel(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input className="form-control" placeholder="Year (e.g. 2023)" value={customYear} onChange={e => setCustomYear(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input className="form-control" placeholder="Plate (e.g. XYZ-1234)" value={customPlate} onChange={e => setCustomPlate(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* New Customer Form UI */}
            {customerMode === 'new' && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                marginBottom: 18
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserPlus size={14} /> New Customer Registration Details
                </div>
                <div className="form-grid" style={{ marginBottom: 8 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name <span>*</span></label>
                    <input
                      className={`form-control ${formErrors.name ? 'has-error' : ''}`}
                      placeholder="e.g. Tariq Al-Mansoor"
                      value={newCustName}
                      onChange={e => {
                        setNewCustName(e.target.value);
                        if (formErrors.name) setFormErrors(p => ({ ...p, name: false }));
                      }}
                    />
                    {formErrors.name && <div className="form-error-hint"><AlertCircle size={12} /> Name is required</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Phone <span>*</span></label>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      className={`form-control ${formErrors.phone ? 'has-error' : ''}`}
                      placeholder="+94 77 123 4567"
                      value={newCustPhone}
                      onChange={e => {
                        setNewCustPhone(e.target.value);
                        if (formErrors.phone) setFormErrors(p => ({ ...p, phone: false }));
                      }}
                    />
                    {formErrors.phone && <div className="form-error-hint"><AlertCircle size={12} /> Phone number is required</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="customer@email.com"
                      value={newCustEmail}
                      onChange={e => setNewCustEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Tier / Tag</label>
                    <select className="form-control" value={newCustTag} onChange={e => setNewCustTag(e.target.value)}>
                      <option value="new">New Customer</option>
                      <option value="regular">Regular</option>
                      <option value="vip">VIP</option>
                      <option value="fleet">Fleet Account</option>
                    </select>
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', margin: '12px 0 8px' }}>
                  Vehicle Information <span>*</span>
                </div>
                <div className="form-grid" style={{ marginBottom: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input className="form-control" placeholder="Make (e.g. Toyota) *" value={customMake} onChange={e => setCustomMake(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input className="form-control" placeholder="Model (e.g. Camry) *" value={customModel} onChange={e => setCustomModel(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input className="form-control" placeholder="Year (e.g. 2022)" value={customYear} onChange={e => setCustomYear(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input className="form-control" placeholder="Plate (e.g. ABC-1234)" value={customPlate} onChange={e => setCustomPlate(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <input
                    type="checkbox"
                    id="register-cust-cb"
                    checked={shouldRegister}
                    onChange={e => setShouldRegister(e.target.checked)}
                    style={{ accentColor: 'var(--brand-primary)', width: 16, height: 16 }}
                  />
                  <label htmlFor="register-cust-cb" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Save as registered customer in database (adds to Customers module)
                  </label>
                </div>
              </div>
            )}

            {/* Schedule & Technician Section */}
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Appointment Date <span>*</span></label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Scheduled Time Slot <span>*</span></label>
                <select className="form-control" value={time} onChange={e => setTime(e.target.value)}>
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Assign Workshop Technician {confirmImmediately && <span>* (Required to Confirm)</span>}
                  </label>
                  {conflictAppt && (
                    <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} /> Schedule Conflict at this time
                    </span>
                  )}
                </div>
                <select
                  className="form-control"
                  value={tech}
                  onChange={e => setTech(e.target.value)}
                  style={{
                    borderColor: conflictAppt ? '#ef4444' : tech ? 'var(--brand-primary)' : 'var(--border-subtle)',
                    color: tech ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: 600
                  }}
                >
                  <option value="">Unassigned (Queue for staff review)</option>
                  {TECHNICIANS.map(t => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.role} - {t.grade})
                    </option>
                  ))}
                </select>
                {conflictAppt && (
                  <div style={{ fontSize: 11.5, color: '#f87171', marginTop: 4 }}>
                    ⚠️ {tech} already has active booking <strong>{conflictAppt.id}</strong> ({conflictAppt.customer}) at {date} {time}.
                  </div>
                )}
              </div>
            </div>

            {/* Multi-Job Selection Section */}
            <div className="form-group" style={{ marginTop: 12 }}>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Select Services / Jobs (Select multiple) <span>*</span>
                </label>
                <span style={{ fontSize: 12, color: 'var(--brand-primary)', fontWeight: 600 }}>
                  {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                </span>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                maxHeight: 220,
                overflowY: 'auto',
                padding: 4
              }}>
                {availableServices.map(srv => {
                  const isChecked = selectedServices.some(s => s.id === srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isChecked ? 'rgba(255, 122, 0, 0.12)' : 'var(--bg-card)',
                        border: `1.5px solid ${isChecked ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: 'var(--brand-primary)', marginTop: 3 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: isChecked ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                          {srv.name}
                        </div>
                        <div className="flex justify-between items-center mt-1" style={{ fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)' }}>{srv.duration} mins</span>
                          <span style={{ fontWeight: 700, color: 'var(--brand-success)' }}>Rs. {srv.price}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Multi-Job Cost & Duration Summary */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Estimated Duration</span>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{totalEst} mins ({Math.floor(totalEst / 60)}h {totalEst % 60}m)</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Combined Estimated Total</span>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--brand-primary)' }}>Rs. {totalCost}.00</div>
              </div>
            </div>

            {/* Confirmation & Status Option */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Confirm Appointment Immediately
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {tech
                      ? `Will confirm slot and generate Service Job Card assigned to ${tech}.`
                      : 'Requires a technician assignment to enable confirmation.'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  disabled={!tech}
                  checked={confirmImmediately && !!tech}
                  onChange={e => setConfirmImmediately(e.target.checked)}
                  style={{
                    accentColor: 'var(--brand-success)',
                    width: 18,
                    height: 18,
                    cursor: tech ? 'pointer' : 'not-allowed',
                    opacity: tech ? 1 : 0.4
                  }}
                  title={!tech ? "Assign a technician above to enable immediate confirmation" : ""}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Customer Notes / Complaints</label>
              <textarea
                className="form-control"
                placeholder="Document customer instructions or symptoms…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Plus size={15} /> {confirmImmediately && tech ? `Confirm & Book (Rs. ${totalCost})` : `Schedule Appointment (Rs. ${totalCost})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Appointments() {
  const { canWrite, canDelete } = usePermission("appointments");
  const [appointments, setAppointments] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('autolab_appointments') || '[]');
      const map = new Map();
      APPOINTMENTS.forEach(a => map.set(a.id, a));
      stored.forEach(a => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
      return Array.from(map.values());
    } catch {
      return APPOINTMENTS;
    }
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [whatsappTarget, setWhatsappTarget] = useState(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState('booking_confirmed');

  const handleOpenWhatsApp = (appt, templateId = 'booking_confirmed') => {
    setWhatsappTarget({
      ...appt,
      name: appt.customer,
      vehicle: appt.vehicle,
      plate: appt.plate,
      service: appt.service,
      phone: appt.phone || '077 123 4567',
      total: appt.cost,
      date: appt.date,
      time: appt.time,
      tech: appt.tech
    });
    setWhatsappTemplate(templateId);
  };

  const toast = useToast();

  // Re-sync from localStorage when public bookings or other tabs/pages add an appointment
  const syncFromStorage = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('autolab_appointments') || '[]');
      setAppointments(prev => {
        const map = new Map();
        APPOINTMENTS.forEach(a => map.set(a.id, a));
        prev.forEach(a => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
        stored.forEach(a => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
        return Array.from(map.values());
      });
    } catch (e) {
      console.warn('Failed to parse stored appointments', e);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch live appointments from backend API and MERGE with local/stored appointments
    api.appointments.getAll()
      .then(serverData => {
        if (isMounted && Array.isArray(serverData) && serverData.length > 0) {
          setAppointments(prev => {
            const stored = JSON.parse(localStorage.getItem('autolab_appointments') || '[]');
            const map = new Map();
            APPOINTMENTS.forEach(a => map.set(a.id, a));
            prev.forEach(a => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
            stored.forEach(a => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
            serverData.forEach(a => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('autolab_appointments', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(err => {
        console.warn('API sync unavailable, using local/storage data:', err.message);
      });

    // 2. Listen to custom event, storage event, and tab focus so any booking made in Public Portal immediately appears!
    window.addEventListener('autolab_appts_updated', syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('focus', syncFromStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('autolab_appts_updated', syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('focus', syncFromStorage);
    };
  }, []);

  const setAndPersistAppointments = (updater) => {
    setAppointments(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('autolab_appointments', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('autolab_appts_updated'));
      } catch (e) {}
      return next;
    });
  };

  const handleAddAppointment = async (newAppt) => {
    let apptToAdd = newAppt;
    try {
      const created = await api.appointments.create(newAppt);
      if (created) apptToAdd = created;
    } catch (err) {
      console.warn('API appointment save failed, saving locally:', err.message);
    }
    setAndPersistAppointments(prev => [apptToAdd, ...prev]);

    // If confirmed immediately, create job card
    if (apptToAdd.status === 'confirmed') {
      const newJobCard = {
        id: `JOB-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        appt: apptToAdd.id,
        vehicle: apptToAdd.vehicle,
        plate: apptToAdd.plate || 'Pending check-in',
        customer: apptToAdd.customer,
        service: apptToAdd.service,
        tech: apptToAdd.tech || 'Unassigned',
        status: (apptToAdd.tech && apptToAdd.tech !== 'Unassigned') ? 'assigned' : 'queued',
        start: `${apptToAdd.date} ${apptToAdd.time}`,
        mileage: 32000,
        labor: Math.round(apptToAdd.cost * 0.6),
        parts: Math.round(apptToAdd.cost * 0.4),
        total: apptToAdd.cost
      };
      try {
        const stored = JSON.parse(localStorage.getItem('autolab_service_jobs') || '[]');
        localStorage.setItem('autolab_service_jobs', JSON.stringify([newJobCard, ...stored]));
        window.dispatchEvent(new CustomEvent('autolab_jobs_updated', { detail: newJobCard }));
      } catch (e) {}
      toast.success(
        'Appointment Confirmed & Job Card Created',
        `Booking ${apptToAdd.id} confirmed for ${apptToAdd.customer} · Assigned to ${apptToAdd.tech}.`
      );
    } else {
      toast.success(
        'Appointment Scheduled',
        `Booking ${apptToAdd.id} registered for ${apptToAdd.customer} (${apptToAdd.vehicle}) · Total Rs. ${apptToAdd.cost}`
      );
    }
  };

  const handleAssignTech = async (id, tech) => {
    const techVal = (tech && tech !== 'Unassigned') ? tech : null;
    setAndPersistAppointments(prev => prev.map(a => a.id === id ? { ...a, tech: techVal } : a));
    if (viewingBooking && viewingBooking.id === id) setViewingBooking(prev => prev ? { ...prev, tech: techVal } : null);
    try { await api.appointments.assignTech(id, techVal || 'Unassigned'); } catch {}

    // Sync linked service job if one exists
    try {
      const storedJobs = JSON.parse(localStorage.getItem('autolab_service_jobs') || '[]');
      let jobChanged = false;
      const updatedJobs = storedJobs.map(j => {
        if (j.appt === id) {
          jobChanged = true;
          const newStatus = (!techVal)
            ? (j.status === 'in_progress' || j.status === 'assigned' ? 'queued' : j.status)
            : (j.status === 'queued' ? 'assigned' : j.status);
          return { ...j, tech: techVal || 'Unassigned', status: newStatus };
        }
        return j;
      });
      if (jobChanged) {
        localStorage.setItem('autolab_service_jobs', JSON.stringify(updatedJobs));
        window.dispatchEvent(new CustomEvent('autolab_jobs_updated', { detail: { appt: id, tech: techVal } }));
      }
    } catch (e) {}

    toast.info('Technician Assigned', techVal ? `${techVal} assigned to booking ${id}.` : `Booking ${id} queued for morning assignment.`);
  };

  // STRICT CONFIRMATION LOGIC:
  // Cannot confirm without assigning a technician and valid time slot!
  const handleConfirm = async (id, techToAssign = null) => {
    const targetAppt = appointments.find(a => a.id === id);
    if (!targetAppt) return;

    const techFinal = techToAssign || targetAppt.tech;

    // Validate technician assignment
    if (!techFinal || techFinal.trim() === '' || techFinal.toLowerCase().includes('unassigned')) {
      toast.warning(
        'Technician Assignment Required',
        `Cannot confirm booking ${id}: You must assign a certified technician to this time slot first.`
      );
      setViewingBooking(targetAppt);
      return;
    }

    // Validate time slot
    if (!targetAppt.date || !targetAppt.time) {
      toast.warning(
        'Time Slot Required',
        `Cannot confirm booking ${id}: A valid date and time slot must be scheduled.`
      );
      setViewingBooking(targetAppt);
      return;
    }

    // Check for technician double-booking conflict
    const conflict = appointments.find(x =>
      x.id !== id &&
      x.tech === techFinal &&
      x.date === targetAppt.date &&
      x.time === targetAppt.time &&
      ['confirmed', 'in_progress'].includes(x.status)
    );
    if (conflict) {
      toast.warning(
        'Technician Conflict Alert',
        `${techFinal} already has active booking ${conflict.id} (${conflict.customer}) at ${targetAppt.date} ${targetAppt.time}. Please check bay allocation.`
      );
    }

    setAndPersistAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed', tech: techFinal } : a));

    try { await api.appointments.updateStatus(id, 'confirmed', techFinal); } catch {}

    // Auto-create Service Job Card
    const newJobCard = {
      id: `JOB-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      appt: targetAppt.id,
      vehicle: targetAppt.vehicle,
      plate: targetAppt.plate || 'Pending check-in',
      customer: targetAppt.customer,
      service: targetAppt.service,
      tech: techFinal,
      status: 'assigned',
      start: `${targetAppt.date} ${targetAppt.time}`,
      mileage: 32000,
      labor: Math.round(targetAppt.cost * 0.6),
      parts: Math.round(targetAppt.cost * 0.4),
      total: targetAppt.cost
    };

    try {
      const stored = JSON.parse(localStorage.getItem('autolab_service_jobs') || '[]');
      const filteredStored = stored.filter(j => j.appt !== targetAppt.id);
      localStorage.setItem('autolab_service_jobs', JSON.stringify([newJobCard, ...filteredStored]));
      window.dispatchEvent(new CustomEvent('autolab_jobs_updated', { detail: newJobCard }));
    } catch (e) {}

    toast.success(
      'Booking Confirmed & Job Card Created!',
      `Booking ${id} confirmed with ${techFinal}. Job Card ${newJobCard.id} active in Service Jobs.`
    );
  };

  // Quick confirm button handler on table rows
  const handleQuickConfirm = (a) => {
    if (!a.tech || a.tech.trim() === '' || a.tech.toLowerCase().includes('unassigned')) {
      toast.warning(
        'Technician Assignment Required',
        `Cannot confirm booking ${a.id}: Please assign a technician to this time slot first.`
      );
      setViewingBooking(a);
      return;
    }
    handleConfirm(a.id, a.tech);
  };

  const filtered = appointments.filter(a => {
    const matchSearch = !search ||
      (a.id && a.id.toLowerCase().includes(search.toLowerCase())) ||
      (a.customer && a.customer.toLowerCase().includes(search.toLowerCase())) ||
      (a.phone && a.phone.includes(search)) ||
      (a.plate && a.plate.toLowerCase().includes(search.toLowerCase())) ||
      (a.service && a.service.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-heading">Appointments</div>
          <div className="page-subheading">
            {appointments.filter(a => a.date === '2026-09-26').length} appointments today · {appointments.filter(a => a.status === 'pending').length} pending confirmation
          </div>
        </div>
        <div className="page-actions">
          {canWrite && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> New Appointment
            </button>
          )}
        </div>
      </div>

      <div className="appointments-layout-grid">
        {/* Main list */}
        <div>
          {/* Filters */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="flex gap-3 flex-wrap" style={{ gap: 12, alignItems: 'center' }}>
              <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
                <Search size={14} className="search-icon" />
                <input
                  style={{ width: '100%' }}
                  placeholder="Search customer, plate, service…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="tabs" style={{ marginBottom: 0 }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s} className={`tab${statusFilter === s ? ' active' : ''}`}
                    onClick={() => setStatusFilter(s)}>
                    {s === 'all' ? 'All' : s.replace('_',' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="card desktop-table-view">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Services Requested</th>
                    <th>Date & Time</th>
                    <th>Technician</th>
                    <th>Est. Cost</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const isTechSet = a.tech && a.tech.trim() !== '' && !a.tech.toLowerCase().includes('unassigned');
                    return (
                      <tr key={a.id}>
                        <td
                          style={{ cursor: 'pointer' }}
                          onClick={() => setViewingBooking(a)}
                          title="Click to view details & print slip"
                        >
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', transition: 'color 0.15s' }}>
                            {a.customer}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 600 }}>{a.id}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13 }}>{a.vehicle}</div>
                          <div className="mono">{a.plate}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 260 }}>
                            {a.service.split(', ').map((srvName, idx) => (
                              <span key={idx} style={{
                                background: 'var(--bg-hover)',
                                border: '1px solid var(--border-subtle)',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                color: 'var(--text-primary)'
                              }}>
                                {srvName}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2" style={{ gap: 6, marginBottom: 2 }}>
                            <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: 12 }}>{a.date}</span>
                          </div>
                          <div className="flex items-center gap-2" style={{ gap: 6 }}>
                            <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: 12 }}>{a.time}</span>
                          </div>
                        </td>
                        <td>
                          <select
                            className="form-control"
                            style={{
                              fontSize: 11.5,
                              padding: '3px 6px',
                              height: 28,
                              borderColor: isTechSet ? 'var(--border-subtle)' : 'var(--brand-warning)',
                              background: 'var(--bg-surface)',
                              color: isTechSet ? 'var(--text-primary)' : 'var(--brand-warning)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              minWidth: 135
                            }}
                            value={a.tech || ''}
                            onChange={(e) => handleAssignTech(a.id, e.target.value)}
                            title="Assign or change technician for this appointment time slot"
                          >
                            <option value="">Unassigned (Queue)</option>
                            {TECHNICIANS.map(t => (
                              <option key={t.name} value={t.name}>{t.name} ({t.grade})</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>Rs. {a.cost}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td>
                          <div className="flex gap-2" style={{ gap: 6 }}>
                            {a.status === 'pending' && canWrite && (
                              <button
                                className={`btn btn-sm btn-icon-only ${isTechSet ? 'btn-success' : 'btn-secondary'}`}
                                title={isTechSet ? "Confirm Appointment" : "Assign technician before confirming"}
                                onClick={() => handleQuickConfirm(a)}
                                style={{
                                  opacity: isTechSet ? 1 : 0.7,
                                  borderColor: isTechSet ? undefined : 'var(--brand-warning)',
                                  color: isTechSet ? undefined : 'var(--brand-warning)'
                                }}
                              >
                                <Check size={13} />
                              </button>
                            )}
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11, padding: '4px 10px' }}
                              onClick={() => setViewingBooking(a)}
                              title="View appointment details and print work order"
                            >
                              View
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Send WhatsApp appointment confirmation"
                              onClick={() => handleOpenWhatsApp(a, 'booking_confirmed')}
                              style={{ padding: '4px 8px', borderColor: 'rgba(37,211,102,0.4)', color: '#25D366' }}
                            >
                              <MessageSquare size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="empty-state">
                  <Calendar size={40} className="empty-icon" />
                  <div className="empty-title">No appointments found</div>
                  <div className="empty-desc">Try adjusting the filter or search term</div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Card Stack (< 768px Viewports) */}
          <div className="mobile-card-stack">
            {filtered.length === 0 ? (
              <div className="card empty-state" style={{ padding: 24, textAlign: 'center' }}>
                <Calendar size={36} className="empty-icon" style={{ margin: '0 auto 8px' }} />
                <div className="empty-title">No appointments found</div>
                <div className="empty-desc">Try adjusting the filter or search term</div>
              </div>
            ) : (
              filtered.map((a) => {
                const isTechSet = a.tech && a.tech.trim() !== '' && !a.tech.toLowerCase().includes('unassigned');
                return (
                  <div key={a.id} className="mobile-data-card">
                    <div className="mobile-card-header">
                      <div>
                        <div
                          className="mobile-card-title"
                          onClick={() => setViewingBooking(a)}
                          style={{ cursor: 'pointer' }}
                        >
                          {a.customer}
                        </div>
                        <div className="mobile-card-subtitle flex items-center gap-2">
                          <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{a.id}</span>
                          <span>&middot;</span>
                          <span className="mono">{a.plate}</span>
                        </div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>

                    <div className="mobile-card-row">
                      <span style={{ color: 'var(--text-secondary)' }}>{a.vehicle}</span>
                      <span style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: 14 }}>
                        Rs. {a.cost}.00
                      </span>
                    </div>

                    {/* Services Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {a.service.split(', ').map((srvName, idx) => (
                        <span key={idx} style={{
                          background: 'var(--bg-hover)',
                          border: '1px solid var(--border-subtle)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          color: 'var(--text-primary)'
                        }}>
                          {srvName}
                        </span>
                      ))}
                    </div>

                    <div className="mobile-card-row" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{a.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{a.time}</span>
                      </div>
                    </div>

                    {/* Tech Selector */}
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Assigned Tech:
                      </label>
                      <select
                        className="form-control"
                        style={{
                          fontSize: 13,
                          borderColor: isTechSet ? 'var(--border-subtle)' : 'var(--brand-warning)',
                          color: isTechSet ? 'var(--text-primary)' : 'var(--brand-warning)',
                          fontWeight: 600,
                          width: '100%'
                        }}
                        value={a.tech || ''}
                        onChange={(e) => handleAssignTech(a.id, e.target.value)}
                      >
                        <option value="">Unassigned (Queue)</option>
                        {TECHNICIANS.map(t => (
                          <option key={t.name} value={t.name}>{t.name} ({t.grade})</option>
                        ))}
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="mobile-card-actions">
                      {a.status === 'pending' && canWrite && (
                        <button
                          className={`btn btn-sm ${isTechSet ? 'btn-success' : 'btn-secondary'}`}
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleQuickConfirm(a)}
                          title={isTechSet ? "Confirm Appointment" : "Assign technician first"}
                        >
                          <Check size={14} /> Confirm
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setViewingBooking(a)}
                      >
                        View Details
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ borderColor: 'rgba(37,211,102,0.4)', color: '#25D366' }}
                        onClick={() => handleOpenWhatsApp(a, 'booking_confirmed')}
                        title="Send WhatsApp update"
                      >
                        <MessageSquare size={14} /> WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar: calendar + quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CalendarView appointments={appointments} />
          <div className="card">
            <div className="section-title mb-4" style={{ marginBottom: 12 }}>Today Summary</div>
            {[
              { label: 'Total',       value: appointments.filter(a=>a.date==='2026-09-26').length, color: 'var(--brand-primary)' },
              { label: 'Confirmed',   value: appointments.filter(a=>a.date==='2026-09-26'&&a.status==='confirmed').length,   color: 'var(--brand-success)' },
              { label: 'In Progress', value: appointments.filter(a=>a.date==='2026-09-26'&&a.status==='in_progress').length, color: '#ea580c' },
              { label: 'Pending',     value: appointments.filter(a=>a.date==='2026-09-26'&&a.status==='pending').length,     color: 'var(--brand-warning)' },
            ].map(row => (
              <div key={row.label} className="flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <NewAppointmentModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddAppointment}
          existingAppointments={appointments}
        />
      )}

      {viewingBooking && (
        <BookingDetailsModal
          booking={viewingBooking}
          onClose={() => setViewingBooking(null)}
          onAssignTech={handleAssignTech}
          onOpenWhatsApp={handleOpenWhatsApp}
          onConfirm={(id, tech) => {
            handleConfirm(id, tech);
            setViewingBooking(prev => prev ? { ...prev, status: 'confirmed', ...(tech ? { tech } : {}) } : null);
          }}
        />
      )}

      {whatsappTarget && (
        <WhatsAppModal
          isOpen={!!whatsappTarget}
          onClose={() => setWhatsappTarget(null)}
          recipient={whatsappTarget}
          defaultTemplateId={whatsappTemplate}
        />
      )}
    </div>
  );
}
