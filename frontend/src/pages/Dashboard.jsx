import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  CalendarDays, Wrench, DollarSign, Car, TrendingUp,
  TrendingDown, AlertCircle, Users, ArrowRight, Clock
} from 'lucide-react';
import { STATS, REVENUE_DATA, SERVICES_REVENUE, APPOINTMENTS, SERVICE_JOBS } from '../data/mockData';
import { api } from '../services/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.dataKey === 'revenue' ? `Rs. ${p.value.toLocaleString()}` : p.value}
        </div>
      ))}
    </div>
  );
};

function StatCard({ icon: Icon, label, value, change, changeDir, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {change && (
          <div className={`stat-change ${changeDir}`}>
            {changeDir === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:     'badge-pending',
    confirmed:   'badge-confirmed',
    in_progress: 'badge-in-progress',
    completed:   'badge-completed',
    cancelled:   'badge-cancelled',
    queued:      'badge-queued',
    on_hold:     'badge-pending',
  };
  const labels = {
    pending: 'Pending', confirmed: 'Confirmed', in_progress: 'In Progress',
    completed: 'Completed', cancelled: 'Cancelled', queued: 'Queued', on_hold: 'On Hold',
  };
  return (
    <span className={`badge ${map[status] || 'badge-draft'}`}>
      <span className="badge-dot" />
      {labels[status] || status}
    </span>
  );
}

function loadFromStorage(key, fallback) {
  try {
    const d = JSON.parse(localStorage.getItem(key) || '[]');
    return d.length > 0 ? d : fallback;
  } catch { return fallback; }
}

export default function Dashboard({ onNav }) {
  const [stats, setStats] = useState(STATS);
  const [appointments, setAppointments] = useState(() => loadFromStorage('autolab_appointments', APPOINTMENTS));
  const [jobs, setJobs] = useState(() => loadFromStorage('autolab_service_jobs', SERVICE_JOBS));

  const refreshFromStorage = () => {
    setAppointments(loadFromStorage('autolab_appointments', APPOINTMENTS));
    setJobs(loadFromStorage('autolab_service_jobs', SERVICE_JOBS));
  };

  useEffect(() => {
    let isMounted = true;
    // Try live API
    Promise.allSettled([
      api.reports.getKpis(),
      api.appointments.getAll(),
      api.jobs.getAll()
    ]).then(([kpiRes, apptRes, jobRes]) => {
      if (!isMounted) return;
      if (kpiRes.status === 'fulfilled' && kpiRes.value) setStats(prev => ({ ...prev, ...kpiRes.value }));
      if (apptRes.status === 'fulfilled' && Array.isArray(apptRes.value) && apptRes.value.length > 0) {
        setAppointments(prev => {
          const stored = JSON.parse(localStorage.getItem('autolab_appointments') || '[]');
          const map = new Map();
          APPOINTMENTS.forEach(a => map.set(a.id, a));
          prev.forEach(a => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
          stored.forEach(a => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
          apptRes.value.forEach(a => map.set(a.id, { ...(map.get(a.id) || {}), ...a }));
          return Array.from(map.values());
        });
      }
      if (jobRes.status === 'fulfilled' && Array.isArray(jobRes.value) && jobRes.value.length > 0) {
        setJobs(prev => {
          const stored = JSON.parse(localStorage.getItem('autolab_service_jobs') || '[]');
          const map = new Map();
          SERVICE_JOBS.forEach(j => map.set(j.id, j));
          prev.forEach(j => map.set(j.id, { ...(map.get(j.id) || {}), ...j }));
          stored.forEach(j => map.set(j.id, { ...(map.get(j.id) || {}), ...j }));
          jobRes.value.forEach(j => map.set(j.id, { ...(map.get(j.id) || {}), ...j }));
          return Array.from(map.values());
        });
      }
    }).catch(() => {});
    // Also sync from localStorage on job updates, appt updates, storage event, and on focus
    window.addEventListener('autolab_jobs_updated', refreshFromStorage);
    window.addEventListener('autolab_appts_updated', refreshFromStorage);
    window.addEventListener('storage', refreshFromStorage);
    window.addEventListener('focus', refreshFromStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('autolab_jobs_updated', refreshFromStorage);
      window.removeEventListener('autolab_appts_updated', refreshFromStorage);
      window.removeEventListener('storage', refreshFromStorage);
      window.removeEventListener('focus', refreshFromStorage);
    };
  }, []);

  // Derive live KPI overrides from localStorage data
  const liveInvoices = (() => { try { return JSON.parse(localStorage.getItem('autolab_invoices') || '[]'); } catch { return []; } })();
  const pendingInvCount = liveInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length;
  const pendingInvAmt   = liveInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s,i) => s + (i.total - i.paid), 0);

  const todayAppts = appointments.filter(a => 
    a.date === '2026-09-26' || 
    a.date === '2026-09-27' || 
    a.date === '2026-09-28' || 
    a.status === 'pending'
  );
  const activeJobs = jobs.filter(j => ['in_progress', 'queued', 'assigned'].includes(j.status));

  return (
    <div>
      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard icon={CalendarDays} label="Today's Appointments" value={todayAppts.length || stats.todayAppointments}
          change={`${appointments.filter(a=>a.status==='pending').length} pending confirmation`} changeDir="up" color="blue" />
        <StatCard icon={Wrench} label="Active Jobs" value={activeJobs.length || stats.activeJobs}
          change={`${jobs.filter(j=>j.status==='queued').length} queued · ${jobs.filter(j=>j.status==='in_progress').length} in progress`} changeDir="flat" color="purple" />
        <StatCard icon={DollarSign} label="Monthly Revenue" value={`Rs. ${Number(stats.monthlyRevenue || 18640).toLocaleString()}`}
          change="+8.4% vs last month" changeDir="up" color="green" />
        <StatCard icon={Car} label="Vehicles Registered" value={stats.totalVehicles}
          change="+12 this month" changeDir="up" color="cyan" />
        <StatCard icon={AlertCircle} label="Pending Invoices" value={pendingInvCount || stats.pendingInvoices}
          change={pendingInvAmt > 0 ? `Rs. ${pendingInvAmt.toFixed(0)} outstanding` : 'All settled'} changeDir="flat" color="amber" />
        <StatCard icon={Users} label="Staff On Duty" value={`${stats.availableTechs || 5}/${stats.totalEmployees || 18}`}
          change="1 on leave" changeDir="flat" color="red" />
      </div>

      <div className="dashboard-grid">
        {/* Revenue Chart */}
        <div className="card span-2">
          <div className="section-header">
            <div>
              <div className="section-title">Revenue Trend</div>
              <div className="text-sm text-muted mt-1">Last 6 months — labor + parts</div>
            </div>
            <span className="badge badge-completed">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff7a00" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ff7a00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `Rs. ${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue"
                stroke="#ff7a00" strokeWidth={2}
                fill="url(#revGrad)" dot={{ fill: '#ff7a00', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Services breakdown */}
        <div className="card">
          <div className="section-header mb-4">
            <div className="section-title">Revenue by Service</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SERVICES_REVENUE.map((s) => {
              const pct = Math.round((s.revenue / 18640) * 100);
              return (
                <div key={s.name}>
                  <div className="flex justify-between mb-2" style={{ marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>Rs. {s.revenue.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jobs by category pie */}
        <div className="card">
          <div className="section-header mb-4">
            <div className="section-title">Jobs Distribution</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={SERVICES_REVENUE} dataKey="jobs" cx="50%" cy="50%"
                innerRadius={45} outerRadius={70} paddingAngle={3}>
                {SERVICES_REVENUE.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n, p) => [v + ' jobs', p.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 8 }}>
            {SERVICES_REVENUE.map((s) => (
              <div key={s.name} className="flex items-center gap-2" style={{ gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {s.name.split(' ')[0]} ({s.jobs})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="card span-2">
          <div className="section-header">
            <div className="section-title">Today's Appointments</div>
            <button className="section-action" onClick={() => onNav('appointments')}>
              View all <ArrowRight size={12} style={{ display: 'inline', marginLeft: 4 }} />
            </button>
          </div>
          <div className="desktop-table-view table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Service</th>
                  <th>Time</th>
                  <th>Technician</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAppts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.customer}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.plate}</div>
                    </td>
                    <td className="muted">{a.vehicle}</td>
                    <td>{a.service}</td>
                    <td>
                      <div className="flex items-center gap-2" style={{ gap: 6 }}>
                        <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                        <span>{a.time}</span>
                      </div>
                    </td>
                    <td className="muted">{a.tech || <span style={{ color: 'var(--brand-warning)' }}>Unassigned</span>}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack */}
          <div className="mobile-card-stack">
            {todayAppts.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                No appointments scheduled for today.
              </div>
            ) : (
              todayAppts.map((a) => (
                <div key={a.id} className="mobile-data-card" style={{ padding: 12 }}>
                  <div className="mobile-card-header">
                    <div>
                      <div className="mobile-card-title" style={{ fontSize: 14 }}>{a.customer}</div>
                      <div className="mobile-card-subtitle">{a.vehicle} &middot; <span className="mono">{a.plate}</span></div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mobile-card-row" style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{a.service}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-primary)', fontWeight: 600 }}>
                      <Clock size={12} /> {a.time}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Technician: <strong style={{ color: a.tech ? 'var(--text-primary)' : 'var(--brand-warning)' }}>{a.tech || 'Unassigned'}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Active Jobs</div>
            <button className="section-action" onClick={() => onNav('jobs')}>View all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeJobs.map((j) => (
              <div key={j.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 12px', background: 'var(--bg-hover)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="mono">{j.id}</span>
                    <StatusBadge status={j.status} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{j.customer}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {j.plate} · {j.service}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Technician: {j.tech}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Quick Alerts</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="alert alert-warning">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600 }}>3 Parts Low Stock</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>Air Filter, Rear Brake Pads, Coolant need reorder</div>
              </div>
            </div>
            <div className="alert alert-danger">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600 }}>1 Invoice Overdue</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>Grace Addo — INV-2026-00039 (Rs. 189)</div>
              </div>
            </div>
            <div className="alert alert-info">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600 }}>3 Appointments Unconfirmed</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>Pending technician assignment</div>
              </div>
            </div>
            <div className="alert alert-success">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600 }}>September Payroll Ready</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>5 payrolls in draft — approve to process</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
