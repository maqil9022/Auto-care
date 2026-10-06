import { usePermission } from "../hooks/usePermission";
import { useState, useEffect } from 'react';
import {
  Plus, Search, X, User, Phone, Mail, Car, Wrench,
  Edit2, Trash2, ChevronRight, Calendar, Clock,
  MapPin, AlertCircle
} from 'lucide-react';
import { APPOINTMENTS, SERVICE_JOBS, INVOICES } from '../data/mockData';
import { useToast } from '../context/ToastContext';

// ── Seed customer data ───────────────────────────────────────────────
const SEED_CUSTOMERS = [
  {
    id: 'CUS-001', name: 'Ahmed Al-Rashid', phone: '+966501234567',
    email: 'ahmed@email.com', address: 'Al-Riyadh, SA', notes: 'Prefers synthetic oil only.',
    tag: 'vip', joined: '2024-03-12',
    vehicles: [{ id: 'VEH-001', make: 'Toyota', model: 'Corolla', year: '2021', plate: 'ABC-1234', color: 'White', fuel: 'Petrol', mileage: 28500 }]
  },
  {
    id: 'CUS-002', name: 'Sara Khalid', phone: '+966502345678',
    email: 'sara@email.com', address: 'Jeddah, SA', notes: '',
    tag: 'regular', joined: '2024-06-20',
    vehicles: [{ id: 'VEH-002', make: 'Honda', model: 'Civic', year: '2022', plate: 'XYZ-5678', color: 'Black', fuel: 'Petrol', mileage: 34200 }]
  },
  {
    id: 'CUS-003', name: 'James Okonkwo', phone: '+966503456789',
    email: 'james@email.com', address: 'Dammam, SA', notes: 'Fleet account — 3 vehicles.',
    tag: 'fleet', joined: '2023-11-05',
    vehicles: [{ id: 'VEH-003', make: 'Ford', model: 'F-150', year: '2020', plate: 'JKL-9012', color: 'Silver', fuel: 'Petrol', mileage: 61200 }]
  },
  {
    id: 'CUS-004', name: 'Fatima Nasser', phone: '+966504567890',
    email: 'fatima@email.com', address: 'Mecca, SA', notes: '',
    tag: 'regular', joined: '2025-01-14',
    vehicles: [{ id: 'VEH-004', make: 'BMW', model: '3 Series', year: '2023', plate: 'MNO-3456', color: 'Blue', fuel: 'Petrol', mileage: 12800 }]
  },
  {
    id: 'CUS-005', name: 'David Mensah', phone: '+966505678901',
    email: 'david@email.com', address: 'Riyadh, SA', notes: '',
    tag: 'regular', joined: '2025-03-22',
    vehicles: [{ id: 'VEH-005', make: 'Hyundai', model: 'Tucson', year: '2021', plate: 'PQR-7890', color: 'Grey', fuel: 'Petrol', mileage: 38000 }]
  },
  {
    id: 'CUS-006', name: 'Layla Ibrahim', phone: '+966506789012',
    email: 'layla@email.com', address: 'Medina, SA', notes: 'Always books in the morning.',
    tag: 'regular', joined: '2024-09-01',
    vehicles: [{ id: 'VEH-006', make: 'Nissan', model: 'Altima', year: '2022', plate: 'STU-1234', color: 'Red', fuel: 'Petrol', mileage: 22000 }]
  },
  {
    id: 'CUS-007', name: 'Omar Farouq', phone: '+966507890123',
    email: 'omar@email.com', address: 'Riyadh, SA', notes: '',
    tag: 'vip', joined: '2023-05-15',
    vehicles: [{ id: 'VEH-007', make: 'Mercedes', model: 'C200', year: '2023', plate: 'VWX-5678', color: 'Black', fuel: 'Petrol', mileage: 8400 }]
  },
  {
    id: 'CUS-008', name: 'Priya Sharma', phone: '+966508901234',
    email: 'priya@email.com', address: 'Jeddah, SA', notes: '',
    tag: 'new', joined: '2026-09-01',
    vehicles: [{ id: 'VEH-008', make: 'Kia', model: 'Sportage', year: '2020', plate: 'YZA-9012', color: 'White', fuel: 'Petrol', mileage: 44500 }]
  },
];

const TAG_CONFIG = {
  vip:     { label: 'VIP',     cls: 'badge-completed' },
  fleet:   { label: 'Fleet',   cls: 'badge-in-progress' },
  regular: { label: 'Regular', cls: 'badge-confirmed' },
  new:     { label: 'New',     cls: 'badge-pending' },
};

