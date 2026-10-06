import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Plus, Search, Edit2, Trash2, Copy, Check,
  Clock, DollarSign, Tag, Layers, Eye, EyeOff, LayoutGrid,
  List, AlertCircle, RefreshCw, X, CheckCircle, ExternalLink
} from 'lucide-react';
import { SERVICES_CATALOG } from '../data/mockData';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { usePermission } from '../hooks/usePermission';

const STORAGE_KEY = 'autolab_services';

// Distinct curated category themes
const CATEGORY_THEMES = {
  'General Service':     { color: '#ff7a00', bg: 'rgba(255, 122, 0, 0.12)', border: 'rgba(255, 122, 0, 0.3)' },
  'Diagnostics':         { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)' },
  'Brakes & Suspension': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  'AC & Climate':        { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  'Tyres & Alignment':   { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
  'Wash & Detailing':    { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)' },
};

function getCategoryTheme(category) {
  return CATEGORY_THEMES[category] || {
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.3)',
  };
}

function loadInitialServices() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load services from localStorage:', e);
  }
  // Initialize with SERVICES_CATALOG
  const initial = SERVICES_CATALOG.map(s => ({
    ...s,
    is_active: s.is_active !== undefined ? s.is_active : 1,
  }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

export default function Services({ onNav }) {
  const { canWrite, canDelete } = usePermission('services');
  const toast = useToast();

  const [services, setServices] = useState(loadInitialServices);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [showInactive, setShowInactive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingService, setEditingService] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Sync with API on mount
  useEffect(() => {
    let isMounted = true;
    const fetchFromServer = async () => {
      try {
        setIsLoading(true);
        const serverServices = await api.services.getAll();
        if (isMounted && Array.isArray(serverServices) && serverServices.length > 0) {
          // Merge with current state/localStorage
          const stored = loadInitialServices();
          const map = new Map();
          // 1. mock / stored
          stored.forEach(s => map.set(Number(s.id), s));
          // 2. server overrides
          serverServices.forEach(s => map.set(Number(s.id), {
            ...s,
            id: Number(s.id),
            price: Number(s.price),
            duration: Number(s.duration),
            is_active: s.is_active !== undefined ? s.is_active : 1
          }));
          const merged = Array.from(map.values()).sort((a, b) => a.id - b.id);
          setServices(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('API services fetch error, relying on local storage:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchFromServer();

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY || e.type === 'autolab_services_updated') {
        setServices(loadInitialServices());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('autolab_services_updated', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('autolab_services_updated', handleStorageChange);
    };
  }, []);

  // Save changes to storage and broadcast event
  const saveServicesState = (updatedList) => {
    setServices(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('autolab_services_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error saving services:', e);
    }
  };

  // Derive unique categories
  const categories = useMemo(() => {
    const set = new Set();
    services.forEach(s => {
      if (s.category && s.category.trim()) set.add(s.category.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      // Category filter
      if (selectedCategory !== 'All' && s.category !== selectedCategory) {
        return false;
      }
      // Inactive filter
      if (!showInactive && s.is_active === 0) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name && s.name.toLowerCase().includes(q);
        const matchDesc = s.desc && s.desc.toLowerCase().includes(q);
        const matchCat  = s.category && s.category.toLowerCase().includes(q);
        return matchName || matchDesc || matchCat;
      }
      return true;
    });
  }, [services, selectedCategory, searchQuery, showInactive]);

  // Statistics
  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter(s => s.is_active !== 0).length;
    const catsCount = categories.filter(c => c !== 'All').length;
    const avgPrice = total > 0
      ? Math.round(services.reduce((acc, s) => acc + (Number(s.price) || 0), 0) / total)
      : 0;
    return { total, active, catsCount, avgPrice };
  }, [services, categories]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingService({
      name: '',
      category: categories.length > 1 ? categories[1] : 'General Service',
      price: '',
      duration: 60,
      desc: '',
      is_active: 1
    });
    setModalMode('add');
  };

  const handleOpenEdit = (srv) => {
    setEditingService({ ...srv });
    setModalMode('edit');
  };

  const handleDuplicate = async (srv) => {
    if (!canWrite) return;
    const maxId = services.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0);
    const newService = {
      ...srv,
      id: maxId + 1,
      name: `${srv.name} (Copy)`,
      is_active: 1,
    };

    try {
      await api.services.create(newService);
    } catch (e) {
      console.warn('API error on service clone, stored locally:', e);
    }

    const updated = [...services, newService];
    saveServicesState(updated);
    toast.success('Service Cloned', `Created copy: "${newService.name}"`);
  };

  const handleToggleActive = async (srv) => {
    if (!canWrite) return;
    const updatedStatus = srv.is_active === 0 ? 1 : 0;
    const updated = services.map(s => s.id === srv.id ? { ...s, is_active: updatedStatus } : s);
    saveServicesState(updated);

    try {
      await api.services.update(srv.id, { is_active: updatedStatus });
    } catch (e) {
      console.warn('API error on status toggle:', e);
    }

    toast.info(
      updatedStatus === 1 ? 'Service Activated' : 'Service Deactivated',
      `"${srv.name}" is now ${updatedStatus === 1 ? 'active and bookable' : 'hidden from customers'}.`
    );
  };

  const handleSaveModal = async (formData) => {
    if (!formData.name.trim() || formData.price === '' || isNaN(formData.price)) {
      toast.warning('Validation Error', 'Please specify a valid Service Name and Price.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      duration: Number(formData.duration) || 30,
      desc: formData.desc ? formData.desc.trim() : '',
      is_active: formData.is_active !== undefined ? formData.is_active : 1,
    };

    if (modalMode === 'add') {
      const maxId = services.reduce((max, s) => Math.max(max, Number(s.id) || 0), 0);
      const newService = { ...payload, id: maxId + 1 };
      
      try {
        const res = await api.services.create(newService);
        if (res && res.id) newService.id = Number(res.id);
      } catch (e) {
        console.warn('Backend create error, fallback local:', e);
      }

      const updated = [...services, newService];
      saveServicesState(updated);
      toast.success('Service Created', `"${newService.name}" has been added to the catalog.`);
    } else if (modalMode === 'edit' && editingService) {
      const updated = services.map(s => s.id === editingService.id ? { ...payload, id: s.id } : s);
      saveServicesState(updated);

      try {
        await api.services.update(editingService.id, payload);
      } catch (e) {
        console.warn('Backend update error, fallback local:', e);
      }

      toast.success('Service Updated', `Changes to "${payload.name}" saved successfully.`);
    }

    setModalMode(null);
    setEditingService(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const updated = services.filter(s => s.id !== targetId);
    saveServicesState(updated);

    try {
      await api.services.delete(targetId);
    } catch (e) {
      console.warn('Backend delete error:', e);
    }

    toast.success('Service Deleted', `"${deleteTarget.name}" was removed from the catalog.`);
    setDeleteTarget(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 22px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ff7a00, #ff4500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
                Services Catalog &amp; Service Cards
              </h1>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Configure workshop service offerings, customer-facing cards, pricing in Rs., and job durations
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Quick link to see public portal */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNav ? onNav('booking') : window.open('/book', '_blank')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, padding: '8px 14px' }}
            title="View how customers see these service cards"
          >
            <ExternalLink size={14} /> Preview Customer Portal
          </button>

          {canWrite && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAdd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 13,
                fontWeight: 700,
                padding: '8px 18px',
                boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)'
              }}
            >
              <Plus size={16} strokeWidth={2.5} /> Add New Service Card
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255, 122, 0, 0.12)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
              Total Services
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
              {stats.total}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
              Active in Booking
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
              {stats.active} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>/ {stats.total}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
              Categories
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
              {stats.catsCount}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
              Average Price
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
              Rs. {stats.avgPrice.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Search box */}
          <div style={{ position: 'relative', minWidth: 260, flex: '1 1 260px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search services by name, keywords, or category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, fontSize: 13 }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* View Toggles & Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                style={{ accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
              />
              Show Inactive Cards
            </label>

            <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '6px 12px',
                  background: viewMode === 'cards' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  color: viewMode === 'cards' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.15s'
                }}
              >
                <LayoutGrid size={14} /> Cards View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '6px 12px',
                  background: viewMode === 'table' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  transition: 'all 0.15s'
                }}
              >
                <List size={14} /> Table View
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 4 }}>
            Filter Category:
          </span>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat;
            const theme = getCategoryTheme(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: `1px solid ${isSelected ? theme.color : 'var(--border-subtle)'}`,
                  background: isSelected ? theme.color : 'var(--bg-surface)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {cat !== 'All' && (
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isSelected ? '#fff' : theme.color,
                    display: 'inline-block'
                  }} />
                )}
                {cat}
                <span style={{
                  fontSize: 10,
                  opacity: 0.8,
                  padding: '1px 5px',
                  borderRadius: 10,
                  background: isSelected ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)'
                }}>
                  {cat === 'All' ? services.length : services.filter(s => s.category === cat).length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredServices.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            No Service Offerings Found
          </div>
          <div style={{ fontSize: 13, maxWidth: 420, margin: '0 auto 18px' }}>
            No service cards matched your active filters. Try searching for another term, clearing the category filter, or add a new service offering.
          </div>
          {canWrite && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAdd}
              style={{ fontSize: 13 }}
            >
              <Plus size={15} /> Add First Service in this Category
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filteredServices.map(srv => {
            const theme = getCategoryTheme(srv.category);
            const isActive = srv.is_active !== 0;

            return (
              <div
                key={srv.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isActive ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.25)'}`,
                  background: isActive ? 'var(--bg-surface)' : 'rgba(23, 25, 35, 0.5)',
                  opacity: isActive ? 1 : 0.75,
                  padding: 18,
                  position: 'relative',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div>
                  {/* Card Header: Category & Active status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: theme.bg,
                      color: theme.color,
                      border: `1px solid ${theme.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: theme.color }} />
                      {srv.category}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: isActive ? '#10b981' : '#f87171',
                        border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        {isActive ? '● Active' : '○ Inactive'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        #{srv.id}
                      </span>
                    </div>
                  </div>

                  {/* Service Title */}
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 800,
                    margin: '6px 0 8px',
                    color: 'var(--text-primary)',
                    lineHeight: 1.35
                  }}>
                    {srv.name}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: '0 0 16px',
                    minHeight: 48
                  }}>
                    {srv.desc || 'No customer description provided for this service.'}
                  </p>

                  {/* Metrics Badge Chips */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'var(--bg-base)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Clock size={14} style={{ color: 'var(--brand-primary)' }} />
                      <span>{srv.duration} mins</span>
                    </div>
                    <div style={{ width: 1, height: 14, background: 'var(--border-subtle)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                      <span style={{ fontSize: 11, color: 'var(--brand-primary)', fontWeight: 700 }}>Price:</span>
                      <span>Rs. {Number(srv.price).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div style={{
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(srv)}
                        className="btn btn-secondary"
                        style={{ padding: '5px 9px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}
                        title={isActive ? 'Deactivate (Hide from customer booking)' : 'Activate (Show in customer booking)'}
                      >
                        {isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                        {isActive ? 'Hide' : 'Enable'}
                      </button>
                    )}

                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => handleDuplicate(srv)}
                        className="btn btn-secondary"
                        style={{ padding: '5px 9px', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}
                        title="Duplicate this service"
                      >
                        <Copy size={13} /> Copy
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(srv)}
                        className="btn btn-secondary"
                        style={{
                          padding: '5px 12px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          borderColor: 'var(--brand-primary)',
                          color: 'var(--brand-primary)'
                        }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(srv)}
                        className="btn btn-secondary"
                        style={{
                          padding: '5px 8px',
                          fontSize: 11.5,
                          color: '#f87171',
                          borderColor: 'rgba(239, 68, 68, 0.3)'
                        }}
                        title="Delete service"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Service Offering</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Est. Duration</th>
                  <th style={{ textAlign: 'right' }}>Price (Rs.)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map(srv => {
                  const theme = getCategoryTheme(srv.category);
                  const isActive = srv.is_active !== 0;

                  return (
                    <tr key={srv.id} style={{ opacity: isActive ? 1 : 0.7 }}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>
                        #{srv.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>
                          {srv.name}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: theme.bg,
                          color: theme.color,
                          border: `1px solid ${theme.border}`,
                          whiteSpace: 'nowrap'
                        }}>
                          {srv.category}
                        </span>
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        <div style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {srv.desc || '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {srv.duration} mins
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 13.5, color: 'var(--text-primary)' }}>
                        Rs. {Number(srv.price).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: isActive ? '#10b981' : '#f87171'
                        }}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {canWrite && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              onClick={() => handleToggleActive(srv)}
                              title={isActive ? 'Deactivate' : 'Activate'}
                            >
                              {isActive ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          )}
                          {canWrite && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              onClick={() => handleDuplicate(srv)}
                              title="Duplicate"
                            >
                              <Copy size={12} />
                            </button>
                          )}
                          {canWrite && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 11, color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }}
                              onClick={() => handleOpenEdit(srv)}
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: 11, color: '#f87171' }}
                              onClick={() => setDeleteTarget(srv)}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {modalMode && editingService && (
        <ServiceFormModal
          mode={modalMode}
          service={editingService}
          existingCategories={categories.filter(c => c !== 'All')}
          onClose={() => { setModalMode(null); setEditingService(null); }}
          onSave={handleSaveModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)} style={{ zIndex: 1000, padding: 16 }}>
          <div
            className="modal"
            style={{
              maxWidth: 440,
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-handle-bar" />
            <div className="modal-header" style={{ padding: '16px 20px', flexShrink: 0 }}>
              <span className="modal-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
                <AlertCircle size={18} /> Delete Service Card
              </span>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong> from the catalog?
              </p>
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12,
                color: '#f87171',
                lineHeight: 1.45
              }}>
                Customers will no longer be able to select or view this service in the booking portal. Existing appointments and job cards will retain their historical records.
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '14px 20px', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDeleteConfirm}
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Form Modal for Adding or Editing a Service Card - Optimized 2-Column Responsive Layout */
function ServiceFormModal({ mode, service, existingCategories, onClose, onSave }) {
  const [name, setName] = useState(service.name || '');
  const [category, setCategory] = useState(service.category || existingCategories[0] || 'General Service');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState(service.price !== undefined ? service.price : '');
  const [duration, setDuration] = useState(service.duration !== undefined ? service.duration : 60);
  const [desc, setDesc] = useState(service.desc || '');
  const [isActive, setIsActive] = useState(service.is_active !== undefined ? service.is_active : 1);

  const durationPresets = [30, 45, 60, 90, 120, 180, 240];

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? (customCategory.trim() || 'General Service') : category;
    onSave({
      name,
      category: finalCategory,
      price,
      duration,
      desc,
      is_active: isActive ? 1 : 0
    });
  };

  const previewTheme = getCategoryTheme(isCustomCategory ? customCategory : category);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, padding: 16 }}>
      <div
        className="modal"
        style={{
          maxWidth: 860,
          width: '100%',
          maxHeight: 'min(90vh, 680px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.85)',
          border: '1px solid var(--border-subtle)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-handle-bar" />
        <div className="modal-header" style={{ padding: '16px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #ff7a00, #ff4500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 10px rgba(255, 122, 0, 0.3)'
            }}>
              <Sparkles size={16} />
            </div>
            <div>
              <span className="modal-title" style={{ fontSize: 16 }}>
                {mode === 'add' ? 'Add New Service Offering' : `Edit Service Card #${service.id}`}
              </span>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                Configure pricing, duration, scope of work, and preview how it displays to customers
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          <div
            className="modal-body modal-grid-2col"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '20px 24px'
            }}
          >
            {/* Left Column: Form Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Service Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                  Service Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Standard Oil & Filter Change"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                  style={{ fontSize: 13 }}
                />
              </div>

              {/* Category selection */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: 12.5 }}>
                    Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand-primary)',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {isCustomCategory ? '← Choose Existing' : '+ Custom Category'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter new category name..."
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    required
                    style={{ fontSize: 13 }}
                  />
                ) : (
                  <select
                    className="form-control"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ fontSize: 13 }}
                  >
                    {existingCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Price and Duration in 2-column grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                    Price (Rs.) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-control"
                    placeholder="e.g. 35"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                    style={{ fontSize: 13, fontWeight: 700 }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                    Duration (Mins) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    className="form-control"
                    placeholder="e.g. 45"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    required
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 2 }}>Quick:</span>
                {durationPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDuration(preset)}
                    style={{
                      padding: '2px 7px',
                      borderRadius: 4,
                      fontSize: 10.5,
                      fontWeight: 600,
                      border: '1px solid var(--border-subtle)',
                      background: Number(duration) === preset ? 'var(--brand-primary)' : 'var(--bg-surface)',
                      color: Number(duration) === preset ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {preset}m
                  </button>
                ))}
              </div>

              {/* Scope of Work */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                  Service Description &amp; Scope
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Details of what is inspected or replaced..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  style={{ fontSize: 12.5, lineHeight: 1.45, minHeight: 70, maxHeight: 110 }}
                />
              </div>

              {/* Active Toggle Switch */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Offering Status:</span>
                    <span style={{
                      fontSize: 11,
                      padding: '1px 7px',
                      borderRadius: 10,
                      background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isActive ? '#10b981' : '#f87171',
                      fontWeight: 700
                    }}>
                      {isActive ? '● Active in Booking' : '○ Inactive / Draft'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {isActive ? 'Visible and selectable by customers on portal' : 'Hidden from public appointment booking'}
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(isActive)}
                    onChange={e => setIsActive(e.target.checked ? 1 : 0)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: isActive ? 'var(--brand-primary)' : '#374151',
                    borderRadius: 22,
                    transition: '0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 2
                  }}>
                    <span style={{
                      width: 18,
                      height: 18,
                      backgroundColor: '#fff',
                      borderRadius: '50%',
                      transform: isActive ? 'translateX(18px)' : 'translateX(0px)',
                      transition: '0.2s'
                    }} />
                  </span>
                </label>
              </div>
            </div>

            {/* Right Column: Live Customer Portal Card Preview */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Live Portal Preview
                </div>
                <span style={{ fontSize: 10, color: 'var(--brand-primary)', fontWeight: 700, background: 'rgba(255, 122, 0, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                  Customer View
                </span>
              </div>

              {/* The interactive simulated card */}
              <div style={{
                background: '#16181e',
                border: '1.5px solid var(--brand-primary)',
                borderRadius: 'var(--radius-sm)',
                padding: 14,
                boxShadow: '0 0 16px rgba(255, 122, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 180
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: previewTheme.bg,
                      color: previewTheme.color,
                      border: `1px solid ${previewTheme.border}`,
                      letterSpacing: 0.5
                    }}>
                      {isCustomCategory ? (customCategory || 'Custom Category') : category}
                    </span>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4,
                      background: 'var(--brand-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff'
                    }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                    {name || 'Service Display Name'}
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 12px' }}>
                    {desc || 'Description of service inclusions, labor, and diagnostic checks will appear here.'}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 8,
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: 12
                }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {duration || 45} mins
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--brand-primary)' }}>
                    Rs. {Number(price || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                💡 Changes saved here immediately synchronize with the customer appointment booking flow and technician job cards.
              </div>
            </div>
          </div>

          {/* Modal Footer - Always pinned and visible! */}
          <div
            className="modal-footer"
            style={{
              flexShrink: 0,
              padding: '14px 24px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {mode === 'edit' ? `ID: #${service.id}` : '+ New Catalog Item'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 16px' }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontWeight: 700, padding: '8px 20px' }}>
                {mode === 'add' ? 'Create Service Card' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
