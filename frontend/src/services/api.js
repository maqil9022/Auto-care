// Auto Lab 360 — API Client
// Connects frontend to Python FastAPI backend (http://127.0.0.1:8000)
// Falls back gracefully if backend is offline

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP Error ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[API] Failed to fetch ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // System Health
  health: () => request('/api/health'),
  root: () => request('/'),

  // Services Catalog
  services: {
    getAll: (params = {}) => {
      if (typeof params === 'string') {
        return request(params ? `/api/services?category=${encodeURIComponent(params)}` : '/api/services');
      }
      const query = new URLSearchParams();
      if (params.category && params.category !== 'All') query.append('category', params.category);
      if (params.search) query.append('search', params.search);
      if (params.active_only) query.append('active_only', 'true');
      const q = query.toString();
      return request(q ? `/api/services?${q}` : '/api/services');
    },
    getCategories: () => request('/api/services/categories'),
    getById: (id) => request(`/api/services/${id}`),
    create: (data) => request('/api/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/services/${id}`, { method: 'DELETE' }),
  },

  // Appointments
  appointments: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.search) query.append('search', params.search);
      const q = query.toString();
      return request(q ? `/api/appointments?${q}` : '/api/appointments');
    },
    getById: (id) => request(`/api/appointments/${id}`),
    create: (data) => request('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status, tech = null) => request(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(tech ? { tech } : {}) })
    }),
    assignTech: (id, tech) => request(`/api/appointments/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ tech })
    }),
    delete: (id) => request(`/api/appointments/${id}`, { method: 'DELETE' })
  },

  // Service Jobs
  jobs: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.search) query.append('search', params.search);
      const q = query.toString();
      return request(q ? `/api/jobs?${q}` : '/api/jobs');
    },
    create: (data) => request('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, update) => request(`/api/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(update)
    })
  },

  // Inventory & Parts
  inventory: {
    getAll: (category) => request(category ? `/api/inventory?category=${encodeURIComponent(category)}` : '/api/inventory'),
    getLowStock: () => request('/api/inventory/low-stock'),
    adjust: (part_id, quantity, reason) => request('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ part_id, quantity, reason })
    })
  },

  // Billing & Invoices
  billing: {
    getInvoices: (status) => request(status ? `/api/billing/invoices?status=${status}` : '/api/billing/invoices'),
    getInvoice: (id) => request(`/api/billing/invoices/${id}`),
    create: (data) => request('/api/billing/invoices', { method: 'POST', body: JSON.stringify(data) }),
    pay: (id, amount, method = 'card') => request(`/api/billing/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount, method })
    })
  },

  // HR & Employees
  hr: {
    getEmployees: (dept) => request(dept ? `/api/hr/employees?dept=${encodeURIComponent(dept)}` : '/api/hr/employees'),
    getPayroll: () => request('/api/hr/payroll'),
    updatePayrollStatus: (id, status) => request(`/api/hr/payroll/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
    getAttendance: () => request('/api/hr/attendance')
  },

  // Reports & Analytics
  reports: {
    getKpis: () => request('/api/reports/kpis'),
    getRevenue: () => request('/api/reports/revenue'),
    getServiceBreakdown: () => request('/api/reports/service-breakdown')
  },

  // Workshop Notifications Telemetry
  notifications: {
    getAll: () => request('/api/notifications'),
    markAllRead: () => request('/api/notifications/read-all', { method: 'POST' }),
    create: (data) => request('/api/notifications', { method: 'POST', body: JSON.stringify(data) })
  },

  // WhatsApp Messaging & Templates (Sri Lanka)
  whatsapp: {
    send: (payload) => request('/api/whatsapp/send', { method: 'POST', body: JSON.stringify(payload) }),
    sanitizePhone: (phone) => request('/api/whatsapp/sanitize-phone', { method: 'POST', body: JSON.stringify({ phone }) }),
    getTemplates: () => request('/api/whatsapp/templates'),
    updateTemplate: (id, data) => request(`/api/whatsapp/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    resetTemplates: () => request('/api/whatsapp/templates/reset', { method: 'POST' }),
    getLogs: (limit = 50) => request(`/api/whatsapp/logs?limit=${limit}`),
    getConfig: () => request('/api/whatsapp/config'),
    updateConfig: (data) => request('/api/whatsapp/config', { method: 'PUT', body: JSON.stringify(data) })
  }
};
