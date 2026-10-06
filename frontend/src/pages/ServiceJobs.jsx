import { usePermission } from "../hooks/usePermission";
import { useState, useEffect } from 'react';
import { Plus, Search, X, Wrench, Clock, User, Check, ShieldCheck, ChevronRight, Pause, AlertTriangle, MessageSquare } from 'lucide-react';
import { SERVICE_JOBS } from '../data/mockData';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import WhatsAppModal from '../components/WhatsAppModal';

function resolveCustomerPhone(job) {
  if (job?.phone) return job.phone;
  try {
    const appts = JSON.parse(localStorage.getItem('autolab_appointments') || '[]');
    const matchAppt = appts.find(a => (job?.appt && a.id === job.appt) || (a.customer && a.customer.toLowerCase() === job?.customer?.toLowerCase()));
    if (matchAppt && matchAppt.phone) return matchAppt.phone;

    const custs = JSON.parse(localStorage.getItem('autolab_customers') || '[]');
    const matchCust = custs.find(c => c.name && c.name.toLowerCase() === job?.customer?.toLowerCase());
    if (matchCust && matchCust.phone) return matchCust.phone;
  } catch (e) {}
  return '077 123 4567';
}

const TECHNICIANS = [
  'Mohamed Hassan',
  'Ali Sayed',
  'Yusuf Ali',
  'Kwame Asante',
  'Unassigned'
];

