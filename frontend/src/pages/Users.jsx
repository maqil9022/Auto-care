import { useState } from "react";
import { usePermission, useIsSuperAdmin } from "../hooks/usePermission";
import { Plus, X, Search, Shield, Edit2, Trash2, Eye, EyeOff, CheckSquare, Square, Lock } from "lucide-react";
import { useToast } from "../context/ToastContext";

const PERM_STORAGE_KEY = "autolab_permissions_v2";

const MODULES = [
  { key: "dashboard",    label: "Dashboard" },
  { key: "appointments", label: "Appointments" },
  { key: "jobs",         label: "Service Jobs" },
  { key: "customers",   label: "Customers" },
  { key: "services",    label: "Services Catalog" },
  { key: "inventory",   label: "Inventory" },
  { key: "billing",     label: "Billing and Invoices" },
  { key: "hr",          label: "HR and Employees" },
  { key: "reports",     label: "Reports" },
  { key: "users",       label: "Users and Access" },
  { key: "booking",     label: "Customer Booking" },
];

const ROLES = [
  { key: "super_admin",  label: "Super Admin",  color: "#ef4444" },
  { key: "manager",      label: "Manager",       color: "#f59e0b" },
  { key: "technician",   label: "Technician",    color: "#3b82f6" },
  { key: "receptionist", label: "Receptionist",  color: "#10b981" },
  { key: "accountant",   label: "Accountant",    color: "#8b5cf6" },
  { key: "viewer",       label: "Viewer Only",   color: "#6b7280" },
];

function makePerms(readKeys, writeKeys, deleteKeys) {
  writeKeys  = writeKeys  || [];
  deleteKeys = deleteKeys || [];
  return Object.fromEntries(MODULES.map(m => [m.key, {
    read:   readKeys === "*"   || (Array.isArray(readKeys) && readKeys.includes(m.key)),
    write:  writeKeys === "*"  || (Array.isArray(writeKeys) && writeKeys.includes(m.key)),
    delete: deleteKeys === "*" || (Array.isArray(deleteKeys) && deleteKeys.includes(m.key)),
  }]));
}

const DEFAULT_PERMISSIONS = {
  super_admin:  makePerms("*", "*", "*"),
  manager:      makePerms("*", ["dashboard","appointments","jobs","customers","services","inventory","billing","hr","reports","users","booking"], []),
  technician:   makePerms(["dashboard","jobs","inventory","services"], ["jobs","inventory"], []),
  receptionist: makePerms(["dashboard","appointments","customers","services","booking"], ["appointments","customers","booking"], []),
  accountant:   makePerms(["dashboard","billing","reports","services"], ["billing","reports"], []),
  viewer:       makePerms(["dashboard"], [], []),
};

const MOCK_USERS = [
  { id: "USR-001", name: "Admin User",     email: "admin@autolab360.com",   role: "super_admin",  status: "active",   lastLogin: "Today, 09:12", avatar: "AU" },
  { id: "USR-002", name: "Ahmed Manager",  email: "ahmed@autolab360.com",   role: "manager",      status: "active",   lastLogin: "Today, 10:45", avatar: "AM" },
  { id: "USR-003", name: "Tariq Mansoor",  email: "tariq@autolab360.com",   role: "technician",   status: "active",   lastLogin: "Today, 08:30", avatar: "TM" },
  { id: "USR-004", name: "Nadia Khalil",   email: "nadia@autolab360.com",   role: "receptionist", status: "active",   lastLogin: "Yesterday",    avatar: "NK" },
  { id: "USR-005", name: "Yusuf Accounts", email: "yusuf@autolab360.com",   role: "accountant",   status: "active",   lastLogin: "2 days ago",   avatar: "YA" },
  { id: "USR-006", name: "Kofi Mensah",    email: "kofi@autolab360.com",    role: "technician",   status: "inactive", lastLogin: "1 week ago",   avatar: "KM" },
];

function fromStorage(key, fallback) {
  try {
    if (key === PERM_STORAGE_KEY) {
      localStorage.removeItem("autolab_permissions");
    }
    const d = JSON.parse(localStorage.getItem(key) || "null");
    return d || fallback;
  }
  catch { return fallback; }
}

function saveStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function RoleBadge({ role }) {
  const r = ROLES.find(x => x.key === role) || { label: role, color: "#6b7280" };
  return (
    <span style={{ background: r.color + "22", color: r.color, padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
      {r.label}
    </span>
  );
}

function UserModal({ onClose, onSave, initial }) {
  const toast = useToast();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name:     initial?.name   || "",
    email:    initial?.email  || "",
    role:     initial?.role   || "viewer",
    status:   initial?.status || "active",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { toast.warning("Required", "Name and email are required."); return; }
    if (!isEdit && !form.password.trim()) { toast.warning("Required", "Password is required for new users."); return; }
    onSave({
      id:        initial?.id || "USR-" + Math.floor(1000 + Math.random() * 9000),
      name:      form.name.trim(),
      email:     form.email.trim(),
      role:      form.role,
      status:    form.status,
      lastLogin: initial?.lastLogin || "Never",
      avatar:    form.name.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? "Edit User" : "Add New User"}</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full Name <span>*</span></label>
            <input className="form-control" placeholder="Full name" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address <span>*</span></label>
            <input type="email" className="form-control" placeholder="user@autolab360.com" value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Role <span>*</span></label>
            <select className="form-control" value={form.role} onChange={e => set("role", e.target.value)}>
              {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          {isEdit && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{isEdit ? "New Password (leave blank to keep)" : "Password *"}</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                className="form-control"
                placeholder={isEdit ? "Leave blank to keep current" : "Set a strong password"}
                value={form.password}
                onChange={e => set("password", e.target.value)}
                style={{ paddingRight: 42 }}
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}><Plus size={15} /> {isEdit ? "Save Changes" : "Create User"}</button>
        </div>
      </div>
    </div>
  );
}

function Tick({ checked, onToggle, color, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      title={disabled ? "Only Super Admins can change permissions" : undefined}
      style={{
        background: "none", border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "var(--border-subtle)" : checked ? color : "var(--border-subtle)",
        opacity: disabled ? 0.45 : 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 4, borderRadius: 4, transition: "color 0.15s",
      }}
    >
      {checked ? <CheckSquare size={19} /> : <Square size={19} />}
    </button>
  );
}

function PermissionsMatrix({ role, permissions, onChange, readOnly }) {
  const rolePerms = permissions[role] || DEFAULT_PERMISSIONS[role] || {};
  const roleMeta  = ROLES.find(x => x.key === role) || { color: "var(--brand-primary)", label: role };
  const isReadOnly = !!readOnly;

  const toggle = (moduleKey, perm) => {
    if (isReadOnly) return;
    const cur = rolePerms[moduleKey] || { read: false, write: false, delete: false };
    let next = { ...cur, [perm]: !cur[perm] };
    if (perm === "read"   && !next.read)   next = { read: false, write: false, delete: false };
    if (perm === "write"  && next.write)   next.read = true;
    if (perm === "delete" && next.delete) { next.read = true; next.write = true; }
    onChange(role, moduleKey, next);
  };

  const toggleAll = (perm, value) => {
    if (isReadOnly) return;
    const allUpdated = {};
    MODULES.forEach(m => {
      const cur = rolePerms[m.key] || { read: false, write: false, delete: false };
      let next = { ...cur, [perm]: value };
      if (perm === "read"   && !value) next = { read: false, write: false, delete: false };
      if (perm === "write"  && value)  next.read = true;
      if (perm === "delete" && value) { next.read = true; next.write = true; }
      allUpdated[m.key] = next;
    });
    onChange(role, "__all__", allUpdated);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Shield size={18} style={{ color: roleMeta.color }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>Permissions for</span>
        <RoleBadge role={role} />
        {!isReadOnly && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(255,122,0,0.08)", padding: "2px 8px", borderRadius: 6 }}>
            Changes save automatically
          </span>
        )}
      </div>
      {isReadOnly && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#f87171" }}>
          <Shield size={14} /> You can view permissions but only a <strong style={{ margin: "0 4px" }}>Super Admin</strong> can make changes.
        </div>
      )}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: "38%" }}>Module</th>
              <th style={{ textAlign: "center" }}>
                <div style={{ color: "var(--brand-primary)", fontWeight: 700 }}>Read</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 5 }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: "1px 7px" }} disabled={isReadOnly} onClick={() => toggleAll("read", true)}>All</button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: "1px 7px" }} disabled={isReadOnly} onClick={() => toggleAll("read", false)}>None</button>
                </div>
              </th>
              <th style={{ textAlign: "center" }}>
                <div style={{ color: "var(--brand-warning)", fontWeight: 700 }}>Write</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 5 }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: "1px 7px" }} disabled={isReadOnly} onClick={() => toggleAll("write", true)}>All</button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: "1px 7px" }} disabled={isReadOnly} onClick={() => toggleAll("write", false)}>None</button>
                </div>
              </th>
              <th style={{ textAlign: "center" }}>
                <div style={{ color: "var(--brand-danger)", fontWeight: 700 }}>Delete</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 5 }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: "1px 7px" }} disabled={isReadOnly} onClick={() => toggleAll("delete", true)}>All</button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: "1px 7px" }} disabled={isReadOnly} onClick={() => toggleAll("delete", false)}>None</button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map(mod => {
              const p = rolePerms[mod.key] || { read: false, write: false, delete: false };
              return (
                <tr key={mod.key}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.delete ? "var(--brand-danger)" : p.write ? "var(--brand-warning)" : p.read ? "var(--brand-success)" : "var(--border-subtle)", flexShrink: 0 }} />
                      {mod.label}
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Tick checked={p.read}   color="var(--brand-primary)" onToggle={() => toggle(mod.key, "read")}   disabled={isReadOnly} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Tick checked={p.write}  color="var(--brand-warning)" onToggle={() => toggle(mod.key, "write")}  disabled={isReadOnly} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <Tick checked={p.delete} color="var(--brand-danger)"  onToggle={() => toggle(mod.key, "delete")} disabled={isReadOnly} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="divider" style={{ margin: "20px 0 14px" }} />
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { label: "Read",   color: "var(--brand-primary)", desc: "Can view / list data" },
          { label: "Write",  color: "var(--brand-warning)", desc: "Can create and edit records" },
          { label: "Delete", color: "var(--brand-danger)",  desc: "Can permanently delete" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <CheckSquare size={15} style={{ color: l.color }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: l.color }}>{l.label}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>-- {l.desc}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", background: "rgba(255,122,0,0.07)", borderRadius: 6, padding: "8px 14px", lineHeight: 1.6 }}>
        Rules: Write auto-enables Read. Delete auto-enables Read + Write. Removing Read also removes Write and Delete.
      </div>
    </div>
  );
}

