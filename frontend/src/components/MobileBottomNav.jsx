import { LayoutDashboard, CalendarDays, Wrench, FileText, Menu, MessageSquare } from 'lucide-react';

/**
 * Touch-optimized Bottom Navigation Bar for Mobile Viewports (< 1024px)
 * Provides rapid one-thumb access to the 4 core workshop screens + full menu drawer trigger.
 */
export default function MobileBottomNav({ active, onNav, onOpenMore, unreadCount = 0 }) {
  const items = [
    { key: 'dashboard',    label: 'Dashboard', icon: LayoutDashboard },
    { key: 'appointments', label: 'Bookings',  icon: CalendarDays, badge: '3' },
    { key: 'jobs',         label: 'Jobs',      icon: Wrench,       badge: '7' },
    { key: 'billing',      label: 'Invoices',  icon: FileText },
    { key: 'whatsapp',     label: 'WhatsApp',  icon: MessageSquare, badge: 'SL' },
    { key: 'more',         label: 'Menu',      icon: Menu,         isMore: true },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = active === item.key;

        return (
          <button
            key={item.key}
            type="button"
            className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (item.isMore) {
                onOpenMore();
              } else {
                onNav(item.key);
              }
            }}
            aria-label={item.label}
          >
            <div className="mobile-bottom-nav-icon-wrap">
              <Icon size={20} />
              {item.badge && !isActive && (
                <span className="mobile-bottom-nav-badge">{item.badge}</span>
              )}
            </div>
            <span className="mobile-bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