function TagBadge({ tag }) {
  const cfg = TAG_CONFIG[tag] || { label: tag, cls: '' };
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className="badge-dot" />{cfg.label}
    </span>
  );
}

// ── Add / Edit Modal ─────────────────────────────────────────────────
function CustomerModal({ customer, onClose, onSave }) {
  const isEdit = !!customer;
  const toast  = useToast();
  const [name,    setName]    = useState(customer?.name    || '');
  const [phone,   setPhone]   = useState(customer?.phone   || '');
  const [email,   setEmail]   = useState(customer?.email   || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [notes,   setNotes]   = useState(customer?.notes   || '');
  const [tag,     setTag]     = useState(customer?.tag     || 'regular');
  const [nameErr, setNameErr] = useState(false);
  const veh = customer?.vehicles?.[0] || {};
  const [vMake,  setVMake]  = useState(veh.make  || '');
  const [vModel, setVModel] = useState(veh.model || '');
  const [vYear,  setVYear]  = useState(veh.year  || '');
  const [vPlate, setVPlate] = useState(veh.plate || '');
  const [vColor, setVColor] = useState(veh.color || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setNameErr(true); toast.warning('Required', 'Customer name is required.'); return; }
    onSave({
      id: customer?.id || `CUS-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(), phone: phone.trim(), email: email.trim(),
      address: address.trim(), notes: notes.trim(), tag,
      joined: customer?.joined || new Date().toISOString().slice(0, 10),
      vehicles: [{
        id: veh.id || `VEH-${Math.floor(100 + Math.random() * 900)}`,
        make: vMake.trim(), model: vModel.trim(), year: vYear.trim(),
        plate: vPlate.trim(), color: vColor.trim(), fuel: veh.fuel || 'Petrol',
        mileage: veh.mileage || 0
      }]
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Customer' : 'Add New Customer'}</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', marginBottom: 12 }}>Customer Information</div>
            <div className="form-grid" style={{ marginBottom: 4 }}>
              <div className="form-group">
                <label className="form-label">Full Name <span>*</span></label>
                <input className={`form-control ${nameErr ? 'has-error' : ''}`} placeholder="e.g. Ahmed Al-Rashid" value={name} onChange={e => { setName(e.target.value); setNameErr(false); }} />
                {nameErr && <div className="form-error-hint"><AlertCircle size={12} /> Name is required</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Customer Tag</label>
                <select className="form-control" value={tag} onChange={e => setTag(e.target.value)}>
                  <option value="new">New</option>
                  <option value="regular">Regular</option>
                  <option value="vip">VIP</option>
                  <option value="fleet">Fleet</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="form-control"
                  placeholder="+94 7X XXX XXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" placeholder="customer@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-control" placeholder="City, Country" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" placeholder="Special preferences, fleet info…" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-muted)', margin: '20px 0 12px' }}>Primary Vehicle</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Make</label>
                <input className="form-control" placeholder="e.g. Toyota" value={vMake} onChange={e => setVMake(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input className="form-control" placeholder="e.g. Corolla" value={vModel} onChange={e => setVModel(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-control" placeholder="e.g. 2022" value={vYear} onChange={e => setVYear(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Plate No.</label>
                <input className="form-control" placeholder="e.g. ABC-1234" value={vPlate} onChange={e => setVPlate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <input className="form-control" placeholder="e.g. White" value={vColor} onChange={e => setVColor(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? <><Edit2 size={14} /> Save Changes</> : <><Plus size={14} /> Add Customer</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Customer Profile Drawer ──────────────────────────────────────────
function CustomerDrawer({ customer, onClose, onEdit, onDelete }) {
  const appointments = APPOINTMENTS.filter(a => a.customer.toLowerCase() === customer.name.toLowerCase());
  const jobs         = SERVICE_JOBS.filter(j => j.customer.toLowerCase() === customer.name.toLowerCase());
  const invoices     = INVOICES.filter(i => i.customer.toLowerCase() === customer.name.toLowerCase());
  const totalSpend   = invoices.reduce((s, i) => s + (i.paid || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', maxWidth: 700 }}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(135deg,rgba(255,122,0,0.3),rgba(234,88,12,0.15))',
              border: '2px solid var(--brand-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: 'var(--brand-primary)', flexShrink: 0
            }}>
              {customer.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="modal-title">{customer.name}</span>
                <TagBadge tag={customer.tag} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {customer.id} · Member since {customer.joined}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(customer)}><Edit2 size={13} /> Edit</button>
            <button className="modal-close" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="modal-body">
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Appointments', val: appointments.length,   color: 'var(--brand-primary)' },
              { label: 'Service Jobs', val: jobs.length,           color: '#a78bfa' },
              { label: 'Invoices',     val: invoices.length,       color: 'var(--brand-warning)' },
              { label: 'Total Spent',  val: `Rs. ${totalSpend}`,   color: 'var(--brand-success)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { icon: Phone,    label: 'Phone',        val: customer.phone   || '—' },
              { icon: Mail,     label: 'Email',        val: customer.email   || '—' },
              { icon: MapPin,   label: 'Address',      val: customer.address || '—' },
              { icon: Calendar, label: 'Member Since', val: customer.joined },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <Icon size={14} style={{ color: 'var(--brand-primary)', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {customer.notes && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,122,0,0.06)', border: '1px solid rgba(255,122,0,0.25)', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 700, marginBottom: 4 }}>📌 Notes</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{customer.notes}</div>
            </div>
          )}

          {/* Vehicles */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Car size={14} style={{ color: 'var(--brand-primary)' }} /> Registered Vehicles ({customer.vehicles.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customer.vehicles.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(255,122,0,0.12)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Car size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{v.make} {v.model} ({v.year})</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.plate} · {v.color} · {v.mileage?.toLocaleString()} km</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service History */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wrench size={14} style={{ color: 'var(--brand-primary)' }} /> Service History
            </div>
            {jobs.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>No service records found</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Job No.</th><th>Service</th><th>Technician</th><th>Status</th><th>Total</th></tr></thead>
                  <tbody>
                    {jobs.map(j => (
                      <tr key={j.id}>
                        <td className="mono" style={{ fontSize: 12 }}>{j.id}</td>
                        <td style={{ fontSize: 13 }}>{j.service}</td>
                        <td style={{ fontSize: 12 }}>{j.tech}</td>
                        <td>
                          <span className={`badge ${j.status === 'completed' ? 'badge-completed' : j.status === 'in_progress' ? 'badge-in-progress' : 'badge-pending'}`}>
                            <span className="badge-dot" />{j.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>Rs. {j.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Appointments */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} style={{ color: 'var(--brand-primary)' }} /> Appointment History
            </div>
            {appointments.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>No appointments found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {appointments.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.service}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 12, marginTop: 3 }}>
                        <span><Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />{a.date}</span>
                        <span><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{a.time}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: 13 }}>Rs. {a.cost}</div>
                      <span className={`badge ${a.status === 'confirmed' ? 'badge-confirmed' : a.status === 'completed' ? 'badge-completed' : 'badge-pending'}`} style={{ fontSize: 10 }}>
                        <span className="badge-dot" />{a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} onClick={() => { onDelete(customer.id); onClose(); }}>
            <Trash2 size={13} /> Delete Customer
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function Customers() {
  const { canWrite, canDelete } = usePermission("customers");
  const toast = useToast();

  const [customers, setCustomers] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('autolab_customers') || '[]');
      const map = new Map();
      SEED_CUSTOMERS.forEach(c => map.set(c.id, c));
      stored.forEach(c => map.set(c.id, { ...(map.get(c.id) || {}), ...c }));
      return Array.from(map.values());
    } catch (e) {
      return SEED_CUSTOMERS;
    }
  });

  const [search,     setSearch]     = useState('');
  const [tagFilter,  setTagFilter]  = useState('all');
  const [selected,   setSelected]   = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showModal,  setShowModal]  = useState(false);

  useEffect(() => {
    try { localStorage.setItem('autolab_customers', JSON.stringify(customers)); } catch (e) {}
  }, [customers]);

  useEffect(() => {
    const handleCustomerSync = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('autolab_customers') || '[]');
        setCustomers(prev => {
          const map = new Map();
          SEED_CUSTOMERS.forEach(c => map.set(c.id, c));
          prev.forEach(c => map.set(c.id, { ...(map.get(c.id) || {}), ...c }));
          stored.forEach(c => map.set(c.id, { ...(map.get(c.id) || {}), ...c }));
          return Array.from(map.values());
        });
      } catch (e) {}
    };
    window.addEventListener('autolab_customers_updated', handleCustomerSync);
    window.addEventListener('storage', handleCustomerSync);
    window.addEventListener('focus', handleCustomerSync);
    return () => {
      window.removeEventListener('autolab_customers_updated', handleCustomerSync);
      window.removeEventListener('storage', handleCustomerSync);
      window.removeEventListener('focus', handleCustomerSync);
    };
  }, []);

  const handleSave = (payload) => {
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.id === payload.id);
      if (idx > -1) {
        const u = [...prev]; u[idx] = payload;
        toast.success('Customer Updated', `${payload.name}'s profile saved.`);
        return u;
      }
      toast.success('Customer Added', `${payload.name} added to database.`);
      return [payload, ...prev];
    });
    setEditTarget(null); setShowModal(false); setSelected(null);
  };

  const handleDelete = (id) => {
    const c = customers.find(x => x.id === id);
    setCustomers(prev => prev.filter(x => x.id !== id));
    toast.info('Customer Removed', `${c?.name} deleted from database.`);
  };

  const handleEdit = (c) => { setEditTarget(c); setSelected(null); setShowModal(true); };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.vehicles.some(v => v.plate.toLowerCase().includes(q) || `${v.make} ${v.model}`.toLowerCase().includes(q));
    const matchTag = tagFilter === 'all' || c.tag === tagFilter;
    return matchSearch && matchTag;
  });

  const tagCounts = { all: customers.length };
  customers.forEach(c => { tagCounts[c.tag] = (tagCounts[c.tag] || 0) + 1; });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-heading">Customers</div>
          <div className="page-subheading">
            {customers.length} total · {customers.filter(c => c.tag === 'vip').length} VIP · {customers.filter(c => c.tag === 'fleet').length} fleet accounts
          </div>
        </div>
        <div className="page-actions">
          {canWrite && (<button className="btn btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
            <Plus size={15} /> Add Customer
          </button>)}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Customers', val: customers.length,                                       color: 'var(--brand-primary)' },
          { label: 'VIP Clients',     val: customers.filter(c => c.tag === 'vip').length,          color: 'var(--brand-success)' },
          { label: 'Fleet Accounts',  val: customers.filter(c => c.tag === 'fleet').length,        color: '#a78bfa' },
          { label: 'New This Month',  val: customers.filter(c => c.joined >= '2026-09-01').length, color: 'var(--brand-warning)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 220 }}>
            <Search size={14} className="search-icon" />
            <input style={{ width: '100%' }} placeholder="Search name, phone, email, plate…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['all', 'vip', 'fleet', 'regular', 'new'].map(t => (
              <button key={t} className={`tab${tagFilter === t ? ' active' : ''}`} onClick={() => setTagFilter(t)}>
                {t === 'all' ? 'All' : TAG_CONFIG[t]?.label || t}
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 8 }}>
                  {tagCounts[t] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1' }}>
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <User size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No customers found</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try adjusting your search or filter</div>
            </div>
          </div>
        ) : filtered.map(c => {
          const vehicle  = c.vehicles[0];
          const jobCount = SERVICE_JOBS.filter(j => j.customer.toLowerCase() === c.name.toLowerCase()).length;
          return (
            <div key={c.id} className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,122,0,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,122,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
              onClick={() => setSelected(c)}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,rgba(255,122,0,0.25),rgba(234,88,12,0.1))',
                  border: '2px solid rgba(255,122,0,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, fontWeight: 800, color: 'var(--brand-primary)'
                }}>
                  {c.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                    <TagBadge tag={c.tag} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.id}</div>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', flexShrink: 0 }}
                  onClick={e => { e.stopPropagation(); handleEdit(c); }}>
                  <Edit2 size={12} />
                </button>
              </div>

              {/* Contact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}><Phone size={12} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />{c.phone}</div>}
                {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}><Mail size={12} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />{c.email}</div>}
                {c.address && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}><MapPin size={12} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />{c.address}</div>}
              </div>

              <div className="divider" style={{ margin: '0 0 12px' }} />

              {/* Vehicle */}
              {vehicle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: 12 }}>
                  <Car size={13} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                  <div style={{ fontSize: 12, flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600 }}>{vehicle.make} {vehicle.model} ({vehicle.year})</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{vehicle.plate}</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Wrench size={10} />{jobCount} job{jobCount !== 1 ? 's' : ''}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10} />Since {c.joined}</div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showModal && (
        <CustomerModal customer={editTarget} onClose={() => { setShowModal(false); setEditTarget(null); }} onSave={handleSave} />
      )}
      {selected && !showModal && (
        <CustomerDrawer customer={selected} onClose={() => setSelected(null)} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
}