export default function Users() {
  const toast = useToast();
  const [tab,          setTab]          = useState("users");
  const [search,       setSearch]       = useState("");
  const [users,        setUsers]        = useState(() => fromStorage("autolab_users",       MOCK_USERS));
  const [permissions,  setPermissions]  = useState(() => fromStorage(PERM_STORAGE_KEY,      DEFAULT_PERMISSIONS));
  const [selectedRole, setSelectedRole] = useState("manager");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser,  setEditingUser]  = useState(null);

  const { canWrite, canDelete } = usePermission("users");
  const isSuperAdmin = useIsSuperAdmin();

  const saveUsers       = u => { setUsers(u);       saveStorage("autolab_users",       u); };
  const savePermissions = p => { setPermissions(p); saveStorage(PERM_STORAGE_KEY,     p); };

  const handleAddUser    = user => { saveUsers([user, ...users]); toast.success("User Created", user.name + " added."); };
  const handleEditUser   = user => { saveUsers(users.map(u => u.id === user.id ? user : u)); toast.success("Updated", user.name + " updated."); };
  const handleDeleteUser = id   => { const u = users.find(x => x.id === id); if (!u) return; saveUsers(users.filter(x => x.id !== id)); toast.success("Removed", u.name + " removed."); };
  const handleToggleStatus = id => saveUsers(users.map(u => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));

  const handlePermChange = (role, moduleKey, updated) => {
    if (!isSuperAdmin) {
      toast.warning("Access Denied", "Only Super Admins can modify permissions.");
      return;
    }
    setPermissions(prev => {
      const next = moduleKey === "__all__"
        ? { ...prev, [role]: updated }
        : { ...prev, [role]: { ...(prev[role] || {}), [moduleKey]: updated } };
      saveStorage(PERM_STORAGE_KEY, next);
      return next;
    });
  };

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (ROLES.find(r => r.key === u.role)?.label || u.role).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-heading">Users and Access</div>
          <div className="page-subheading">
            {users.filter(u => u.status === "active").length} active users &middot; {users.filter(u => u.status === "inactive").length} inactive &middot; {ROLES.length} roles defined
          </div>
        </div>
        <div className="page-actions">
          {tab === "users" && canWrite && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={15} /> Add User</button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={"tab" + (tab === "users" ? " active" : "")} onClick={() => setTab("users")}>Users</button>
        {(isSuperAdmin || canWrite) && (
          <button className={"tab" + (tab === "privileges" ? " active" : "")} onClick={() => setTab("privileges")}>
            Privileges {!isSuperAdmin && "(View Only)"}
          </button>
        )}
      </div>

      {tab === "users" && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="search-box" style={{ maxWidth: 340 }}>
              <Search size={14} className="search-icon" />
              <input style={{ width: "100%" }} placeholder="Search by name, email or role..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
            {ROLES.map(r => {
              const count = users.filter(u => u.role === r.key && u.status === "active").length;
              return (
                <div key={r.key}
                  onClick={() => {
                    if (isSuperAdmin || canWrite) {
                      setSelectedRole(r.key);
                      setTab("privileges");
                    }
                  }}
                  style={{
                    padding: "14px 16px",
                    background: "var(--bg-card)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    borderLeft: "3px solid " + r.color,
                    cursor: (isSuperAdmin || canWrite) ? "pointer" : "default"
                  }}
                  onMouseEnter={e => { if (isSuperAdmin || canWrite) e.currentTarget.style.boxShadow = "0 2px 14px rgba(0,0,0,0.2)"; }}
                  onMouseLeave={e => { if (isSuperAdmin || canWrite) e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.7px" }}>{r.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: r.color, marginTop: 4 }}>{count}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>active</div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>User</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const roleColor = ROLES.find(r => r.key === u.role)?.color || "#7c3aed";
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: roleColor + "22", color: roleColor, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                              {u.avatar}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><RoleBadge role={u.role} /></td>
                        <td className="muted" style={{ fontSize: 12 }}>{u.lastLogin}</td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 10, background: u.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)", color: u.status === "active" ? "var(--brand-success)" : "var(--text-muted)" }}>
                            {u.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {canWrite && <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setEditingUser(u)}><Edit2 size={13} /></button>}
                            {canWrite && (
                              <button className={"btn btn-sm " + (u.status === "active" ? "btn-secondary" : "btn-success")} style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => handleToggleStatus(u.id)}>
                                {u.status === "active" ? "Deactivate" : "Activate"}
                              </button>
                            )}
                            {(isSuperAdmin || canWrite) && (
                              <button className="btn btn-ghost btn-sm" title={isSuperAdmin ? "Edit privileges" : "View privileges"} onClick={() => { setSelectedRole(u.role); setTab("privileges"); }}>
                                <Shield size={13} style={{ color: roleColor }} />
                              </button>
                            )}
                            {canDelete && <button className="btn btn-ghost btn-sm" title="Delete" style={{ color: "var(--brand-danger)" }} onClick={() => handleDeleteUser(u.id)}>
                              <Trash2 size={13} />
                            </button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 36, color: "var(--text-muted)" }}>No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "privileges" && (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
          <div className="card" style={{ padding: 0, height: "fit-content" }}>
            <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border-subtle)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={14} style={{ color: "var(--brand-primary)" }} /> Roles
            </div>
            {ROLES.map(r => (
              <button key={r.key} onClick={() => setSelectedRole(r.key)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 16px", background: selectedRole === r.key ? r.color + "18" : "transparent", border: "none", borderLeft: selectedRole === r.key ? "3px solid " + r.color : "3px solid transparent", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                <Lock size={13} style={{ color: r.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selectedRole === r.key ? r.color : "var(--text-primary)" }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{users.filter(u => u.role === r.key).length} user(s)</div>
                </div>
              </button>
            ))}
          </div>
          <div className="card">
            <PermissionsMatrix
              key={selectedRole}
              role={selectedRole}
              permissions={permissions}
              onChange={handlePermChange}
              readOnly={!isSuperAdmin}
            />
          </div>
        </div>
      )}

      {showAddModal && <UserModal onClose={() => setShowAddModal(false)} onSave={handleAddUser} />}
      {editingUser  && <UserModal initial={editingUser} onClose={() => setEditingUser(null)} onSave={handleEditUser} />}
    </div>
  );
}
