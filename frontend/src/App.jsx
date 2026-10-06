import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar  from './components/Topbar';
import MobileBottomNav from './components/MobileBottomNav';
import Login   from './pages/Login';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { usePermission } from './hooks/usePermission';
import { Lock, Wrench, Phone, MapPin } from 'lucide-react';

import Dashboard    from './pages/Dashboard';
import Appointments from './pages/Appointments';
import ServiceJobs  from './pages/ServiceJobs';
import HR           from './pages/HR';
import Inventory    from './pages/Inventory';
import Billing      from './pages/Billing';
import Reports      from './pages/Reports';
import Booking      from './pages/Booking';
import Customers    from './pages/Customers';
import Users        from './pages/Users';
import Services     from './pages/Services';
import WhatsAppCenter from './pages/WhatsAppCenter';

/** Wraps an internal management page and shows "Access Denied" if user lacks read permission */
function ProtectedPage({ moduleKey, children }) {
  const { canRead } = usePermission(moduleKey);
  if (!canRead) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, color: 'var(--text-muted)', gap: 12 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Access Denied</div>
        <div style={{ fontSize: 14 }}>You do not have permission to view this module.</div>
        <div style={{ fontSize: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 16px', color: '#f87171' }}>
          Contact your administrator to request access.
        </div>
      </div>
    );
  }
  return children;
}

/** Public Customer Portal for non-logged in visitors */
function PublicCustomerPortal({ onOpenStaffLogin }) {
  return (
    <div className="public-portal-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Public Responsive Header */}
      <header className="public-header">
        <div className="public-header-brand">
          <div className="public-logo-icon">
            <Wrench size={20} />
          </div>
          <div>
            <div className="public-logo-title">
              Auto Lab 360
            </div>
            <div className="public-logo-sub">
              Motorsport Standard Workshop &amp; Diagnostics
            </div>
          </div>
        </div>

        {/* Workshop contact info & Staff Portal button */}
        <div className="public-header-actions">
          <a href="tel:0718818898" className="public-phone-link" title="Tap to call workshop hotline">
            <Phone size={13} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
            <span className="phone-number-text">071-881 8898</span>
          </a>

          <button
            type="button"
            className="staff-portal-btn"
            onClick={onOpenStaffLogin}
            aria-label="Open staff login portal"
          >
            <Lock size={13} /> <span>Staff Portal</span>
          </button>
        </div>
      </header>

      {/* Main Booking Content */}
      <main className="public-main-content">
        <Booking />
      </main>

      {/* Public Responsive Footer */}
      <footer className="public-footer">
        <div className="public-footer-inner">
          <div className="public-footer-brand-row">
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Auto Lab 360</span>
            <span>&middot;</span>
            <span>No 787, Kandy Road, Meepitiya, Kegalle</span>
          </div>
          <div className="public-footer-info-row">
            Mon - Sat 08:00 AM - 06:00 PM &middot; 📞 071-881 8898 / 071-881 8854 &middot; ✉️ autolab360lk@gmail.com
          </div>
          <button
            onClick={onOpenStaffLogin}
            className="public-footer-login-btn"
          >
            Employee / Staff Login
          </button>
        </div>
      </footer>
    </div>
  );
}

function AppShell() {
  const { user, login, logout } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode,   setViewMode]   = useState('customer'); // 'customer' | 'login'

  const handleLogout = () => {
    logout();
    setViewMode('customer'); // Return to customer site upon logout
  };

  // If not logged in as staff, show either Customer Booking Site or Login Page
  if (!user) {
    if (viewMode === 'login') {
      return <Login onLogin={login} onBack={() => setViewMode('customer')} />;
    }
    return <PublicCustomerPortal onOpenStaffLogin={() => setViewMode('login')} />;
  }

  // Logged-in Staff Management Shell
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':    return <ProtectedPage moduleKey="dashboard"><Dashboard onNav={setActivePage} /></ProtectedPage>;
      case 'appointments': return <ProtectedPage moduleKey="appointments"><Appointments /></ProtectedPage>;
      case 'jobs':         return <ProtectedPage moduleKey="jobs"><ServiceJobs /></ProtectedPage>;
      case 'hr':           return <ProtectedPage moduleKey="hr"><HR /></ProtectedPage>;
      case 'inventory':    return <ProtectedPage moduleKey="inventory"><Inventory /></ProtectedPage>;
      case 'billing':      return <ProtectedPage moduleKey="billing"><Billing /></ProtectedPage>;
      case 'reports':      return <ProtectedPage moduleKey="reports"><Reports /></ProtectedPage>;
      case 'services':     return <ProtectedPage moduleKey="services"><Services onNav={setActivePage} /></ProtectedPage>;
      case 'booking':      return <ProtectedPage moduleKey="booking"><Booking /></ProtectedPage>;
      case 'customers':    return <ProtectedPage moduleKey="customers"><Customers /></ProtectedPage>;
      case 'users':        return <ProtectedPage moduleKey="users"><Users /></ProtectedPage>;
      case 'whatsapp':     return <ProtectedPage moduleKey="whatsapp"><WhatsAppCenter /></ProtectedPage>;
      default:             return <ProtectedPage moduleKey="dashboard"><Dashboard onNav={setActivePage} /></ProtectedPage>;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        active={activePage}
        onNav={setActivePage}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(prev => !prev)}
        user={user}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />
      <div className={`main-content${collapsed ? ' collapsed' : ''}`}>
        <Topbar
          page={activePage}
          collapsed={collapsed}
          user={user}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        />
        <main className="page-body">
          {renderPage()}
        </main>
      </div>

      {/* Touch-Optimized Mobile Bottom Bar for Quick Navigation */}
      <MobileBottomNav
        active={activePage}
        onNav={(page) => {
          setActivePage(page);
          setMobileMenuOpen(false);
        }}
        onOpenMore={() => setMobileMenuOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </AuthProvider>
  );
}
