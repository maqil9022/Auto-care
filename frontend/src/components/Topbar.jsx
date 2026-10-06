import { useState, useRef, useEffect } from 'react';
import {
  Bell, Search, Settings, AlertTriangle, AlertCircle,
  CheckCircle2, Info, X, CheckCheck, Sparkles, LogOut, Menu
} from 'lucide-react';


import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

const PAGE_META = {
  dashboard:    { title: 'Dashboard',           sub: 'Overview of Auto Lab 360 operations' },
  appointments: { title: 'Appointments',        sub: 'Manage and schedule customer appointments' },
  jobs:         { title: 'Service Jobs',        sub: 'Workshop job cards and technician assignments' },
  hr:           { title: 'HR & Employees',      sub: 'Human resources, payroll, attendance & leave' },
  inventory:    { title: 'Inventory & Parts',   sub: 'Parts catalog, stock levels and transactions' },
  billing:      { title: 'Billing & Invoices',  sub: 'Invoices, payments and discount promotions' },
  reports:      { title: 'Reports',             sub: 'Analytics and business performance reports' },
  users:        { title: 'Users & Access',     sub: 'Manage user accounts, roles and privileges' },
  customers:    { title: 'Customers',           sub: 'Customer profiles, history and loyalty' },
  services:     { title: 'Services Catalog',    sub: 'Workshop service offerings, pricing and job durations' },
  booking:      { title: 'Customer Booking',    sub: 'Public appointment booking portal' },
};


const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'warning',
    title: 'Low Stock Alert',
    desc: 'Brake Pads Ceramic Front below safety threshold (3 sets left in Shelf B-04).',
    time: '5m ago',
    unread: true,
    category: 'critical'
  },
  {
    id: 2,
    type: 'success',
    title: 'Customer Booking Confirmed',
    desc: 'APT-2026-9021 booked by Tariq Al-Mansoor for Full Service & OBD Scan (Rs. 125.00).',
    time: '18m ago',
    unread: true,
    category: 'general'
  },
  {
    id: 3,
    type: 'error',
    title: 'Overdue Invoice Reminder',
    desc: 'Invoice INV-003 for Toyota Camry is past 48-hour payment terms (Rs. 185.00).',
    time: '42m ago',
    unread: true,
    category: 'critical'
  },
  {
    id: 4,
    type: 'info',
    title: 'Job Card Completed',
    desc: 'Mohamed Hassan marked JOB-002 complete. Ready for final inspection & invoicing.',
    time: '2h ago',
    unread: false,
    category: 'general'
  },
];

