import { useState } from 'react';
import {
  LayoutDashboard, CalendarDays, Wrench, Users, Package,
  FileText, BarChart3, Globe, ChevronLeft, ChevronRight,
  Car, UserRound, ShieldCheck, Sparkles, MessageSquare, X
} from 'lucide-react';
import { useAllowedModules } from '../hooks/usePermission';

const ALL_NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { key: 'dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
      { key: 'appointments', icon: CalendarDays,    label: 'Appointments', badge: 3 },
      { key: 'jobs',         icon: Wrench,          label: 'Service Jobs',  badge: 7 },
    ],
  },
  {
    label: 'Management',
    items: [
      { key: 'whatsapp',  icon: MessageSquare, label: 'WhatsApp Center', badge: 'SL' },
      { key: 'services',  icon: Sparkles,     label: 'Services Catalog' },
      { key: 'hr',        icon: Users,        label: 'HR & Employees' },
      { key: 'customers', icon: UserRound,    label: 'Customers' },
      { key: 'users',     icon: ShieldCheck,  label: 'Users & Access' },
      { key: 'inventory', icon: Package,      label: 'Inventory',     badge: '!' },
      { key: 'billing',   icon: FileText,     label: 'Billing & Invoices' },
      { key: 'reports',   icon: BarChart3,    label: 'Reports' },
    ],
  },
  {
    label: 'Public',
    items: [
      { key: 'booking', icon: Globe, label: 'Customer Booking' },
    ],
  },
];

const ROLE_COLORS = {
  super_admin: '#ef4444', manager: '#f59e0b', technician: '#3b82f6',
  receptionist: '#10b981', accountant: '#8b5cf6', viewer: '#6b7280',
};
const ROLE_LABELS = {
  super_admin: 'Super Admin', manager: 'Manager', technician: 'Technician',
  receptionist: 'Receptionist', accountant: 'Accountant', viewer: 'Viewer',
};

export default function Sidebar({
  active,
  onNav,
  collapsed = false,
  onToggleCollapse,
  user,
  mobileOpen = false,
  onCloseMobile
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed   = collapsed !== undefined ? collapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(p => !p));
  const allowedModules = useAllowedModules(); // null = all

  // Filter sections based on permissions
  const navSections = ALL_NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      allowedModules === null || allowedModules.includes(item.key)
    ),
  })).filter(section => section.items.length > 0);

  const roleColor = ROLE_COLORS[user?.role] || 'var(--brand-primary)';
  const roleLabel = ROLE_LABELS[user?.role] || (user?.role || 'User');

  const handleItemClick = (key) => {
    onNav(key);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">🔧</div>
          <div className="logo-text">
            <div className="logo-title">Auto Lab 360</div>
            <div className="logo-sub">Management System</div>
          </div>
          {/* Mobile Close Button */}
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className={`nav-item${active === item.key ? ' active' : ''}`}
                  onClick={() => handleItemClick(item.key)}
                  data-tooltip={isCollapsed ? item.label : undefined}
                >
                  <Icon size={18} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: roleColor + '22', color: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
              {user.avatar || 'U'}
            </div>
            <div className="logo-text">
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user.name}</div>
              <div style={{ fontSize: 10, color: roleColor, fontWeight: 600 }}>{roleLabel}</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="nav-item" style={{ marginBottom: 4 }}>
          <Car size={18} className="nav-icon" />
          <span className="nav-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            v1.0.0 — Auto Lab 360
          </span>
        </div>
        <button
          className="sidebar-collapse-btn"
          onClick={toggleCollapse}
          data-tooltip={isCollapsed ? 'Expand sidebar' : undefined}
        >
          {isCollapsed
            ? <ChevronRight size={18} className="nav-icon" />
            : <ChevronLeft  size={18} className="nav-icon" />
          }
          <span className="nav-label">Collapse</span>
        </button>
      </div>
    </aside>
  </>
  );
}
