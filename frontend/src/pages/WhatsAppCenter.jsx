import { useState, useEffect } from 'react';
import {
  MessageSquare, Send, CheckCircle2, Clock, Settings,
  RotateCcw, ExternalLink, AlertCircle, FileText, Phone,
  ShieldCheck, RefreshCw, Eye, Sparkles, AlertTriangle, Copy
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  sanitizeSriLankanPhone,
  generateWhatsAppLink,
  DEFAULT_WHATSAPP_TEMPLATES,
  renderWhatsAppTemplate
} from '../utils/phoneSanitizer';

const DYNAMIC_TAGS = [
  { tag: '{customer_name}', label: 'Customer Name' },
  { tag: '{vehicle_no}', label: 'Vehicle / Plate' },
  { tag: '{service_name}', label: 'Service Name' },
  { tag: '{booking_date}', label: 'Date' },
  { tag: '{booking_time}', label: 'Time' },
  { tag: '{total_amount}', label: 'Total (Rs.)' },
  { tag: '{assigned_tech}', label: 'Technician' },
  { tag: '{garage_name}', label: 'Workshop Name' },
  { tag: '{garage_phone}', label: 'Hotline' },
];

export default function WhatsAppCenter() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'templates' | 'settings' | 'test'
  
  // Logs state
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('booking_confirmed');
  const [templateEditBody, setTemplateEditBody] = useState('');
  const [templateEditName, setTemplateEditName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Settings state
  const [config, setConfig] = useState({
    mode: 'simulated',
    garage_name: 'Auto Lab 360',
    garage_phone: '071-881 8898 / 071-881 8854',
    has_api_token: false,
    phone_number_id: ''
  });
  const [apiTokenInput, setApiTokenInput] = useState('');
  const [phoneIdInput, setPhoneIdInput] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Sandbox Tester state
  const [testPhone, setTestPhone] = useState('0771234567');
  const [testMsg, setTestMsg] = useState('Hello from Auto Lab 360 test console!');

  const testSanitized = sanitizeSriLankanPhone(testPhone);

  // Load Initial Data
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await api.whatsapp.getLogs(50);
      setLogs(data || []);
    } catch (e) {
      console.warn('Failed to fetch WhatsApp logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await api.whatsapp.getTemplates();
      setTemplates(data || []);
      const current = data.find(t => t.id === selectedTemplateId) || data[0];
      if (current) {
        setTemplateEditName(current.name);
        setTemplateEditBody(current.content);
      }
    } catch (e) {
      // Fallback to local default templates
      const fallback = Object.values(DEFAULT_WHATSAPP_TEMPLATES);
      setTemplates(fallback);
      setTemplateEditName(fallback[0].name);
      setTemplateEditBody(fallback[0].content);
    }
  };

  const fetchConfig = async () => {
    try {
      const data = await api.whatsapp.getConfig();
      if (data) {
        setConfig(data);
        setPhoneIdInput(data.phone_number_id || '');
      }
    } catch (e) {
      console.warn('Config fetch skipped:', e);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchTemplates();
    fetchConfig();
  }, []);

  useEffect(() => {
    const found = templates.find(t => t.id === selectedTemplateId);
    if (found) {
      setTemplateEditName(found.name);
      setTemplateEditBody(found.content);
    }
  }, [selectedTemplateId, templates]);

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      await api.whatsapp.updateTemplate(selectedTemplateId, {
        name: templateEditName,
        content: templateEditBody
      });
      toast.success('Template Saved', `Template '${templateEditName}' updated.`);
      fetchTemplates();
    } catch (e) {
      toast.error('Save Failed', e.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleResetTemplates = async () => {
    if (!window.confirm('Reset all WhatsApp templates back to default system copy?')) return;
    try {
      await api.whatsapp.resetTemplates();
      toast.info('Templates Reset', 'All templates restored to defaults.');
      fetchTemplates();
    } catch (e) {
      toast.error('Reset Failed', e.message);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const payload = {
        mode: config.mode,
        garage_name: config.garage_name,
        garage_phone: config.garage_phone,
        phone_number_id: phoneIdInput
      };
      if (apiTokenInput.trim()) {
        payload.api_token = apiTokenInput.trim();
      }
      await api.whatsapp.updateConfig(payload);
      toast.success('Settings Saved', 'WhatsApp gateway configuration updated.');
      fetchConfig();
      setApiTokenInput('');
    } catch (e) {
      toast.error('Save Failed', e.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleInsertTag = (tag) => {
    setTemplateEditBody(prev => `${prev} ${tag}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14,
        background: 'var(--bg-card)', padding: '18px 24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)'
          }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
              WhatsApp Notification Center
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)'
              }}>
                🇱🇰 Sri Lanka Standard (+94)
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Automated trigger dispatches &amp; one-click web messaging for booking, garage progress, and pickup
            </div>
          </div>
        </div>

        {/* Status Pill & Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#25D366' }} />
            Mode: <span style={{ color: 'var(--brand-primary)', textTransform: 'capitalize' }}>{config.mode}</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchLogs}
            disabled={loadingLogs}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={loadingLogs ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexWrap: 'wrap' }}>
        {[
          { key: 'logs', label: 'Message Dispatch Logs', icon: Clock, count: logs.length },
          { key: 'templates', label: 'Message Templates', icon: FileText, count: templates.length },
          { key: 'settings', label: 'Gateway Settings', icon: Settings },
          { key: 'test', label: 'Sri Lanka Phone Tester', icon: Phone }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: isActive ? 'rgba(37,211,102,0.12)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? '#25D366' : 'transparent',
                color: isActive ? '#25D366' : 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Icon size={14} />
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  fontSize: 10.5, padding: '1px 6px', borderRadius: 10,
                  background: isActive ? '#25D366' : 'var(--border-subtle)',
                  color: isActive ? '#000' : 'var(--text-muted)'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Logs */}
      {activeTab === 'logs' && (
        <div className="card">
          <div className="section-header" style={{ marginBottom: 14 }}>
            <div>
              <div className="section-title">Automated &amp; Staff WhatsApp Logs</div>
              <div className="section-sub">Real-time record of all sent updates, delivery strategies, and direct chat links</div>
            </div>
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No WhatsApp messages logged yet. Use Job Cards or Appointments to trigger updates!
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="desktop-table-view table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Recipient</th>
                      <th>Sanitized Phone</th>
                      <th>Lifecycle Event</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={log.id || idx}>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {log.created_at}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>
                          {log.recipient}
                        </td>
                        <td>
                          <span className="mono" style={{ fontSize: 12, color: '#25D366' }}>
                            +{log.clean_phone}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                            background: 'rgba(255,122,0,0.1)', color: 'var(--brand-primary)', textTransform: 'capitalize'
                          }}>
                            {String(log.event).replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          {log.mode}
                        </td>
                        <td>
                          <span className={`badge ${log.status === 'sent' ? 'badge-completed' : 'badge-cancelled'}`}>
                            <span className="badge-dot" />
                            {log.status}
                          </span>
                        </td>
                        <td>
                          {log.wa_link ? (
                            <a
                              href={log.wa_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: 11, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4, borderColor: '#25D366', color: '#25D366' }}
                            >
                              <ExternalLink size={12} /> Open Chat
                            </a>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack */}
              <div className="mobile-card-stack">
                {logs.map((log, idx) => (
                  <div key={log.id || idx} className="mobile-data-card">
                    <div className="mobile-card-header">
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.created_at}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginTop: 2 }}>{log.recipient}</div>
                      </div>
                      <span className={`badge ${log.status === 'sent' ? 'badge-completed' : 'badge-cancelled'}`}>
                        <span className="badge-dot" />
                        {log.status}
                      </span>
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Sanitized Phone</span>
                      <span className="mono" style={{ fontSize: 13, color: '#25D366', fontWeight: 700 }}>+{log.clean_phone}</span>
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Lifecycle Event</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: 'rgba(255,122,0,0.1)', color: 'var(--brand-primary)', textTransform: 'capitalize'
                      }}>
                        {String(log.event).replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Mode</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{log.mode}</span>
                    </div>

                    {log.wa_link && (
                      <div className="mobile-card-actions">
                        <a
                          href={log.wa_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', justifyContent: 'center', borderColor: '#25D366', color: '#25D366', minHeight: 40 }}
                        >
                          <ExternalLink size={14} /> Open WhatsApp Chat
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: Templates */}
      {activeTab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {/* Template List Selector */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
              Select Template
            </div>
            {templates.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tpl.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: selectedTemplateId === tpl.id ? '#25D366' : 'var(--border-subtle)',
                  background: selectedTemplateId === tpl.id ? 'rgba(37,211,102,0.12)' : 'var(--bg-surface)',
                  color: selectedTemplateId === tpl.id ? '#25D366' : 'var(--text-primary)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                {tpl.name}
              </button>
            ))}

            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={handleResetTemplates}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', fontSize: 11, color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <RotateCcw size={12} /> Reset to Defaults
              </button>
            </div>
          </div>

          {/* Template Editor & Preview */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="section-title">Edit Template: {templateEditName}</div>
                <div className="section-sub">Customize the message sent to Sri Lankan clients for this lifecycle trigger</div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                style={{ background: '#25D366', border: 'none', color: '#000', fontWeight: 800 }}
              >
                {savingTemplate ? 'Saving...' : 'Save Template'}
              </button>
            </div>

            {/* Dynamic Tag Pills */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                Insert Dynamic Data Tags (Click to Append):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {DYNAMIC_TAGS.map(t => (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => handleInsertTag(t.tag)}
                    style={{
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      borderRadius: 14, padding: '3px 10px', fontSize: 11, color: 'var(--brand-primary)',
                      cursor: 'pointer', fontWeight: 600
                    }}
                  >
                    + {t.label} <code>{t.tag}</code>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Area */}
            <div>
              <label className="form-label">Template Content</label>
              <textarea
                className="form-control mono"
                rows={10}
                value={templateEditBody}
                onChange={e => setTemplateEditBody(e.target.value)}
                style={{ fontSize: 12.5, lineHeight: 1.5, background: '#0d1117', color: '#e6edf3' }}
              />
            </div>

            {/* Live Preview Box */}
            <div style={{ background: 'var(--bg-surface)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Customer Phone Preview (Simulated Sample Data):
              </div>
              <div style={{
                background: '#0d1117', color: '#25D366', padding: 12, borderRadius: 8, fontSize: 12,
                whiteSpace: 'pre-wrap', lineHeight: 1.5, borderLeft: '3px solid #25D366'
              }}>
                {renderWhatsAppTemplate(templateEditBody, {
                  customer_name: 'Dinesh Wickramasinghe',
                  vehicle_no: 'Toyota Aqua (WP CB-8921)',
                  service_name: 'Full Synthetic Oil Change & Multi-Point Inspection',
                  total_amount: '24,500.00',
                  assigned_tech: 'Mohamed Hassan',
                  booking_date: '2026-10-02',
                  booking_time: '10:00 AM'
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Settings & Gateway Provider */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: 720 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div className="section-title">WhatsApp Gateway &amp; Provider Strategy</div>
              <div className="section-sub">Configure how WhatsApp messages are delivered to customers</div>
            </div>

            {/* Mode Selection */}
            <div className="form-group">
              <label className="form-label">Delivery Strategy</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {[
                  {
                    id: 'simulated',
                    title: 'Simulated API (Demo)',
                    desc: 'Instant mock delivery with auto-generated wa.me links. Ideal for demos without API fees.'
                  },
                  {
                    id: 'manual',
                    title: 'Manual wa.me Only',
                    desc: 'Staff manually clicks "Send via WhatsApp Web" to chat directly with customers.'
                  },
                  {
                    id: 'cloud_api',
                    title: 'Meta WhatsApp Cloud API',
                    desc: 'Official automated cloud sending via Meta Developer API token and Phone Number ID.'
                  }
                ].map(m => (
                  <div
                    key={m.id}
                    onClick={() => setConfig(prev => ({ ...prev, mode: m.id }))}
                    style={{
                      padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid',
                      borderColor: config.mode === m.id ? '#25D366' : 'var(--border-subtle)',
                      background: config.mode === m.id ? 'rgba(37,211,102,0.1)' : 'var(--bg-surface)',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: config.mode === m.id ? '#25D366' : 'var(--text-primary)', marginBottom: 4 }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {m.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workshop Information */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Workshop / Garage Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={config.garage_name}
                  onChange={e => setConfig(prev => ({ ...prev, garage_name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Workshop Hotline (Sri Lanka)</label>
                <input
                  type="tel"
                  inputMode="tel"
                  className="form-control"
                  value={config.garage_phone}
                  onChange={e => setConfig(prev => ({ ...prev, garage_phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Cloud API Credentials (Conditional) */}
            {config.mode === 'cloud_api' && (
              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} /> Meta WhatsApp Cloud API Credentials
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 104598234857239"
                    value={phoneIdInput}
                    onChange={e => setPhoneIdInput(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Permanent / System User Access Token</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="EAAB..."
                    value={apiTokenInput}
                    onChange={e => setApiTokenInput(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                style={{ background: '#25D366', color: '#000', fontWeight: 800, border: 'none', minHeight: 44 }}
              >
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Sri Lanka Phone Tester */}
      {activeTab === 'test' && (
        <div style={{ maxWidth: 720 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="section-title">Sri Lankan Phone Sanitizer &amp; Link Tester</div>
              <div className="section-sub">Verify conversion from local 07X format to standardized international +94 format</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Enter Test Phone Number</label>
                <input
                  type="tel"
                  inputMode="tel"
                  className="form-control"
                  placeholder="e.g. 077 123 4567, 712345678, +94771234567"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quick Test Presets (Sri Lankan Telcos)</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['077 123 4567 (Dialog)', '071 234 5678 (Mobitel)', '078 987 6543 (Hutch)', '771234567 (No 0)'].map(p => {
                    const num = p.split(' ')[0];
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTestPhone(num)}
                        style={{
                          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                          borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', minHeight: 36
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sanitization Breakdown */}
            <div style={{
              background: 'var(--bg-surface)', padding: 14, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10
            }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Input Raw</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{testSanitized.raw || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Clean Digits</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#25D366', marginTop: 2 }}>{testSanitized.clean || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Formatted View</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{testSanitized.formatted || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SL Validation</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: testSanitized.isValid ? '#25D366' : '#ef4444', marginTop: 2 }}>
                  {testSanitized.isValid ? (testSanitized.isSriLankan ? '🇱🇰 Valid Sri Lanka Mobile' : '🌐 Valid International') : '❌ Invalid'}
                </div>
              </div>
            </div>

            {/* Message Preview & Click-to-chat */}
            <div className="form-group">
              <label className="form-label">Message Payload</label>
              <textarea
                className="form-control"
                rows={3}
                value={testMsg}
                onChange={e => setTestMsg(e.target.value)}
              />
            </div>

            <div>
              <a
                href={testSanitized.isValid ? generateWhatsAppLink(testSanitized.clean, testMsg) : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn btn-primary ${!testSanitized.isValid ? 'disabled' : ''}`}
                style={{
                  background: '#25D366', color: '#000', fontWeight: 800, border: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 8, pointerEvents: testSanitized.isValid ? 'auto' : 'none',
                  minHeight: 44
                }}
              >
                <ExternalLink size={14} /> Launch WhatsApp Web Test Link
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
