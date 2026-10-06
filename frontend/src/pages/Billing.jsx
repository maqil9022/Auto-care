import { usePermission } from "../hooks/usePermission";
import { useState, useEffect } from 'react';
import { Plus, Search, X, DollarSign, CreditCard, Printer, RefreshCw } from 'lucide-react';
import { INVOICES, SERVICE_JOBS } from '../data/mockData';
import { useToast } from '../context/ToastContext';

// ── Helpers ──────────────────────────────────────────────────────────
function loadJobs() {
  try {
    const stored = JSON.parse(localStorage.getItem('autolab_service_jobs') || '[]');
    if (stored.length > 0) return stored;
  } catch (e) {}
  return SERVICE_JOBS;
}

function loadInvoices(liveJobs) {
  try {
    const stored = JSON.parse(localStorage.getItem('autolab_invoices') || '[]');
    if (stored.length > 0) {
      // Re-derive subtotals from live job data every time
      return stored.map(inv => recomputeInvoice(inv, liveJobs));
    }
  } catch (e) {}
  // Seed from mockData, re-compute with live job totals
  return INVOICES.map(inv => recomputeInvoice({ ...inv }, liveJobs));
}

// Re-compute an invoice's subtotal/total from the linked job's current total
function recomputeInvoice(inv, jobs) {
  const job = jobs.find(j => j.id === inv.job);
  if (!job) return inv;
  const subtotal = job.total || inv.subtotal;
  const discount = inv.discount || 0;
  const taxRate  = inv.tax || 5;
  const taxAmt   = ((subtotal - discount) * taxRate) / 100;
  const total    = parseFloat(((subtotal - discount) + taxAmt).toFixed(2));
  return { ...inv, subtotal, total };
}

