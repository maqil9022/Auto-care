import { usePermission } from "../hooks/usePermission";
import { useState, useEffect } from "react";
import { Plus, Search, X, DollarSign, Users, Clock, CheckCircle, Eye, Edit2 } from "lucide-react";
import { EMPLOYEES, PAYROLL, ATTENDANCE_TODAY } from "../data/mockData";
import { useToast } from "../context/ToastContext";

const DEPT_COLORS = {
  Workshop: "#ff7a00", "Front Desk": "#7c3aed", Management: "#f59e0b",
  Accounts: "#10b981", Stores: "#22d3ee",
};

function fromStorage(key, fallback) {
  try { const d = JSON.parse(localStorage.getItem(key) || "[]"); return d.length > 0 ? d : fallback; }
  catch { return fallback; }
}
function saveStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function EmployeeAvatar({ name, dept }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const color = DEPT_COLORS[dept] || "#7c3aed";
  return (
    <div className="avatar" style={{ background: `${color}22`, color, fontWeight: 700 }}>
      {initials}
    </div>
  );
}

function EmployeeModal({ onClose, onSave, initial }) {
  const toast = useToast();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    firstName: initial?.name?.split(" ")[0] || "",
    lastName:  initial?.name?.split(" ").slice(1).join(" ") || "",
    email:     initial?.email || "",
    phone:     initial?.phone || "",
    dept:      initial?.dept  || "Workshop",
    role:      initial?.role  || "Technician",
    type:      initial?.type  || "full_time",
    hire:      initial?.hire  || "2026-09-26",
    salary:    initial?.salary || "",
    nationalId: initial?.nationalId || "",
    bank:      initial?.bank  || "",
    bankAcc:   initial?.bankAcc || "",
    emergName: initial?.emergName || "",
    emergPhone: initial?.emergPhone || "",
    status:    initial?.status || "active",
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.salary) {
      toast.warning("Required Fields", "First Name, Last Name and Salary are required.");
      return;
    }
    onSave({
      id:         initial?.id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name:       `${form.firstName.trim()} ${form.lastName.trim()}`,
      email:      form.email.trim(),
      phone:      form.phone.trim(),
      dept:       form.dept,
      role:       form.role,
      type:       form.type,
      hire:       form.hire,
      salary:     Number(form.salary),
      nationalId: form.nationalId.trim(),
      bank:       form.bank.trim(),
      bankAcc:    form.bankAcc.trim(),
      emergName:  form.emergName.trim(),
      emergPhone: form.emergPhone.trim(),
      status:     form.status,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <span className="modal-title">{isEdit ? "Edit Employee" : "Add New Employee"}</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label className="form-label">First Name <span>*</span></label>
              <input className="form-control" placeholder="First name" value={form.firstName} onChange={e => set("firstName", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Last Name <span>*</span></label>
              <input className="form-control" placeholder="Last name" value={form.lastName} onChange={e => set("lastName", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Email</label>
              <input type="email" className="form-control" placeholder="email@autolab360.com" value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Phone</label>
              <input type="tel" inputMode="tel" className="form-control" placeholder="07X XXXXXXX" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Department <span>*</span></label>
              <select className="form-control" value={form.dept} onChange={e => set("dept", e.target.value)}>
                <option>Workshop</option><option>Front Desk</option>
                <option>Management</option><option>Accounts</option><option>Stores</option>
              </select></div>
            <div className="form-group"><label className="form-label">Job Title <span>*</span></label>
              <select className="form-control" value={form.role} onChange={e => set("role", e.target.value)}>
                <option>Technician</option><option>Senior Technician</option>
                <option>Junior Technician</option><option>Service Advisor</option>
                <option>Receptionist</option><option>HR Manager</option>
                <option>Accountant</option><option>Store Keeper</option>
              </select></div>
            <div className="form-group"><label className="form-label">Employment Type</label>
              <select className="form-control" value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
              </select></div>
            <div className="form-group"><label className="form-label">Hire Date <span>*</span></label>
              <input type="date" className="form-control" value={form.hire} onChange={e => set("hire", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Basic Salary (Rs.) <span>*</span></label>
              <input type="number" className="form-control" placeholder="e.g. 35000" value={form.salary} onChange={e => set("salary", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">National ID</label>
              <input className="form-control" placeholder="CNIC / National ID" value={form.nationalId} onChange={e => set("nationalId", e.target.value)} /></div>
            {isEdit && (
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => set("status", e.target.value)}>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select></div>
            )}
          </div>
          <div className="divider" />
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Bank Name</label>
              <input className="form-control" placeholder="Bank name" value={form.bank} onChange={e => set("bank", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Bank Account No</label>
              <input className="form-control" placeholder="Account number" value={form.bankAcc} onChange={e => set("bankAcc", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Emergency Contact Name</label>
              <input className="form-control" placeholder="Full name" value={form.emergName} onChange={e => set("emergName", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Emergency Contact Phone</label>
              <input className="form-control" placeholder="Phone number" value={form.emergPhone} onChange={e => set("emergPhone", e.target.value)} /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Plus size={15} /> {isEdit ? "Save Changes" : "Add Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewProfileModal({ emp, onClose }) {
  const color = DEPT_COLORS[emp.dept] || "#7c3aed";
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <span className="modal-title">Employee Profile</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div className="avatar" style={{ background: `${color}22`, color, fontWeight: 700, width: 56, height: 56, fontSize: 20 }}>
              {emp.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{emp.name}</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{emp.role}</div>
              <span style={{ background: `${color}22`, color, padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{emp.dept}</span>
            </div>
          </div>
          <div className="divider" />
          <div className="form-grid" style={{ gap: 12 }}>
            {[
              ["Employee ID", emp.id],
              ["Hire Date", emp.hire],
              ["Employment Type", emp.type?.replace("_"," ")],
              ["Status", emp.status],
              ["Basic Salary", `Rs. ${Number(emp.salary).toLocaleString()}`],
              ["Phone", emp.phone || "�"],
              ["Email", emp.email || "�"],
              ["National ID", emp.nationalId || "�"],
              ["Bank", emp.bank || "�"],
              ["Bank Account", emp.bankAcc || "�"],
              ["Emergency Contact", emp.emergName || "�"],
              ["Emergency Phone", emp.emergPhone || "�"],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, textTransform: "capitalize" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function MarkAttendanceModal({ employees, onClose, onMark }) {
  const toast = useToast();
  const [empId,    setEmpId]    = useState(employees[0]?.id || "");
  const [status,   setStatus]   = useState("present");
  const [checkIn,  setCheckIn]  = useState("09:00");
  const [checkOut, setCheckOut] = useState("18:00");
  const [ot,       setOt]       = useState("0");

  const handleMark = () => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    onMark({ emp: empId, name: emp.name, status, checkIn: (status==="present"||status==="late") ? checkIn : null, checkOut: (status==="present"||status==="late") ? checkOut : null, ot: Number(ot) || 0 });
    toast.success("Attendance Marked", `${emp.name} marked as ${status.replace("_"," ")}.`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-handle-bar" />
        <div className="modal-header">
          <span className="modal-title">Mark Attendance</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Employee <span>*</span></label>
            <select className="form-control" value={empId} onChange={e => setEmpId(e.target.value)}>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Status <span>*</span></label>
            <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="on_leave">On Leave</option>
              <option value="absent">Absent</option>
            </select></div>
          {(status === "present" || status === "late") && (
            <>
              <div className="form-group"><label className="form-label">Check In</label>
                <input type="time" className="form-control" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Check Out</label>
                <input type="time" className="form-control" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Overtime Hours</label>
                <input type="number" className="form-control" value={ot} onChange={e => setOt(e.target.value)} min="0" step="0.5" /></div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleMark}><CheckCircle size={15} /> Mark Attendance</button>
        </div>
      </div>
    </div>
  );
}

function PayrollSection({ employees }) {
  const toast = useToast();
  const [payroll, setPayroll] = useState(() => fromStorage("autolab_payroll", PAYROLL));

  const savePayroll = (updated) => { setPayroll(updated); saveStorage("autolab_payroll", updated); };

  const approve = (id) => {
    savePayroll(payroll.map(p => p.id === id ? { ...p, status: "approved" } : p));
    toast.success("Payroll Approved", `Record ${id} approved.`);
  };
  const markPaid = (id) => {
    savePayroll(payroll.map(p => p.id === id ? { ...p, status: "paid" } : p));
    toast.success("Marked as Paid", `Record ${id} marked as paid.`);
  };
  const approveAll = () => {
    const drafts = payroll.filter(p => p.status === "draft").length;
    if (drafts === 0) { toast.info("Nothing to Approve", "No draft records found."); return; }
    savePayroll(payroll.map(p => p.status === "draft" ? { ...p, status: "approved" } : p));
    toast.success("All Approved", `${drafts} draft record(s) approved.`);
  };
  const runPayroll = () => {
    const period = "Sep 2026";
    const existingEmpIds = payroll.map(p => p.empId);
    const newRecords = employees
      .filter(e => !existingEmpIds.includes(e.id) && e.status === "active")
      .map(e => ({
        id:         `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        empId:      e.id,
        name:       e.name,
        period,
        basic:      e.salary,
        overtime:   0,
        otRate:     Math.round(e.salary / 208),
        allowances: Math.round(e.salary * 0.1),
        deductions: Math.round(e.salary * 0.05),
        status:     "draft",
      }));
    if (newRecords.length > 0) {
      savePayroll([...payroll, ...newRecords]);
      toast.success("Payroll Run", `Generated ${newRecords.length} new record(s) for ${period}.`);
    } else {
      toast.info("Up to Date", "All active employees already have payroll records for this period.");
    }
  };

  const statusMap = { draft: "badge-draft", approved: "badge-confirmed", paid: "badge-paid" };
  const totalBasic  = payroll.reduce((s,p) => s+p.basic, 0);
  const totalAllow  = payroll.reduce((s,p) => s+p.allowances, 0);
  const totalDeduct = payroll.reduce((s,p) => s+p.deductions, 0);
  const totalNet    = payroll.reduce((s,p) => { const ot=p.overtime*p.otRate; return s+p.basic+ot+p.allowances-p.deductions; }, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>September 2026 Payroll</div>
          <div className="page-subheading">
            {payroll.length} records � {payroll.filter(p=>p.status==="approved").length} approved � {payroll.filter(p=>p.status==="paid").length} paid � {payroll.filter(p=>p.status==="draft").length} draft
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={runPayroll}>Run Payroll Period</button>
          <button className="btn btn-primary" onClick={approveAll}><CheckCircle size={15} /> Approve All</button>
        </div>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th><th>Period</th><th>Basic</th>
                <th>OT Hrs</th><th>OT Amt</th><th>Allowances</th>
                <th>Deductions</th><th>Gross</th><th>Net</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map(p => {
                const otAmount = p.overtime * p.otRate;
                const gross = p.basic + otAmount + p.allowances;
                const net = gross - p.deductions;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td className="muted">{p.period}</td>
                    <td>Rs. {p.basic.toLocaleString()}</td>
                    <td>{p.overtime}h</td>
                    <td>Rs. {otAmount.toFixed(0)}</td>
                    <td style={{ color: "var(--brand-success)" }}>+Rs. {p.allowances}</td>
                    <td style={{ color: "var(--brand-danger)" }}>-Rs. {p.deductions}</td>
                    <td style={{ fontWeight: 600 }}>Rs. {gross.toFixed(0)}</td>
                    <td style={{ fontWeight: 700, color: "var(--brand-primary)" }}>Rs. {net.toFixed(0)}</td>
                    <td>
                      <span className={`badge ${statusMap[p.status] || "badge-draft"}`}>
                        <span className="badge-dot" />
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {p.status === "draft" && (
                          <button className="btn btn-success btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => approve(p.id)}>Approve</button>
                        )}
                        {p.status === "approved" && (
                          <button className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => markPaid(p.id)}>Mark Paid</button>
                        )}
                        <button className="btn btn-secondary btn-sm" style={{ fontSize: 11, padding: "4px 10px" }}
                          onClick={() => toast.info("Payroll Slip", `${p.name} � Net: Rs. ${net.toFixed(0)} | Period: ${p.period} | Status: ${p.status}`)}>
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {payroll.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No records. Click "Run Payroll Period" to generate.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="divider" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { label: "Total Basic",       value: `Rs. ${totalBasic.toLocaleString()}`,  color: "var(--text-primary)"   },
            { label: "Total Allowances",  value: `Rs. ${totalAllow.toLocaleString()}`,  color: "var(--brand-success)"  },
            { label: "Total Deductions",  value: `Rs. ${totalDeduct.toLocaleString()}`, color: "var(--brand-danger)"   },
            { label: "Total Net Payroll", value: `Rs. ${Math.round(totalNet).toLocaleString()}`, color: "var(--brand-primary)" },
          ].map(row => (
            <div key={row.label} style={{ padding: "12px 14px", background: "var(--bg-card)", borderRadius: "var(--radius-sm)", textAlign: "center", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{row.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: row.color }}>{row.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AttendanceSection({ employees }) {
  const toast = useToast();
  const [attendance, setAttendance] = useState(() => fromStorage("autolab_attendance", ATTENDANCE_TODAY));
  const [showMark, setShowMark] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const getCurrentTime = () => {
    const h = String(new Date().getHours()).padStart(2, "0");
    const m = String(new Date().getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const handleMark = (record) => {
    setAttendance(prev => {
      const updated = [record, ...prev.filter(a => a.emp !== record.emp)];
      saveStorage("autolab_attendance", updated);
      return updated;
    });
  };

  const handleCheckIn = (empId) => {
    const time = getCurrentTime();
    const isLate = time > "09:00";
    setAttendance(prev => {
      const updated = prev.map(a =>
        a.emp === empId ? { ...a, checkIn: time, status: isLate ? "late" : "present" } : a
      );
      saveStorage("autolab_attendance", updated);
      return updated;
    });
    toast.success("Checked In", `Check-in recorded at ${time}${isLate ? " (Late)" : ""}.`);
  };

  const handleCheckOut = (empId) => {
    const time = getCurrentTime();
    setAttendance(prev => {
      const updated = prev.map(a => {
        if (a.emp !== empId) return a;
        let ot = 0;
        if (a.checkIn) {
          const [ih, im] = a.checkIn.split(":").map(Number);
          const [oh, om] = time.split(":").map(Number);
          const workedMins = (oh * 60 + om) - (ih * 60 + im);
          const otMins = Math.max(0, workedMins - 480);
          ot = Math.round(otMins / 30) * 0.5;
        }
        return { ...a, checkOut: time, ot };
      });
      saveStorage("autolab_attendance", updated);
      return updated;
    });
    toast.success("Checked Out", `Check-out recorded at ${time}.`);
  };

  const statusColor = {
    present: "var(--brand-success)", late: "var(--brand-warning)",
    on_leave: "var(--text-muted)",   absent: "var(--brand-danger)",
  };

  const today = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const clockStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Attendance &mdash; {today}</div>
          <div className="page-subheading" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span>
              {attendance.filter(a=>a.status==="present").length} present &middot;&nbsp;
              {attendance.filter(a=>a.status==="late").length} late &middot;&nbsp;
              {attendance.filter(a=>a.status==="on_leave").length} on leave &middot;&nbsp;
              {attendance.filter(a=>a.status==="absent").length} absent
            </span>
            <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--brand-primary)", fontWeight: 700, background: "rgba(255,122,0,0.1)", padding: "2px 10px", borderRadius: 8 }}>
              {clockStr}
            </span>
          </div>
        </div>
        {canWrite && (<button className="btn btn-primary" onClick={() => setShowMark(true)}><Plus size={15} /> Mark Attendance</button>)}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>OT Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a, i) => (
                <tr key={`${a.emp}-${i}`}>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {a.checkIn ? (
                        <span className="mono" style={{ color: "var(--brand-success)", fontWeight: 700 }}>{a.checkIn}</span>
                      ) : (
                        <span className="mono" style={{ color: "var(--text-muted)" }}>--:--</span>
                      )}
                      {!a.checkIn && a.status !== "on_leave" && a.status !== "absent" && (
                        <button
                          className="btn btn-success btn-sm"
                          style={{ fontSize: 10, padding: "3px 10px", whiteSpace: "nowrap" }}
                          onClick={() => handleCheckIn(a.emp)}
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {a.checkOut ? (
                        <span className="mono" style={{ color: "var(--brand-danger)", fontWeight: 700 }}>{a.checkOut}</span>
                      ) : (
                        <span className="mono" style={{ color: "var(--text-muted)" }}>--:--</span>
                      )}
                      {a.checkIn && !a.checkOut && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 10, padding: "3px 10px", whiteSpace: "nowrap" }}
                          onClick={() => handleCheckOut(a.emp)}
                        >
                          Check Out
                        </button>
                      )}
                    </div>
                  </td>

                  <td style={{ fontWeight: 600, color: a.ot > 0 ? "var(--brand-warning)" : "var(--text-muted)" }}>
                    {a.ot > 0 ? `${a.ot}h` : "—"}
                  </td>

                  <td>
                    <span style={{ fontSize: 12, fontWeight: 600, color: statusColor[a.status] || "var(--text-muted)", textTransform: "capitalize" }}>
                      &bull; {a.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No records. Click "Mark Attendance" to add.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMark && <MarkAttendanceModal employees={employees} onClose={() => setShowMark(false)} onMark={handleMark} />}
    </div>
  );
}

export default function HR() {
  const { canWrite, canDelete } = usePermission("hr");
  const toast = useToast();
  const [tab, setTab] = useState("employees");
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState(() => fromStorage("autolab_employees", EMPLOYEES));
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp,   setEditingEmp]   = useState(null);
  const [viewingEmp,   setViewingEmp]   = useState(null);

  const saveEmployees = (updated) => { setEmployees(updated); saveStorage("autolab_employees", updated); };

  const handleAddEmployee = (emp) => {
    saveEmployees([emp, ...employees]);
    toast.success("Employee Added", `${emp.name} has been added.`);
  };
  const handleEditEmployee = (emp) => {
    saveEmployees(employees.map(e => e.id === emp.id ? emp : e));
    toast.success("Employee Updated", `${emp.name} profile updated.`);
  };

  const filtered = employees.filter(e =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.dept.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-heading">HR &amp; Employees</div>
          <div className="page-subheading">
            {employees.filter(e=>e.status==="active").length} active � {employees.filter(e=>e.status==="on_leave").length} on leave
          </div>
        </div>
        <div className="page-actions">
          {tab === "employees" && canWrite && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={15} /> Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        {[
          { key: "employees",  label: "Employees",  icon: Users },
          { key: "payroll",    label: "Payroll",    icon: DollarSign },
          { key: "attendance", label: "Attendance", icon: Clock },
        ].map(t => (
          <button key={t.key} className={`tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "employees" && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="search-box" style={{ maxWidth: 320 }}>
              <Search size={14} className="search-icon" />
              <input style={{ width: "100%" }} placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 16 }}>
            {filtered.map(emp => (
              <div key={emp.id} className="card">
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
                  <EmployeeAvatar name={emp.name} dept={emp.dept} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{emp.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{emp.role}</div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ background: `${DEPT_COLORS[emp.dept]||"#7c3aed"}22`, color: DEPT_COLORS[emp.dept]||"#7c3aed", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
                        {emp.dept}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: emp.status==="active" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: emp.status==="active" ? "var(--brand-success)" : "var(--brand-warning)" }}>
                    {emp.status==="active" ? "Active" : emp.status==="on_leave" ? "On Leave" : "Inactive"}
                  </span>
                </div>
                <div className="divider" style={{ margin: "10px 0" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Employee ID</div>
                    <div className="mono" style={{ fontSize: 12, marginTop: 2 }}>{emp.id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Basic Salary</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-primary)", marginTop: 2 }}>Rs. {Number(emp.salary).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Since</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{emp.hire}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Type</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, textTransform: "capitalize" }}>{emp.type?.replace("_"," ")}</div>
                  </div>
                </div>
                <div className="divider" style={{ margin: "10px 0" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setViewingEmp(emp)}>
                    <Eye size={13} /> View
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingEmp(emp)}>
                    <Edit2 size={13} /> Edit
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                No employees match your search.
              </div>
            )}
          </div>
        </>
      )}

      {tab === "payroll"    && <PayrollSection    employees={employees} />}
      {tab === "attendance" && <AttendanceSection employees={employees} />}

      {showAddModal && <EmployeeModal onClose={() => setShowAddModal(false)} onSave={handleAddEmployee} />}
      {editingEmp   && <EmployeeModal initial={editingEmp} onClose={() => setEditingEmp(null)} onSave={handleEditEmployee} />}
      {viewingEmp   && <ViewProfileModal emp={viewingEmp} onClose={() => setViewingEmp(null)} />}
    </div>
  );
}