export default function Topbar({ page, collapsed, user, onLogout, onToggleMobileMenu }) {
  const meta = PAGE_META[page] || { title: page, sub: '' };
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'critical'
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef(null);

  // Fetch live notifications from API
  useEffect(() => {
    let isMounted = true;
    api.notifications.getAll()
      .then(data => {
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          setNotifications(data);
        }
      })
      .catch(err => {
        console.warn('Could not load live notifications, using mock fallback:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    try {
      await api.notifications.markAllRead();
    } catch {
      // Local state updated
    }
    toast.info('Notifications Read', 'All notifications marked as read.');
  };

  const handleItemClick = (item) => {
    setNotifications(notifications.map(n => n.id === item.id ? { ...n, unread: false } : n));
    if (item.type === 'warning') {
      toast.warning(item.title, item.desc);
    } else if (item.type === 'error') {
      toast.error(item.title, item.desc);
    } else if (item.type === 'success') {
      toast.success(item.title, item.desc);
    } else {
      toast.info(item.title, item.desc);
    }
  };

  const handleSendTestToast = () => {
    const samples = [
      { type: 'warning', title: 'Bay 3 Sensor Warning', msg: 'Laser wheel alignment rig calibration due in 4 hours.' },
      { type: 'success', title: 'Payment Received', msg: 'Customer settled Invoice INV-004 in Rs. 315.00 via POS.' },
      { type: 'error', title: 'Diagnostics Fault Code', msg: 'DTC P0300 Random/Multiple Cylinder Misfire Detected on Bay 1.' },
      { type: 'info', title: 'Technician Clock-in', msg: 'Ali Sayed clocked in at Workshop Bay 2.' },
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    toast[picked.type](picked.title, picked.msg);
  };

  const filteredList = notifications.filter(n => {
    if (filter === 'unread') return n.unread;
    if (filter === 'critical') return n.category === 'critical' || n.type === 'warning' || n.type === 'error';
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={15} style={{ color: 'var(--brand-primary)' }} />;
      case 'error':
        return <AlertCircle size={15} style={{ color: 'var(--brand-danger)' }} />;
      case 'success':
        return <CheckCircle2 size={15} style={{ color: 'var(--brand-success)' }} />;
      default:
        return <Info size={15} style={{ color: '#38bdf8' }} />;
    }
  };

  return (
    <header className={`topbar${collapsed ? ' collapsed' : ''}`}>
      <div className="topbar-left">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-title-wrap">
          <span className="topbar-title">{meta.title}</span>
          <span className="topbar-subtitle">{meta.sub}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Search */}
        <div className="search-box topbar-search">
          <Search size={14} className="search-icon" />
          <input placeholder="Search orders, plates, parts..." />
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="notification-bell-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => setIsOpen(prev => !prev)}
            aria-label="Toggle notifications"
            style={{
              background: isOpen ? 'rgba(255, 122, 0, 0.18)' : undefined,
              borderColor: isOpen ? 'var(--brand-primary)' : undefined,
              color: isOpen ? 'var(--brand-primary)' : undefined
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="notification-badge-count">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Interactive Popover Menu */}
          {isOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <div className="notification-header-title">
                  <Bell size={15} style={{ color: 'var(--brand-primary)' }} />
                  <span>Workshop Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: 'rgba(255, 122, 0, 0.2)',
                      color: 'var(--brand-primary)',
                      padding: '2px 6px',
                      borderRadius: 10
                    }}>
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notification-mark-all"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="notification-tabs">
                {[
                  { key: 'all', label: `All (${notifications.length})` },
                  { key: 'unread', label: `Unread (${unreadCount})` },
                  { key: 'critical', label: 'Critical' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`notification-tab-btn ${filter === tab.key ? 'active' : ''}`}
                    onClick={() => setFilter(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div className="notification-list">
                {filteredList.length === 0 ? (
                  <div className="notification-empty">
                    <CheckCheck size={28} style={{ color: 'var(--brand-success)', margin: '0 auto 8px', opacity: 0.7 }} />
                    <div>All caught up! No notifications in this view.</div>
                  </div>
                ) : (
                  filteredList.map(n => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.unread ? 'unread' : ''}`}
                      onClick={() => handleItemClick(n)}
                    >
                      <div
                        className="notification-item-icon"
                        style={{
                          background: n.type === 'warning'
                            ? 'rgba(255, 122, 0, 0.14)'
                            : n.type === 'error'
                            ? 'rgba(239, 68, 68, 0.14)'
                            : n.type === 'success'
                            ? 'rgba(16, 185, 129, 0.14)'
                            : 'rgba(56, 189, 248, 0.14)'
                        }}
                      >
                        {getIcon(n.type)}
                      </div>
                      <div className="notification-item-body">
                        <div className="notification-item-title">{n.title}</div>
                        <div className="notification-item-desc">{n.desc}</div>
                        <div className="notification-item-time">{n.time}</div>
                      </div>
                      {n.unread && <span className="notification-unread-dot" />}
                    </div>
                  ))
                )}
              </div>

              {/* Footer with Test Toast Trigger */}
              <div style={{
                padding: '8px 14px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Live Workshop Telemetry
                </span>
                <button
                  type="button"
                  onClick={handleSendTestToast}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--brand-primary)',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Test in-app toast notification"
                >
                  <Sparkles size={11} /> Test Toast
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Test Toast Button on Topbar */}
        <button
          className="topbar-icon-btn topbar-test-toast-btn"
          onClick={handleSendTestToast}
          title="Trigger live notification toast"
          style={{ position: 'relative' }}
        >
          <Sparkles size={15} style={{ color: 'var(--brand-primary)' }} />
        </button>

        {/* Settings */}
        <button
          className="topbar-icon-btn topbar-settings-btn"
          title="Settings"
          onClick={() => toast.info('System Settings', 'Workshop configuration loaded. All parameters optimal.')}
        >
          <Settings size={16} />
        </button>

        {/* User Avatar + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="topbar-user-text" style={{ textAlign: 'right', lineHeight: 1.3 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{(user?.role || 'admin').replace('_',' ')}</div>
          </div>
          <div className="topbar-avatar" title={user?.name || 'Admin'}>
            {user?.avatar || 'AD'}
          </div>
          <button
            className="topbar-icon-btn"
            title="Sign out"
            onClick={onLogout}
            style={{ color: 'var(--brand-danger)' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