function StatusBadge({ status }) {
  const map = {
    queued: 'badge-queued',
    assigned: 'badge-confirmed',
    in_progress: 'badge-in-progress',
    on_hold: 'badge-pending',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };
  const labels = {
    queued: 'Queued',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return (
    <span className={`badge ${map[status] || ''}`}>
      <span className="badge-dot" />
      {labels[status] || status}
    </span>
  );
}

function NewJobModal({ onClose, onSave }) {
  const [customer, setCustomer] = useState('');
  const [vehicle, setVehicle] = useState('Toyota Corolla 2021');
  const [plate, setPlate] = useState('ABC-1234');
  const [mileage, setMileage] = useState('');
  const [tech, setTech] = useState('Mohamed Hassan');
  const [service, setService] = useState('');
  const [labor, setLabor] = useState(85);
  const [linkedAppt, setLinkedAppt] = useState('');
  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer.trim()) {
      toast.error('Required Field', 'Please enter customer name');
      return;
    }
    const newJob = {
      id: `JOB-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      appt: linkedAppt || null,
      customer: customer.trim(),
      vehicle: vehicle.trim() || 'General Vehicle',
      plate: plate.trim() || 'UNREGISTERED',
      service: service.trim() || 'General Maintenance',
      tech: tech || 'Unassigned',
      status: tech && tech !== 'Unassigned' ? 'assigned' : 'queued',
      start: '09:00',
      mileage: Number(mileage) || 0,
      labor: Number(labor) || 60,
      parts: 0,
      total: Number(labor) || 60
    };
    onSave(newJob);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <span className="modal-title">Create New Job Card</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Customer Name <span>*</span></label>
                <input
                  className="form-control"
                  placeholder="e.g. Tariq Mansoor"
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Model <span>*</span></label>
                <input
                  className="form-control"
                  placeholder="e.g. Toyota Corolla 2021"
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Plate / Registration</label>
                <input
                  className="form-control"
                  placeholder="e.g. ABC-1234"
                  value={plate}
                  onChange={e => setPlate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mileage at Service (km)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 28500"
                  value={mileage}
                  onChange={e => setMileage(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Technician</label>
                <select
                  className="form-control"
                  value={tech}
                  onChange={e => setTech(e.target.value)}
                >
                  {TECHNICIANS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Labor Cost (Rs.)</label>
                <input
                  type="number"
                  className="form-control"
                  value={labor}
                  onChange={e => setLabor(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Problem / Service Requested <span>*</span></label>
              <textarea
                className="form-control"
                placeholder="Describe the problem or specific service requested by the customer…"
                value={service}
                onChange={e => setService(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Link to Appointment</label>
              <select
                className="form-control"
                value={linkedAppt}
                onChange={e => setLinkedAppt(e.target.value)}
              >
                <option value="">Walk-in (no appointment)</option>
                <option value="APT-007">APT-007 — Omar Farouq — Mercedes C200</option>
                <option value="APT-003">APT-003 — James Okonkwo — Brake Repair</option>
                <option value="APT-005">APT-005 — David Mensah — Alignment</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Plus size={15} /> Create Job Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobDetailModal({ job, onClose, onAssignTech, onUpdateStatus, onUpdateParts, onOpenWhatsApp }) {
  const toast = useToast();
  const [tab, setTab] = useState('details');
  const [activeTech, setActiveTech] = useState(job.tech || 'Unassigned');
  const [partsList, setPartsList] = useState(job.partsList || []);
  const [showAddPart, setShowAddPart] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartPrice, setNewPartPrice] = useState('');
  const [servicesList, setServicesList] = useState(
    job.servicesList || [{ name: job.service, tech: job.tech, duration: '—', labor: job.labor || 0 }]
  );
  const [showAddService, setShowAddService] = useState(false);
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcTech, setNewSvcTech] = useState(job.tech || 'Unassigned');
  const [newSvcLabor, setNewSvcLabor] = useState('');

  // Keep active technician synchronized with job updates
  useEffect(() => {
    setActiveTech(job.tech || 'Unassigned');
  }, [job.tech]);

  const handleTechChange = (newTech) => {
    setActiveTech(newTech);
    onAssignTech(job.id, newTech);
  };

  const handleAddPart = () => {
    if (!newPartName.trim() || !newPartPrice) return;
    const qty = Number(newPartQty) || 1;
    const price = Number(newPartPrice) || 0;
    const entry = { name: newPartName.trim(), qty, price, total: qty * price };
    const updated = [...partsList, entry];
    setPartsList(updated);
    const partsTotal = updated.reduce((s, p) => s + p.total, 0);
    onUpdateParts(job.id, updated, partsTotal);
    setNewPartName('');
    setNewPartQty(1);
    setNewPartPrice('');
    setShowAddPart(false);
  };

  const handleAddService = () => {
    if (!newSvcName.trim()) return;
    const labor = Number(newSvcLabor) || 0;
    const entry = { name: newSvcName.trim(), tech: newSvcTech, duration: '—', labor };
    const updated = [...servicesList, entry];
    setServicesList(updated);
    setNewSvcName('');
    setNewSvcLabor('');
    setShowAddService(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="modal-title">{job.id}</span>
              {job.appt && (
                <span className="badge badge-queued" style={{ fontSize: 11, padding: '2px 8px' }}>
                  Linked: {job.appt}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {job.vehicle} · {job.plate}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge status={job.status} />
            <button className="modal-close" onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <div className="modal-body">
          <div className="tabs">
            {['details','services','parts','notes'].map(t => (
              <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'details' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Customer</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{job.customer}</div>
                </div>

                <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Vehicle & Plate</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{job.vehicle} <span style={{ color: 'var(--brand-primary)', fontSize: 12 }}>({job.plate})</span></div>
                </div>

                {/* Interactive Technician Selector inside modal */}
                <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Assigned Technician
                  </div>
                  <select
                    className="form-control"
                    disabled={job.status === 'completed' || job.status === 'cancelled'}
                    style={{
                      fontWeight: 600,
                      color: activeTech !== 'Unassigned' ? 'var(--brand-primary)' : 'var(--text-muted)',
                      borderColor: 'var(--border-subtle)',
                      cursor: (job.status === 'completed' || job.status === 'cancelled') ? 'not-allowed' : 'pointer',
                      opacity: (job.status === 'completed' || job.status === 'cancelled') ? 0.75 : 1
                    }}
                    value={activeTech}
                    onChange={(e) => handleTechChange(e.target.value)}
                    title={job.status === 'completed' ? "Completed job technician is locked" : "Select assigned technician"}
                  >
                    {TECHNICIANS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Start Time</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{job.start || '—'}</div>
                </div>

                <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Mileage</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{job.mileage ? `${job.mileage.toLocaleString()} km` : '—'}</div>
                </div>

                <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Current Status</div>
                  <div style={{ marginTop: 2 }}><StatusBadge status={job.status} /></div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="form-label" style={{ marginBottom: 6 }}>Service Requested / Diagnosis</div>
                <textarea className="form-control" defaultValue={job.service} readOnly={false} />
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="form-label" style={{ marginBottom: 6 }}>Work Performed</div>
                <textarea className="form-control" placeholder="Document work completed by technician…" />
              </div>
            </div>
          )}

          {tab === 'services' && (
            <div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Service</th><th>Technician</th><th>Duration</th><th>Labor Cost</th></tr></thead>
                  <tbody>
                    {servicesList.map((s, i) => (
                      <tr key={i}>
                        <td>{s.name}</td>
                        <td>{s.tech}</td>
                        <td>{s.duration || '—'}</td>
                        <td style={{ fontWeight: 600 }}>Rs. {s.labor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showAddService && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginTop: 10, alignItems: 'end' }}>
                  <div>
                    <div className="form-label" style={{ marginBottom: 4, fontSize: 11 }}>Service Name</div>
                    <input
                      className="form-control"
                      placeholder="e.g. Brake Pad Replacement"
                      value={newSvcName}
                      onChange={e => setNewSvcName(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="form-label" style={{ marginBottom: 4, fontSize: 11 }}>Technician</div>
                    <select className="form-control" value={newSvcTech} onChange={e => setNewSvcTech(e.target.value)}>
                      {TECHNICIANS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="form-label" style={{ marginBottom: 4, fontSize: 11 }}>Labor Cost (Rs.)</div>
                    <input
                      type="number"
                      min={0}
                      className="form-control"
                      placeholder="0"
                      value={newSvcLabor}
                      onChange={e => setNewSvcLabor(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleAddService}>Add</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddService(false)}>Cancel</button>
                  </div>
                </div>
              )}
              {!showAddService && (
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={() => setShowAddService(true)}>
                  <Plus size={13} /> Add Service
                </button>
              )}
            </div>
          )}

          {tab === 'parts' && (
            <div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Part</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {partsList.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)', fontSize: 13 }}>No parts used</td></tr>
                    ) : (
                      partsList.map((p, i) => (
                        <tr key={i}>
                          <td>{p.name}</td>
                          <td>{p.qty}</td>
                          <td>Rs. {p.price}</td>
                          <td style={{ fontWeight: 600 }}>Rs. {p.total}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {showAddPart && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginTop: 10, alignItems: 'end' }}>
                  <div>
                    <div className="form-label" style={{ marginBottom: 4, fontSize: 11 }}>Part Name</div>
                    <input
                      className="form-control"
                      placeholder="e.g. Oil Filter"
                      value={newPartName}
                      onChange={e => setNewPartName(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="form-label" style={{ marginBottom: 4, fontSize: 11 }}>Qty</div>
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      value={newPartQty}
                      onChange={e => setNewPartQty(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="form-label" style={{ marginBottom: 4, fontSize: 11 }}>Unit Price (Rs.)</div>
                    <input
                      type="number"
                      min={0}
                      className="form-control"
                      placeholder="0"
                      value={newPartPrice}
                      onChange={e => setNewPartPrice(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleAddPart}>Add</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddPart(false)}>Cancel</button>
                  </div>
                </div>
              )}
              {!showAddPart && (
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={() => setShowAddPart(true)}>
                  <Plus size={13} /> Add Part
                </button>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <div>
              <textarea className="form-control" style={{ minHeight: 150 }}
                placeholder="Internal notes about this job…" />
            </div>
          )}

          {/* Cost Summary */}
          {(() => {
            const partsTotal = partsList.reduce((s, p) => s + p.total, 0);
            const laborTotal = servicesList.reduce((s, sv) => s + sv.labor, 0);
            const grandTotal = laborTotal + partsTotal;
            return (
              <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Labor</span>
                  <span style={{ fontWeight: 600 }}>Rs. {laborTotal}</span>
                </div>
                <div className="flex justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Parts</span>
                  <span style={{ fontWeight: 600 }}>Rs. {partsTotal}</span>
                </div>
                <div className="divider" style={{ margin: '10px 0' }} />
                <div className="flex justify-between">
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--brand-primary)' }}>Rs. {grandTotal}</span>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {job.status === 'completed' ? (
              <span style={{ color: 'var(--brand-success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <ShieldCheck size={16} /> Service Completed
              </span>
            ) : job.status === 'in_progress' ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-success" onClick={() => onUpdateStatus(job.id, 'completed')}>
                  <Check size={15} /> Mark Completed
                </button>
                <button className="btn btn-secondary" onClick={() => onUpdateStatus(job.id, 'on_hold')}>
                  <Pause size={15} /> Put On Hold
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  className="btn btn-warning"
                  disabled={!activeTech || activeTech === 'Unassigned'}
                  onClick={() => {
                    if (!activeTech || activeTech === 'Unassigned') {
                      toast.error('Technician Required', 'Cannot start service: Please assign a technician to this job card first.');
                    } else {
                      onUpdateStatus(job.id, 'in_progress');
                    }
                  }}
                  style={{
                    opacity: (!activeTech || activeTech === 'Unassigned') ? 0.5 : 1,
                    cursor: (!activeTech || activeTech === 'Unassigned') ? 'not-allowed' : 'pointer'
                  }}
                  title={(!activeTech || activeTech === 'Unassigned') ? 'Assign a technician to enable starting service' : 'Start Service'}
                >
                  <Wrench size={15} /> {job.status === 'on_hold' ? 'Resume Service' : 'Start Service'}
                </button>
                {(!activeTech || activeTech === 'Unassigned') && (
                  <span style={{ fontSize: 12, color: 'var(--brand-warning)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                    <AlertTriangle size={14} /> Assign technician above to start service
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onOpenWhatsApp && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenWhatsApp(job, 'urgent_update')}
                  style={{
                    borderColor: 'rgba(245,158,11,0.5)',
                    color: '#f59e0b',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Send urgent delay notice or parts approval request via WhatsApp"
                >
                  <AlertTriangle size={13} /> Quick Notice / Alert
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenWhatsApp(job, job.status === 'completed' ? 'work_completed' : 'work_started')}
                  style={{
                    borderColor: '#25D366',
                    color: '#25D366',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Send status update to customer on WhatsApp"
                >
                  <MessageSquare size={13} /> WhatsApp Customer
                </button>
              </>
            )}
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceJobs() {
  const { canWrite, canDelete } = usePermission("jobs");
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [whatsappTarget, setWhatsappTarget] = useState(null);
  const [whatsappTemplate, setWhatsappTemplate] = useState('work_started');

  const handleOpenWhatsApp = (job, templateId = 'work_started') => {
    const phone = resolveCustomerPhone(job);
    setWhatsappTarget({
      ...job,
      name: job.customer,
      phone
    });
    setWhatsappTemplate(templateId);
  };

  // Load from localStorage or mockData initially
  const [jobs, setJobs] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('autolab_service_jobs') || '[]');
      const map = new Map();
      SERVICE_JOBS.forEach(j => map.set(j.id, j));
      stored.forEach(j => map.set(j.id, { ...(map.get(j.id) || {}), ...j }));
      return Array.from(map.values());
    } catch (e) {
      return SERVICE_JOBS;
    }
  });

  // Sync logic when confirmed bookings or updates occur
  const syncFromStorage = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('autolab_service_jobs') || '[]');
      setJobs(prevJobs => {
        const map = new Map();
        prevJobs.forEach(j => map.set(j.id, j));
        stored.forEach(j => map.set(j.id, { ...(map.get(j.id) || {}), ...j }));
        return Array.from(map.values());
      });
    } catch (e) {
      console.warn('Failed to parse stored jobs', e);
    }
  };

  useEffect(() => {
    // 1. Fetch live jobs from API
    api.jobs.getAll()
      .then(serverJobs => {
        if (Array.isArray(serverJobs) && serverJobs.length > 0) {
          setJobs(prev => {
            const map = new Map();
            prev.forEach(j => map.set(j.id, j));
            serverJobs.forEach(j => map.set(j.id, { ...(map.get(j.id) || {}), ...j }));
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('autolab_service_jobs', JSON.stringify(merged));
            } catch (err) {}
            return merged;
          });
        }
      })
      .catch(err => {
        console.warn('Service jobs using offline state:', err.message);
      });

    // 2. Listen to custom event fired when an appointment is confirmed
    const handleJobUpdated = () => {
      syncFromStorage();
    };

    window.addEventListener('autolab_jobs_updated', handleJobUpdated);
    window.addEventListener('storage', syncFromStorage);

    return () => {
      window.removeEventListener('autolab_jobs_updated', handleJobUpdated);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  // Technician assignment handler with strict status rules
  const handleAssignTech = async (jobId, newTech) => {
    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    const isUnassigned = !newTech || newTech === 'Unassigned';

    let updatedStatus = targetJob.status;
    if (isUnassigned) {
      // Rule: Unassigning tech halts active progress or assignment, reverts to queued
      if (targetJob.status === 'assigned' || targetJob.status === 'in_progress') {
        updatedStatus = 'queued';
      }
    } else {
      // Rule: Assigning tech to a queued job promotes it to assigned
      if (targetJob.status === 'queued') {
        updatedStatus = 'assigned';
      }
    }

    const updated = jobs.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          tech: newTech,
          status: updatedStatus
        };
      }
      return j;
    });

    setJobs(updated);
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob(prev => ({ ...prev, tech: newTech, status: updatedStatus }));
    }

    try {
      localStorage.setItem('autolab_service_jobs', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('autolab_jobs_updated', { detail: { id: jobId, tech: newTech, status: updatedStatus } }));
    } catch (e) {}

    try {
      await api.jobs.updateStatus(jobId, { tech: newTech, status: updatedStatus });
      if (isUnassigned) {
        if (targetJob.status === 'in_progress') {
          toast.warning('Technician Unassigned', `${jobId} active service stopped & returned to queue (technician required).`);
        } else {
          toast.info('Technician Unassigned', `${jobId} placed in queue awaiting technician.`);
        }
      } else {
        toast.success('Technician Assigned', `${newTech} assigned to ${jobId} (Status: ${updatedStatus.replace('_', ' ')}).`);
      }
    } catch (err) {
      if (isUnassigned) {
        if (targetJob.status === 'in_progress') {
          toast.warning('Technician Unassigned', `${jobId} active service stopped & returned to queue.`);
        } else {
          toast.info('Technician Unassigned', `${jobId} saved locally as Unassigned (in queue).`);
        }
      } else {
        toast.info('Technician Assigned', `${newTech} assigned locally to ${jobId}.`);
      }
    }
  };

  // Status update handler with strict technician validation
  const handleUpdateStatus = async (jobId, newStatus) => {
    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    // Rule: Cannot start service if technician is Unassigned or missing
    if (newStatus === 'in_progress') {
      if (!targetJob.tech || targetJob.tech === 'Unassigned') {
        toast.error('Technician Required', `Cannot start service for ${jobId}: You must assign a technician to the job card first.`);
        return;
      }
      if (targetJob.status === 'completed') {
        toast.warning('Job Completed', `${jobId} is already marked as completed.`);
        return;
      }
    }

    // Rule: Cannot complete service without technician
    if (newStatus === 'completed') {
      if (!targetJob.tech || targetJob.tech === 'Unassigned') {
        toast.error('Technician Required', `Cannot complete ${jobId} without an assigned technician.`);
        return;
      }
    }

    const updated = jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, status: newStatus };
      }
      return j;
    });

    setJobs(updated);
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob(prev => ({ ...prev, status: newStatus }));
    }

    try {
      localStorage.setItem('autolab_service_jobs', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('autolab_jobs_updated', { detail: { id: jobId, status: newStatus } }));
    } catch (e) {}

    try {
      await api.jobs.updateStatus(jobId, { status: newStatus });
      toast.success('Status Updated', `${jobId} is now ${newStatus.replace('_', ' ')}.`);
    } catch (err) {
      toast.info('Status Updated', `${jobId} is now ${newStatus.replace('_', ' ')}.`);
    }
  };

  // Parts update handler
  const handleUpdateParts = (jobId, partsList, partsTotal) => {
    const updated = jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, partsList, parts: partsTotal, total: (j.labor || 0) + partsTotal };
      }
      return j;
    });
    setJobs(updated);
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob(prev => ({ ...prev, partsList, parts: partsTotal, total: (prev.labor || 0) + partsTotal }));
    }
    try {
      localStorage.setItem('autolab_service_jobs', JSON.stringify(updated));
    } catch (e) {}
  };

  // Manual new job card handler
  const handleCreateJob = async (newJob) => {
    const updated = [newJob, ...jobs];
    setJobs(updated);
    try {
      localStorage.setItem('autolab_service_jobs', JSON.stringify(updated));
    } catch (e) {}

    try {
      await api.jobs.create({
        appt: newJob.appt,
        vehicle: newJob.vehicle,
        plate: newJob.plate,
        customer: newJob.customer,
        service: newJob.service,
        tech: newJob.tech,
        status: newJob.status,
        start: newJob.start,
        mileage: newJob.mileage,
        labor: newJob.labor,
        parts: newJob.parts
      });
      toast.success('Job Card Created', `${newJob.id} generated for ${newJob.customer}`);
    } catch (err) {
      toast.info('Job Card Created', `${newJob.id} generated locally for ${newJob.customer}`);
    }
  };

  const statuses = ['all', 'queued', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'];

  const filtered = jobs.filter(j => {
    const matchSearch = !search ||
      j.customer.toLowerCase().includes(search.toLowerCase()) ||
      j.id.toLowerCase().includes(search.toLowerCase()) ||
      j.plate.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-heading">Service Jobs</div>
          <div className="page-subheading">
            {jobs.filter(j => j.status === 'in_progress').length} in progress ·{' '}
            {jobs.filter(j => j.status === 'queued').length} queued ·{' '}
            {jobs.filter(j => j.status === 'assigned').length} assigned
          </div>
        </div>
        <div className="page-actions">
          {canWrite && (<button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={15} /> New Job Card
          </button>)}
        </div>
      </div>

      {/* Job Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Queued',      count: jobs.filter(j=>j.status==='queued').length,      color: 'var(--brand-warning)' },
          { label: 'Assigned',    count: jobs.filter(j=>j.status==='assigned').length,    color: 'var(--brand-primary)' },
          { label: 'In Progress', count: jobs.filter(j=>j.status==='in_progress').length, color: '#a78bfa' },
          { label: 'On Hold',     count: jobs.filter(j=>j.status==='on_hold').length,     color: 'var(--brand-warning)' },
          { label: 'Completed',   count: jobs.filter(j=>j.status==='completed').length,   color: 'var(--brand-success)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex gap-3 flex-wrap" style={{ gap: 12, alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input
              style={{ width: '100%' }}
              placeholder="Search job no, customer, plate…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {statuses.map(s => (
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
                <th>Job No.</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Service</th>
                <th>Technician</th>
                <th>Start</th>
                <th>Labor</th>
                <th>Parts</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No service jobs match your current search or status filter.
                  </td>
                </tr>
              ) : (
                filtered.map(j => (
                  <tr key={j.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="mono" style={{ fontWeight: 600 }}>{j.id}</span>
                      </div>
                      {j.appt && (
                        <div style={{ marginTop: 2 }}>
                          <span style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 122, 0, 0.15)',
                            color: 'var(--brand-primary)',
                            fontWeight: 700,
                            display: 'inline-block'
                          }}>
                            Appt: {j.appt}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{j.customer}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{j.plate}</div>
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>{j.vehicle}</td>
                    <td style={{ fontSize: 13 }}>{j.service}</td>
                    <td>
                      <select
                        className="form-control"
                        disabled={j.status === 'completed' || j.status === 'cancelled'}
                        style={{
                          fontSize: 12,
                          padding: '4px 8px',
                          height: 'auto',
                          width: '135px',
                          borderColor: j.tech && j.tech !== 'Unassigned' ? 'rgba(255,122,0,0.4)' : 'var(--border-subtle)',
                          color: j.tech && j.tech !== 'Unassigned' ? 'var(--brand-primary)' : 'var(--text-muted)',
                          fontWeight: j.tech && j.tech !== 'Unassigned' ? 600 : 400,
                          cursor: (j.status === 'completed' || j.status === 'cancelled') ? 'not-allowed' : 'pointer',
                          opacity: (j.status === 'completed' || j.status === 'cancelled') ? 0.75 : 1
                        }}
                        value={j.tech || 'Unassigned'}
                        onChange={(e) => handleAssignTech(j.id, e.target.value)}
                        title={j.status === 'completed' ? "Completed jobs cannot be reassigned" : "Assign or reassign technician"}
                      >
                        {TECHNICIANS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="muted">{j.start || '—'}</td>
                    <td>Rs. {j.labor}</td>
                    <td>Rs. {j.parts}</td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>Rs. {j.total}</td>
                    <td><StatusBadge status={j.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedJob(j)}>
                          Open
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Open WhatsApp notification for this vehicle / customer"
                          onClick={() => handleOpenWhatsApp(j, j.status === 'completed' ? 'work_completed' : (j.status === 'in_progress' ? 'work_started' : 'urgent_update'))}
                          style={{ padding: '4px 8px', borderColor: 'rgba(37,211,102,0.4)', color: '#25D366' }}
                        >
                          <MessageSquare size={13} />
                        </button>
                        {j.status === 'in_progress' ? (
                          <button
                            className="btn btn-success btn-sm"
                            title="Complete Service"
                            onClick={() => handleUpdateStatus(j.id, 'completed')}
                            style={{ padding: '4px 8px' }}
                          >
                            <Check size={13} />
                          </button>
                        ) : j.status !== 'completed' && j.status !== 'cancelled' ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            title={(!j.tech || j.tech === 'Unassigned') ? "Assign a technician before starting service" : "Start Service"}
                            onClick={() => {
                              if (!j.tech || j.tech === 'Unassigned') {
                                toast.error('Technician Required', `Cannot start service for ${j.id}: Assign a technician first.`);
                              } else {
                                handleUpdateStatus(j.id, 'in_progress');
                              }
                            }}
                            style={{
                              padding: '4px 8px',
                              color: (!j.tech || j.tech === 'Unassigned') ? 'var(--text-muted)' : 'var(--brand-primary)',
                              cursor: (!j.tech || j.tech === 'Unassigned') ? 'not-allowed' : 'pointer',
                              opacity: (!j.tech || j.tech === 'Unassigned') ? 0.45 : 1
                            }}
                          >
                            <Wrench size={13} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Stack (< 768px Viewports) */}
      <div className="mobile-card-stack">
        {filtered.length === 0 ? (
          <div className="card empty-state" style={{ padding: 24, textAlign: 'center' }}>
            <Wrench size={36} className="empty-icon" style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
            <div className="empty-title">No service jobs found</div>
            <div className="empty-desc">Try adjusting your filter or search query</div>
          </div>
        ) : (
          filtered.map(j => {
            const hasTech = j.tech && j.tech !== 'Unassigned';
            return (
              <div key={j.id} className="mobile-data-card">
                <div className="mobile-card-header">
                  <div>
                    <div className="mobile-card-title">{j.customer}</div>
                    <div className="mobile-card-subtitle flex items-center gap-2">
                      <span className="mono" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{j.id}</span>
                      {j.appt && <span className="badge badge-queued" style={{ fontSize: 9 }}>{j.appt}</span>}
                      <span>&middot;</span>
                      <span className="mono">{j.plate}</span>
                    </div>
                  </div>
                  <StatusBadge status={j.status} />
                </div>

                <div className="mobile-card-row">
                  <span style={{ color: 'var(--text-secondary)' }}>{j.vehicle}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-primary)' }}>
                    Rs. {j.total}.00
                  </span>
                </div>

                <div style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}>
                  <strong style={{ color: 'var(--text-muted)', fontSize: 11, display: 'block' }}>SERVICE:</strong>
                  {j.service}
                </div>

                {/* Tech Selector */}
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Technician:
                  </label>
                  <select
                    className="form-control"
                    style={{
                      fontSize: 13,
                      borderColor: hasTech ? 'var(--border-subtle)' : 'var(--brand-warning)',
                      color: hasTech ? 'var(--text-primary)' : 'var(--brand-warning)',
                      fontWeight: 600,
                      width: '100%'
                    }}
                    value={j.tech || 'Unassigned'}
                    onChange={(e) => handleAssignTech(j.id, e.target.value)}
                  >
                    <option value="Unassigned">Unassigned (Queue)</option>
                    {TECHNICIANS.map(t => (
                      <option key={t.name} value={t.name}>{t.name} ({t.grade})</option>
                    ))}
                  </select>
                </div>

                <div className="mobile-card-row" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>Labor: Rs. {j.labor}</span>
                  <span>Parts: Rs. {j.parts}</span>
                  <span>Started: {j.start || '—'}</span>
                </div>

                {/* Mobile Actions */}
                <div className="mobile-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setSelectedJob(j)}
                  >
                    Job Details
                  </button>

                  {(j.status === 'assigned' || j.status === 'in_progress') && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        color: hasTech ? 'var(--brand-primary)' : 'var(--text-muted)'
                      }}
                      disabled={!hasTech}
                      onClick={() => {
                        if (!hasTech) {
                          toast.warning('Technician Required', 'Assign a technician before starting.');
                          return;
                        }
                        handleUpdateStatus(j.id, j.status === 'in_progress' ? 'on_hold' : 'in_progress');
                      }}
                    >
                      <Wrench size={14} /> {j.status === 'in_progress' ? 'Pause' : 'Start'}
                    </button>
                  )}

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ borderColor: 'rgba(37,211,102,0.4)', color: '#25D366' }}
                    onClick={() => handleOpenWhatsApp(j, j.status === 'completed' ? 'work_completed' : 'work_started')}
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

      {showNew && (
        <NewJobModal
          onClose={() => setShowNew(false)}
          onSave={handleCreateJob}
        />
      )}

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onAssignTech={handleAssignTech}
          onUpdateStatus={handleUpdateStatus}
          onUpdateParts={handleUpdateParts}
          onOpenWhatsApp={handleOpenWhatsApp}
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