function StatusBadge({ status }) {
  const map    = { draft: 'badge-draft', issued: 'badge-confirmed', partially_paid: 'badge-in-progress', paid: 'badge-paid', overdue: 'badge-overdue', cancelled: 'badge-cancelled' };
  const labels = { draft: 'Draft', issued: 'Issued', partially_paid: 'Partially Paid', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' };
  return <span className={`badge ${map[status] || ''}`}><span className="badge-dot" />{labels[status] || status}</span>;
}

// ── Payment Modal ────────────────────────────────────────────────────
function PaymentModal({ invoice, onClose, onPaid }) {
  const [amount, setAmount] = useState((invoice.total - invoice.paid).toFixed(2));
  const [method, setMethod] = useState('Cash');
  const toast = useToast();

  const handleSubmit = () => {
    const paid = parseFloat(amount);
    if (!paid || paid <= 0) { toast.warning('Invalid', 'Enter a valid amount.'); return; }
    const newPaid  = Math.min(invoice.paid + paid, invoice.total);
    const newStatus = newPaid >= invoice.total ? 'paid' : 'partially_paid';
    onPaid(invoice.id, newPaid, newStatus, method);
    toast.success('Payment Recorded', `Rs. ${paid.toFixed(2)} via ${method} for ${invoice.invoiceNo}`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <span className="modal-title">Record Payment</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <DollarSign size={14} />
            <div>
              <div>{invoice.invoiceNo} · {invoice.customer}</div>
              <div style={{ fontSize: 12, marginTop: 2 }}>
                Balance: <strong>Rs. {(invoice.total - invoice.paid).toFixed(2)}</strong>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Amount <span>*</span></label>
            <input type="number" inputMode="decimal" className="form-control" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method <span>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {['Cash','Card','Bank Transfer','Mobile Pay','Cheque'].map(m => (
                <label key={m} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)', background: method === m ? 'rgba(255,122,0,0.1)' : 'var(--bg-card)',
                  border: `1px solid ${method === m ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                  fontSize: 12, cursor: 'pointer'
                }}>
                  <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} style={{ accentColor: 'var(--brand-primary)' }} />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Date</label>
            <input type="date" className="form-control" defaultValue={new Date().toISOString().slice(0,10)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <CreditCard size={15} /> Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Invoice Modal ────────────────────────────────────────────────
function NewInvoiceModal({ jobs, onClose, onSave }) {
  const [jobId,    setJobId]    = useState('');
  const [due,      setDue]      = useState(new Date().toISOString().slice(0,10));
  const [taxRate,  setTaxRate]  = useState(5);
  const [discount, setDiscount] = useState(0);
  const [notes,    setNotes]    = useState('');
  const toast = useToast();

  const selectedJob = jobs.find(j => j.id === jobId);

  const subtotal = selectedJob?.total || 0;
  const taxAmt   = ((subtotal - Number(discount)) * Number(taxRate)) / 100;
  const total    = parseFloat(((subtotal - Number(discount)) + taxAmt).toFixed(2));

  const handleCreate = () => {
    if (!jobId) { toast.warning('Required', 'Select a job card to invoice.'); return; }
    const inv = {
      id: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      customer: selectedJob?.customer || '',
      job: jobId,
      date: new Date().toISOString().slice(0,10),
      due,
      subtotal,
      discount: Number(discount),
      tax: Number(taxRate),
      total,
      paid: 0,
      status: 'draft',
      method: null
    };
    onSave(inv);
    toast.success('Invoice Created', `${inv.invoiceNo} created for ${inv.customer}`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <span className="modal-title">Create Invoice</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Job Card <span>*</span></label>
              <select className="form-control" value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">— Select a job —</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.id} — {j.customer} (Rs. {j.total})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date <span>*</span></label>
              <input type="date" className="form-control" value={due} onChange={e => setDue(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tax Rate (%)</label>
              <input type="number" className="form-control" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Discount (Rs.)</label>
              <input type="number" className="form-control" value={discount} onChange={e => setDiscount(e.target.value)} />
            </div>
          </div>
          {selectedJob && (
            <div style={{ padding: '12px 14px', background: 'rgba(255,122,0,0.06)', border: '1px solid rgba(255,122,0,0.2)', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Invoice Preview</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--brand-success)' }}>
                <span>Discount</span><span>- Rs. {Number(discount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Tax ({taxRate}%)</span><span>Rs. {taxAmt.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)', color: 'var(--brand-primary)' }}>
                <span>Total</span><span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Notes</label>
            <textarea className="form-control" placeholder="Invoice notes…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Plus size={15} /> Create Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Billing Page ────────────────────────────────────────────────
export default function Billing() {
  const { canWrite, canDelete } = usePermission("billing");
  const toast = useToast();

  // Load live jobs from localStorage (same store ServiceJobs writes to)
  const [jobs, setJobs] = useState(loadJobs);

  // Invoices derived + persisted in localStorage
  const [invoices, setInvoices] = useState(() => loadInvoices(loadJobs()));

  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter] = useState('all');
  const [payInvoice,  setPayInvoice]  = useState(null);
  const [showNew,     setShowNew]     = useState(false);

  // Listen for job updates from ServiceJobs (fires when parts/services are saved)
  useEffect(() => {
    const onJobsUpdated = () => {
      const freshJobs = loadJobs();
      setJobs(freshJobs);
      // Re-derive all invoice totals from fresh job data
      setInvoices(prev => prev.map(inv => recomputeInvoice({ ...inv }, freshJobs)));
    };
    window.addEventListener('autolab_jobs_updated', onJobsUpdated);
    // Also re-sync on focus (switching tabs)
    window.addEventListener('focus', onJobsUpdated);
    return () => {
      window.removeEventListener('autolab_jobs_updated', onJobsUpdated);
      window.removeEventListener('focus', onJobsUpdated);
    };
  }, []);

  // Persist invoices whenever they change
  useEffect(() => {
    try { localStorage.setItem('autolab_invoices', JSON.stringify(invoices)); } catch (e) {}
  }, [invoices]);

  // Record a payment
  const handlePaid = (invoiceId, newPaid, newStatus) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId ? { ...inv, paid: newPaid, status: newStatus } : inv
    ));
  };

  // Add new invoice
  const handleNewInvoice = (inv) => {
    setInvoices(prev => [inv, ...prev]);
  };

  // Manual refresh from localStorage
  const handleRefresh = () => {
    const freshJobs = loadJobs();
    setJobs(freshJobs);
    setInvoices(prev => prev.map(inv => recomputeInvoice({ ...inv }, freshJobs)));
    toast.info('Refreshed', 'Invoice totals synced from latest job data.');
  };

  const statuses = ['all','draft','issued','partially_paid','paid','overdue'];

  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalInvoiced    = invoices.reduce((s,i) => s + i.total, 0);
  const totalPaid        = invoices.filter(i => i.status === 'paid').reduce((s,i) => s + i.total, 0);
  const totalOutstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s,i) => s + (i.total - i.paid), 0);
  const totalOverdue     = invoices.filter(i => i.status === 'overdue').reduce((s,i) => s + (i.total - i.paid), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-heading">Billing &amp; Invoices</div>
          <div className="page-subheading">{invoices.length} invoices · Rs. {totalOutstanding.toFixed(2)} outstanding</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleRefresh} title="Sync totals from latest job data">
            <RefreshCw size={14} /> Sync Totals
          </button>
          {canWrite && (<button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={15} /> New Invoice
          </button>)}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Invoiced', value: `Rs. ${totalInvoiced.toFixed(2)}`,    color: 'var(--text-primary)' },
          { label: 'Total Paid',     value: `Rs. ${totalPaid.toFixed(2)}`,        color: 'var(--brand-success)' },
          { label: 'Outstanding',    value: `Rs. ${totalOutstanding.toFixed(2)}`, color: 'var(--brand-warning)' },
          { label: 'Overdue',        value: `Rs. ${totalOverdue.toFixed(2)}`,     color: 'var(--brand-danger)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1 }}>
            <Search size={14} className="search-icon" />
            <input style={{ width: '100%' }} placeholder="Search invoice no, customer…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {statuses.map(s => (
              <button key={s} className={`tab${statusFilter===s?' active':''}`} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All' : s.replace('_',' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Invoices Table */}
      <div className="card desktop-table-view">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Customer</th>
                <th>Job</th>
                <th>Date</th>
                <th>Due</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No invoices match your filter.
                  </td>
                </tr>
              ) : filtered.map(inv => {
                const balance = inv.total - inv.paid;
                return (
                  <tr key={inv.id}>
                    <td><span className="mono">{inv.invoiceNo}</span></td>
                    <td style={{ fontWeight: 600 }}>{inv.customer}</td>
                    <td><span className="mono" style={{ fontSize: 11 }}>{inv.job}</span></td>
                    <td className="muted">{inv.date}</td>
                    <td className="muted">{inv.due}</td>
                    <td>Rs. {typeof inv.subtotal === 'number' ? inv.subtotal.toFixed(2) : inv.subtotal}</td>
                    <td style={{ color: 'var(--brand-success)' }}>Rs. {(inv.discount||0).toFixed(2)}</td>
                    <td className="muted">{inv.tax}%</td>
                    <td style={{ fontWeight: 700 }}>Rs. {typeof inv.total === 'number' ? inv.total.toFixed(2) : inv.total}</td>
                    <td style={{ color: 'var(--brand-success)' }}>Rs. {(inv.paid||0).toFixed(2)}</td>
                    <td style={{ fontWeight: 700, color: balance > 0.01 ? 'var(--brand-danger)' : 'var(--brand-success)' }}>
                      Rs. {balance.toFixed(2)}
                    </td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => setPayInvoice(inv)}>
                            Pay
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm btn-icon-only" title="Print">
                          <Printer size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Stack (< 768px Viewports) */}
      <div className="mobile-card-stack">
        {filtered.length === 0 ? (
          <div className="card empty-state" style={{ padding: 24, textAlign: 'center' }}>
            <FileText size={36} className="empty-icon" style={{ margin: '0 auto 8px', color: 'var(--text-muted)' }} />
            <div className="empty-title">No invoices found</div>
            <div className="empty-desc">Try adjusting your filter or search query</div>
          </div>
        ) : (
          filtered.map(inv => {
            const balance = inv.total - inv.paid;
            return (
              <div key={inv.id} className="mobile-data-card">
                <div className="mobile-card-header">
                  <div>
                    <div className="mobile-card-title">{inv.customer}</div>
                    <div className="mobile-card-subtitle flex items-center gap-2">
                      <span className="mono" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                        {inv.invoiceNo}
                      </span>
                      <span>&middot;</span>
                      <span className="mono">{inv.job}</span>
                    </div>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>

                <div className="mobile-card-row">
                  <span style={{ color: 'var(--text-muted)' }}>Due Date: {inv.due}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--brand-primary)' }}>
                    Rs. {typeof inv.total === 'number' ? inv.total.toFixed(2) : inv.total}
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg-surface)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>PAID</span>
                    <strong style={{ color: 'var(--brand-success)' }}>Rs. {(inv.paid || 0).toFixed(2)}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 10 }}>BALANCE</span>
                    <strong style={{ color: balance > 0.01 ? 'var(--brand-danger)' : 'var(--brand-success)' }}>
                      Rs. {balance.toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mobile-card-actions">
                  {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setPayInvoice(inv)}
                    >
                      <CreditCard size={14} /> Record Payment
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: inv.status === 'paid' ? 1 : undefined, justifyContent: 'center' }}
                    onClick={() => window.print()}
                  >
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showNew    && <NewInvoiceModal jobs={jobs} onClose={() => setShowNew(false)} onSave={handleNewInvoice} />}
      {payInvoice && <PaymentModal invoice={payInvoice} onClose={() => setPayInvoice(null)} onPaid={handlePaid} />}
    </div>
  );
}


