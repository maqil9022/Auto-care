import { useState } from "react";
import { Eye, EyeOff, LogIn, Wrench, ArrowLeft } from "lucide-react";

const SEED_USERS = [
  { id: "USR-001", name: "Admin User",    email: "admin@autolab360.com",  password: "admin123",    role: "super_admin",  avatar: "AU" },
  { id: "USR-002", name: "Ahmed Manager", email: "ahmed@autolab360.com",  password: "manager123",  role: "manager",      avatar: "AM" },
  { id: "USR-003", name: "Tariq Mansoor", email: "tariq@autolab360.com",  password: "tech123",     role: "technician",   avatar: "TM" },
  { id: "USR-004", name: "Nadia Khalil",  email: "nadia@autolab360.com",  password: "recept123",   role: "receptionist", avatar: "NK" },
  { id: "USR-005", name: "Yusuf Ali",     email: "yusuf@autolab360.com",  password: "account123",  role: "accountant",   avatar: "YA" },
];

function getUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem("autolab_users") || "null");
    if (stored && stored.length > 0) {
      return stored.map(u => {
        const seed = SEED_USERS.find(s => s.id === u.id);
        return { ...u, password: seed?.password || "autolab123" };
      });
    }
  } catch {}
  return SEED_USERS;
}

const ROLE_COLORS = {
  super_admin: "#ef4444", manager: "#f59e0b", technician: "#3b82f6",
  receptionist: "#10b981", accountant: "#8b5cf6", viewer: "#6b7280",
};
const ROLE_LABELS = {
  super_admin: "Super Admin", manager: "Manager", technician: "Technician",
  receptionist: "Receptionist", accountant: "Accountant", viewer: "Viewer",
};

export default function Login({ onLogin, onBack }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const user  = users.find(u =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.password === password &&
        u.status !== "inactive"
      );

      if (user) {
        const sessionUser = {
          id:       user.id,
          name:     user.name,
          email:    user.email,
          role:     user.role,
          avatar:   user.avatar || user.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase(),
          loginAt:  new Date().toISOString(),
        };
        localStorage.setItem("autolab_session", JSON.stringify(sessionUser));
        onLogin(sessionUser);
      } else {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    }, 600);
  };

  const fillDemo = (u) => { setEmail(u.email); setPassword(u.password); setError(""); };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-base)",
      backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(255,122,0,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.06) 0%, transparent 50%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: 16,
    }}>
      {/* Animated background grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,122,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,122,0,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440 }}>
        {/* Back to Customer Booking Site Button */}
        {onBack && (
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 8,
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--brand-primary)"; e.currentTarget.style.borderColor = "var(--brand-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
            >
              <ArrowLeft size={14} /> Back to Customer Booking Site
            </button>
          </div>
        )}

        {/* Logo card */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, #ff7a00, #ff4500)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px", boxShadow: "0 8px 32px rgba(255,122,0,0.35)",
          }}>
            <Wrench size={28} color="#fff" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>Auto Lab 360</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Staff &amp; Management Portal</div>
        </div>

        {/* Login card */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 20,
          padding: "32px 36px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          animation: shake ? "shake 0.5s ease" : undefined,
        }}>
          <style>{`
            @keyframes shake {
              0%,100% { transform: translateX(0); }
              20% { transform: translateX(-8px); }
              40% { transform: translateX(8px); }
              60% { transform: translateX(-6px); }
              80% { transform: translateX(6px); }
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: "var(--text-primary)" }}>Staff Sign In</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>Access the workshop management system</div>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="you@autolab360.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                autoFocus
                required
                style={{ height: 44 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  required
                  style={{ height: 44, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>!</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", height: 46, fontSize: 15, fontWeight: 700, marginTop: 12, justifyContent: "center", borderRadius: 10, gap: 10 }}
            >
              {loading ? (
                <>
                  <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Signing in...
                </>
              ) : (
                <><LogIn size={17} /> Sign In</>
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div style={{
          marginTop: 20, background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: 14, padding: "16px 18px",
        }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, marginBottom: 10 }}>
            Demo Employee Accounts — click to fill
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {SEED_USERS.map(u => {
              const color = ROLE_COLORS[u.role] || "#7c3aed";
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => fillDemo(u)}
                  style={{
                    background: color + "12", border: "1px solid " + color + "30",
                    borderRadius: 8, padding: "8px 12px", cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = color + "22"; e.currentTarget.style.borderColor = color + "60"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = color + "12"; e.currentTarget.style.borderColor = color + "30"; }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: color }}>{u.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{ROLE_LABELS[u.role]}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: "var(--text-muted)" }}>
          Auto Lab 360 v1.0 &middot; &copy; 2026
        </div>
      </div>
    </div>
  );
}
