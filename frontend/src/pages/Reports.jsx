import { usePermission } from "../hooks/usePermission";
import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { REVENUE_DATA, SERVICES_REVENUE, SERVICE_JOBS, APPOINTMENTS } from '../data/mockData';

// ── Live data helpers ─────────────────────────────────────────────────
function fromStorage(key, fallback) {
  try {
    const d = JSON.parse(localStorage.getItem(key) || '[]');
    return d.length > 0 ? d : fallback;
  } catch { return fallback; }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.dataKey === 'revenue' ? `Rs. ${p.value.toLocaleString()}` : p.value}
        </div>
      ))}
    </div>
  );
};

const DEPT_DATA = [
  { dept: 'Workshop',   count: 5 },
  { dept: 'Front Desk', count: 2 },
  { dept: 'Management', count: 3 },
  { dept: 'Accounts',   count: 1 },
  { dept: 'Stores',     count: 1 },
];

export default function Reports() {
  const { canWrite, canDelete } = usePermission("reports");
  // ── Live data from localStorage ──────────────────────────────────────
  const jobs     = useMemo(() => fromStorage('autolab_service_jobs', SERVICE_JOBS), []);
  const appts    = useMemo(() => fromStorage('autolab_appointments', APPOINTMENTS), []);
  const invoices = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('autolab_invoices') || '[]'); } catch { return []; }
  }, []);
  const parts    = useMemo(() => {
    try {
      const d = JSON.parse(localStorage.getItem('autolab_inventory') || '[]');
      return d.length > 0 ? d : [];
    } catch { return []; }
  }, []);

  // KPI calculations
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const totalRevenue  = jobs.reduce((s, j) => s + (j.total || 0), 0);
  const avgJobValue   = completedJobs > 0 ? Math.round(totalRevenue / completedJobs) : 0;
  const outstanding   = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
  const outstandingAmt = outstanding.reduce((s, i) => s + ((i.total || 0) - (i.paid || 0)), 0);

  // Appointment status donut (from live data)
  const statusColors = { completed: '#10b981', in_progress: '#ea580c', confirmed: '#ff7a00', pending: '#f59e0b', cancelled: '#ef4444' };
  const statusLabels = { completed: 'Completed', in_progress: 'In Progress', confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled' };
  const apptStatusData = Object.entries(
    appts.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {})
  ).map(([status, value]) => ({ name: statusLabels[status] || status, value, color: statusColors[status] || '#888' }))
   .filter(d => d.value > 0);

  // Parts health from localStorage inventory
  const partsTotal   = parts.length;
  const partsIn      = parts.filter(p => p.stock > p.reorder).length;
  const partsLow     = parts.filter(p => p.stock <= p.reorder && p.stock > 0).length;
  const partsOut     = parts.filter(p => p.stock === 0).length;

  const kpis = [
    { label: 'Sep Revenue',        value: `Rs. ${totalRevenue > 0 ? totalRevenue.toLocaleString() : '18,640'}`, trend: '+8.4% vs last month', up: true  },
    { label: 'Jobs Completed',     value: completedJobs || 142, trend: '+4 jobs',  up: true  },
    { label: 'Avg Job Value',      value: `Rs. ${avgJobValue || 131}`,             trend: '+Rs. 12',  up: true  },
    { label: 'Outstanding Inv.',   value: `Rs. ${outstandingAmt > 0 ? outstandingAmt.toFixed(0) : '291'}`, trend: `${outstanding.length || 3} open`, up: false },
    { label: 'Payroll This Month', value: 'Rs. 21,490',         trend: '10 staff', up: null  },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-heading">Reports &amp; Analytics</div>
          <div className="page-subheading">Business performance overview · Auto Lab 360 · Kegalle</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary">Export PDF</button>
          <button className="btn btn-secondary">Export Excel</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{k.value}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: k.up === null ? 'var(--text-muted)' : k.up ? 'var(--brand-success)' : 'var(--brand-danger)' }}>
              {k.up === true ? '↑' : k.up === false ? '↓' : '•'} {k.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Trend */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <div>
            <div className="section-title">Monthly Revenue &amp; Jobs</div>
            <div className="text-sm text-muted mt-1">Last 6 months</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={REVENUE_DATA}>
            <defs>
              <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ff7a00" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ff7a00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v=>`Rs. ${(v/1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#ff7a00" strokeWidth={2} fill="url(#r1)" dot={{ fill: '#ff7a00', r: 4 }} />
            <Bar yAxisId="right" dataKey="jobs" name="Jobs" fill="#ea580c" opacity={0.5} radius={[3,3,0,0]} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* Revenue by Category */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Revenue by Service Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SERVICES_REVENUE} layout="vertical">
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v=>`Rs. ${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip formatter={v=>[`Rs. ${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[0,4,4,0]}>
                {SERVICES_REVENUE.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment Status Donut — LIVE */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Appointment Status (Live)</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 16 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={apptStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {apptStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {apptStatusData.map(d => (
                <div key={d.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2" style={{ gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {/* Staff by Department */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Headcount by Department</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DEPT_DATA}>
              <XAxis dataKey="dept" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" name="Employees" fill="#7c3aed" radius={[4,4,0,0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Parts Inventory Status — LIVE */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Parts Stock Health</div>
          {[
            { label: 'Total SKUs',   value: partsTotal || 10, pct: 100, color: 'var(--brand-primary)' },
            { label: 'In Stock',     value: partsIn    || 7,  pct: partsTotal ? Math.round(partsIn/partsTotal*100)    : 70,  color: 'var(--brand-success)' },
            { label: 'Low Stock',    value: partsLow   || 2,  pct: partsTotal ? Math.round(partsLow/partsTotal*100)   : 20,  color: 'var(--brand-warning)' },
            { label: 'Out of Stock', value: partsOut   || 1,  pct: partsTotal ? Math.round(partsOut/partsTotal*100)   : 10,  color: 'var(--brand-danger)'  },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: 12 }}>
              <div className="flex justify-between" style={{ marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.max(row.pct, 3)}%`, background: row.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

